import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// Message role enum
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);

// AI companion conversation history
export const chatMessage = pgTable(
	"chat_message",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		// Message content
		role: messageRoleEnum("role").notNull(),
		content: text("content").notNull(),

		// Optional context (health data at time of message)
		context: jsonb("context").$type<{
			healthScore?: number;
			recentCheckins?: Array<{
				date: string;
				sleepScore: number;
				energyScore: number;
				stressScore: number;
				digestionScore: number;
				hasPain: boolean;
			}>;
		}>(),

		// Timestamps
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		// Index for querying user's messages
		index("chat_message_user_id_idx").on(table.userId),
		// Index for chronological ordering
		index("chat_message_created_at_idx").on(table.createdAt),
	]
);

export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
	user: one(user, {
		fields: [chatMessage.userId],
		references: [user.id],
	}),
}));

export type ChatMessage = typeof chatMessage.$inferSelect;
export type NewChatMessage = typeof chatMessage.$inferInsert;
