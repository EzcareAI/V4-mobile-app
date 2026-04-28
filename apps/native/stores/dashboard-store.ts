import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/stores/onboarding-store";

const STREAK_RESET_MS = 36 * 60 * 60 * 1000; // 36 hours grace window

export interface CheckInMetrics {
	sleep: number; // 1-5
	energy: number; // 1-5
	stress: number; // 1-5
	digestion: number; // 1-5
}

export interface CheckInRecord {
	date: string; // ISO timestamp
	metrics: CheckInMetrics;
}

export interface Mission {
	id: string;
	title: string;
	icon: string;
	/** Habit score points awarded when completed. */
	habitPoints: number;
	/** XP granted for level progression. */
	xp: number;
	completed: boolean;
}

/**
 * Habit score increments for daily lifestyle actions.
 */
const DAILY_MISSIONS: Omit<Mission, "completed">[] = [
	{
		id: "breathing",
		title: "Deep Breathing Focus",
		icon: "😮‍💨",
		habitPoints: 0.8,
		xp: 80,
	},
	{
		id: "meal",
		title: "Log First Meal",
		icon: "🥗",
		habitPoints: 0.5,
		xp: 50,
	},
	{
		id: "walk",
		title: "10 Min Walk",
		icon: "👟",
		habitPoints: 1.2,
		xp: 120,
	},
	{
		id: "hydrate",
		title: "Drink 2L of Water",
		icon: "💧",
		habitPoints: 0.6,
		xp: 60,
	},
	{
		id: "stretch",
		title: "Morning Stretch",
		icon: "🧘",
		habitPoints: 0.9,
		xp: 90,
	},
];

export interface DashboardState {
	// Check-in
	lastCheckInAt: string | null; // ISO timestamp
	lastCheckInValues: CheckInMetrics | null;
	checkInHistory: CheckInRecord[];
	streak: number;
	lastStreakUpdateDate: string | null; // Date string YYYY-MM-DD

	// Habit score delta from daily actions (accumulated, capped at 5 per day)
	dailyHabitScoreDelta: number;

	// Missions
	missions: Mission[];
	missionsResetDate: string | null; // YYYY-MM-DD

