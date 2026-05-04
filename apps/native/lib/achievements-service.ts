/**
 * Achievements Service
 *
 * Checks and unlocks achievements based on user actions.
 * Achievement definitions live in Supabase `achievements` table (seeded via SQL).
 * User unlocks tracked in `user_achievements`.
 */

import { supabase } from "./supabase";
import { mixpanelService } from "./mixpanel-service";
import { levelsService } from "./levels-service";

// -- Types ----------------------------------------------------

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
	id: string;
	code: string;
	name: string;
	description: string;
	rarity: AchievementRarity;
	icon: string;
	xpBonus: number;
	conditions: Record<string, unknown>;
}

export interface UserAchievement {
	achievement: Achievement;
	unlockedAt: string;
}

export interface AchievementUnlock {
	achievement: Achievement;
	xpAwarded: number;
	isNew: boolean;
}

// Trigger events that can unlock achievements
export type AchievementTrigger =
	| "quest_complete"
	| "daily_all_quests"
	| "checkin"
	| "meal_scan"
	| "mood_log"
	| "streak_update"
	| "level_up"
	| "chat_message"
	| "league_promoted"
	| "league_first_legendary";

// Rarity colors for UI
export const RARITY_COLORS: Record<AchievementRarity, { bg: string; border: string; text: string }> = {
	common: { bg: "#1A2138", border: "#4A5568", text: "#E2E8F0" },
	rare: { bg: "#1A1A3E", border: "#C0C0C0", text: "#C0C0C0" },
	epic: { bg: "#2D1B00", border: "#FFD60A", text: "#FFD60A" },
	legendary: { bg: "#2D1052", border: "#9D4EDD", text: "#9D4EDD" },
};

// -- Service --------------------------------------------------

class AchievementsService {
	private static instance: AchievementsService;
	private achievementsCache: Achievement[] | null = null;

	static getInstance(): AchievementsService {
		if (!AchievementsService.instance) {
			AchievementsService.instance = new AchievementsService();
		}
		return AchievementsService.instance;
	}

	/**
	 * Load all achievement definitions (cached after first load).
	 */
	private async getAllAchievements(): Promise<Achievement[]> {
		if (this.achievementsCache) return this.achievementsCache;

		const { data } = await supabase
			.from("achievements")
			.select("id, code, name, description, rarity, icon, xp_bonus, conditions")
			.order("rarity");

		if (!data) return [];

		this.achievementsCache = data.map((a) => ({
			id: a.id,
			code: a.code,
			name: a.name,
			description: a.description,
			rarity: a.rarity as AchievementRarity,
			icon: a.icon,
			xpBonus: a.xp_bonus,
			conditions: a.conditions as Record<string, unknown>,
		}));

		return this.achievementsCache;
	}

	/**
	 * Get all achievements the user has unlocked.
	 */
	async getUserAchievements(userId: string): Promise<UserAchievement[]> {
		const allAchievements = await this.getAllAchievements();

		const { data: unlocked } = await supabase
			.from("user_achievements")
			.select("achievement_id, unlocked_at")
			.eq("user_id", userId);

		if (!unlocked) return [];

		const unlockedMap = new Map(
			unlocked.map((u) => [u.achievement_id, u.unlocked_at])
		);

		return allAchievements
			.filter((a) => unlockedMap.has(a.id))
			.map((a) => ({
				achievement: a,
				unlockedAt: unlockedMap.get(a.id)!,
			}));
	}

	/**
	 * Get count of unlocked achievements.
	 */
	async getUnlockedCount(userId: string): Promise<number> {
		const { count } = await supabase
			.from("user_achievements")
			.select("id", { count: "exact", head: true })
			.eq("user_id", userId);

		return count ?? 0;
	}

	/**
	 * Check if a specific achievement is already unlocked.
	 */
	private async isUnlocked(userId: string, achievementId: string): Promise<boolean> {
		const { data } = await supabase
			.from("user_achievements")
			.select("id")
			.eq("user_id", userId)
			.eq("achievement_id", achievementId)
			.single();

		return !!data;
	}

	/**
	 * Unlock an achievement for a user. Awards XP bonus.
	 * Returns null if already unlocked.
	 */
	async unlockAchievement(
		userId: string,
		achievementCode: string
	): Promise<AchievementUnlock | null> {
		const allAchievements = await this.getAllAchievements();
		const achievement = allAchievements.find((a) => a.code === achievementCode);
		if (!achievement) return null;

		const alreadyUnlocked = await this.isUnlocked(userId, achievement.id);
		if (alreadyUnlocked) {
			return { achievement, xpAwarded: 0, isNew: false };
		}

		// Unlock it
		const { error } = await supabase.from("user_achievements").insert({
			user_id: userId,
			achievement_id: achievement.id,
		});

		if (error) return null;

		// Award XP bonus
		let xpAwarded = 0;
		if (achievement.xpBonus > 0) {
			await levelsService.addXp(
				userId,
				achievement.xpBonus,
				"achievement_bonus",
				{ achievement: achievement.code }
			);
			xpAwarded = achievement.xpBonus;
		}

		mixpanelService.track("achievement_unlocked", {
			code: achievement.code,
			name: achievement.name,
			rarity: achievement.rarity,
			xp_bonus: achievement.xpBonus,
		});

		return { achievement, xpAwarded, isNew: true };
	}

