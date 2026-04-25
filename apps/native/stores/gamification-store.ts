import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ── Badge definitions ──────────────────────────────
export interface Badge {
	id: string;
	title: string;
	description: string;
	emoji: string;
	requirement: number; // threshold to unlock
	type: "streak" | "checkins" | "meals" | "xp" | "vibes";
}

const BADGES: Badge[] = [
	{ id: "streak3", title: "Getting Started", description: "3-day streak", emoji: "🌱", requirement: 3, type: "streak" },
	{ id: "streak7", title: "Week Warrior", description: "7-day streak", emoji: "⚡", requirement: 7, type: "streak" },
	{ id: "streak14", title: "Fortnight Force", description: "14-day streak", emoji: "🔥", requirement: 14, type: "streak" },
	{ id: "streak30", title: "Monthly Master", description: "30-day streak", emoji: "👑", requirement: 30, type: "streak" },
	{ id: "streak100", title: "Centurion", description: "100-day streak", emoji: "💎", requirement: 100, type: "streak" },
	{ id: "checkins5", title: "First Steps", description: "5 total check-ins", emoji: "👣", requirement: 5, type: "checkins" },
	{ id: "checkins25", title: "Quarter Century", description: "25 check-ins", emoji: "🏅", requirement: 25, type: "checkins" },
	{ id: "checkins50", title: "Half Way There", description: "50 check-ins", emoji: "🎯", requirement: 50, type: "checkins" },
	{ id: "meals10", title: "Food Detective", description: "10 meals scanned", emoji: "🔍", requirement: 10, type: "meals" },
	{ id: "meals50", title: "Nutrition Guru", description: "50 meals scanned", emoji: "🧠", requirement: 50, type: "meals" },
	{ id: "xp1000", title: "XP Hunter", description: "1,000 XP earned", emoji: "⭐", requirement: 1000, type: "xp" },
	{ id: "xp5000", title: "XP Legend", description: "5,000 XP earned", emoji: "🌟", requirement: 5000, type: "xp" },
	{ id: "vibes10", title: "Vibe Checker", description: "10 vibe cards shared", emoji: "✨", requirement: 10, type: "vibes" },
];

// ── Challenge definitions ──────────────────────────
export interface Challenge {
	id: string;
	title: string;
	description: string;
	emoji: string;
	xpReward: number;
	coinReward: number;
	target: number;
	type: "daily" | "weekly";
}

const DAILY_CHALLENGES: Challenge[] = [
	{ id: "dc_checkin", title: "Morning Ritual", description: "Complete your daily check-in", emoji: "☀️", xpReward: 50, coinReward: 10, target: 1, type: "daily" },
	{ id: "dc_scan", title: "Scan a Meal", description: "Use the AI meal scanner once", emoji: "📸", xpReward: 75, coinReward: 15, target: 1, type: "daily" },
	{ id: "dc_chat", title: "Ask EZBuddy", description: "Have a conversation with your AI companion", emoji: "💬", xpReward: 40, coinReward: 8, target: 1, type: "daily" },
	{ id: "dc_missions", title: "Action Hero", description: "Complete 3 daily actions", emoji: "⚡", xpReward: 100, coinReward: 20, target: 3, type: "daily" },
	{ id: "dc_vibe", title: "Vibe Check", description: "Share your daily vibe card", emoji: "✨", xpReward: 60, coinReward: 12, target: 1, type: "daily" },
];

const WEEKLY_CHALLENGES: Challenge[] = [
	{ id: "wc_streak", title: "Consistency King", description: "Maintain a 7-day streak", emoji: "👑", xpReward: 500, coinReward: 100, target: 7, type: "weekly" },
	{ id: "wc_scans", title: "Meal Prep Pro", description: "Scan 10 meals this week", emoji: "🍽️", xpReward: 400, coinReward: 80, target: 10, type: "weekly" },
	{ id: "wc_allactions", title: "Perfect Day x3", description: "Complete all daily actions 3 times", emoji: "🏆", xpReward: 600, coinReward: 120, target: 3, type: "weekly" },
];

export interface ChallengeProgress {
	challengeId: string;
	progress: number;
	completed: boolean;
	claimed: boolean;
}

export interface GamificationState {
	// Currency
	coins: number;
	totalXp: number;

	// Stats
	totalCheckIns: number;
	totalMealsScanned: number;
	totalVibesShared: number;

	// Badges
	unlockedBadges: string[]; // badge IDs

	// Challenges
	dailyChallenges: ChallengeProgress[];
	weeklyChallenges: ChallengeProgress[];
	challengesResetDate: string | null;
	weeklyResetDate: string | null;

	// Methods
	addXp: (amount: number) => void;
	addCoins: (amount: number) => void;
	incrementStat: (stat: "totalCheckIns" | "totalMealsScanned" | "totalVibesShared") => void;
	checkBadges: (streak: number) => string[]; // returns newly unlocked badge IDs
	updateChallengeProgress: (challengeId: string, progress: number) => void;
	claimChallenge: (challengeId: string) => void;
	resetDailyChallenges: () => void;
	resetWeeklyChallenges: () => void;
	getLevel: () => number;
	getXpForNextLevel: () => number;
	getXpProgress: () => number; // 0-1
	getAllBadges: () => Badge[];
}

