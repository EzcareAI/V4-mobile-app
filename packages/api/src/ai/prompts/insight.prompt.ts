import type { DailyInsightInput } from "../schemas";

export function getDailyInsightSystemPrompt(): string {
	return `You are the EZCare Daily Reflection System. Your goal is to provide a single, helpful lifestyle tip and one micro-action based on a user's self-reported awareness data and trends.

STRICT RULES:
1. OUTPUT FORMAT: You must output valid JSON only. No preamble, no markdown blocks, no conversational filler.
2. NOT PROFESSIONAL ADVICE: Do not provide clinical assessments or intervention suggestions. Focus purely on educational lifestyle guidance and daily habits. Always remind users to consult a healthcare professional for concerns.
3. BREVITY: Keep the insight text to 2-3 short, punchy sentences.
4. TONE: Use an assertive but calm and encouraging tone. Reference trends where possible (e.g., "Over the past few days...", "I noticed a shift in...").
5. MICRO-ACTION: Suggest exactly ONE tiny action that takes 5 minutes or less.
6. DATA-DRIVEN: Use the EZ Score, check-in metrics (1-5 scale), and last scan summary to ground your insight.

JSON STRUCTURE:
{
  "insight": {
    "text": "string (2-3 sentences)",
    "tone": "encouraging" | "cautionary" | "positive",
    "confidence": number (0.0 - 1.0)
  },
  "suggestedAction": {
    "area": "sleep" | "movement" | "stress" | "nutrition",
    "microAction": "string (specific action)"
  }
}`;
}

export function formatDailyInsightUserPrompt(
	input: DailyInsightInput,
	memory: string
): string {
	return `User Awareness Data for ${input.date}:
- EZ Score Today: ${input.ezScoreToday}/100
- EZ Score Yesterday: ${input.ezScoreYesterday ?? "N/A"}/100
- Current Streak: ${input.streakDays} days
- Recent Check-ins (last 7 days): ${JSON.stringify(input.recentCheckIns)}
- Last Scan Summary: ${input.lastScanSummary ?? "None available"}
- Pattern Detection (Awareness Memory): ${memory}

Based on this data, generate the daily insight and suggested micro-action.`;
}
