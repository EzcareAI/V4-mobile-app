import { relations } from "drizzle-orm";
import {
	date,
	index,
	integer,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// User streaks for habit tracking
export const streak = pgTable(
	"streak",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.unique()
			.references(() => user.id, { onDelete: "cascade" }),

		// Current streak count
		currentStreak: integer("current_streak").default(0).notNull(),

		// Longest streak ever achieved
		longestStreak: integer("longest_streak").default(0).notNull(),

		// Last check-in date (to calculate streak continuity)
		lastCheckinDate: date("last_checkin_date"),

		// Timestamps
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		// Index for querying user's streak
		index("streak_user_id_idx").on(table.userId),
	]
);

export const streakRelations = relations(streak, ({ one }) => ({
	user: one(user, {
		fields: [streak.userId],
		references: [user.id],
	}),
}));

export type Streak = typeof streak.$inferSelect;
export type NewStreak = typeof streak.$inferInsert;
