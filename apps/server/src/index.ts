import { createContext } from "@ezcare/api/context";
import { appRouter } from "@ezcare/api/routers/index";
import { auth } from "@ezcare/auth";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
	"*",
	cors({
		origin: (origin) => {
			if (
				origin?.includes("localhost") ||
				origin?.includes("127.0.0.1") ||
				origin?.includes("192.168.137.122")
			) {
				return origin;
			}
			return "http://localhost:3001";
		},
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: [
			"Content-Type",
			"Authorization",
			"x-trpc-source",
			"Origin",
			"Accept",
		],
		credentials: true,
	})
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	})
);

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
