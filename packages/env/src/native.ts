import { z } from "zod";

// Simple environment validation without @t3-oss/env-core to avoid import.meta issues in Metro
const schema = z.object({
	EXPO_PUBLIC_SUPABASE_URL: z.string().url().optional(),
	EXPO_PUBLIC_SUPABASE_KEY: z.string().optional(),
	EXPO_PUBLIC_SERVER_URL: z.string().url().optional(),
});

const parsed = schema.safeParse(process.env);

// Default fallback values for production builds
const defaults = {
	EXPO_PUBLIC_SUPABASE_URL: "https://gutftkmzvskuyxlldzkx.supabase.co",
	EXPO_PUBLIC_SUPABASE_KEY: "sb_publishable_thKn4C49wc02Uz0rTPuJag_oeUdKJqu",
	EXPO_PUBLIC_SERVER_URL: "http://192.168.137.1:3000",
};

if (!parsed.success) {
	console.warn(
		"⚠️ Environment variables not fully configured, using defaults:",
		parsed.error.flatten().fieldErrors
	);
}

export const env = {
	EXPO_PUBLIC_SUPABASE_URL:
		parsed.data?.EXPO_PUBLIC_SUPABASE_URL ?? defaults.EXPO_PUBLIC_SUPABASE_URL,
	EXPO_PUBLIC_SUPABASE_KEY:
		parsed.data?.EXPO_PUBLIC_SUPABASE_KEY ?? defaults.EXPO_PUBLIC_SUPABASE_KEY,
	EXPO_PUBLIC_SERVER_URL:
		parsed.data?.EXPO_PUBLIC_SERVER_URL ?? defaults.EXPO_PUBLIC_SERVER_URL,
};
