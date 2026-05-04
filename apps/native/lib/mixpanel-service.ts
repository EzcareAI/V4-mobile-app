/**
 * Mixpanel service — product analytics (what users do inside the app).
 *
 * No-op when EXPO_PUBLIC_MIXPANEL_TOKEN is empty, so builds without the token
 * (e.g. local dev without the env set) stay safe.
 */

import { Mixpanel } from "mixpanel-react-native";
import { env } from "@ezcare/env/native";

type Plan = "monthly" | "yearly" | "lifetime" | "other";
type SubscriptionType = "paid" | "trial";

class MixpanelService {
	private static instance: MixpanelService;
	private mp: Mixpanel | null = null;
	private initialized = false;
	private initPromise: Promise<void> | null = null;

	private constructor() {}

	static getInstance(): MixpanelService {
		if (!MixpanelService.instance) {
			MixpanelService.instance = new MixpanelService();
		}
		return MixpanelService.instance;
	}

	initialize(): Promise<void> {
		if (this.initPromise) {
			return this.initPromise;
		}
		this.initPromise = (async () => {
			const token = env.EXPO_PUBLIC_MIXPANEL_TOKEN;
			if (!token) {
				console.log("[Mixpanel] no token set — tracking disabled");
				return;
			}
			try {
				this.mp = new Mixpanel(token, true /* trackAutomaticEvents */);
				await this.mp.init();
				this.initialized = true;
				console.log("[Mixpanel] initialized");
			} catch (e) {
				console.error("[Mixpanel] initialize failed:", e);
				this.mp = null;
			}
		})();
		return this.initPromise;
	}

	identify(userId: string, props?: Record<string, unknown>): void {
		if (!this.mp) {
			return;
		}
		try {
			this.mp.identify(userId);
			if (props) {
				this.mp.getPeople().set(props as Record<string, string | number>);
			}
		} catch (e) {
			console.warn("[Mixpanel] identify failed:", e);
		}
	}

	track(name: string, props?: Record<string, unknown>): void {
		if (!this.mp) {
			return;
		}
		try {
			this.mp.track(name, props);
		} catch (e) {
			console.warn(`[Mixpanel] track ${name} failed:`, e);
		}
	}

	trackAppInstall(): void {
		this.track("app_install");
	}

	trackAppOpen(): void {
		this.track("app_open");
	}

	trackOnboardingStart(): void {
		this.track("onboarding_start");
	}

	trackOnboardingComplete(props?: {
		method?: string;
		user_id?: string;
	}): void {
		this.track("onboarding_complete", props);
	}

	trackSubscriptionCtaSeen(props?: {
		source?: string;
		offering?: string;
	}): void {
		this.track("subscription_cta_seen", props);
	}

	trackSubscriptionStart(props: {
		product_id: string;
		plan: Plan;
		type: SubscriptionType;
		revenue: number;
		currency: string;
	}): void {
		this.track("subscription_start", props);
	}
}

export const mixpanelService = MixpanelService.getInstance();

export function inferPlanFromPackageType(pkgType: string | undefined): Plan {
	const t = (pkgType ?? "").toLowerCase();
	if (t.includes("month")) {
		return "monthly";
	}
	if (t.includes("year") || t.includes("annual")) {
		return "yearly";
	}
	if (t.includes("lifetime") || t.includes("non_consumable")) {
		return "lifetime";
	}
	return "other";
}
