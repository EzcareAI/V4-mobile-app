export type UserWithSubscription = {
	subscriptionStatus: "free" | "active" | "expired" | "cancelled" | "trial";
};

/**
 * Checks if a user has paid access (active or trial)
 */
export function hasPaidAccess(user: UserWithSubscription): boolean {
	return (
		user.subscriptionStatus === "active" || user.subscriptionStatus === "trial"
	);
}
