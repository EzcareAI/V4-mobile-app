import { db } from "@ezcare/db";
import { scan, scanAnswer, scanResult } from "@ezcare/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { generateScanResult } from "../ai/scan-ai";
import { type ScanAIInput, ScanAIInputSchema } from "../ai/schemas";
import { protectedProcedure, router } from "../index";
import { logger } from "../logic/logger";
import {
	hasPaidAccess,
	type UserWithSubscription,
} from "../logic/subscription";

export const scanRouter = router({
	// 1. Create a new scan session
	create: protectedProcedure
		.input(z.object({ startedAt: z.string().datetime().optional() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [newScan] = await db
				.insert(scan)
				.values({
					userId,
					status: "in_progress",
					startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
				})
				.returning();

			if (!newScan) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create scan",
				});
			}

			return {
				scanId: newScan.id,
				status: newScan.status,
			};
		}),

	// 2. Submit answers for a scan
	submitAnswers: protectedProcedure
		.input(
			z.object({
				scanId: z.string().uuid(),
				answers: ScanAIInputSchema.omit({
					userId: true,
					scanId: true,
					timestamp: true,
				}),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// Verify scan exists and belongs to user
			const [existingScan] = await db
				.select()
				.from(scan)
				.where(eq(scan.id, input.scanId));
			if (!existingScan || existingScan.userId !== userId) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Scan not found" });
			}

			// Save answers
			await db
				.insert(scanAnswer)
				.values({
					scanId: input.scanId,
					answers: input.answers,
				})
				.onConflictDoUpdate({
					target: scanAnswer.scanId,
					set: { answers: input.answers },
				});

			return { success: true, scanId: input.scanId };
		}),

	// 3. Generate and return AI result
	generateResult: protectedProcedure
		.input(z.object({ scanId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// 1. Fetch scan and answers
			const [existingScan] = await db
				.select()
				.from(scan)
				.where(eq(scan.id, input.scanId));
			if (!existingScan || existingScan.userId !== userId) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Scan not found" });
			}

			const [answersRecord] = await db
				.select()
				.from(scanAnswer)
				.where(eq(scanAnswer.scanId, input.scanId));
			if (!answersRecord) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No answers found for this scan",
				});
			}

			// 1.5 Rate Limiting: Max 3 scans per day
			const startOfToday = new Date();
			startOfToday.setHours(0, 0, 0, 0);

			const todayScans = await db
				.select()
				.from(scan)
				.where(
					and(
						eq(scan.userId, userId),
						eq(scan.status, "completed"),
						gte(scan.completedAt, startOfToday)
					)
				);

			if (todayScans.length >= 3 && existingScan.status !== "completed") {
				throw new TRPCError({
					code: "TOO_MANY_REQUESTS",
					message:
						"Daily scan limit reached (Max 3). Upgrade for unlimited scans.",
				});
			}

			const answers = answersRecord.answers as Record<string, unknown>;
			const aiInput = {
				userId,
				scanId: input.scanId,
				timestamp: new Date().toISOString(),
				symptoms: answers.symptoms,
				lifestyle: answers.lifestyle,
				user_context: answers.user_context || answers.medical_context,
			};

			// 3. Call AI service
			const startAi = Date.now();
			const aiOutput = await generateScanResult(
				aiInput as unknown as ScanAIInput
			);
			logger.ai(userId, "scan", Date.now() - startAi);

			// 4. Save result to DB
			await db
				.insert(scanResult)
				.values({
					scanId: input.scanId,
					confidence: aiOutput.confidence,
					processingTimeMs: aiOutput.processing_time_ms,
					result: aiOutput.result,
					disclaimer: aiOutput.disclaimer,
				})
				.onConflictDoUpdate({
					target: scanResult.scanId,
					set: {
						confidence: aiOutput.confidence,
						processingTimeMs: aiOutput.processing_time_ms,
						result: aiOutput.result,
						disclaimer: aiOutput.disclaimer,
					},
				});

			// Update scan status
			await db
				.update(scan)
				.set({
					status: "completed",
					completedAt: new Date(),
				})
				.where(eq(scan.id, input.scanId));

			// 5. Check subscription for blurring logic
			const isSubscribed = hasPaidAccess(
				ctx.session.user as unknown as UserWithSubscription
			);
			const requiresPayment = !isSubscribed;

			if (requiresPayment) {
				// Return blurred response for free users
				return {
					...aiOutput,
					requiresPayment: true,
					result: {
						summary: aiOutput.result.summary,
						possible_contributors: aiOutput.result.possible_contributors,
						recommended_actions: [], // BLURRED
						things_to_avoid: [], // BLURRED
						escalation: aiOutput.result.escalation,
					},
				};
			}

			return {
				...aiOutput,
				requiresPayment: false,
			};
		}),

	// 4. Get existing result
	getResult: protectedProcedure
		.input(z.object({ scanId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [resultRecord] = await db
				.select()
				.from(scanResult)
				.where(eq(scanResult.scanId, input.scanId));
			if (!resultRecord) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Result not found" });
			}

			// Verify ownership via scan table
			const [scanRecord] = await db
				.select()
				.from(scan)
				.where(eq(scan.id, input.scanId));
			if (!scanRecord || scanRecord.userId !== userId) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
			}

			// Check subscription for blurring logic
			const isSubscribed = hasPaidAccess(
				ctx.session.user as unknown as UserWithSubscription
			);
			const requiresPayment = !isSubscribed;

			const output = {
				scanId: resultRecord.scanId,
				confidence: resultRecord.confidence,
				processing_time_ms: resultRecord.processingTimeMs,
				result: resultRecord.result as Record<string, unknown>,
				disclaimer: resultRecord.disclaimer,
				requiresPayment,
			};

			if (requiresPayment) {
				return {
					...output,
					result: {
						summary: output.result.summary,
						possible_contributors: output.result.possible_contributors,
						recommended_actions: [], // BLURRED
						things_to_avoid: [], // BLURRED
						escalation: output.result.escalation,
					},
				};
			}

			return output;
		}),
});
