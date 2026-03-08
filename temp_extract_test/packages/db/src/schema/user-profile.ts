import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// Enums for user profile
export const ageRangeEnum = pgEnum("age_range", [
	"18-24",
	"25-34",
	"35-44",
	"45-54",
	"55-64",
	"65+",
]);

export const genderEnum = pgEnum("gender", [
	"male",
	"female",
	"other",
	"prefer_not_to_say",
]);

export const dietTypeEnum = pgEnum("diet_type", [
	"classic",
	"vegan",
	"carnivore",
	"mixed",
]);

export const healthGoalEnum = pgEnum("health_goal", [
	"energy",
	"sleep",
	"digestion",
	"stress",
	"longevity",
]);

export const symptomEnum = pgEnum("symptom", [
	"fatigue",
	"brain_fog",
	"digestive",
	"anxiety",
	"pain",
]);

// User profile extending auth user with health-specific data
export const userProfile = pgTable("user_profile", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id")
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: "cascade" }),

	// Identity
	ageRange: ageRangeEnum("age_range"),
	gender: genderEnum("gender"),
	heightCm: integer("height_cm"),
	weightKg: integer("weight_kg"),

	// Lifestyle
	activityLevel: integer("activity_level"), // 1-5
	sleepQuality: integer("sleep_quality"), // 1-5
	stressLevel: integer("stress_level"), // 1-5
	dietType: dietTypeEnum("diet_type"),

	// Goals
	primaryGoal: healthGoalEnum("primary_goal"),
	secondaryGoal: healthGoalEnum("secondary_goal"),

	// Symptoms (stored as JSON array)
	symptoms: jsonb("symptoms").$type<string[]>().default([]),

	// Motivation
	motivationLevel: integer("motivation_level"), // 1-5
	willingDailyActions: boolean("willing_daily_actions"),

	// Permissions
	notificationsEnabled: boolean("notifications_enabled").default(false),
	disclaimerAccepted: boolean("disclaimer_accepted").default(false),

	// Onboarding status
	onboardingCompleted: boolean("onboarding_completed").default(false),
	onboardingCompletedAt: timestamp("onboarding_completed_at"),

	// Timestamps
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const userProfileRelations = relations(userProfile, ({ one }) => ({
	user: one(user, {
		fields: [userProfile.userId],
		references: [user.id],
	}),
}));

export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
