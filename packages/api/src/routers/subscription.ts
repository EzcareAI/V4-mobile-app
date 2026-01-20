import { db } from "@ezcare/db";
import { subscription } from "@ezcare/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

// Feature access levels
const FREE_FEATURES = [
	"onboarding",
	"first_diagnosis",
	"limited_chat",
] as const;
const PREMIUM_FEATURES = [
	"unlimited_chat",
	"daily_checkin",
	"health_score",
	"full_diagnostics",
	"meal_scan",
	"advanced_insights",
] as const;

type Feature =
	| (typeof FREE_FEATURES)[number]
	| (typeof PREMIUM_FEATURES)[number];

// Paywall triggers tracking (stored in memory for now, could be moved to DB)
const paywallTriggers = new Map<
	string,
	{
		chatCount: number;
		checkinCount: number;
		diagnosisViewed: boolean;
	}
>();

function getOrCreateTriggers(userId: string) {
	if (!paywallTriggers.has(userId)) {
		paywallTriggers.set(userId, {
			chatCount: 0,
			checkinCount: 0,
			diagnosisViewed: false,
		});
	}
	return paywallTriggers.get(userId);
}

export const subscriptionRouter = router({
	// Check current subscription status
	status: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const [sub] = await db
			.select()
			.from(subscription)
			.where(eq(subscription.userId, userId));

		if (!sub) {
			return {
				status: "free" as const,
				isPremium: false,
				expiresAt: null,
				productId: null,
			};
		}

		// Check if subscription is still valid
		const isActive =
			sub.status === "active" &&
			sub.expiresAt &&
			new Date(sub.expiresAt) > new Date();

		return {
			status: isActive ? ("premium" as const) : ("expired" as const),
			isPremium: isActive,
			expiresAt: sub.expiresAt,
			productId: sub.productId,
		};
	}),

	// Check if user can access a specific feature
	canAccess: protectedProcedure
		.input(z.object({ feature: z.string() }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const feature = input.feature as Feature;

			// Free features are always accessible
			if ((FREE_FEATURES as readonly string[]).includes(feature)) {
				return { canAccess: true, requiresPaywall: false };
			}

			// Check subscription status
			const [sub] = await db
				.select()
				.from(subscription)
				.where(eq(subscription.userId, userId));

			const isPremium =
				sub?.status === "active" &&
				sub.expiresAt &&
				new Date(sub.expiresAt) > new Date();

			return {
				canAccess: isPremium,
				requiresPaywall: !isPremium,
			};
		}),

	// Track paywall triggers and check if should show paywall
	shouldShowPaywall: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		// Check if already premium
		const [sub] = await db
			.select()
			.from(subscription)
			.where(eq(subscription.userId, userId));

		const isPremium =
			sub?.status === "active" &&
			sub.expiresAt &&
			new Date(sub.expiresAt) > new Date();

		if (isPremium) {
			return { shouldShow: false, reason: null };
		}

		const triggers = getOrCreateTriggers(userId);
		if (!triggers) {
			return { shouldShow: false, reason: null };
		}

		// Paywall trigger conditions
		if (triggers.chatCount >= 3) {
			return { shouldShow: true, reason: "chat_limit" as const };
		}

		if (triggers.checkinCount >= 2) {
			return { shouldShow: true, reason: "checkin_limit" as const };
		}

		if (triggers.diagnosisViewed) {
			return { shouldShow: true, reason: "diagnosis_viewed" as const };
		}

		return { shouldShow: false, reason: null };
	}),

	// Increment paywall trigger (called after actions)
	incrementTrigger: protectedProcedure
		.input(z.object({ trigger: z.enum(["chat", "checkin", "diagnosis"]) }))
		.mutation(({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const triggers = getOrCreateTriggers(userId);

			if (!triggers) {
				return { success: false };
			}

			switch (input.trigger) {
				case "chat":
					triggers.chatCount += 1;
					break;
				case "checkin":
					triggers.checkinCount += 1;
					break;
				case "diagnosis":
					triggers.diagnosisViewed = true;
					break;
				default:
					break;
			}

			return { success: true, triggers };
		}),

	// Verify RevenueCat purchase (placeholder - needs RevenueCat SDK integration)
	verifyPurchase: protectedProcedure
		.input(
			z.object({
				productId: z.string(),
				revenuecatUserId: z.string(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// TODO: Verify with RevenueCat API
			// For now, just create/update subscription record

			const [existing] = await db
				.select()
				.from(subscription)
				.where(eq(subscription.userId, userId));

			// Calculate expiration based on product
			const expiresAt = new Date();
			if (
				input.productId.includes("yearly") ||
				input.productId.includes("annual")
			) {
				expiresAt.setFullYear(expiresAt.getFullYear() + 1);
			} else {
				expiresAt.setMonth(expiresAt.getMonth() + 1);
			}

			if (existing) {
				const [updated] = await db
					.update(subscription)
					.set({
						productId: input.productId,
						revenuecatUserId: input.revenuecatUserId,
						status: "active",
						expiresAt,
						originalPurchaseDate: existing.originalPurchaseDate ?? new Date(),
					})
					.where(eq(subscription.userId, userId))
					.returning();

				return { success: true, subscription: updated };
			}

			const [created] = await db
				.insert(subscription)
				.values({
					userId,
					productId: input.productId,
					revenuecatUserId: input.revenuecatUserId,
					status: "active",
					expiresAt,
					originalPurchaseDate: new Date(),
				})
				.returning();

			return { success: true, subscription: created };
		}),
});
