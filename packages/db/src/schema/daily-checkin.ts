import { relations } from "drizzle-orm";
import {
	date,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// Daily health check-in records
export const dailyCheckin = pgTable(
	"daily_checkin",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		// Check-in date (one per user per day)
		date: date("date").notNull(),

		// Health metrics (1-5 scale)
		energy: integer("energy").notNull(),
		mood: integer("mood").notNull(),
		pain: integer("pain").notNull(), // 1-5 scale
		digestion: integer("digestion").notNull(),
		sleepQuality: integer("sleep_quality").notNull(),

		// Timestamps
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		// Ensure one check-in per user per day
		unique("daily_checkin_user_date_unique").on(table.userId, table.date),
		// Index for querying user's check-ins
		index("daily_checkin_user_id_idx").on(table.userId),
		// Index for date-based queries
		index("daily_checkin_date_idx").on(table.date),
	]
);

export const dailyCheckinRelations = relations(dailyCheckin, ({ one }) => ({
	user: one(user, {
		fields: [dailyCheckin.userId],
		references: [user.id],
	}),
}));

export type DailyCheckin = typeof dailyCheckin.$inferSelect;
export type NewDailyCheckin = typeof dailyCheckin.$inferInsert;
