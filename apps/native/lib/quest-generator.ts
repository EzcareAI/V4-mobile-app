/**
 * Daily Quest Generator
 *
 * Uses Anthropic Claude to generate 3 personalized daily quests.
 * Caches in Supabase `daily_quests` table — 1 generation per user per day.
 */

import { Platform } from "react-native";
import { supabase } from "./supabase";
import { mixpanelService } from "./mixpanel-service";

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

// ── Types ────────────────────────────────────────────────────
export interface QuestGoal {
	type: "count" | "duration" | "time_of_day" | "self_report";
	value: number;
	unit?: string;
}

export interface Quest {
	id: string; // "q1", "q2", "q3"
	difficulty: "easy" | "medium" | "hard";
	category: "hydration" | "movement" | "sleep" | "nutrition" | "mindfulness" | "reflection";
	icon: string;
	label: string;
	description: string;
	xp_reward: number;
	measurable_goal: QuestGoal;
}

export interface DailyQuestsData {
	quests: Quest[];
	completedQuestIds: string[];
	bonusCompleted: boolean;
	date: string;
}

// ── Fallback quests if AI generation fails ───────────────────
const FALLBACK_QUESTS: Quest[] = [
	{
		id: "q1",
		difficulty: "easy",
		category: "hydration",
		icon: "water-outline",
		label: "Drink 6 glasses of water",
		description: "Stay hydrated throughout your day",
		xp_reward: 50,
		measurable_goal: { type: "self_report", value: 1 },
	},
	{
		id: "q2",
		difficulty: "medium",
		category: "movement",
		icon: "walk-outline",
		label: "Take a 20-minute walk",
		description: "Get outside and move your body",
		xp_reward: 100,
		measurable_goal: { type: "duration", value: 20, unit: "minutes" },
	},
	{
		id: "q3",
		difficulty: "hard",
		category: "mindfulness",
		icon: "leaf-outline",
		label: "15-minute meditation session",
		description: "Find a quiet space and practice mindfulness",
		xp_reward: 200,
		measurable_goal: { type: "duration", value: 15, unit: "minutes" },
	},
];

// ── XP by difficulty ─────────────────────────────────────────
const XP_BY_DIFFICULTY: Record<string, number> = {
	easy: 50,
	medium: 100,
	hard: 200,
};

// ── Service ──────────────────────────────────────────────────
class QuestGenerator {
	private static instance: QuestGenerator;

	static getInstance(): QuestGenerator {
		if (!QuestGenerator.instance) {
			QuestGenerator.instance = new QuestGenerator();
		}
		return QuestGenerator.instance;
	}

	private todayStr(): string {
		return new Date().toISOString().split("T")[0];
	}

	/**
	 * Get today's quests for the user. Generates via AI if not cached.
	 * Optional ritualContext from Awakening Ritual for better personalization.
	 */
	async getTodayQuests(
		userId: string,
		ritualContext?: { sleepScore: number; energyScore: number; intention: string }
	): Promise<DailyQuestsData> {
		const today = this.todayStr();

		// 1. Check cache
		const { data: cached } = await supabase
			.from("daily_quests")
			.select("*")
			.eq("user_id", userId)
			.eq("date", today)
			.single();

		if (cached) {
			return {
				quests: cached.quests as Quest[],
				completedQuestIds: (cached.completed_quest_ids as string[]) ?? [],
				bonusCompleted: cached.bonus_completed,
				date: today,
			};
		}

		// 2. Generate new quests
		const quests = await this.generateQuests(userId, ritualContext);

		// 3. Store in DB
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 1);
		expiresAt.setHours(6, 0, 0, 0); // Expires at 6am next day

		await supabase.from("daily_quests").insert({
			user_id: userId,
			date: today,
			quests,
			completed_quest_ids: [],
			bonus_completed: false,
			expires_at: expiresAt.toISOString(),
		});

