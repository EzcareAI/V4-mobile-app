/**
 * Awakening Levels Service
 *
 * Manages XP, levels (1-50), titles, and avatar stages.
 * All data persisted in Supabase `awakening_levels` + `xp_transactions`.
 */

import { supabase } from "./supabase";
import { mixpanelService } from "./mixpanel-service";
import { leaguesService } from "./leagues-service";
import { achievementsService } from "./achievements-service";
import { avatarService } from "./avatar-service";

// ── XP formula: floor(100 * level^1.5) ──────────────────────
export function xpForNextLevel(level: number): number {
	return Math.floor(100 * Math.pow(level, 1.5));
}

// ── Level titles & avatar stages ────────────────────────────
const LEVEL_TIERS: { maxLevel: number; title: string; avatarStage: number }[] = [
	{ maxLevel: 5, title: "Sleeper", avatarStage: 0 },
	{ maxLevel: 10, title: "Awakening", avatarStage: 0 },
	{ maxLevel: 15, title: "Aware", avatarStage: 1 },
	{ maxLevel: 20, title: "Conscious", avatarStage: 1 },
	{ maxLevel: 25, title: "Vital", avatarStage: 1 },
	{ maxLevel: 30, title: "Optimized", avatarStage: 2 },
	{ maxLevel: 40, title: "Master", avatarStage: 2 },
	{ maxLevel: 50, title: "Sovereign", avatarStage: 2 },
];

export function getTierForLevel(level: number): { title: string; avatarStage: number } {
	for (const tier of LEVEL_TIERS) {
		if (level <= tier.maxLevel) return tier;
	}
	return LEVEL_TIERS[LEVEL_TIERS.length - 1];
}

// ── Types ────────────────────────────────────────────────────
export type XpSource =
	| "quest_completion"
	| "daily_check_in"
	| "meal_log"
	| "streak_milestone"
	| "ai_chat"
	| "mood_log"
	| "daily_hero_bonus"
	| "achievement_bonus"
	| "league_promotion"
	| "awakening_ritual";

export interface LevelInfo {
	currentLevel: number;
	levelTitle: string;
	avatarStage: number;
	currentXp: number;
	xpForNext: number;
	progressPct: number; // 0-1
	totalXpEarned: number;
}

export interface AddXpResult {
	xpAdded: number;
	leveledUp: boolean;
	newLevel: number;
	levelInfo: LevelInfo;
}

// ── Service ──────────────────────────────────────────────────
class LevelsService {
	private static instance: LevelsService;

	static getInstance(): LevelsService {
		if (!LevelsService.instance) {
			LevelsService.instance = new LevelsService();
		}
		return LevelsService.instance;
	}

	/**
	 * Ensure the user has an awakening_levels row. Creates one if missing.
	 */
	private async ensureRow(userId: string): Promise<void> {
		const { data } = await supabase
			.from("awakening_levels")
			.select("id")
			.eq("user_id", userId)
			.single();

		if (!data) {
			await supabase.from("awakening_levels").insert({ user_id: userId });
		}
	}

	/**
	 * Get the user's current level info.
	 */
	async getLevelInfo(userId: string): Promise<LevelInfo> {
		await this.ensureRow(userId);

		const { data, error } = await supabase
			.from("awakening_levels")
			.select("current_level, current_xp, total_xp_earned, level_title, avatar_stage")
			.eq("user_id", userId)
			.single();

		if (error || !data) {
			// Return defaults if fetch fails
			return {
				currentLevel: 1,
				levelTitle: "Sleeper",
				avatarStage: 0,
				currentXp: 0,
				xpForNext: xpForNextLevel(1),
				progressPct: 0,
				totalXpEarned: 0,
			};
		}

		const xpNeeded = xpForNextLevel(data.current_level);
		return {
			currentLevel: data.current_level,
			levelTitle: data.level_title,
			avatarStage: data.avatar_stage,
			currentXp: data.current_xp,
			xpForNext: xpNeeded,
			progressPct: Math.min(data.current_xp / Math.max(xpNeeded, 1), 1),
			totalXpEarned: data.total_xp_earned,
		};
	}

