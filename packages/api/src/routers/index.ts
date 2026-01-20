import { protectedProcedure, publicProcedure, router } from "../index";
import { checkinRouter } from "./checkin";
import { companionRouter } from "./companion";
import { healthRouter } from "./health";
import { profileRouter } from "./profile";
import { subscriptionRouter } from "./subscription";

export const appRouter = router({
	// Health check
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),

	// Private data (for testing auth)
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),

	// Feature routers
	profile: profileRouter,
	checkin: checkinRouter,
	health: healthRouter,
	companion: companionRouter,
	subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;
