import { db } from "@ezcare/db";
import { dailyCheckin, healthScore, scan, streak } from "@ezcare/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { generateDailyInsight } from "../ai/dailyInsightAI";
import { protectedProcedure, router } from "../index";

export const insightRouter = router({
	getToday: protectedProcedure
		.input(z.object({ date: z.string() }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const todayDate = input.date;

			// 1. Fetch Today's EZ Score
			const todayScore = await db.query.healthScore.findFirst({
				where: and(
					eq(healthScore.userId, userId),
					eq(healthScore.date, todayDate)
				),
			});

			// 2. Fetch Yesterday's EZ Score
			const yesterday = new Date(todayDate);
			yesterday.setDate(yesterday.getDate() - 1);
			const yesterdayDate = yesterday.toISOString().split("T")[0]!;

			const yesterdayScore = await db.query.healthScore.findFirst({
				where: and(
					eq(healthScore.userId, userId),
					eq(healthScore.date, yesterdayDate)
				),
			});

			// 3. Fetch Recent Check-ins (last 7 days)
			const sevenDaysAgo = new Date(todayDate);
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
			const sevenDaysAgoDate = sevenDaysAgo.toISOString().split("T")[0]!;

			const checkins = await db.query.dailyCheckin.findMany({
				where: and(
					eq(dailyCheckin.userId, userId),
					gte(dailyCheckin.date, sevenDaysAgoDate),
					lte(dailyCheckin.date, todayDate)
				),
				orderBy: [desc(dailyCheckin.date)],
			});

			// 4. Fetch Current Streak
			const userStreak = await db.query.streak.findFirst({
				where: eq(streak.userId, userId),
			});

			// 5. Fetch Last Scan Summary
			const lastScan = await db.query.scan.findFirst({
				where: and(eq(scan.userId, userId), eq(scan.status, "completed")),
				orderBy: [desc(scan.completedAt)],
				with: {
					result: true,
				},
			});

			const scanSummary = lastScan?.result?.result
				? (lastScan.result.result as any).summary
				: null;

			// 6. Map to DailyInsightInput
			const insightInput = {
				userId,
				date: todayDate,
				ezScoreToday: todayScore?.overallScore ?? 70, // Default for POC
				ezScoreYesterday: yesterdayScore?.overallScore ?? null,
				streakDays: userStreak?.currentStreak ?? 0,
				recentCheckIns: checkins.map((c) => ({
					date: c.date,
					energy: c.energy,
					mood: c.mood,
					pain: c.pain,
					digestion: c.digestion,
					sleepQuality: c.sleepQuality,
				})),
				lastScanSummary: scanSummary,
			};

			// 7. Generate or return cached insight
			return generateDailyInsight(insightInput);
		}),
});
