import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { subscriptionStatusEnum, user } from "./auth";

// RevenueCat subscription tracking
export const subscription = pgTable(
	"subscription",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.unique()
			.references(() => user.id, { onDelete: "cascade" }),

		// RevenueCat identifiers
		revenuecatUserId: text("revenuecat_user_id"),
		productId: text("product_id"),

		// Subscription status
		status: subscriptionStatusEnum("status").default("trial").notNull(),

		// Expiration
		expiresAt: timestamp("expires_at"),

		// Original purchase info
		originalPurchaseDate: timestamp("original_purchase_date"),

		// Timestamps
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		// Index for querying user's subscription
		index("subscription_user_id_idx").on(table.userId),
		// Index for RevenueCat lookups
		index("subscription_revenuecat_user_id_idx").on(table.revenuecatUserId),
	]
);

export const subscriptionRelations = relations(subscription, ({ one }) => ({
	user: one(user, {
		fields: [subscription.userId],
		references: [user.id],
	}),
}));

export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;
