import { expo } from "@better-auth/expo";
import { db } from "@ezcare/db";
import * as schema from "@ezcare/db/schema/auth";
import { env } from "@ezcare/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",

		schema,
	}),
	trustedOrigins: [
		env.CORS_ORIGIN,
		"http://localhost:8081",
		"http://192.168.137.1:8081",
		"mybettertapp://",
		"exp://",
	],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: env.NODE_ENV === "production" ? "none" : "lax",
			secure: env.NODE_ENV === "production",
			httpOnly: true,
		},
	},
	plugins: [expo()],
});
