/**
 * Apptrove SDK service — install/affiliate attribution tracking.
 *
 * Distinct from Mixpanel (product analytics). Apptrove answers
 * "where did this user come from?" and feeds the affiliate revenue/commission pipeline.
 */

import { Platform } from "react-native";
import {
	ApptroveConfig,
	ApptroveEvent,
	ApptroveSDK,
} from "react-native-apptrove";
import { env } from "@ezcare/env/native";

const APPTROVE_SDK_KEY = "ff84ab36-6665-46c1-a3bf-fbd4df1199a0";

// Event IDs from Apptrove dashboard (My Apps > Events)
// CRITICAL: use the exact IDs with correct casing — I (capital i) vs l (lowercase L)
const EVENT_ID_APP_OPEN = "o91gt1Q0PK";
const EVENT_ID_COMPLETE_REGISTER = "mEqP4aD8dU";
const EVENT_ID_SUBSCRIBE = "B4N_In4cIP"; // B4N_ + I + n4c + I + P
const EVENT_ID_START_TRIAL = "jYHcuyxWUW";

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

	initialize(): void {
		if (this.initialized) {
			return;
		}
		try {
			const environment =
				env.EXPO_PUBLIC_APPTROVE_ENV === "production"
					? ApptroveConfig.EnvironmentProduction
					: ApptroveConfig.EnvironmentDevelopment;
			const config = new ApptroveConfig(APPTROVE_SDK_KEY, environment);
			if (Platform.OS === "android") {
				config.setAndroidId("AndroidTest123");
			}
			ApptroveSDK.initialize(config);
			this.initialized = true;
			console.log(
				`[Apptrove] initialized (env=${env.EXPO_PUBLIC_APPTROVE_ENV})`
			);
		} catch (e) {
			console.error("[Apptrove] initialize failed:", e);
		}
	}

	trackAppOpen(): void {
		try {
			const event = new ApptroveEvent(EVENT_ID_APP_OPEN);
			event.param1 = "app_open";
			ApptroveSDK.trackEvent(event);
			console.log("[Apptrove] tracked APP_OPEN", EVENT_ID_APP_OPEN);
		} catch (e) {
			console.warn("[Apptrove] trackAppOpen failed:", e);
		}
	}

	trackRegistration(userId: string, email?: string, method?: string): void {
		try {
			const event = new ApptroveEvent(EVENT_ID_COMPLETE_REGISTER);
			event.param1 = method ?? "unknown";
			if (email) {
				event.param2 = email;
			}
			event.setEventValue("user_id", userId);
			ApptroveSDK.trackEvent(event);
			console.log("[Apptrove] tracked COMPLETE_REGISTER", EVENT_ID_COMPLETE_REGISTER, { userId, method });
		} catch (e) {
			console.warn("[Apptrove] trackRegistration failed:", e);
		}
	}

	trackSubscribe(
		productId: string,
		revenue: number,
		currency: string = "USD"
	): void {
		try {
			const event = new ApptroveEvent(EVENT_ID_SUBSCRIBE);
			event.revenue = revenue;
			event.currency = currency;
			event.param1 = productId;
			ApptroveSDK.trackEvent(event);
			console.log("[Apptrove] tracked SUBSCRIBE", EVENT_ID_SUBSCRIBE, { productId, revenue, currency });
		} catch (e) {
			console.warn("[Apptrove] trackSubscribe failed:", e);
		}
	}

	trackStartTrial(productId: string, currency: string = "USD"): void {
		try {
			const event = new ApptroveEvent(EVENT_ID_START_TRIAL);
			event.param1 = productId;
			event.currency = currency;
			ApptroveSDK.trackEvent(event);
			console.log("[Apptrove] tracked START_TRIAL", EVENT_ID_START_TRIAL, { productId });
		} catch (e) {
			console.warn("[Apptrove] trackStartTrial failed:", e);
		}
	}
}

export const apptroveService = ApptroveService.getInstance();
