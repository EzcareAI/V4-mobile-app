import { env } from "@ezcare/env/native";

interface Message {
	role: "user" | "assistant";
	content: string;
}

export const anthropicService = {
	sendMessage: async (messages: Message[]) => {
		const apiKey = env.ANTHROPIC_API_KEY;

		if (!apiKey) {
			throw new Error("Anthropic API key not configured");
		}

		try {
			const response = await fetch("https://api.anthropic.com/v1/messages", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": apiKey,
					"anthropic-version": "2023-06-01",
				},
				body: JSON.stringify({
					model: "claude-3-5-sonnet-20240620",
					max_tokens: 1024,
					messages: messages.map((m) => ({
						role: m.role,
						content: m.content,
					})),
					system:
						"You are EZBuddy, a friendly lifestyle wellness companion for EZCare AI — a general wellness and lifestyle tracking app. You are NOT a medical professional, medical device, or healthcare service. Your goal is to help users understand their wellness habits and suggest general self-care activities like stretching, hydration, and mindfulness. Be encouraging and empathetic. ALWAYS include a clear disclaimer that your suggestions are for general informational and educational purposes only — not medical advice, diagnosis, or treatment. If a user describes serious or urgent concerns, advise them to contact a healthcare professional or emergency services immediately. Never use clinical or diagnostic language. Keep responses concise and formatted for a mobile screen.",
				}),
			});

			if (!response.ok) {
				const errorData = (await response.json()) as {
					error?: { message?: string };
				};
				console.error("Anthropic API Error:", errorData);
				throw new Error(
					errorData.error?.message || "Failed to call Anthropic API"
				);
			}

			const data = (await response.json()) as { content: { text: string }[] };
			return data.content[0].text;
		} catch (error) {
			console.error("Anthropic Service Exception:", error);
			throw error;
		}
	},
};