	/**
	 * Add XP to the user. Handles level-up logic, title changes, avatar stage updates.
	 * Returns the result including whether a level-up occurred.
	 */
	async addXp(
		userId: string,
		amount: number,
		source: XpSource,
		metadata?: Record<string, unknown>
	): Promise<AddXpResult> {
		await this.ensureRow(userId);

		// 1. Log the XP transaction
		await supabase.from("xp_transactions").insert({
			user_id: userId,
			amount,
			source,
			metadata: metadata ?? {},
		});

		// 2. Get current state
		const { data: current } = await supabase
			.from("awakening_levels")
			.select("current_level, current_xp, total_xp_earned")
			.eq("user_id", userId)
			.single();

		if (!current) {
			return {
				xpAdded: amount,
				leveledUp: false,
				newLevel: 1,
				levelInfo: {
					currentLevel: 1,
					levelTitle: "Sleeper",
					avatarStage: 0,
					currentXp: amount,
					xpForNext: xpForNextLevel(1),
					progressPct: amount / xpForNextLevel(1),
					totalXpEarned: amount,
				},
			};
		}

		// 3. Calculate new XP and check for level-ups
		let newXp = current.current_xp + amount;
		let newLevel = current.current_level;
		let leveledUp = false;

		while (newLevel < 50 && newXp >= xpForNextLevel(newLevel)) {
			newXp -= xpForNextLevel(newLevel);
			newLevel++;
			leveledUp = true;
		}

		// Cap at level 50
		if (newLevel >= 50) {
			newLevel = 50;
		}

		const tier = getTierForLevel(newLevel);
		const newTotalXp = current.total_xp_earned + amount;

		// 4. Update the row
		await supabase
			.from("awakening_levels")
			.update({
				current_level: newLevel,
				current_xp: newXp,
				total_xp_earned: newTotalXp,
				level_title: tier.title,
				avatar_stage: tier.avatarStage,
			})
			.eq("user_id", userId);

		// 5. Track analytics
		mixpanelService.track("xp_gained", { amount, source, new_total: newTotalXp });
		if (leveledUp) {
			mixpanelService.track("level_up", { new_level: newLevel, title: tier.title });
			// Trigger avatar evolution check
			avatarService.onLevelUp(userId, newLevel).catch(() => {});
			// Check level-based achievements
			achievementsService
				.checkAchievements(userId, "level_up", { level: newLevel })
				.catch(() => {});
		}

		// 6. Pipe XP to weekly league tally (skip for achievement/league sources to avoid loops)
		if (source !== "achievement_bonus" && source !== "league_promotion") {
			leaguesService.addWeeklyXp(userId, amount).catch(() => {});
		}

		const xpNeeded = xpForNextLevel(newLevel);
		const levelInfo: LevelInfo = {
			currentLevel: newLevel,
			levelTitle: tier.title,
			avatarStage: tier.avatarStage,
			currentXp: newXp,
			xpForNext: xpNeeded,
			progressPct: Math.min(newXp / Math.max(xpNeeded, 1), 1),
			totalXpEarned: newTotalXp,
		};

		return { xpAdded: amount, leveledUp, newLevel, levelInfo };
	}

	/**
	 * Get today's XP transactions count for a given source (for rate-limiting).
	 */
	async getTodayCountForSource(userId: string, source: XpSource): Promise<number> {
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);

		const { count } = await supabase
			.from("xp_transactions")
			.select("id", { count: "exact", head: true })
			.eq("user_id", userId)
			.eq("source", source)
			.gte("created_at", todayStart.toISOString());

		return count ?? 0;
	}
}

export const levelsService = LevelsService.getInstance();
