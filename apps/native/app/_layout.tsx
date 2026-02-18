import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { queryClient } from "@/utils/trpc";

// Regex for matching onboarding step routes (/1, /2, etc.)
const ONBOARDING_STEP_PATTERN = /^\/\d+$/;

// Timeout in ms before giving up on auth session loading
const AUTH_TIMEOUT_MS = 2000;

function StackLayout() {
	const router = useRouter();
	const pathname = usePathname();

	// Safely retrieve session state, defaulting to not pending if it crashes/failes
	const { data: session, isPending } = authClient.useSession();
	const [authTimedOut, setAuthTimedOut] = useState(false);

	// Timeout: if auth stays pending for too long, proceed anyway
	useEffect(() => {
		if (!isPending) {
			setAuthTimedOut(false);
			return;
		}
		const timer = setTimeout(() => {
			if (isPending) {
				console.warn("Auth session timed out — proceeding without auth");
				setAuthTimedOut(true);
			}
		}, AUTH_TIMEOUT_MS);
		return () => clearTimeout(timer);
	}, [isPending]);

	// For Phase 1, we use local state to determine if onboarding is finished
	const { currentStep } = useOnboardingStore();

	// Treat as "ready" if auth resolved OR timed out
	const isReady = !isPending || authTimedOut;

	useEffect(() => {
		if (!isReady) {
			return;
		}

		const inOnboarding =
			pathname === "/" || ONBOARDING_STEP_PATTERN.test(pathname);

		const inAuth =
			pathname.includes("sign-in") ||
			pathname.includes("sign-up") ||
			pathname.includes("privacy-policy") ||
			pathname.includes("terms-of-service");

		// Logic: If user not logged in & onboarding not done -> Onboarding
		// If logged in or onboarding complete -> Drawer (Home)

		const sessionExists = !!session?.user;
		const onboardingDone = currentStep >= 20;

		// Prioritize onboarding flow for unauthenticated/new users
		if (!(onboardingDone || sessionExists || inOnboarding || inAuth)) {
			// Small delay to ensure navigation is ready
			setTimeout(() => router.replace("/(onboarding)"), 100);
		} else if ((onboardingDone || sessionExists) && inOnboarding) {
			setTimeout(() => router.replace("/(drawer)"), 100);
		}
	}, [isReady, currentStep, pathname, router, session]);

	// Show a loading screen only if strictly pending and not timed out
	if (!isReady) {
		return null; // Or a simple View with ActivityIndicator if desired
	}

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(drawer)" />
			<Stack.Screen name="(onboarding)" />
			<Stack.Screen name="(auth)" />
			<Stack.Screen
				name="modal"
				options={{ title: "Modal", presentation: "modal" }}
			/>
		</Stack>
	);
}

const Layout = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<KeyboardProvider>
					<AppThemeProvider>
						<HeroUINativeProvider>
							<StackLayout />
						</HeroUINativeProvider>
					</AppThemeProvider>
				</KeyboardProvider>
			</GestureHandlerRootView>
		</QueryClientProvider>
	);
};

export default Layout;
