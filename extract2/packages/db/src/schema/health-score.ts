import { relations } from "drizzle-orm";
import {
	date,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// Trend direction enum
export const trendEnum = pgEnum("health_trend", ["up", "down", "stable"]);

// Calculated health scores (daily & rolling)
export const healthScore = pgTable(
	"health_score",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		// Score date
		date: date("date").notNull(),

		// Overall score (0-100)
		overallScore: integer("overall_score").notNull(),

		// Trend compared to previous period
		trend: trendEnum("trend").default("stable"),

		// Today's focus summary
		todayFocus: text("today_focus"),

		// Timestamps
		calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
	},
	(table) => [
		// Ensure one score per user per day
		unique("health_score_user_date_unique").on(table.userId, table.date),
		// Index for querying user's scores
		index("health_score_user_id_idx").on(table.userId),
		// Index for date-based queries
		index("health_score_date_idx").on(table.date),
	]
);

export const healthScoreRelations = relations(healthScore, ({ one }) => ({
	user: one(user, {
		fields: [healthScore.userId],
		references: [user.id],
	}),
}));

export type HealthScore = typeof healthScore.$inferSelect;
export type NewHealthScore = typeof healthScore.$inferInsert;
