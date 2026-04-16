import {
	ApptroveConfig,
	ApptroveSDK,
	ApptroveEvent,
} from "react-native-apptrove";

const APPTROVE_SDK_KEY = "ff84ab36-6665-46c1-a3bf-fbd4df1199a0";

class ApptroveService {
	private static instance: ApptroveService;
	private initialized = false;

	private constructor() {}

	static getInstance(): ApptroveService {
		if (!ApptroveService.instance) {
			ApptroveService.instance = new ApptroveService();
		}
		return ApptroveService.instance;
	}

	/**
	 * Initialize the Apptrove SDK. Call once early in the app lifecycle.
	 */
	initialize(): void {
		if (this.initialized) return;

		try {
			const config = new ApptroveConfig(
				APPTROVE_SDK_KEY,
				ApptroveConfig.EnvironmentProduction
			);

			config.setDeferredDeeplinkCallbackListener((deepLinkData: any) => {
				console.log("[Apptrove] Deferred deeplink:", deepLinkData?.url);
			});

			ApptroveSDK.initialize(config);
			this.initialized = true;
			console.log("[Apptrove] SDK initialized");
		} catch (error) {
			console.error("[Apptrove] Init error:", error);
		}
	}

	/**
	 * Track APP_OPEN event.
	 */
	trackAppOpen(): void {
		if (!this.initialized) return;
		try {
			const event = new ApptroveEvent(ApptroveEvent.APP_OPEN);
			ApptroveSDK.trackEvent(event);
		} catch (error) {
			console.error("[Apptrove] trackAppOpen error:", error);
		}
	}

	/**
	 * Track COMPLETE_REGISTRATION after account creation.
	 */
	trackRegistration(userId: string, email?: string, method?: string): void {
		if (!this.initialized) return;
		try {
			const event = new ApptroveEvent(ApptroveEvent.COMPLETE_REGISTRATION);
			event.param1 = method ?? "unknown";
			if (userId) ApptroveSDK.setUserId(userId);
			if (email) ApptroveSDK.setUserEmail(email);
			ApptroveSDK.trackEvent(event);
		} catch (error) {
			console.error("[Apptrove] trackRegistration error:", error);
		}
	}

	/**
	 * Track SUBSCRIBE after a successful in-app purchase.
	 */
	trackSubscribe(
		productId: string,
		revenue: number,
		currency: string = "USD"
	): void {
		if (!this.initialized) return;
		try {
			const event = new ApptroveEvent(ApptroveEvent.SUBSCRIBE);
			event.param1 = productId;
			event.revenue = revenue;
			event.currency = currency;
			ApptroveSDK.trackEvent(event);
		} catch (error) {
			console.error("[Apptrove] trackSubscribe error:", error);
		}
	}
}

export const apptroveService = ApptroveService.getInstance();
