import { z } from "zod";

// Safe environment validation to prevent launch crashes due to missing variables
const schema = z.object({
	EXPO_PUBLIC_SUPABASE_URL: z.string().url().optional(),
	EXPO_PUBLIC_SUPABASE_KEY: z.string().optional(),
	EXPO_PUBLIC_SERVER_URL: z.string().url().optional(),
	EXPO_PUBLIC_ANTHROPIC_API_KEY: z.string().optional(),
	EXPO_PUBLIC_APPTROVE_ENV: z.enum(["development", "production"]).optional(),
	EXPO_PUBLIC_APPTROVE_APP_TOKEN_IOS: z.string().optional(),
	EXPO_PUBLIC_APPTROVE_APP_TOKEN_ANDROID: z.string().optional(),
	EXPO_PUBLIC_APPTROVE_SECRET_ID: z.string().optional(),
	EXPO_PUBLIC_APPTROVE_SECRET_KEY: z.string().optional(),
	EXPO_PUBLIC_MIXPANEL_TOKEN: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

// Default fallback values (same as in .env)
const defaults = {
	EXPO_PUBLIC_SUPABASE_URL: "https://gutftkmzvskuyxlldzkx.supabase.co",
	EXPO_PUBLIC_SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1dGZ0a216dnNrdXl4bGxkemt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4OTYxNTIsImV4cCI6MjA4NDQ3MjE1Mn0.AZzu-viw1bNaCOqg8dzFdLHj5Dmg63o-eaX2wKQ0GHU",
	EXPO_PUBLIC_SERVER_URL: "https://gutftkmzvskuyxlldzkx.supabase.co",
	EXPO_PUBLIC_ANTHROPIC_API_KEY: "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",
	EXPO_PUBLIC_APPTROVE_ENV: "development" as const,
	EXPO_PUBLIC_APPTROVE_APP_TOKEN_IOS: "ff84ab36-6665-46c1-a3bf-fbd4df1199a0",
	EXPO_PUBLIC_APPTROVE_APP_TOKEN_ANDROID: "59b0d897-e2e7-4ce5-b6a6-b3684bc33a40",
	EXPO_PUBLIC_APPTROVE_SECRET_ID: "",
	EXPO_PUBLIC_APPTROVE_SECRET_KEY: "",
	EXPO_PUBLIC_MIXPANEL_TOKEN: "",
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
	EXPO_PUBLIC_APPTROVE_ENV:
		parsed.data?.EXPO_PUBLIC_APPTROVE_ENV ??
		defaults.EXPO_PUBLIC_APPTROVE_ENV,
	EXPO_PUBLIC_APPTROVE_APP_TOKEN_IOS:
		parsed.data?.EXPO_PUBLIC_APPTROVE_APP_TOKEN_IOS ??
		defaults.EXPO_PUBLIC_APPTROVE_APP_TOKEN_IOS,
	EXPO_PUBLIC_APPTROVE_APP_TOKEN_ANDROID:
		parsed.data?.EXPO_PUBLIC_APPTROVE_APP_TOKEN_ANDROID ??
		defaults.EXPO_PUBLIC_APPTROVE_APP_TOKEN_ANDROID,
	EXPO_PUBLIC_APPTROVE_SECRET_ID:
		parsed.data?.EXPO_PUBLIC_APPTROVE_SECRET_ID ??
		defaults.EXPO_PUBLIC_APPTROVE_SECRET_ID,
	EXPO_PUBLIC_APPTROVE_SECRET_KEY:
		parsed.data?.EXPO_PUBLIC_APPTROVE_SECRET_KEY ??
		defaults.EXPO_PUBLIC_APPTROVE_SECRET_KEY,
	EXPO_PUBLIC_MIXPANEL_TOKEN:
		parsed.data?.EXPO_PUBLIC_MIXPANEL_TOKEN ??
		defaults.EXPO_PUBLIC_MIXPANEL_TOKEN,
};
