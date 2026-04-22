import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	real,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// Scan status enum
export const scanStatusEnum = pgEnum("scan_status", [
	"in_progress",
	"completed",
	"failed",
]);

// Professional reminder level for wellness checks
export const scanUrgencyEnum = pgEnum("scan_urgency", [
	"none",
	"gentle_reminder",
]);

// Main scan table
export const scan = pgTable(
	"scan",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		status: scanStatusEnum("status").default("in_progress").notNull(),
		startedAt: timestamp("started_at").defaultNow().notNull(),
		completedAt: timestamp("completed_at"),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("scan_user_id_idx").on(table.userId)]
);

// Scan answers table (storing the raw input data)
export const scanAnswer = pgTable(
	"scan_answer",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		scanId: text("scan_id")
			.notNull()
			.unique()
			.references(() => scan.id, { onDelete: "cascade" }),

		// Detailed fields as JSON for flexibility, but could also be individual columns
		// Since we have a strict contract, we'll store the object to match it
		answers: jsonb("answers").notNull(),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("scan_answer_scan_id_idx").on(table.scanId)]
);

// Scan results table (storing AI interpreted output)
export const scanResult = pgTable(
	"scan_result",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		scanId: text("scan_id")
			.notNull()
			.unique()
			.references(() => scan.id, { onDelete: "cascade" }),

		confidence: real("confidence").notNull(),
		processingTimeMs: integer("processing_time_ms").notNull(),

		// The main result object from the contract
		result: jsonb("result").notNull(),

		disclaimer: text("disclaimer").notNull(),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("scan_result_scan_id_idx").on(table.scanId)]
);

// Relations
export const scanRelations = relations(scan, ({ one }) => ({
	user: one(user, {
		fields: [scan.userId],
		references: [user.id],
	}),
	answer: one(scanAnswer, {
		fields: [scan.id],
		references: [scanAnswer.scanId],
	}),
	result: one(scanResult, {
		fields: [scan.id],
		references: [scanResult.scanId],
	}),
}));

export const scanAnswerRelations = relations(scanAnswer, ({ one }) => ({
	scan: one(scan, {
		fields: [scanAnswer.scanId],
		references: [scan.id],
	}),
}));

export const scanResultRelations = relations(scanResult, ({ one }) => ({
	scan: one(scan, {
		fields: [scanResult.scanId],
		references: [scan.id],
	}),
}));

export type Scan = typeof scan.$inferSelect;
export type NewScan = typeof scan.$inferInsert;
export type ScanAnswer = typeof scanAnswer.$inferSelect;
export type NewScanAnswer = typeof scanAnswer.$inferInsert;
export type ScanResult = typeof scanResult.$inferSelect;
export type NewScanResult = typeof scanResult.$inferInsert;
