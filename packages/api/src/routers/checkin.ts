import { db } from "@ezcare/db";
import { dailyCheckin, healthScore, streak } from "@ezcare/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const submitCheckinSchema = z.object({
	sleepScore: z.number().min(1).max(5),
	energyScore: z.number().min(1).max(5),
	stressScore: z.number().min(1).max(5),
	digestionScore: z.number().min(1).max(5),
	hasPain: z.boolean(),
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

// Helper to calculate trend from previous score
function calculateTrend(
	previousScore: number | undefined,
	currentScore: number
): "up" | "down" | "stable" {
	if (previousScore === undefined) {
		return "stable";
	}
	if (currentScore > previousScore) {
		return "up";
	}
	if (currentScore < previousScore) {
		return "down";
	}
	return "stable";
}

// Calculate health score from check-in data (0-100)
function calculateOverallScore(checkin: {
	sleepScore: number;
	energyScore: number;
	stressScore: number;
	digestionScore: number;
	hasPain: boolean;
}): number {
	// Each metric is 1-5, we need to convert to 0-100
	// Sleep: 25% weight
	// Energy: 25% weight
	// Stress: 20% weight (inverted - lower stress = higher score)
	// Digestion: 20% weight
	// Pain: 10% weight (no pain = 100, pain = 0)

	const sleepContribution = ((checkin.sleepScore - 1) / 4) * 25;
	const energyContribution = ((checkin.energyScore - 1) / 4) * 25;
	const stressContribution = ((6 - checkin.stressScore - 1) / 4) * 20; // Inverted
	const digestionContribution = ((checkin.digestionScore - 1) / 4) * 20;
	const painContribution = checkin.hasPain ? 0 : 10;

	return Math.round(
		sleepContribution +
			energyContribution +
			stressContribution +
			digestionContribution +
			painContribution
	);
}

export const checkinRouter = router({
	// Get today's check-in (if exists)
	today: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const today = getTodayDate();

		const [todayCheckin] = await db
			.select()
			.from(dailyCheckin)
			.where(
				and(eq(dailyCheckin.userId, userId), eq(dailyCheckin.date, today))
			);

		return todayCheckin ?? null;
	}),

	// Submit daily check-in
	submit: protectedProcedure
		.input(submitCheckinSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const today = getTodayDate();
			const yesterday = getYesterdayDate();

			// Check if already checked in today
			const [existing] = await db
				.select()
				.from(dailyCheckin)
				.where(
					and(eq(dailyCheckin.userId, userId), eq(dailyCheckin.date, today))
				);

			if (existing) {
				throw new Error("Already checked in today");
			}

			// Create check-in
			const [checkin] = await db
				.insert(dailyCheckin)
				.values({
					userId,
					date: today,
					...input,
				})
				.returning();

			// Calculate and save health score
			const overallScore = calculateOverallScore(input);

			// Get previous score for trend calculation
			const [previousScore] = await db
				.select()
				.from(healthScore)
				.where(eq(healthScore.userId, userId))
				.orderBy(desc(healthScore.date))
				.limit(1);

			const trend = calculateTrend(previousScore?.overallScore, overallScore);

			const changeFromPrevious = previousScore
				? overallScore - previousScore.overallScore
				: 0;

			await db.insert(healthScore).values({
				userId,
				date: today,
				overallScore,
				sleepSubScore: ((input.sleepScore - 1) / 4) * 100,
				stressSubScore: ((6 - input.stressScore - 1) / 4) * 100,
				painSubScore: input.hasPain ? 0 : 100,
				trend: trend as "up" | "down" | "stable",
				changeFromPrevious,
			});

			// Update streak
			const [existingStreak] = await db
				.select()
				.from(streak)
				.where(eq(streak.userId, userId));

			if (existingStreak) {
				const isConsecutive = existingStreak.lastCheckinDate === yesterday;
				const newCurrentStreak = isConsecutive
					? existingStreak.currentStreak + 1
					: 1;
				const newLongestStreak = Math.max(
					existingStreak.longestStreak,
					newCurrentStreak
				);

				await db
					.update(streak)
					.set({
						currentStreak: newCurrentStreak,
						longestStreak: newLongestStreak,
						lastCheckinDate: today,
					})
					.where(eq(streak.userId, userId));
			} else {
				await db.insert(streak).values({
					userId,
					currentStreak: 1,
					longestStreak: 1,
					lastCheckinDate: today,
				});
			}

			return {
				checkin,
				score: overallScore,
				trend,
				changeFromPrevious,
			};
		}),

	// Get recent check-ins
	history: protectedProcedure
		.input(z.object({ limit: z.number().min(1).max(30).default(7) }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const checkins = await db
				.select()
				.from(dailyCheckin)
				.where(eq(dailyCheckin.userId, userId))
				.orderBy(desc(dailyCheckin.date))
				.limit(input.limit);

			return checkins;
		}),
});
