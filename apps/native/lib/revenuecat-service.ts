import { Platform } from "react-native";
import Purchases, {
	type PurchasesOffering,
	type PurchasesPackage,
} from "react-native-purchases";

// In a real app, these would come from your environment variables
const REVENUECAT_APPLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || "";
const REVENUECAT_GOOGLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || "";

// Entitlement IDs from RevenueCat dashboard
// User is "pro" if they have EITHER the monthly or yearly entitlement
const ENTITLEMENT_IDS = ["monthly", "yearly"] as const;

class RevenueCatService {
	private static instance: RevenueCatService;
	private initialized = false;

	private constructor() {}

	static getInstance(): RevenueCatService {
		if (!RevenueCatService.instance) {
			RevenueCatService.instance = new RevenueCatService();
		}
		return RevenueCatService.instance;
	}

	/**
	 * Initialize the SDK. Should be called early in the app lifecycle.
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		try {
			Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

			let apiKey = "";
			if (Platform.OS === "ios") {
				apiKey = REVENUECAT_APPLE_KEY;
			} else if (Platform.OS === "android") {
				apiKey = REVENUECAT_GOOGLE_KEY;
			}

			if (apiKey) {
				Purchases.configure({ apiKey });
				this.initialized = true;
			} else {
				console.warn(`RevenueCat: No API Key provided for ${Platform.OS}.`);
			}
		} catch (error) {
			console.error("RevenueCat Initialization Error:", error);
		}
	}

	/**
	 * Check if any entitlement is active (monthly OR yearly).
	 */
	private hasActiveEntitlement(activeEntitlements: Record<string, unknown>): boolean {
		return ENTITLEMENT_IDS.some((id) => activeEntitlements[id] !== undefined);
	}

	/**
	 * Check if the user currently has an active pro entitlement.
	 */
	async checkProStatus(): Promise<boolean> {
		try {
			const customerInfo = await Purchases.getCustomerInfo();
			return this.hasActiveEntitlement(customerInfo.entitlements.active);
		} catch (error) {
			console.error("RevenueCat: Error fetching customer info:", error);
			return false;
		}
	}

	/**
	 * Fetch current offerings (paywall data).
	 */
	async getOfferings(): Promise<PurchasesOffering | null> {
		try {
			const offerings = await Purchases.getOfferings();
			if (offerings.current !== null) {
				return offerings.current;
			}
			return null;
		} catch (error) {
			console.error("RevenueCat: Error fetching offerings:", error);
			return null;
		}
	}

	/**
	 * Purchase a specific package.
	 */
	async purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
		try {
			const { customerInfo } = await Purchases.purchasePackage(pkg);

			// Primary check: any entitlement is active
			if (this.hasActiveEntitlement(customerInfo.entitlements.active)) {
				return true;
			}

			// Fallback: a transaction exists for this product (handles sandbox timing
			// delays and cases where the entitlement isn't attached in RevenueCat yet)
			const productId = pkg.product.identifier;
			const hasTransaction =
				customerInfo.allPurchasedProductIdentifiers?.includes(productId) ||
				Object.keys(customerInfo.allExpirationDates || {}).includes(productId) ||
				Object.keys(customerInfo.allPurchaseDates || {}).includes(productId);

			if (hasTransaction) {
				console.warn(
					`[RevenueCat] Purchase succeeded for ${productId} but no entitlement is active. ` +
					`Check that this package is linked to a 'monthly' or 'yearly' entitlement in RevenueCat.`
				);
				return true;
			}

			return false;
		} catch (error) {
			// @ts-expect-error - error might have userCancelled property
			if (!error.userCancelled) {
				console.error("RevenueCat: Purchase Error:", error);
			}
			return false;
		}
	}

	/**
	 * Restore past purchases.
	 */
	async restorePurchases(): Promise<boolean> {
		try {
			const customerInfo = await Purchases.restorePurchases();
			return this.hasActiveEntitlement(customerInfo.entitlements.active);
		} catch (error) {
			console.error("RevenueCat: Restore Error:", error);
			return false;
		}
	}
}

export const revenueCatService = RevenueCatService.getInstance();
