import { callAnthropic, extractText } from "./anthropic";

export interface AnalysisRequest {
	zones: string[];
	description: string;
	painLevel: number;
	imageBase64?: string;
	/** @deprecated Use description instead */
	concernDescription?: string;
}

export interface AnalysisResponse {
	wellnessTips: Array<{
		name: string;
		description: string;
	}>;
	wellnessSuggestions: Array<{
		day: number;
		activity: string;
		duration: string;
	}>;
	disclaimer: string;
	/** @deprecated Use wellnessTips instead. Kept for backward compat with saved history. */
	probableCauses?: Array<{
		name: string;
		description: string;
		likelihood?: number;
	}>;
	/** @deprecated Use wellnessSuggestions instead. Kept for backward compat with saved history. */
	actionPlan?: Array<{
		day: number;
		activity: string;
		duration: string;
	}>;
}

const SYSTEM_PROMPT = `
You are EZBuddy, an educational body awareness companion embedded in a lifestyle awareness and habit-learning app.
A user has selected specific body zones and shared how they feel.

You are an educational lifestyle awareness assistant only. You help users LEARN about their body and lifestyle choices. You provide general educational information and self-care ideas.

You MUST NOT:
- Use any language that sounds like professional advice
- Suggest any specific conditions or interpretations
- Provide percentage-based confidence or likelihood scores
- Provide dosage or supplement recommendations
- Provide any form of assessment

If a user asks for professional advice, respond ONLY with: "That's a great question for a qualified professional. I'm here to help you learn about general lifestyle habits."

Instead, frame everything as educational lifestyle observations and awareness tips. Use phrases like "awareness factor", "educational lifestyle tip", and "self-care idea".

**OUTPUT FORMAT:**
You MUST return your entire response as a strictly valid, minified JSON object matching the following structure exactly, with NO markdown formatting, NO markdown code block wrappers (like \`\`\`json), and NO conversational prefixes or suffixes. It must be strictly parseable by JSON.parse().

{
  "disclaimer": "This information is for general educational purposes only. EZCare is a lifestyle awareness and habit-learning tool. Always consult a qualified professional for any concerns.",
  "wellnessTips": [
    {
      "name": "String: Name of a general lifestyle or comfort factor (e.g., 'Posture Habits'). Do NOT use clinical terms.",
      "description": "String: A brief, general lifestyle observation."
    }
  ],
  "wellnessSuggestions": [
    {
      "day": number,
      "activity": "String: e.g., 'Gentle stretching and relaxation'",
      "duration": "String: e.g., '5 mins'"
    }
  ]
}

Provide a 7-day general self-care idea list (Days 1 through 7) with activities like rest, gentle stretching, or relaxation techniques for general comfort. Each day should have a distinct idea. Always recommend consulting a professional if anything persists.
`;

export const aiAnalysisService = {
	async analyzeConcerns(request: AnalysisRequest): Promise<AnalysisResponse> {
		const textPrompt = `
User Data:
- Selected Body Zones: ${request.zones.join(", ") || "General Body Awareness"}
- Comfort Level: ${request.painLevel}/10
- Description: "${request.description || request.concernDescription}"

Based on the above general lifestyle inputs (and the provided image if present), provide educational comfort tips and self-care ideas strictly in the requested JSON format.
`;

		try {
			// Construct message content (Vision support)
			const content: any[] = [];
			
			if (request.imageBase64) {
				content.push({
					type: "image",
					source: {
						type: "base64",
						media_type: "image/jpeg",
						data: request.imageBase64,
					},
				});
			}
			
			content.push({
				type: "text",
				text: textPrompt,
			});

			const response = await callAnthropic({
				model: "claude-haiku-4-5-20251001",
				max_tokens: 1024,
				system: SYSTEM_PROMPT,
				messages: [{ role: "user", content }],
			});

			const textResponse = extractText(response);

			// Strip potential markdown wrappers if Claude ignores the system prompt
			const cleanJson = textResponse.replace(/^```json\n|\n```$/g, "").trim();
			return JSON.parse(cleanJson) as AnalysisResponse;
		} catch (error) {
			console.error("[AI Analysis] Failed to generate plan:", error);
			throw new Error("Unable to generate reflections at this time.");
		}
	},
};
