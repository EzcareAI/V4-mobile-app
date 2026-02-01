import { db } from "@ezcare/db";
import { dailyCheckin, healthScore, streak } from "@ezcare/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { calculateEZScore } from "../logic/ezScore";
import { getTodayFocus } from "../logic/todayFocus";

const submitCheckinSchema = z.object({
	energy: z.number().min(1).max(5),
	mood: z.number().min(1).max(5),
	pain: z.number().min(1).max(5),
	digestion: z.number().min(1).max(5),
	sleep_quality: z.number().min(1).max(5),
});

// Helper to get today's date as string (YYYY-MM-DD)
function getTodayDate(): string {
	const parts = new Date().toISOString().split("T");
	return parts[0] ?? "";
}

// Helper to get yesterday's date as string
function getYesterdayDate(): string {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const parts = yesterday.toISOString().split("T");
	return parts[0] ?? "";
}

export const checkinRouter = router({
	// Get today's state
	getToday: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const today = getTodayDate();

		const [todayCheckin] = await db
			.select()
			.from(dailyCheckin)
			.where(and(eq(dailyCheckin.userId, userId), eq(dailyCheckin.date, today)))
			.orderBy(desc(dailyCheckin.createdAt))
			.limit(1);

		const [latestScore] = await db
			.select()
			.from(healthScore)
			.where(eq(healthScore.userId, userId))
			.orderBy(desc(healthScore.date))
			.limit(1);

		const [userStreak] = await db
			.select()
			.from(streak)
			.where(eq(streak.userId, userId));

		return {
			ezScore: latestScore?.overallScore ?? 0,
			today_focus: latestScore?.todayFocus ?? "Check in to see your focus",
			streak_info: {
				current: userStreak?.currentStreak ?? 0,
				longest: userStreak?.longestStreak ?? 0,
			},
			hasCheckedInToday: !!todayCheckin,
		};
	}),

	// Submit daily check-in
	submit: protectedProcedure
		.input(submitCheckinSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const today = getTodayDate();
			const yesterday = getYesterdayDate();

			// Enforce daily limit (Max 2 check-ins per day per user as per PRD)
			const existingToday = await db
				.select()
				.from(dailyCheckin)
				.where(
					and(eq(dailyCheckin.userId, userId), eq(dailyCheckin.date, today))
				);

			if (existingToday.length >= 2) {
				throw new Error("Maximum 2 check-ins per day allowed");
			}

			// Save check-in
			await db.insert(dailyCheckin).values({
				userId,
				date: today,
				energy: input.energy,
				mood: input.mood,
				pain: input.pain,
				digestion: input.digestion,
				sleepQuality: input.sleep_quality,
			});

			// Get latest previous score (might be from earlier today or yesterday)
			const [previousScoreRecord] = await db
				.select()
				.from(healthScore)
				.where(eq(healthScore.userId, userId))
				.orderBy(desc(healthScore.date), desc(healthScore.calculatedAt))
				.limit(1);

			// Update EZ Score
			const newScore = calculateEZScore(
				{
					energy: input.energy,
					mood: input.mood,
					pain: input.pain,
					digestion: input.digestion,
					sleepQuality: input.sleep_quality,
				},
				previousScoreRecord?.overallScore
			);

			const todayFocus = getTodayFocus({
				energy: input.energy,
				mood: input.mood,
				pain: input.pain,
				digestion: input.digestion,
				sleepQuality: input.sleep_quality,
			});

			// Determine trend
			let trend: "up" | "down" | "stable" = "stable";
			if (previousScoreRecord) {
				if (newScore > previousScoreRecord.overallScore) trend = "up";
				else if (newScore < previousScoreRecord.overallScore) trend = "down";
			}

			// Upsert today's health score (or keep a history?)
			// PRD says "Updates EZ Score", let's insert a new record for history but timeline asks for max 30 days
			await db.insert(healthScore).values({
				userId,
				date: today,
				overallScore: newScore,
				trend,
				todayFocus,
			});

			// Update streak
			const [existingStreak] = await db
				.select()
				.from(streak)
				.where(eq(streak.userId, userId));

			let streakInfo;
			if (existingStreak) {
				const isConsecutive =
					existingStreak.lastCheckinDate === today ||
					existingStreak.lastCheckinDate === yesterday;

				const newCurrentStreak = isConsecutive
					? existingStreak.lastCheckinDate === today
						? existingStreak.currentStreak
						: existingStreak.currentStreak + 1
					: 1;

				const newLongestStreak = Math.max(
					existingStreak.longestStreak,
					newCurrentStreak
				);

				const [updatedStreak] = await db
					.update(streak)
					.set({
						currentStreak: newCurrentStreak,
						longestStreak: newLongestStreak,
						lastCheckinDate: today,
					})
					.where(eq(streak.userId, userId))
					.returning();

				if (!updatedStreak) {
					throw new Error("Failed to update streak");
				}
				streakInfo = {
					current: updatedStreak.currentStreak,
					longest: updatedStreak.longestStreak,
				};
			} else {
				const [newStreak] = await db
					.insert(streak)
					.values({
						userId,
						currentStreak: 1,
						longestStreak: 1,
						lastCheckinDate: today,
					})
					.returning();

				if (!newStreak) {
					throw new Error("Failed to create streak");
				}
				streakInfo = {
					current: newStreak.currentStreak,
					longest: newStreak.longestStreak,
				};
			}

			return {
				ezScore: newScore,
				today_focus: todayFocus,
				streak_info: streakInfo,
			};
		}),

	// Get timeline for progress (Max 30 days)
	timeline: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const scores = await db
			.select()
			.from(healthScore)
			.where(eq(healthScore.userId, userId))
			.orderBy(desc(healthScore.date))
			.limit(30);

		// Format for timeline: date, ezScore, status
		return scores
			.map((s) => ({
				date: s.date,
				ezScore: s.overallScore,
				status:
					s.trend === "up"
						? "improving"
						: s.trend === "down"
							? "declining"
							: "stable",
			}))
			.reverse();
	}),
});
