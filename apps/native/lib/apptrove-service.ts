/**
 * Apptrove SDK service — stub implementation.
 *
 * The react-native-apptrove package will be added once the bun workspace
 * lockfile resolution is sorted. All methods are safe no-ops until then.
 * TODO: Restore full implementation when react-native-apptrove is in bun.lock
 */

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
		// Stub — will initialize react-native-apptrove when package is available
		console.log("[Apptrove] Stub — SDK not yet integrated in binary");
	}

	trackAppOpen(): void {
		// no-op
	}

	trackRegistration(_userId: string, _email?: string, _method?: string): void {
		// no-op
	}

	trackSubscribe(_productId: string, _revenue: number, _currency: string = "USD"): void {
		// no-op
	}
}

export const apptroveService = ApptroveService.getInstance();
