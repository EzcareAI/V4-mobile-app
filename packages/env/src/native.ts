import { z } from "zod";

// Simple environment validation without @t3-oss/env-core to avoid import.meta issues in Metro
const schema = z.object({
	EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
	EXPO_PUBLIC_SUPABASE_KEY: z.string(),
	EXPO_PUBLIC_SERVER_URL: z.string().url(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
	console.error(
		"❌ Invalid environment variables:",
		parsed.error.flatten().fieldErrors
	);
	throw new Error("Invalid environment variables");
}

export const env = parsed.data;
