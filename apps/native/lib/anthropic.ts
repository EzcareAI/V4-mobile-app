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
					model: "claude-sonnet-4-6",
					max_tokens: 1024,
					messages: messages.map((m) => ({
						role: m.role,
						content: m.content,
					})),
					system:
						"You are EZBuddy, a friendly daily companion for EZCare AI. You help users build healthy daily habits like sleep, hydration, movement, mood, and nutrition. You NEVER provide professional advice of any kind. You NEVER discuss symptoms, diseases, conditions, or treatments. If a user asks about any such topic, respond: 'I am a lifestyle companion. For any concern, please consult a qualified professional. I can help you with daily habits, hydration, sleep, mood, and movement instead.' Keep responses concise and formatted for a mobile screen.",
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
