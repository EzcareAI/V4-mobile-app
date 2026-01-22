import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { queryClient } from "@/utils/trpc";

export const unstable_settings = {
	initialRouteName: "(drawer)",
};

// Regex for matching onboarding step routes (/1, /2, etc.)
const ONBOARDING_STEP_PATTERN = /^\/\d+$/;

function StackLayout() {
	const router = useRouter();
	const pathname = usePathname();
	const { isPending } = authClient.useSession();

	// For Phase 1, we use local state to determine if onboarding is finished
	// In a real app, this would come from session.user.profile.onboardingCompleted
	const { currentStep } = useOnboardingStore();

	useEffect(() => {
		if (isPending) {
			return;
		}

		// Expo Router strips group names from pathnames
		// /(onboarding)/1 becomes /1, /(onboarding)/ becomes /
		// /(drawer)/home becomes /home
		const inOnboarding =
			pathname === "/" || ONBOARDING_STEP_PATTERN.test(pathname);

		// If onboarding is not completed (step < 20), redirect to onboarding
		// We prioritize this over auth for now to ensure the user sees the flow
		if (currentStep < 20 && !inOnboarding) {
			router.replace("/(onboarding)");
		}
	}, [isPending, currentStep, pathname, router]);

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(drawer)" />
			<Stack.Screen name="(onboarding)" />
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
