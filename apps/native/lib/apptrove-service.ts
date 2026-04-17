/**
 * Apptrove SDK service — install/affiliate attribution tracking.
 *
 * Distinct from Mixpanel (product analytics). Apptrove answers
 * "where did this user come from?" and feeds the affiliate revenue/commission pipeline.
 */

import {
	ApptroveConfig,
	ApptroveEvent,
	ApptroveSDK,
} from "react-native-apptrove";
import { env } from "@ezcare/env/native";

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
			const event = new ApptroveEvent(ApptroveEvent.APP_OPEN);
			ApptroveSDK.trackEvent(event);
		} catch (e) {
			console.warn("[Apptrove] trackAppOpen failed:", e);
		}
	}

	trackRegistration(userId: string, email?: string, method?: string): void {
		try {
			const event = new ApptroveEvent(ApptroveEvent.COMPLETE_REGISTRATION);
			event.param1 = method ?? "unknown";
			if (email) {
				event.param2 = email;
			}
			event.setEventValue("user_id", userId);
			ApptroveSDK.trackEvent(event);
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
			const event = new ApptroveEvent(ApptroveEvent.SUBSCRIBE);
			event.revenue = revenue;
			event.currency = currency;
			event.param1 = productId;
			ApptroveSDK.trackEvent(event);
		} catch (e) {
			console.warn("[Apptrove] trackSubscribe failed:", e);
		}
	}
}

export const apptroveService = ApptroveService.getInstance();
