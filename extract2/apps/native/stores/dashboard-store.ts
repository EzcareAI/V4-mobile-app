import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/stores/onboarding-store";

const CHECKIN_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours
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
	xp: number;
	completed: boolean;
}

const DAILY_MISSIONS: Omit<Mission, "completed">[] = [
	{ id: "breathing", title: "Deep Breathing Focus", icon: "😮‍💨", xp: 50 },
	{ id: "meal", title: "Log First Meal", icon: "🥗", xp: 20 },
	{ id: "walk", title: "10 Min Walk", icon: "👟", xp: 30 },
	{ id: "hydrate", title: "Drink 2L of Water", icon: "💧", xp: 25 },
	{ id: "stretch", title: "Morning Stretch", icon: "🧘", xp: 40 },
];

const XP_PER_LEVEL = 500;

export interface DashboardState {
	// Check-in
	lastCheckInAt: string | null; // ISO timestamp
	lastCheckInValues: CheckInMetrics | null;
	checkInHistory: CheckInRecord[];
	streak: number;
	lastStreakUpdateDate: string | null; // Date string YYYY-MM-DD

	// XP / Gamification
	totalXp: number;

	// Missions
	missions: Mission[];
	missionsResetDate: string | null; // YYYY-MM-DD

	// Computed helpers (not persisted, derived)
	getLevel: () => number;
	getLevelProgress: () => number; // 0-1
	getXpInCurrentLevel: () => number;
	canCheckIn: () => boolean;
	getNextCheckInMs: () => number;
	saveCheckIn: (metrics: CheckInMetrics) => void;
	completeMission: (id: string) => void;
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
			totalXp: 0,
			missions: DAILY_MISSIONS.map((m) => ({ ...m, completed: false })),
			missionsResetDate: null,

			getLevel: () => {
				const { totalXp } = get();
				return Math.floor(totalXp / XP_PER_LEVEL) + 1;
			},

			getLevelProgress: () => {
				const { totalXp } = get();
				const xpInLevel = totalXp % XP_PER_LEVEL;
				return xpInLevel / XP_PER_LEVEL;
			},

			getXpInCurrentLevel: () => {
				const { totalXp } = get();
				return totalXp % XP_PER_LEVEL;
			},

			canCheckIn: () => {
				const { lastCheckInAt } = get();
				if (!lastCheckInAt) {
					return true;
				}
				const elapsed = Date.now() - new Date(lastCheckInAt).getTime();
				return elapsed >= CHECKIN_COOLDOWN_MS;
			},

			getNextCheckInMs: () => {
				const { lastCheckInAt } = get();
				if (!lastCheckInAt) {
					return 0;
				}
				const elapsed = Date.now() - new Date(lastCheckInAt).getTime();
				return Math.max(0, CHECKIN_COOLDOWN_MS - elapsed);
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
						// Missed a day — reset
						newStreak = 1;
					}
				}

				set((state) => {
					// Append to history and keep last 90 days to prevent bloat
					const newHistory = [
						...state.checkInHistory,
						{ date: now.toISOString(), metrics },
					].slice(-90);

					// Grant base XP for check-in goal (e.g. 150) plus bonus for streak
					let earnedXp = 150;
					if (newStreak > streak) {
						earnedXp += 100; // Bonus for maintaining a streak
					}

					return {
						lastCheckInAt: now.toISOString(),
						lastCheckInValues: metrics,
						checkInHistory: newHistory,
						streak: newStreak,
						lastStreakUpdateDate: todayStr,
						totalXp: state.totalXp + earnedXp,
					};
				});

				// Background sync to DB
				get().syncToSupabase();
			},

			completeMission: (id) => {
				const { missions, totalXp } = get();
				const mission = missions.find((m) => m.id === id);
				if (!mission || mission.completed) {
					return;
				}

				const updatedMissions = missions.map((m) =>
					m.id === id ? { ...m, completed: true } : m
				);
				set({
					missions: updatedMissions,
					totalXp: totalXp + mission.xp,
				});

				// Background sync to DB
				get().syncToSupabase();
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
				});
			},

			syncToSupabase: async () => {
				const state = get();
				const recordId = useOnboardingStore.getState().onboardingRecordId;

				if (!recordId) {
					console.log(
						"No onboarding record ID found; skipping dashboard sync."
					);
					return;
				}

				const payload = {
					dashboard_streak: state.streak,
					dashboard_xp: state.totalXp,
					dashboard_level: state.getLevel(),
					updated_at: new Date().toISOString(),
				};

				try {
					console.log(
						"Syncing dashboard progress to Supabase for record:",
						recordId
					);
					const { error } = await supabase
						.from("onboarding_profiles")
						.update(payload)
						.eq("id", recordId);

					if (error) {
						console.error("❌ SUPABASE DASHBOARD SYNC ERROR:", error);
					} else {
						console.log("✅ SUPABASE DASHBOARD SYNC SUCCESSFUL");
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
