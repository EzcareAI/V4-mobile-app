/**
 * AI Insights Engine
 *
 * Generates personalized insights after quest completions using Claude.
 * Connects actions to bigger lifestyle patterns.
 * Insights saved to Supabase `user_insights` table.
 */

import { supabase } from "./supabase";
import { mixpanelService } from "./mixpanel-service";

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

// ── Types ────────────────────────────────────────────────────
export interface Insight {
	insight: string;
	patternDetected: string | null;
	nextActionSuggestion: string | null;
}

export interface InsightContext {
	questLabel: string;
	questCategory: string;
	questDifficulty: string;
	userLevel: number;
	streakDays: number;
	weeklyXp: number;
	intention?: string;
}

// ── Service ──────────────────────────────────────────────────
class InsightsEngine {
	private static instance: InsightsEngine;

	static getInstance(): InsightsEngine {
		if (!InsightsEngine.instance) {
			InsightsEngine.instance = new InsightsEngine();
		}
		return InsightsEngine.instance;
	}

	/**
	 * Generate an insight after a quest completion.
	 * Returns null if generation fails (non-blocking).
	 */
	async generateInsight(userId: string, context: InsightContext): Promise<Insight | null> {
		if (!apiKey) return null;

		try {
			const prompt = `You are EZBuddy, the AI companion for EzCare lifestyle app.
The user just completed a quest. Generate ONE concise insight (2-3 sentences) connecting this completion to their lifestyle patterns and progress.

Context:
- Completed quest: "${context.questLabel}" (${context.questCategory}, ${context.questDifficulty})
- User's awakening level: ${context.userLevel}
- Current streak: ${context.streakDays} days
- This week's XP: ${context.weeklyXp}
${context.intention ? `- Today's intention: ${context.intention}` : ""}

Rules:
- Warm, insightful, motivating but NEVER preachy
- Make it feel personal and specific to what they just did
- Connect the action to a bigger pattern when possible
- NEVER give medical or health advice
- Keep it lifestyle/educational only
- Max 2-3 sentences for insight

Return ONLY valid JSON:
{
  "insight": "your personalized message here",
  "pattern_detected": "brief pattern description or null",
  "next_action_suggestion": "optional next step or null"
}`;

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
					max_tokens: 300,
					messages: [{ role: "user", content: prompt }],
				}),
			});

			if (!response.ok) {
				console.warn("[Insights] API error:", response.status);
				return null;
			}

			const result = await response.json();
			const text = result.content?.[0]?.text ?? "";

			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (!jsonMatch) return null;

			const parsed = JSON.parse(jsonMatch[0]);

			const insight: Insight = {
				insight: String(parsed.insight ?? "").slice(0, 300),
				patternDetected: parsed.pattern_detected ?? null,
				nextActionSuggestion: parsed.next_action_suggestion ?? null,
			};

			// Save to Supabase
			await supabase.from("user_insights").insert({
				user_id: userId,
				trigger_event: "quest_completion",
				insight: insight.insight,
				pattern_detected: insight.patternDetected,
				next_action_suggestion: insight.nextActionSuggestion,
				context: {
					quest: context.questLabel,
					category: context.questCategory,
					level: context.userLevel,
					streak: context.streakDays,
				},
			});

			mixpanelService.track("insight_generated", {
				trigger: "quest_completion",
				quest_category: context.questCategory,
				has_pattern: !!insight.patternDetected,
			});

			return insight;
		} catch (err) {
			console.warn("[Insights] Generation failed:", err);
			return null;
		}
	}

	/**
	 * Get recent insights for display in profile/history.
	 */
	async getRecentInsights(userId: string, limit = 10): Promise<Insight[]> {
		const { data } = await supabase
			.from("user_insights")
			.select("insight, pattern_detected, next_action_suggestion")
			.eq("user_id", userId)
			.order("created_at", { ascending: false })
			.limit(limit);

		if (!data) return [];

		return data.map((row) => ({
			insight: row.insight,
			patternDetected: row.pattern_detected,
			nextActionSuggestion: row.next_action_suggestion,
		}));
	}
}

export const insightsEngine = InsightsEngine.getInstance();
