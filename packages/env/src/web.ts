import { z } from "zod";

// Simple environment validation without @t3-oss/env-core
const schema = z.object({
	VITE_SERVER_URL: z.string().url(),
});

const runtimeEnv = typeof process !== "undefined" ? process.env : {};
const parsed = schema.safeParse(runtimeEnv);

if (!parsed.success) {
	console.error(
		"❌ Invalid environment variables:",
		parsed.error.flatten().fieldErrors
	);
	throw new Error("Invalid environment variables");
}

export const env = parsed.data;