		return {
			quests,
			completedQuestIds: [],
			bonusCompleted: false,
			date: today,
		};
	}

	/**
	 * Mark a quest as completed.
	 */
	async completeQuest(userId: string, questId: string): Promise<{
		completedQuestIds: string[];
		bonusCompleted: boolean;
		xpAwarded: number;
		allCompleted: boolean;
	}> {
		const today = this.todayStr();

		const { data } = await supabase
			.from("daily_quests")
			.select("quests, completed_quest_ids, bonus_completed")
			.eq("user_id", userId)
			.eq("date", today)
			.single();

		if (!data) {
			return { completedQuestIds: [], bonusCompleted: false, xpAwarded: 0, allCompleted: false };
		}

		const quests = data.quests as Quest[];
		const completed = [...((data.completed_quest_ids as string[]) ?? [])];

		// Already completed this quest
		if (completed.includes(questId)) {
			return {
				completedQuestIds: completed,
				bonusCompleted: data.bonus_completed,
				xpAwarded: 0,
				allCompleted: false,
			};
		}

		completed.push(questId);

		// Find the quest to determine XP reward
		const quest = quests.find((q) => q.id === questId);
		const xpAwarded = quest?.xp_reward ?? XP_BY_DIFFICULTY[quest?.difficulty ?? "easy"] ?? 50;

		// Check if all 3 completed = bonus
		const allCompleted = completed.length >= 3;
		const bonusCompleted = allCompleted && !data.bonus_completed;

		await supabase
			.from("daily_quests")
			.update({
				completed_quest_ids: completed,
				bonus_completed: allCompleted,
			})
			.eq("user_id", userId)
			.eq("date", today);

		mixpanelService.track("quest_completed", {
			quest_id: questId,
			difficulty: quest?.difficulty,
			category: quest?.category,
			xp: xpAwarded,
		});

		return {
			completedQuestIds: completed,
			bonusCompleted: allCompleted,
			xpAwarded,
			allCompleted: bonusCompleted, // true only on the transition to all-complete
		};
	}

	/**
	 * Generate quests via Anthropic Claude API.
	 */
	private async generateQuests(
		userId: string,
		ritualContext?: { sleepScore: number; energyScore: number; intention: string }
	): Promise<Quest[]> {
		if (!apiKey) {
			console.warn("[QuestGenerator] No API key, using fallback quests");
			return FALLBACK_QUESTS;
		}

		try {
			// Gather user context for personalization
			const context = await this.getUserContext(userId);

			const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];

			const ritualInfo = ritualContext
				? `\n- Morning sleep quality: ${ritualContext.sleepScore}/5\n- Morning energy: ${ritualContext.energyScore}/10\n- Today's intention: ${ritualContext.intention}`
				: "";

			const systemPrompt = `You are EZBuddy, the AI for EzCare AI lifestyle app.

Generate exactly 3 personalized daily quests for a user.

User profile:
- Goal: ${context.goal}
- Awakening level: ${context.level} (${context.levelTitle})
- Current streak: ${context.streak} days
- Meals logged today: ${context.mealsToday}
- Today is: ${dayOfWeek}${ritualInfo}

Requirements:
- 1 easy quest (5 minutes effort, achievable for anyone) worth 50 XP
- 1 medium quest (15-30 minutes effort) worth 100 XP
- 1 hard quest (significant commitment but doable in 1 day) worth 200 XP
- Vary categories: hydration, movement, sleep, nutrition, mindfulness, reflection
- Don't repeat the same category for all 3
- Align with user's goal
- Lifestyle-focused, NEVER medical advice
- Engaging, friendly language
- Labels max 40 chars, descriptions max 100 chars

Return ONLY valid JSON:
{
  "quests": [
    {
      "id": "q1",
      "difficulty": "easy",
      "category": "hydration",
      "icon": "water-outline",
      "label": "Drink 6 glasses of water",
      "description": "Stay hydrated throughout your day",
      "xp_reward": 50,
      "measurable_goal": { "type": "self_report", "value": 1 }
    },
    {
      "id": "q2",
      "difficulty": "medium",
      "category": "movement",
      "icon": "walk-outline",
      "label": "...",
      "description": "...",
      "xp_reward": 100,
      "measurable_goal": { "type": "duration", "value": 20, "unit": "minutes" }
    },
    {
      "id": "q3",
      "difficulty": "hard",
      "category": "mindfulness",
      "icon": "leaf-outline",
      "label": "...",
      "description": "...",
      "xp_reward": 200,
      "measurable_goal": { "type": "self_report", "value": 1 }
    }
  ]
}

Valid icon values (Ionicons): water-outline, walk-outline, leaf-outline, bed-outline, restaurant-outline, happy-outline, book-outline, fitness-outline, heart-outline, moon-outline, sunny-outline, musical-notes-outline`;

			const response = await fetch("https://api.anthropic.com/v1/messages", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": apiKey,
					"anthropic-version": "2023-06-01",
					"anthropic-dangerous-direct-browser-access": "true",
				},
				body: JSON.stringify({
					model: "claude-haiku-4-5-20251001",
					max_tokens: 800,
					system: systemPrompt,
					messages: [{ role: "user", content: "Generate my 3 daily quests for today." }],
				}),
			});

			if (!response.ok) {
				console.warn("[QuestGenerator] API error:", response.status);
				return FALLBACK_QUESTS;
			}

			const result = await response.json();
			const text = result.content?.[0]?.text ?? "";

			// Extract JSON from response
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				console.warn("[QuestGenerator] No JSON in response");
				return FALLBACK_QUESTS;
			}

			const parsed = JSON.parse(jsonMatch[0]);
			if (!parsed.quests || !Array.isArray(parsed.quests) || parsed.quests.length !== 3) {
				console.warn("[QuestGenerator] Invalid quest structure");
				return FALLBACK_QUESTS;
			}

			// Validate and normalize each quest
			return parsed.quests.map((q: any, i: number) => ({
				id: `q${i + 1}`,
				difficulty: q.difficulty ?? ["easy", "medium", "hard"][i],
				category: q.category ?? "mindfulness",
				icon: q.icon ?? "star-outline",
				label: String(q.label ?? "Complete a quest").slice(0, 40),
				description: String(q.description ?? "").slice(0, 100),
				xp_reward: XP_BY_DIFFICULTY[q.difficulty] ?? [50, 100, 200][i],
				measurable_goal: q.measurable_goal ?? { type: "self_report", value: 1 },
			}));
		} catch (err) {
			console.warn("[QuestGenerator] Generation failed:", err);
			return FALLBACK_QUESTS;
		}
	}

	/**
	 * Gather user context for AI personalization.
	 */
	private async getUserContext(userId: string): Promise<{
		goal: string;
		level: number;
		levelTitle: string;
		streak: number;
		mealsToday: number;
	}> {
		try {
			const [levelData, streakData] = await Promise.all([
				supabase.from("awakening_levels").select("current_level, level_title").eq("user_id", userId).single(),
				supabase.from("streaks").select("current_streak").eq("user_id", userId).single(),
			]);

			return {
				goal: "lifestyle improvement",
				level: levelData.data?.current_level ?? 1,
				levelTitle: levelData.data?.level_title ?? "Sleeper",
				streak: streakData.data?.current_streak ?? 0,
				mealsToday: 0,
			};
		} catch {
			return { goal: "lifestyle improvement", level: 1, levelTitle: "Sleeper", streak: 0, mealsToday: 0 };
		}
	}
}

export const questGenerator = QuestGenerator.getInstance();
