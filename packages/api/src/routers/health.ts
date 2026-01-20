import { db } from "@ezcare/db";
import { healthScore, streak } from "@ezcare/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

export const healthRouter = router({
	// Get current health score with trend
	score: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		// Get latest score
		const [latestScore] = await db
			.select()
			.from(healthScore)
			.where(eq(healthScore.userId, userId))
			.orderBy(desc(healthScore.date))
			.limit(1);

		// Get streak
		const [userStreak] = await db
			.select()
			.from(streak)
			.where(eq(streak.userId, userId));

		if (!latestScore) {
			return {
				score: null,
				trend: "stable" as const,
				changeFromPrevious: 0,
				streak: userStreak?.currentStreak ?? 0,
				longestStreak: userStreak?.longestStreak ?? 0,
			};
		}

		return {
			score: latestScore.overallScore,
			trend: latestScore.trend,
			changeFromPrevious: latestScore.changeFromPrevious,
			sleepSubScore: latestScore.sleepSubScore,
			stressSubScore: latestScore.stressSubScore,
			painSubScore: latestScore.painSubScore,
			streak: userStreak?.currentStreak ?? 0,
			longestStreak: userStreak?.longestStreak ?? 0,
			calculatedAt: latestScore.calculatedAt,
		};
	}),

	// Get score history for charting
	history: protectedProcedure
		.input(z.object({ days: z.number().min(1).max(90).default(14) }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const scores = await db
				.select({
					date: healthScore.date,
					overallScore: healthScore.overallScore,
					trend: healthScore.trend,
				})
				.from(healthScore)
				.where(eq(healthScore.userId, userId))
				.orderBy(desc(healthScore.date))
				.limit(input.days);

			// Reverse to get chronological order
			return scores.reverse();
		}),

	// Get streak info
	streak: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const [userStreak] = await db
			.select()
			.from(streak)
			.where(eq(streak.userId, userId));

		return {
			currentStreak: userStreak?.currentStreak ?? 0,
			longestStreak: userStreak?.longestStreak ?? 0,
			lastCheckinDate: userStreak?.lastCheckinDate ?? null,
		};
	}),
});