const XP_PER_LEVEL = 500;

export const useGamificationStore = create<GamificationState>()(
	persist(
		(set, get) => ({
			coins: 0,
			totalXp: 0,
			totalCheckIns: 0,
			totalMealsScanned: 0,
			totalVibesShared: 0,
			unlockedBadges: [],
			dailyChallenges: DAILY_CHALLENGES.map((c) => ({
				challengeId: c.id,
				progress: 0,
				completed: false,
				claimed: false,
			})),
			weeklyChallenges: WEEKLY_CHALLENGES.map((c) => ({
				challengeId: c.id,
				progress: 0,
				completed: false,
				claimed: false,
			})),
			challengesResetDate: null,
			weeklyResetDate: null,

			addXp: (amount) => {
				set((s) => ({ totalXp: s.totalXp + amount }));
			},

			addCoins: (amount) => {
				set((s) => ({ coins: s.coins + amount }));
			},

			incrementStat: (stat) => {
				set((s) => ({ [stat]: (s[stat] as number) + 1 }));
			},

			checkBadges: (streak) => {
				const state = get();
				const newlyUnlocked: string[] = [];

				for (const badge of BADGES) {
					if (state.unlockedBadges.includes(badge.id)) continue;

					let value = 0;
					switch (badge.type) {
						case "streak": value = streak; break;
						case "checkins": value = state.totalCheckIns; break;
						case "meals": value = state.totalMealsScanned; break;
						case "xp": value = state.totalXp; break;
						case "vibes": value = state.totalVibesShared; break;
					}

					if (value >= badge.requirement) {
						newlyUnlocked.push(badge.id);
					}
				}

				if (newlyUnlocked.length > 0) {
					set((s) => ({
						unlockedBadges: [...s.unlockedBadges, ...newlyUnlocked],
					}));
				}

				return newlyUnlocked;
			},

			updateChallengeProgress: (challengeId, progress) => {
				const allChallenges = [...DAILY_CHALLENGES, ...WEEKLY_CHALLENGES];
				const challengeDef = allChallenges.find((c) => c.id === challengeId);
				if (!challengeDef) return;

				const isDaily = challengeDef.type === "daily";
				const key = isDaily ? "dailyChallenges" : "weeklyChallenges";

				set((s) => ({
					[key]: s[key].map((cp) =>
						cp.challengeId === challengeId
							? {
								...cp,
								progress: Math.min(progress, challengeDef.target),
								completed: progress >= challengeDef.target,
							}
							: cp
					),
				}));
			},

			claimChallenge: (challengeId) => {
				const allChallenges = [...DAILY_CHALLENGES, ...WEEKLY_CHALLENGES];
				const challengeDef = allChallenges.find((c) => c.id === challengeId);
				if (!challengeDef) return;

				const state = get();
				const isDaily = challengeDef.type === "daily";
				const challenges = isDaily ? state.dailyChallenges : state.weeklyChallenges;
				const cp = challenges.find((c) => c.challengeId === challengeId);

				if (!cp || !cp.completed || cp.claimed) return;

				const key = isDaily ? "dailyChallenges" : "weeklyChallenges";
				set((s) => ({
					totalXp: s.totalXp + challengeDef.xpReward,
					coins: s.coins + challengeDef.coinReward,
					[key]: s[key].map((c) =>
						c.challengeId === challengeId ? { ...c, claimed: true } : c
					),
				}));
			},

			resetDailyChallenges: () => {
				const todayStr = new Date().toISOString().split("T")[0];
				if (get().challengesResetDate === todayStr) return;

				set({
					dailyChallenges: DAILY_CHALLENGES.map((c) => ({
						challengeId: c.id,
						progress: 0,
						completed: false,
						claimed: false,
					})),
					challengesResetDate: todayStr,
				});
			},

			resetWeeklyChallenges: () => {
				const now = new Date();
				const weekStart = new Date(now);
				weekStart.setDate(now.getDate() - now.getDay());
				const weekStr = weekStart.toISOString().split("T")[0];

				if (get().weeklyResetDate === weekStr) return;

				set({
					weeklyChallenges: WEEKLY_CHALLENGES.map((c) => ({
						challengeId: c.id,
						progress: 0,
						completed: false,
						claimed: false,
					})),
					weeklyResetDate: weekStr,
				});
			},

			getLevel: () => Math.floor(get().totalXp / XP_PER_LEVEL) + 1,

			getXpForNextLevel: () => {
				const level = get().getLevel();
				return level * XP_PER_LEVEL;
			},

			getXpProgress: () => {
				const xp = get().totalXp;
				const currentLevelXp = (get().getLevel() - 1) * XP_PER_LEVEL;
				return (xp - currentLevelXp) / XP_PER_LEVEL;
			},

			getAllBadges: () => BADGES,
		}),
		{
			name: "gamification-storage",
			storage: createJSONStorage(() => AsyncStorage),
		}
	)
);

// Export for reference
export { DAILY_CHALLENGES, WEEKLY_CHALLENGES, BADGES };
