import { Platform } from "react-native";
import Purchases, {
	type PurchasesOffering,
	type PurchasesPackage,
} from "react-native-purchases";

// In a real app, these would come from your environment variables
const REVENUECAT_APPLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || "";
// const REVENUECAT_GOOGLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || "";

export const ENTITLEMENT_ID = "pro";

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
			// Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

			if (Platform.OS === "ios" && REVENUECAT_APPLE_KEY) {
				Purchases.configure({ apiKey: REVENUECAT_APPLE_KEY });
				this.initialized = true;
			} else {
				// For Android or development without keys, we just skip
				console.warn("RevenueCat: No API Key provided for this platform.");
			}
		} catch (error) {
			console.error("RevenueCat Initialization Error:", error);
		}
	}

	/**
	 * Check if the user currently has an active 'pro' entitlement.
	 */
	async checkProStatus(): Promise<boolean> {
		try {
			const customerInfo = await Purchases.getCustomerInfo();
			return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
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
			return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
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
			return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
		} catch (error) {
			console.error("RevenueCat: Restore Error:", error);
			return false;
		}
	}
}

export const revenueCatService = RevenueCatService.getInstance();
