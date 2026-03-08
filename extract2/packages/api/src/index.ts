import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import { logger } from "./logic/logger";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure.use(async ({ path, type, next }) => {
	const start = Date.now();
	const result = await next();
	const duration = Date.now() - start;
	logger.info(`tRPC ${type} ${path} completed in ${duration}ms`);
	return result;
});

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});
