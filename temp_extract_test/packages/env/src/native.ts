import { z } from "zod";

// Safe environment validation to prevent launch crashes due to missing variables
const schema = z.object({
	EXPO_PUBLIC_SUPABASE_URL: z.string().url().optional(),
	EXPO_PUBLIC_SUPABASE_KEY: z.string().optional(),
	EXPO_PUBLIC_SERVER_URL: z.string().url().optional(),
	EXPO_PUBLIC_ANTHROPIC_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

// Default fallback values (same as in .env)
const defaults = {
	EXPO_PUBLIC_SUPABASE_URL: "https://gutftkmzvskuyxlldzkx.supabase.co",
	EXPO_PUBLIC_SUPABASE_KEY: "sb_publishable_thKn4C49wc02Uz0rTPuJag_oeUdKJqu",
	EXPO_PUBLIC_SERVER_URL: "http://192.168.1.24:3000",
	EXPO_PUBLIC_ANTHROPIC_API_KEY: "",
};

export const env = {
	EXPO_PUBLIC_SUPABASE_URL:
		parsed.data?.EXPO_PUBLIC_SUPABASE_URL ?? defaults.EXPO_PUBLIC_SUPABASE_URL,
	EXPO_PUBLIC_SUPABASE_KEY:
		parsed.data?.EXPO_PUBLIC_SUPABASE_KEY ?? defaults.EXPO_PUBLIC_SUPABASE_KEY,
	EXPO_PUBLIC_SERVER_URL:
		parsed.data?.EXPO_PUBLIC_SERVER_URL ?? defaults.EXPO_PUBLIC_SERVER_URL,
	ANTHROPIC_API_KEY:
		parsed.data?.EXPO_PUBLIC_ANTHROPIC_API_KEY ??
		defaults.EXPO_PUBLIC_ANTHROPIC_API_KEY,
};
