import { Anthropic } from "@anthropic-ai/sdk";
import { env } from "@ezcare/env/server";
import { detectHealthPatterns } from "../logic/health-memory";
import { GLOBAL_DISCLAIMER, SAFETY_PROMPT_INJECTION } from "../logic/legal";
import { logger } from "../logic/logger";
import {
	formatDailyInsightUserPrompt,
	getDailyInsightSystemPrompt,
} from "./prompts/insight.prompt";
import {
	type DailyInsightInput,
	type DailyInsightOutput,
	DailyInsightOutputSchema,
} from "./schemas";

const anthropic = new Anthropic({
	apiKey: env.ANTHROPIC_API_KEY,
});

// Simple in-memory cache for POC: Map<"${userId}:${date}", DailyInsightOutput>
const insightCache = new Map<string, DailyInsightOutput>();

const DEFAULT_FALLBACK: DailyInsightOutput = {
	insight: {
		text: "Your health profile is updating. Check in again tomorrow for deeper insights.",
		tone: "encouraging",
		confidence: 0.0,
	},
	suggestedAction: {
		area: "stress",
		microAction: "Take 3 slow breaths right now.",
	},
};

/**
 * Generates Daily Insight using AI.
 * Includes timeout, retry logic, 24h cache, and fallback.
 */
export async function generateDailyInsight(
	input: DailyInsightInput
): Promise<DailyInsightOutput> {
	const cacheKey = `${input.userId}:${input.date}`;

	// 1. Check Cache
	const cached = insightCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	try {
		return await callAIWithRetry(input, cacheKey);
	} catch (error) {
		console.error("Daily Insight AI failed after retries:", error);
		return DEFAULT_FALLBACK;
	}
}

async function callAIWithRetry(
	input: DailyInsightInput,
	cacheKey: string,
	retries = 1
): Promise<DailyInsightOutput> {
	const healthMemory = detectHealthPatterns(input);
	const systemPrompt = `${getDailyInsightSystemPrompt()}\n\n${SAFETY_PROMPT_INJECTION}`;
	const userPrompt = formatDailyInsightUserPrompt(input, healthMemory);

	let lastError: unknown;
	for (let i = 0; i <= retries; i++) {
		const abortController = new AbortController();
		const timeoutId = setTimeout(() => abortController.abort(), 10_000); // 10s timeout

		try {
			const message = await anthropic.messages.create(
				{
					model: "claude-3-5-sonnet-20241022",
					max_tokens: 500,
					messages: [{ role: "user", content: userPrompt }],
					system: systemPrompt,
				},
				{ signal: abortController.signal }
			);

			clearTimeout(timeoutId);

			const firstContent = message.content[0];
			if (firstContent?.type !== "text") {
				throw new Error("Unexpected content type from AI");
			}

			const rawJson = firstContent.text;
			const parsed = JSON.parse(rawJson);
			const validated = DailyInsightOutputSchema.parse(parsed);

			// Cache the result for 24h (POC: forever in memory until process restarts)
			insightCache.set(cacheKey, validated);

			logger.ai(input.userId, "dailyInsight", 0); // No global startTime here, but we could add it

			return {
				...validated,
				disclaimer: GLOBAL_DISCLAIMER,
			};
		} catch (error) {
			clearTimeout(timeoutId);
			lastError = error;
			console.warn(
				`AI attempt ${i + 1} failed:`,
				error instanceof Error ? error.message : error
			);
			if (i === retries) {
				break;
			}
			// Small delay before retry
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	throw lastError;
}
