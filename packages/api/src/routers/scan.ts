import { TRPCError } from "@trpc/server";
import { db } from "@ezcare/db";
import { scan, scanAnswer, scanResult, subscription } from "@ezcare/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { ScanAIInputSchema } from "../ai/schemas";
import { generateScanResult } from "../ai/scanAI";

export const scanRouter = router({
    // 1. Create a new scan session
    create: protectedProcedure
        .input(z.object({ startedAt: z.string().datetime().optional() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const [newScan] = await db.insert(scan).values({
                userId,
                status: "in_progress",
                startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
            }).returning();

            return {
                scanId: newScan.id,
                status: newScan.status,
            };
        }),

    // 2. Submit answers for a scan
    submitAnswers: protectedProcedure
        .input(z.object({
            scanId: z.string().uuid(),
            answers: ScanAIInputSchema.omit({ userId: true, scanId: true, timestamp: true }),
        }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify scan exists and belongs to user
            const [existingScan] = await db.select().from(scan).where(eq(scan.id, input.scanId));
            if (!existingScan || existingScan.userId !== userId) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Scan not found" });
            }

            // Save answers
            await db.insert(scanAnswer).values({
                scanId: input.scanId,
                answers: input.answers,
            }).onConflictDoUpdate({
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
            const [existingScan] = await db.select().from(scan).where(eq(scan.id, input.scanId));
            if (!existingScan || existingScan.userId !== userId) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Scan not found" });
            }

            const [answersRecord] = await db.select().from(scanAnswer).where(eq(scanAnswer.scanId, input.scanId));
            if (!answersRecord) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "No answers found for this scan" });
            }

            // 2. Prepare AI input
            const aiInput = {
                userId,
                scanId: input.scanId,
                timestamp: new Date().toISOString(),
                symptoms: (answersRecord.answers as any).symptoms,
                lifestyle: (answersRecord.answers as any).lifestyle,
                medical_context: (answersRecord.answers as any).medical_context,
            };

            // 3. Call AI service
            const aiOutput = await generateScanResult(aiInput as any);

            // 4. Save result to DB
            await db.insert(scanResult).values({
                scanId: input.scanId,
                confidence: aiOutput.confidence,
                processingTimeMs: aiOutput.processing_time_ms,
                result: aiOutput.result,
                disclaimer: aiOutput.disclaimer,
            }).onConflictDoUpdate({
                target: scanResult.scanId,
                set: {
                    confidence: aiOutput.confidence,
                    processingTimeMs: aiOutput.processing_time_ms,
                    result: aiOutput.result,
                    disclaimer: aiOutput.disclaimer,
                },
            });

            // Update scan status
            await db.update(scan).set({
                status: "completed",
                completedAt: new Date(),
            }).where(eq(scan.id, input.scanId));

            // 5. Check subscription for blurring logic
            const [userSub] = await db.select().from(subscription).where(eq(subscription.userId, userId));
            const isSubscribed = userSub && (userSub.status === "active" || userSub.status === "trial");

            if (!isSubscribed) {
                // Return blurred response for free users
                return {
                    ...aiOutput,
                    result: {
                        summary: aiOutput.result.summary,
                        possible_contributors: aiOutput.result.possible_contributors,
                        recommended_actions: [], // BLURRED
                        things_to_avoid: [], // BLURRED
                        escalation: aiOutput.result.escalation,
                    },
                };
            }

            return aiOutput;
        }),

    // 4. Get existing result
    getResult: protectedProcedure
        .input(z.object({ scanId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const [resultRecord] = await db.select().from(scanResult).where(eq(scanResult.scanId, input.scanId));
            if (!resultRecord) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Result not found" });
            }

            // Verify ownership via scan table
            const [scanRecord] = await db.select().from(scan).where(eq(scan.id, input.scanId));
            if (!scanRecord || scanRecord.userId !== userId) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
            }

            // Check subscription for blurring logic
            const [userSub] = await db.select().from(subscription).where(eq(subscription.userId, userId));
            const isSubscribed = userSub && (userSub.status === "active" || userSub.status === "trial");

            const output = {
                scanId: resultRecord.scanId,
                confidence: resultRecord.confidence,
                processing_time_ms: resultRecord.processingTimeMs,
                result: resultRecord.result as any,
                disclaimer: resultRecord.disclaimer,
            };

            if (!isSubscribed) {
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
