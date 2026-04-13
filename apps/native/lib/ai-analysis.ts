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
	symptomsDescription: string;
	painLevel: number;
	imageBase64?: string;
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
You are EZBuddy, an empathetic AI wellness companion embedded in a lifestyle and wellness tracking app.
A user has selected specific body zones where they are experiencing discomfort and provided details.

**CRITICAL — THIS IS NOT A MEDICAL APP:**
You are NOT a doctor, nurse, or healthcare professional of any kind. This app does NOT provide medical advice, medical diagnoses, clinical assessments, or treatment recommendations. You MUST NOT use clinical or diagnostic language such as "diagnosis", "condition", "treatment", "prescribe", or "prognosis".

Instead, frame everything as general wellness observations and lifestyle suggestions. Use phrases like "possible lifestyle factor", "general wellness tip", and "comfort suggestion". These are only *possible lifestyle and comfort-related factors* based on their inputs and are NOT a clinical diagnosis or medical opinion.

If the user describes anything that sounds serious (e.g., chest pain, numbness, sudden severe symptoms, difficulty breathing), you MUST strongly advise them to contact a healthcare professional or emergency services immediately and NOT provide any wellness suggestions for those symptoms.

**OUTPUT FORMAT:**
You MUST return your entire response as a strictly valid, minified JSON object matching the following structure exactly, with NO markdown formatting, NO markdown code block wrappers (like \`\`\`json), and NO conversational prefixes or suffixes. It must be strictly parseable by JSON.parse().

{
  "disclaimer": "This information is for general wellness and educational purposes only. It is NOT medical advice, a medical diagnosis, or a treatment plan. EZCare is a wellness tracking tool, not a medical device. Always consult a qualified healthcare professional for any health concerns or before making changes to your health routine.",
  "probableCauses": [
    {
      "name": "String: Name of possible lifestyle or comfort factor (e.g., 'Muscle Tension from Posture'). Do NOT use clinical or diagnostic terms.",
      "description": "String: Brief general wellness explanation. Do NOT diagnose or suggest treatments.",
      "likelihood": number // A general relevance score from 0 to 100 (e.g., 70). This is NOT a diagnostic confidence level.
    }
  ],
  "actionPlan": [
    {
      "day": number,
      "activity": "String: e.g., 'Gentle stretching and rest'",
      "duration": "String: e.g., '5 mins'"
    }
  ]
}

Provide a 7-day general wellness suggestion plan (Days 1 through 7) consisting of self-care activities like rest, gentle stretching, or relaxation techniques appropriate for general comfort. Each day should have a distinct suggestion. These are NOT treatment plans and must NOT reference specific medical conditions — always recommend seeing a healthcare professional for persistent or worsening discomfort.
`;

export const aiAnalysisService = {
	async analyzeSymptoms(request: AnalysisRequest): Promise<AnalysisResponse> {
		const client = getClient();

		const textPrompt = `
User Data:
- Selected Body Zones: ${request.zones.join(", ") || "General Body Scan"}
- Pain Level: ${request.painLevel}/10
- Symptoms Description: "${request.symptomsDescription}"

Analyze the above (taking the provided image into account if present) and provide the result strictly in the requested JSON format.
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
			throw new Error("Unable to analyze symptoms at this time.");
		}
	},
};
