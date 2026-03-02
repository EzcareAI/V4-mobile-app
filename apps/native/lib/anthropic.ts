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
						"You are EZBuddy, a helpful and friendly AI wellness companion for EZCare AI. Your goal is to help users understand their health data, explain their Health Score, and suggest daily wellness actions. Be encouraging, empathetic, and always include a disclaimer that you are an AI, not a medical professional. Keep responses concise and formatted for a mobile screen.",
				}),
			});

			if (!response.ok) {
				const errorData = (await response.json()) as { error?: { message?: string } };
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
