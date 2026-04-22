import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

// Create the client lazily to avoid throwing instantly on load if missing
let anthropicClient: Anthropic | null = null;
function getClient() {
	if (!anthropicClient) {
		if (!apiKey) {
			throw new Error("Anthropic API key is not configured.");
		}
		anthropicClient = new Anthropic({
			apiKey,
			dangerouslyAllowBrowser: true, // required for React Native
		});
	}
	return anthropicClient;
}

export interface AnalysisRequest {
	zones: string[];
	description: string;
	painLevel: number;
	imageBase64?: string;
	/** @deprecated Use description instead */
	symptomsDescription?: string;
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
You are EZBuddy, a friendly AI lifestyle and wellness companion embedded in a general wellness and habit tracking app.
A user has selected specific body zones and shared how they feel.

You are a lifestyle and wellness assistant only. You provide general comfort tips and self-care ideas.

You MUST NOT:
- Use clinical or diagnostic language such as "diagnosis", "condition", "treatment", "prescribe", "prognosis", "symptom", "cause", "medical", or "health data"
- Suggest any specific conditions or diseases
- Provide percentage-based confidence or likelihood scores

Instead, frame everything as general lifestyle observations and comfort tips. Use phrases like "lifestyle factor", "general comfort tip", and "self-care idea".

If the user describes anything that sounds serious, gently suggest they speak with a qualified professional. Do NOT provide other suggestions for those inputs.

**OUTPUT FORMAT:**
You MUST return your entire response as a strictly valid, minified JSON object matching the following structure exactly, with NO markdown formatting, NO markdown code block wrappers (like \`\`\`json), and NO conversational prefixes or suffixes. It must be strictly parseable by JSON.parse().

{
  "disclaimer": "This information is for general lifestyle and educational purposes only. EZCare is a wellness and habit tracking tool. Always consult a qualified professional for health concerns.",
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
	async analyzeSymptoms(request: AnalysisRequest): Promise<AnalysisResponse> {
		const client = getClient();

		const textPrompt = `
User Data:
- Selected Body Zones: ${request.zones.join(", ") || "General Wellness Check"}
- Comfort Level: ${request.painLevel}/10
- Description: "${request.description || request.symptomsDescription}"

Based on the above general wellness inputs (and the provided image if present), provide lifestyle comfort tips and self-care ideas strictly in the requested JSON format.
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

			const response = await client.messages.create({
				model: "claude-3-haiku-20240307",
				max_tokens: 1024,
				temperature: 0.1,
				system: SYSTEM_PROMPT,
				messages: [{ role: "user", content }],
			});

			const textResponse =
				response.content[0].type === "text" ? response.content[0].text : "";

			// Strip potential markdown wrappers if Claude ignores the system prompt
			const cleanJson = textResponse.replace(/^```json\n|\n```$/g, "").trim();
			return JSON.parse(cleanJson) as AnalysisResponse;
		} catch (error) {
			console.error("[AI Analysis] Failed to generate plan:", error);
			throw new Error("Unable to generate wellness insights at this time.");
		}
	},
};
