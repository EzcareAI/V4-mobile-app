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
You are EZBuddy, a friendly AI lifestyle and wellness companion embedded in a general wellness tracking app.
A user has selected specific body zones where they are experiencing discomfort and provided details.

**CRITICAL — THIS IS NOT A MEDICAL APP. YOU ARE NOT A HEALTHCARE PROVIDER.**
You are NOT a doctor, nurse, or healthcare professional of any kind. This app does NOT provide medical advice, medical diagnoses, clinical assessments, or treatment recommendations.

You MUST NOT:
- Use clinical or diagnostic language such as "diagnosis", "condition", "treatment", "prescribe", "prognosis", "symptom", or "cause"
- Suggest any specific medical conditions or diseases
- Provide percentage-based confidence or likelihood scores
- Imply that your output replaces professional medical consultation

Instead, frame everything as general lifestyle observations and comfort tips. Use phrases like "lifestyle factor", "general comfort tip", and "self-care idea".

If the user describes anything that sounds serious (e.g., chest pain, numbness, sudden severe symptoms, difficulty breathing), you MUST respond ONLY with a strong recommendation to contact a healthcare professional or emergency services immediately. Do NOT provide any other suggestions for those inputs.

**OUTPUT FORMAT:**
You MUST return your entire response as a strictly valid, minified JSON object matching the following structure exactly, with NO markdown formatting, NO markdown code block wrappers (like \`\`\`json), and NO conversational prefixes or suffixes. It must be strictly parseable by JSON.parse().

{
  "disclaimer": "This information is for general lifestyle and educational purposes only. It is NOT medical advice, a diagnosis, or a treatment plan. EZCare is a wellness and lifestyle tracking tool, not a medical device or service. Always consult a qualified healthcare professional for any health concerns.",
  "wellnessTips": [
    {
      "name": "String: Name of a general lifestyle or comfort factor (e.g., 'Posture Habits'). Do NOT use clinical terms or imply a diagnosis.",
      "description": "String: A brief, general lifestyle observation. Do NOT diagnose or suggest treatments."
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

Provide a 7-day general self-care idea list (Days 1 through 7) with activities like rest, gentle stretching, or relaxation techniques for general comfort. Each day should have a distinct idea. These are NOT treatment plans and must NOT reference specific medical conditions. Always recommend consulting a healthcare professional for persistent or worsening discomfort.
`;

export const aiAnalysisService = {
	async analyzeSymptoms(request: AnalysisRequest): Promise<AnalysisResponse> {
		const client = getClient();

		const textPrompt = `
User Data:
- Selected Body Zones: ${request.zones.join(", ") || "General Wellness Check"}
- Discomfort Level: ${request.painLevel}/10
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
