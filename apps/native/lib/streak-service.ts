/**
 * Humane Streak Service
 *
 * Tracks daily streaks with monthly free freezes.
 * Premium users get unlimited freezes via RevenueCat.
 */

import { supabase } from "./supabase";
import { mixpanelService } from "./mixpanel-service";
import { revenueCatService } from "./revenuecat-service";

// ── Streak titles ────────────────────────────────────────────
const STREAK_TITLES: { minDays: number; title: string; emoji: string }[] = [
	{ minDays: 365, title: "Sovereign", emoji: "star" },
	{ minDays: 100, title: "Legend", emoji: "crown" },
	{ minDays: 60, title: "Mountain", emoji: "mountain" },
	{ minDays: 30, title: "Strong", emoji: "tree" },
	{ minDays: 14, title: "Rooted", emoji: "deciduous_tree" },
	{ minDays: 7, title: "Growing", emoji: "herb" },
	{ minDays: 3, title: "Sprouting", emoji: "seedling" },
];

export function getStreakTitle(days: number): { title: string; emoji: string } | null {
	for (const st of STREAK_TITLES) {
		if (days >= st.minDays) return st;
	}
	return null;
}

// ── Milestone XP rewards ─────────────────────────────────────
const MILESTONE_XP: Record<number, number> = {
	3: 100,
	7: 200,
	14: 300,
	30: 500,
	60: 750,
	100: 1000,
	365: 2000,
};

// ── Types ────────────────────────────────────────────────────
export interface StreakInfo {
	currentStreak: number;
	longestStreak: number;
	lastActivityDate: string | null;
	freezesAvailable: number;
	freezesUsedThisMonth: number;
	freezesResetAt: string;
	streakTitle: { title: string; emoji: string } | null;
}

export interface StreakUpdateResult {
	streakInfo: StreakInfo;
	frozeUsed: boolean;
	streakBroken: boolean;
	milestoneReached: number | null; // days milestone, or null
	milestoneXp: number;
}

// ── Service ──────────────────────────────────────────────────
class StreakService {
	private static instance: StreakService;

	static getInstance(): StreakService {
		if (!StreakService.instance) {
			StreakService.instance = new StreakService();
		}
		return StreakService.instance;
	}

	private todayStr(): string {
		return new Date().toISOString().split("T")[0];
	}

	private yesterdayStr(): string {
		const d = new Date();
		d.setDate(d.getDate() - 1);
		return d.toISOString().split("T")[0];
	}

	/**
	 * Ensure the user has a streaks row.
	 */
	private async ensureRow(userId: string): Promise<void> {
		const { data } = await supabase
			.from("streaks")
			.select("id")
			.eq("user_id", userId)
			.single();

		if (!data) {
			await supabase.from("streaks").insert({ user_id: userId });
		}
	}

	/**
	 * Get user's streak info.
	 */
	async getStreakInfo(userId: string): Promise<StreakInfo> {
		await this.ensureRow(userId);

		const { data } = await supabase
			.from("streaks")
			.select("*")
			.eq("user_id", userId)
			.single();

		if (!data) {
			return {
				currentStreak: 0,
				longestStreak: 0,
				lastActivityDate: null,
				freezesAvailable: 1,
				freezesUsedThisMonth: 0,
				freezesResetAt: new Date().toISOString(),
				streakTitle: null,
			};
		}

		// Check if freezes need monthly reset
		if (data.freezes_reset_at && new Date(data.freezes_reset_at) <= new Date()) {
			await supabase
				.from("streaks")
				.update({
					freezes_available: 1,
					freezes_used_this_month: 0,
					freezes_reset_at: this.getNextMonthReset(),
				})
				.eq("user_id", userId);
			data.freezes_available = 1;
			data.freezes_used_this_month = 0;
		}

		return {
			currentStreak: data.current_streak,
			longestStreak: data.longest_streak,
			lastActivityDate: data.last_activity_date,
			freezesAvailable: data.freezes_available,
			freezesUsedThisMonth: data.freezes_used_this_month,
			freezesResetAt: data.freezes_reset_at,
			streakTitle: getStreakTitle(data.current_streak),
		};
	}