	// Computed helpers (not persisted, derived)
	canCheckIn: () => boolean;
	getNextCheckInMs: () => number;
	saveCheckIn: (metrics: CheckInMetrics) => void;
	toggleMission: (id: string) => void;
	completeMission: (id: string) => void; // Alias for toggleMission
	getLevel: () => number;
	getXpInCurrentLevel: () => number;
	resetDailyMissions: () => void;
	syncToSupabase: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()(
	persist(
		(set, get) => ({
			lastCheckInAt: null,
			lastCheckInValues: null,
			checkInHistory: [],
			streak: 0,
			lastStreakUpdateDate: null,
			dailyHabitScoreDelta: 0,
			missions: DAILY_MISSIONS.map((m) => ({ ...m, completed: false })),
			missionsResetDate: null,

			canCheckIn: () => {
				const { lastCheckInAt } = get();
				if (!lastCheckInAt) {
					return true;
				}

				// Get the date string (YYYY-MM-DD) in local time for both now and the last check-in
				const lastCheckInDateStr = new Date(lastCheckInAt).toLocaleDateString();
				const todayDateStr = new Date().toLocaleDateString();

				// They can check in if the dates don't match (i.e. it's a new day)
				return lastCheckInDateStr !== todayDateStr;
			},

			getNextCheckInMs: () => {
				const { lastCheckInAt } = get();
				if (!lastCheckInAt) {
					return 0;
				}

				// If they haven't checked in today, they can do it now
				const lastCheckInDateStr = new Date(lastCheckInAt).toLocaleDateString();
				const todayDateStr = new Date().toLocaleDateString();
				if (lastCheckInDateStr !== todayDateStr) {
					return 0;
				}

				// Otherwise, calculate MS until the next midnight (local time)
				const now = new Date();
				const nextMidnight = new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getDate() + 1, // Next day
					0,
					0,
					0,
					0 // Midnight
				);

				return Math.max(0, nextMidnight.getTime() - now.getTime());
			},

			saveCheckIn: (metrics) => {
				const now = new Date();
				const todayStr = now.toISOString().split("T")[0];
				const { lastStreakUpdateDate, streak } = get();

				let newStreak = streak;
				if (lastStreakUpdateDate !== todayStr) {
					const yesterday = new Date(now);
					yesterday.setDate(yesterday.getDate() - 1);
					const yesterdayStr = yesterday.toISOString().split("T")[0];

					const lastDate = lastStreakUpdateDate
						? new Date(lastStreakUpdateDate).getTime()
						: 0;
					const sinceLastUpdate = Date.now() - lastDate;

					if (
						lastStreakUpdateDate === yesterdayStr ||
						sinceLastUpdate < STREAK_RESET_MS
					) {
						newStreak = streak + 1;
					} else {
						newStreak = 1;
					}
				}

				set((state) => {
					const newHistory = [
						...state.checkInHistory,
						{ date: now.toISOString(), metrics },
					].slice(-90);

					return {
						lastCheckInAt: now.toISOString(),
						lastCheckInValues: metrics,
						checkInHistory: newHistory,
						streak: newStreak,
						lastStreakUpdateDate: todayStr,
					};
				});

				// Bump daily score in onboarding store based on check-in quality
				const avg =
					(metrics.sleep +
						metrics.energy +
						(6 - metrics.stress) +
						metrics.digestion) /
					4;
				// avg is 1–5, map it to a small +0 to +2 daily score bump
				const checkInBonus = Math.round(((avg - 1) / 4) * 2 * 10) / 10;
				const currentScore = useOnboardingStore.getState().lifestyleScore ?? 50;
				// Round to 1 decimal to avoid IEEE-754 drift (e.g. 77.09999999999998)
				const newScore =
					Math.round(
						Math.min(100, Math.max(0, currentScore + checkInBonus)) * 10
					) / 10;
				useOnboardingStore.getState().setAnswer("lifestyleScore", newScore);

				// Background sync to DB
				get().syncToSupabase();
			},

			toggleMission: (id) => {
				const { missions } = get();
				const mission = missions.find((m) => m.id === id);
				if (!mission) {
					return;
				}

				const wasCompleted = mission.completed;
				const updatedMissions = missions.map((m) =>
					m.id === id ? { ...m, completed: !m.completed } : m
				);

				// Adjust the accumulated daily habit score delta
				const delta = wasCompleted
					? -mission.habitPoints
					: mission.habitPoints;
				const newDailyDelta = Math.max(0, get().dailyHabitScoreDelta + delta);

				set({
					missions: updatedMissions,
					dailyHabitScoreDelta: newDailyDelta,
				});

				// Apply the habit point change to the live score (capped 0–100)
				const currentScore = useOnboardingStore.getState().lifestyleScore ?? 50;
				const newScore = Math.min(
					100,
					Math.max(
						0,
						currentScore +
							(wasCompleted ? -mission.habitPoints : mission.habitPoints)
					)
				);
				useOnboardingStore
					.getState()
					.setAnswer("lifestyleScore", Math.round(newScore * 10) / 10);

				// Background sync to DB
				get().syncToSupabase();
			},

			completeMission: (id) => {
				get().toggleMission(id);
			},

			getLevel: () => {
				const { dailyHabitScoreDelta } = get();
				// Simple level logic: every 5 points is a level
				return Math.floor(dailyHabitScoreDelta / 5) + 1;
			},

			getXpInCurrentLevel: () => {
				const { missions } = get();
				// Calculate XP from completed missions
				return missions
					.filter((m) => m.completed)
					.reduce((acc, m) => acc + (m.xp || 0), 0);
			},

			resetDailyMissions: () => {
				const todayStr = new Date().toISOString().split("T")[0];
				const { missionsResetDate } = get();
				if (missionsResetDate === todayStr) {
					return;
				}

				set({
					missions: DAILY_MISSIONS.map((m) => ({ ...m, completed: false })),
					missionsResetDate: todayStr,
					dailyHabitScoreDelta: 0,
				});
			},

			syncToSupabase: async () => {
				const state = get();
				const recordId = useOnboardingStore.getState().onboardingRecordId;

				if (!recordId) {
					return;
				}

				const payload = {
					dashboard_streak: state.streak,
					updated_at: new Date().toISOString(),
				};

				try {
					const { error } = await supabase
						.from("onboarding_profiles")
						.update(payload)
						.eq("id", recordId);

					if (error) {
						console.error("❌ SUPABASE DASHBOARD SYNC ERROR:", error);
					}
				} catch (err) {
					console.error("❌ SUPABASE DASHBOARD SYNC CRITICAL EXCEPTION:", err);
				}
			},
		}),
		{
			name: "dashboard-storage",
			storage: createJSONStorage(() => AsyncStorage),
		}
	)
);
