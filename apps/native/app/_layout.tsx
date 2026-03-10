import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { Component, type ErrorInfo, type ReactNode, useEffect } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { queryClient } from "@/utils/trpc";

// Regex for matching onboarding step routes (/1, /2, etc.)
const ONBOARDING_STEP_PATTERN = /^\/\d+$/;

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

class AppErrorBoundary extends Component<
	{ children: ReactNode },
	ErrorBoundaryState
> {
	constructor(props: { children: ReactNode }) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("App ErrorBoundary caught:", error, info);
	}

	render() {
		if (this.state.hasError) {
			return (
				<View
					style={{
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
						padding: 24,
					}}
				>
					<Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
						Something went wrong
					</Text>
					<Text style={{ color: "#666", textAlign: "center" }}>
						{this.state.error?.message ??
							"An unexpected error occurred. Please restart the app."}
					</Text>
				</View>
			);
		}
		return this.props.children;
	}
}

function StackLayout() {
	const router = useRouter();
	const pathname = usePathname();
	const { isPending } = authClient.useSession();

	// For Phase 1, we use local state to determine if onboarding is finished
	const onboardingComplete = useOnboardingStore(
		(state) => state.onboardingComplete
	);
	const currentStep = useOnboardingStore((state) => state.currentStep);
	const totalSteps = useOnboardingStore((state) => state.totalSteps);

	// True if the user has started but not yet completed onboarding
	const onboardingInProgress = currentStep > 0 && currentStep <= totalSteps;

	useEffect(() => {
		if (isPending) {
			return;
		}

		// Expo Router strips group names from pathnames
		// /(onboarding)/1 becomes /1, /(onboarding)/ becomes /
		// /(dashboard)/home becomes /home
		const isOnboardingSplash = pathname === "/";
		const isOnboardingStep = ONBOARDING_STEP_PATTERN.test(pathname);
		const inOnboarding = isOnboardingSplash || isOnboardingStep;

		const inAuth =
			pathname.includes("sign-in") ||
			pathname.includes("sign-up") ||
			pathname.includes("privacy-policy") ||
			pathname.includes("terms-of-service");

		// Never redirect a user who is actively going through onboarding steps,
		// even if they just authenticated (e.g. via Google/Apple/email signup)
		if (onboardingInProgress) {
			return;
		}

		if (!(onboardingComplete || inOnboarding || inAuth)) {
			router.replace("/(onboarding)");
		} else if (onboardingComplete && isOnboardingSplash) {
			// Only redirect from the splash screen — not from step screens
			// (users should be able to navigate steps even after completing onboarding)
			router.replace("/(dashboard)");
		}
	}, [isPending, onboardingComplete, onboardingInProgress, pathname, router]);

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(dashboard)" />
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
		<AppErrorBoundary>
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
		</AppErrorBoundary>
	);
};

export default Layout;
