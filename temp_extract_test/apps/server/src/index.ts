import { createContext } from "@ezcare/api/context";
import { appRouter } from "@ezcare/api/routers/index";
import { auth } from "@ezcare/auth";
import { env } from "@ezcare/env/server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// CORS configuration - allowing Expo Go and local development origins
app.use(
	"*",
	cors({
		origin: [
			env.CORS_ORIGIN,
			"http://localhost:8081",
			"exp://",
			"http://192.168.1.24:8081",
			"http://192.168.1.24:3000",
		],
		allowHeaders: ["Content-Type", "Authorization", "x-trpc-source"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
		maxAge: 600,
		credentials: true,
	})
);

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// tRPC handler
app.use(
	"/api/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, c) => createContext({ context: c }),
	})
);

// Health check
app.get("/", (c) => c.text("EZCare AI Server is running"));

console.log("Server is running on port 3000");

export default {
	port: 3000,
	fetch: app.fetch,
};
