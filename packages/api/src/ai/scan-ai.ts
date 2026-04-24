import { Anthropic } from "@anthropic-ai/sdk";
import { env } from "@ezcare/env/server";
import { getDisclaimer, SAFETY_PROMPT_INJECTION } from "../logic/legal";
import {
	formatScanUserPrompt,
	getScanSystemPrompt,
	getSimplifiedScanPrompt,
} from "./prompts/scan.prompt";
import type { ScanAIInput, ScanAIOutput } from "./schemas";
import { validateScanInput, validateScanOutput } from "./validator";

const anthropic = new Anthropic({
	apiKey: env.ANTHROPIC_API_KEY,
});

const DEFAULT_FALLBACK: ScanAIOutput = {
	scanId: "", // Will be replaced by caller
	confidence: 0.0,
	processing_time_ms: 0,
	result: {
		summary: "We're reviewing your wellness check. Check back shortly.",
		lifestyle_factors: [],
		suggested_actions: [],
		things_to_avoid: [],
		professional_reminder: {
			should_mention: true,
			note: "For persistent concerns, consider speaking with a wellness or healthcare professional.",
		},
	},
	disclaimer:
		"This is for educational and informational purposes only — not professional advice. Always consult a qualified healthcare professional for concerns.",
};

/**
 * Generates Scan AI result using Claude Sonnet 4.5.
 * Includes timeout, retry logic, and fallback.
 */
export async function generateScanResult(
	input: ScanAIInput
): Promise<ScanAIOutput> {
	const startTime = Date.now();
	const validatedInput = validateScanInput(input);

	try {
		return await callClaude(validatedInput, startTime);
	} catch (error) {
		console.warn(
			"First AI call failed, retrying with simplified prompt...",
			error
		);

		try {
			// Retry once with simplified prompt
			return await callClaude(validatedInput, startTime, true);
		} catch (retryError) {
			console.error("AI Retry failed, returning fallback:", retryError);
			return {
				...DEFAULT_FALLBACK,
				scanId: input.scanId,
				processing_time_ms: Date.now() - startTime,
			};
		}
	}
}

async function callClaude(
	input: ScanAIInput,
	startTime: number,
	isRetry = false
): Promise<ScanAIOutput> {
	const basePrompt = isRetry
		? `${getScanSystemPrompt()}\n\n${getSimplifiedScanPrompt()}`
		: getScanSystemPrompt();
	const systemPrompt = `${basePrompt}\n\n${SAFETY_PROMPT_INJECTION}`;

	const userPrompt = formatScanUserPrompt(input);

	// Implement 15s timeout
	const abortController = new AbortController();
	const timeoutId = setTimeout(() => abortController.abort(), 15_000);

	try {
		const message = await anthropic.messages.create(
			{
				model: "claude-sonnet-4-6",
				max_tokens: 1000,
				messages: [{ role: "user", content: userPrompt }],
				system: systemPrompt,
			},
			{ signal: abortController.signal }
		);

		clearTimeout(timeoutId);

		const firstContent = message.content[0];
		if (!firstContent || firstContent.type !== "text") {
			throw new Error("Unexpected content type from Claude");
		}

		const rawJson = firstContent.text;
		const parsed = JSON.parse(rawJson);

		const validated = validateScanOutput(parsed);

		return {
			...validated,
			disclaimer: getDisclaimer(validated.disclaimer),
			processing_time_ms: Date.now() - startTime,
		};
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
}
