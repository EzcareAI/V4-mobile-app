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
			dangerousBrowser: true, // required for React Native
		});
	}
	return anthropicClient;
}

export interface AnalysisRequest {
	zones: string[];
	symptomsDescription: string;
	painLevel: number;
}

export interface AnalysisResponse {
	probableCauses: Array<{
		name: string;
		description: string;
		likelihood: number; // Percentage (0 to 100)
	}>;
	actionPlan: Array<{
		day: number;
		activity: string;
		duration: string;
	}>;
	disclaimer: string;
}

const SYSTEM_PROMPT = `
You are EZBuddy, an empathetic, cautious AI assistant embedded in a health and physical therapy app.
A user has selected specific body zones where they are experiencing discomfort and provided details.

**CRITICAL MEDICAL LIABILITY RULE:**
You are NOT a doctor. You must provide a prominent medical disclaimer at the top of your response. Explain that these are only *possible functional or musculoskeletal causes* based on their inputs and are not a clinical diagnosis. If the symptoms suggest a severe condition (e.g., shooting chest pain, numbness, paralysis), strongly advise immediate medical attention.

**OUTPUT FORMAT:**
You MUST return your entire response as a strictly valid, minified JSON object matching the following structure exactly, with NO markdown formatting, NO markdown code block wrappers (like \`\`\`json), and NO conversational prefixes or suffixes. It must be strictly parseable by JSON.parse().

{
  "disclaimer": "String containing your strong medical disclaimer.",
  "probableCauses": [
    {
      "name": "String: Name of potential cause (e.g., 'Rotator Cuff Strain')",
      "description": "String: Brief explanation of what this is and why it fits.",
      "likelihood": number // A match percentage from 0 to 100 (e.g., 85)
    }
  ],
  "actionPlan": [
    {
      "day": number,
      "activity": "String: e.g., 'Gentle pendulum stretches'",
      "duration": "String: e.g., '5 mins'"
    }
  ]
}

Provide a comprehensive 7-day action plan (Days 1 through 7) consisting of rest, ice/heat, or gentle mobility exercises appropriate for the reported discomfort. Each day must have a distinct task.
`;

export const aiAnalysisService = {
	async analyzeSymptoms(request: AnalysisRequest): Promise<AnalysisResponse> {
		const client = getClient();

		const prompt = `
User Data:
- Selected Body Zones: ${request.zones.join(", ")}
- Pain Level: ${request.painLevel}/10
- Symptoms Description: "${request.symptomsDescription}"

Analyze the above and provide the result strictly in the requested JSON format.
`;

		try {
			const response = await client.messages.create({
				model: "claude-3-haiku-20240307", // Fast and capable for this structural task
				max_tokens: 1024,
				temperature: 0.1, // Low temperature for consistent JSON structure
				system: SYSTEM_PROMPT,
				messages: [{ role: "user", content: prompt }],
			});

			const textResponse =
				response.content[0].type === "text" ? response.content[0].text : "";

			// Strip potential markdown wrappers if Claude ignores the system prompt
			const cleanJson = textResponse.replace(/^```json\n|\n```$/g, "").trim();
			return JSON.parse(cleanJson) as AnalysisResponse;
		} catch (error) {
			console.error("[AI Analysis] Failed to generate plan:", error);
			throw new Error("Unable to analyze symptoms at this time.");
		}
	},
};