	/**
	 * Check achievements based on a trigger event.
	 * Call this after key user actions. Returns any newly unlocked achievements.
	 */
	async checkAchievements(
		userId: string,
		trigger: AchievementTrigger,
		context?: Record<string, unknown>
	): Promise<AchievementUnlock[]> {
		const unlocks: AchievementUnlock[] = [];

		try {
			switch (trigger) {
				case "quest_complete":
					await this.checkQuestAchievements(userId, unlocks);
					break;
				case "daily_all_quests":
					await this.checkDailyAllQuests(userId, unlocks);
					break;
				case "meal_scan":
					await this.checkMealAchievements(userId, unlocks);
					break;
				case "mood_log":
					await this.checkMoodAchievements(userId, unlocks);
					break;
				case "streak_update": {
					const streak = (context?.streak as number) ?? 0;
					await this.checkStreakAchievements(userId, streak, unlocks);
					break;
				}
				case "level_up": {
					const level = (context?.level as number) ?? 0;
					await this.checkLevelAchievements(userId, level, unlocks);
					break;
				}
				case "chat_message":
					await this.checkChatAchievements(userId, unlocks);
					break;
				case "league_promoted":
					await this.checkLeagueAchievements(userId, unlocks);
					break;
				case "league_first_legendary":
					await this.tryUnlock(userId, "league_champion", unlocks);
					break;
				case "checkin":
					// Check-in triggers are covered by streak/quest checks
					break;
			}

			// Always check polymath (achievement count)
			await this.checkPolymathAchievement(userId, unlocks);
		} catch (e) {
			console.warn("[Achievements] check failed:", e);
		}

		return unlocks.filter((u) => u.isNew);
	}

	// -- Private achievement checkers ---------------------------

	private async tryUnlock(
		userId: string,
		code: string,
		unlocks: AchievementUnlock[]
	): Promise<void> {
		const result = await this.unlockAchievement(userId, code);
		if (result?.isNew) unlocks.push(result);
	}

	private async checkQuestAchievements(
		userId: string,
		unlocks: AchievementUnlock[]
	): Promise<void> {
		// Count total quests completed
		const { count } = await supabase
			.from("xp_transactions")
			.select("id", { count: "exact", head: true })
			.eq("user_id", userId)
			.eq("source", "quest_completion");

		const total = count ?? 0;

		if (total >= 1) await this.tryUnlock(userId, "first_steps", unlocks);
		if (total >= 30) await this.tryUnlock(userId, "quest_crusher_30", unlocks);
		if (total >= 100) await this.tryUnlock(userId, "quest_legend_100", unlocks);
	}

	private async checkDailyAllQuests(
		userId: string,
		unlocks: AchievementUnlock[]
	): Promise<void> {
		// daily_doer: complete all 3 in one day (already triggered means it happened)
		await this.tryUnlock(userId, "daily_doer", unlocks);

		// iron_will: all quests for 30 days straight
		// Count daily_hero_bonus transactions (awarded when all 3 done)
		const { count } = await supabase
			.from("xp_transactions")
			.select("id", { count: "exact", head: true })
			.eq("user_id", userId)
			.eq("source", "daily_hero_bonus");

		const total = count ?? 0;
		if (total >= 30) await this.tryUnlock(userId, "iron_will", unlocks);
	}

	private async checkMealAchievements(
		userId: string,
		unlocks: AchievementUnlock[]
	): Promise<void> {
		const { count } = await supabase
			.from("xp_transactions")
			.select("id", { count: "exact", head: true })
			.eq("user_id", userId)
			.eq("source", "meal_log");

		const total = count ?? 0;
		if (total >= 1) await this.tryUnlock(userId, "first_scan", unlocks);
		if (total >= 7) await this.tryUnlock(userId, "scan_streak_7", unlocks);
	}

	private async checkMoodAchievements(
		userId: string,
		unlocks: AchievementUnlock[]
	): Promise<void> {
		const { count } = await supabase
			.from("xp_transactions")
			.select("id", { count: "exact", head: true })
			.eq("user_id", userId)
			.eq("source", "mood_log");

		const total = count ?? 0;
		if (total >= 1) await this.tryUnlock(userId, "vibe_check", unlocks);
		if (total >= 14) await this.tryUnlock(userId, "mood_tracker_14", unlocks);
	}

	private async checkStreakAchievements(
		userId: string,
		streak: number,
		unlocks: AchievementUnlock[]
	): Promise<void> {
		if (streak >= 7) await this.tryUnlock(userId, "deep_diver", unlocks);
		if (streak >= 30) await this.tryUnlock(userId, "streak_master_30", unlocks);
		if (streak >= 100) await this.tryUnlock(userId, "centurion", unlocks);
	}

	private async checkLevelAchievements(
		userId: string,
		level: number,
		unlocks: AchievementUnlock[]
	): Promise<void> {
		if (level >= 25) await this.tryUnlock(userId, "awakened", unlocks);
		if (level >= 50) await this.tryUnlock(userId, "sovereign", unlocks);
	}

	private async checkChatAchievements(
		userId: string,
		unlocks: AchievementUnlock[]
	): Promise<void> {
		const { count } = await supabase
			.from("xp_transactions")
			.select("id", { count: "exact", head: true })
			.eq("user_id", userId)
			.eq("source", "ai_chat");

		const total = count ?? 0;
		if (total >= 50) await this.tryUnlock(userId, "chat_sage", unlocks);
	}

	private async checkLeagueAchievements(
		userId: string,
		unlocks: AchievementUnlock[]
	): Promise<void> {
		// Count promotions
		const { count } = await supabase
			.from("league_week_entries")
			.select("id", { count: "exact", head: true })
			.eq("user_id", userId)
			.eq("promoted", true);

		const total = count ?? 0;
		if (total >= 3) await this.tryUnlock(userId, "league_climber", unlocks);
	}

	private async checkPolymathAchievement(
		userId: string,
		unlocks: AchievementUnlock[]
	): Promise<void> {
		const count = await this.getUnlockedCount(userId);
		if (count >= 15) await this.tryUnlock(userId, "polymath", unlocks);
	}
}

export const achievementsService = AchievementsService.getInstance();