	/**
	 * Record daily activity and update streak.
	 * Call this after any qualifying action (quest completion, check-in).
	 */
	async recordActivity(userId: string): Promise<StreakUpdateResult> {
		await this.ensureRow(userId);
		const today = this.todayStr();
		const yesterday = this.yesterdayStr();

		const { data } = await supabase
			.from("streaks")
			.select("*")
			.eq("user_id", userId)
			.single();

		if (!data) {
			return this.defaultResult();
		}

		// Already recorded today
		if (data.last_activity_date === today) {
			return {
				streakInfo: await this.getStreakInfo(userId),
				frozeUsed: false,
				streakBroken: false,
				milestoneReached: null,
				milestoneXp: 0,
			};
		}

		let newStreak = data.current_streak;
		let frozeUsed = false;
		let streakBroken = false;

		if (data.last_activity_date === yesterday) {
			// Consecutive day — increment
			newStreak += 1;
		} else if (data.last_activity_date && data.last_activity_date < yesterday) {
			// Missed day(s) — check freezes
			const missedDays = this.daysBetween(data.last_activity_date, today) - 1;

			if (missedDays === 1) {
				// Missed exactly 1 day — try to use a freeze
				const isPro = await revenueCatService.checkProStatus();
				if (isPro || data.freezes_available > 0) {
					frozeUsed = true;
					newStreak += 1; // Continue as if no gap
					if (!isPro) {
						// Deduct freeze for free users
						await supabase
							.from("streaks")
							.update({
								freezes_available: Math.max(0, data.freezes_available - 1),
								freezes_used_this_month: data.freezes_used_this_month + 1,
							})
							.eq("user_id", userId);
					}
					mixpanelService.track("streak_freeze_used", { streak: newStreak, is_pro: isPro });
				} else {
					// No freeze — reset
					streakBroken = true;
					newStreak = 1;
				}
			} else {
				// Missed 2+ days — reset regardless
				streakBroken = true;
				newStreak = 1;
			}
		} else {
			// First ever activity
			newStreak = 1;
		}

		const newLongest = Math.max(data.longest_streak, newStreak);

		await supabase
			.from("streaks")
			.update({
				current_streak: newStreak,
				longest_streak: newLongest,
				last_activity_date: today,
			})
			.eq("user_id", userId);

		// Check for milestone
		let milestoneReached: number | null = null;
		let milestoneXp = 0;
		if (MILESTONE_XP[newStreak]) {
			milestoneReached = newStreak;
			milestoneXp = MILESTONE_XP[newStreak];
			mixpanelService.track("streak_milestone", { days: newStreak, xp: milestoneXp });
		}

		return {
			streakInfo: {
				currentStreak: newStreak,
				longestStreak: newLongest,
				lastActivityDate: today,
				freezesAvailable: frozeUsed && !await revenueCatService.checkProStatus()
					? Math.max(0, data.freezes_available - 1)
					: data.freezes_available,
				freezesUsedThisMonth: frozeUsed
					? data.freezes_used_this_month + 1
					: data.freezes_used_this_month,
				freezesResetAt: data.freezes_reset_at,
				streakTitle: getStreakTitle(newStreak),
			},
			frozeUsed,
			streakBroken,
			milestoneReached,
			milestoneXp,
		};
	}

	private daysBetween(dateA: string, dateB: string): number {
		const a = new Date(dateA);
		const b = new Date(dateB);
		return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
	}

	private getNextMonthReset(): string {
		const now = new Date();
		const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
		return next.toISOString();
	}

	private defaultResult(): StreakUpdateResult {
		return {
			streakInfo: {
				currentStreak: 0,
				longestStreak: 0,
				lastActivityDate: null,
				freezesAvailable: 1,
				freezesUsedThisMonth: 0,
				freezesResetAt: new Date().toISOString(),
				streakTitle: null,
			},
			frozeUsed: false,
			streakBroken: false,
			milestoneReached: null,
			milestoneXp: 0,
		};
	}
}

export const streakService = StreakService.getInstance();
