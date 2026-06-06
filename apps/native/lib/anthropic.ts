// Centralized client for the Supabase Edge Function that proxies Anthropic.
//
// Every Anthropic call in the app should go through `callAnthropic` so the
// Anthropic API key stays on the server. The mobile app authenticates with
// the user's Supabase JWT; the function verifies the JWT and forwards to
// api.anthropic.com with the server-held key.
//
// See packages/db/supabase/functions/anthropic-proxy/ for the function
// source and deployment notes.
import { env } from "@ezcare/env/native";
import { supabase } from "./supabase";

const PROXY_URL = `${env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/anthropic-proxy`;

export interface AnthropicMessage {
	role: "user" | "assistant";
	content: unknown;
}

export interface AnthropicRequest {
	model?: string;
	max_tokens?: number;
	system?: string;
	messages: AnthropicMessage[];
}

export interface AnthropicResponse {
	content: { type: string; text: string }[];
	stop_reason?: string;
}

/**
 * Call the Anthropic Messages API via the Supabase proxy. Returns the parsed
 * response body. Throws with the upstream error body on non-2xx.
 */
export async function callAnthropic(body: AnthropicRequest): Promise<AnthropicResponse> {
	const { data: { session } } = await supabase.auth.getSession();
	if (!session) {
		throw new Error("Not signed in. Please sign in again and retry.");
	}
	const response = await fetch(PROXY_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${session.access_token}`,
			apikey: env.EXPO_PUBLIC_SUPABASE_KEY,
		},
		body: JSON.stringify({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 1024,
			...body,
		}),
	});
	if (!response.ok) {
		const errBody = await response.text();
		throw new Error(`Anthropic proxy ${response.status}: ${errBody.slice(0, 200)}`);
	}
	return (await response.json()) as AnthropicResponse;
}

/**
 * Convenience: extract the first text block from an Anthropic response.
 * Returns an empty string if the response shape is unexpected.
 */
export function extractText(resp: AnthropicResponse): string {
	const first = resp.content?.[0];
	return first && "text" in first ? first.text : "";
}

const EZBUDDY_SYSTEM_PROMPT =
	"You are EZBuddy, a friendly daily companion for EZCare AI. You help users build healthy daily habits like sleep, hydration, movement, mood, and nutrition. You NEVER provide professional advice of any kind. You NEVER discuss symptoms, diseases, conditions, or treatments. If a user asks about any such topic, respond: 'I am a lifestyle companion. For any concern, please consult a qualified professional. I can help you with daily habits, hydration, sleep, mood, and movement instead.' Keep responses concise and formatted for a mobile screen.";

interface SimpleMessage {
	role: "user" | "assistant";
	content: string;
}

export const anthropicService = {
	sendMessage: async (messages: SimpleMessage[]): Promise<string> => {
		const resp = await callAnthropic({
			model: "claude-sonnet-4-6",
			max_tokens: 1024,
			system: EZBUDDY_SYSTEM_PROMPT,
			messages,
		});
		return extractText(resp);
	},
};
