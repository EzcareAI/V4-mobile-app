import { db } from "@ezcare/db";
import { userProfile } from "@ezcare/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

// Validation schemas
const ageRangeSchema = z.enum([
	"18-24",
	"25-34",
	"35-44",
	"45-54",
	"55-64",
	"65+",
]);
const genderSchema = z.enum(["male", "female", "other", "prefer_not_to_say"]);
const dietTypeSchema = z.enum(["classic", "vegan", "carnivore", "mixed"]);
const healthGoalSchema = z.enum([
	"energy",
	"sleep",
	"digestion",
	"stress",
	"longevity",
]);
const symptomSchema = z.enum([
	"fatigue",
	"brain_fog",
	"digestive",
	"anxiety",
	"pain",
]);

const updateProfileSchema = z.object({
	ageRange: ageRangeSchema.optional(),
	gender: genderSchema.optional(),
	heightCm: z.number().min(100).max(250).optional(),
	weightKg: z.number().min(30).max(300).optional(),
	activityLevel: z.number().min(1).max(5).optional(),
	sleepQuality: z.number().min(1).max(5).optional(),
	stressLevel: z.number().min(1).max(5).optional(),
	dietType: dietTypeSchema.optional(),
	primaryGoal: healthGoalSchema.optional(),
	secondaryGoal: healthGoalSchema.optional(),
	symptoms: z.array(symptomSchema).optional(),
	motivationLevel: z.number().min(1).max(5).optional(),
	willingDailyActions: z.boolean().optional(),
	notificationsEnabled: z.boolean().optional(),
	disclaimerAccepted: z.boolean().optional(),
});

const completeOnboardingSchema = z.object({
	ageRange: ageRangeSchema,
	gender: genderSchema,
	heightCm: z.number().min(100).max(250),
	weightKg: z.number().min(30).max(300),
	activityLevel: z.number().min(1).max(5),
	sleepQuality: z.number().min(1).max(5),
	stressLevel: z.number().min(1).max(5),
	dietType: dietTypeSchema,
	primaryGoal: healthGoalSchema,
	secondaryGoal: healthGoalSchema.optional(),
	symptoms: z.array(symptomSchema),
	motivationLevel: z.number().min(1).max(5),
	willingDailyActions: z.boolean(),
	notificationsEnabled: z.boolean(),
	disclaimerAccepted: z.literal(true),
});

export const profileRouter = router({
	// Get current user profile
	get: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const [profile] = await db
			.select()
			.from(userProfile)
			.where(eq(userProfile.userId, userId));

		return profile ?? null;
	}),

	// Update profile fields
	update: protectedProcedure
		.input(updateProfileSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// Check if profile exists
			const [existing] = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, userId));

			if (existing) {
				// Update existing profile
				const [updated] = await db
					.update(userProfile)
					.set(input)
					.where(eq(userProfile.userId, userId))
					.returning();
				return updated;
			}

			// Create new profile
			const [created] = await db
				.insert(userProfile)
				.values({
					userId,
					...input,
				})
				.returning();

			return created;
		}),

	// Complete onboarding (bulk save all answers)
	completeOnboarding: protectedProcedure
		.input(completeOnboardingSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// Check if profile exists
			const [existing] = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, userId));

			const profileData = {
				...input,
				onboardingCompleted: true,
				onboardingCompletedAt: new Date(),
			};

			if (existing) {
				const [updated] = await db
					.update(userProfile)
					.set(profileData)
					.where(eq(userProfile.userId, userId))
					.returning();
				return updated;
			}

			const [created] = await db
				.insert(userProfile)
				.values({
					userId,
					...profileData,
				})
				.returning();

			return created;
		}),

	// Check if onboarding is completed
	isOnboardingCompleted: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const [profile] = await db
			.select({ completed: userProfile.onboardingCompleted })
			.from(userProfile)
			.where(eq(userProfile.userId, userId));

		return profile?.completed ?? false;
	}),
});
