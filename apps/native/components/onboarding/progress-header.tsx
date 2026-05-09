import { selectionAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/stores/onboarding-store";

// Regex for matching onboarding step routes (/1, /2, etc.)
const STEP_ROUTE_PATTERN = /^\/\d+$/;

export const ProgressHeader = () => {
	const router = useRouter();
	const pathname = usePathname();
	const { currentStep, totalSteps, prevStep } = useOnboardingStore();

	// Only show header on onboarding step screens (not on the index)
	// Expo Router strips group names: /(onboarding)/1 becomes /1
	const isStepScreen = STEP_ROUTE_PATTERN.test(pathname);

	// The ultimate source of truth for the screen number is the route itself.
	// This prevents desyncs if the user uses native iOS swipe-back gestures.
	const displayStep = isStepScreen
		? Number.parseInt(pathname.substring(1), 10)
		: currentStep;

	// Keep the persistent store perfectly synced with the physical route
	useEffect(() => {
		if (isStepScreen && displayStep !== currentStep) {
			useOnboardingStore.setState({ currentStep: displayStep });
		}
	}, [isStepScreen, displayStep, currentStep]);

	if (!isStepScreen) {
		return null;
	}

	// Hide back arrow on payment screens — users must choose a plan
	const hideBackArrow = displayStep === 19 || displayStep === 20;

	const handleBack = () => {
		if (hideBackArrow) return;

		if (Platform.OS === "ios") {
			try {
				selectionAsync();
			} catch {
				// Ignore haptics errors
			}
		}

		if (displayStep > 1) {
			const prevStepNumber = displayStep - 1;
			prevStep();
			router.push(`/(onboarding)/${prevStepNumber}`);
		} else {
			router.replace("/(onboarding)");
		}
	};

	// Ensure progress is at least visible if on first step
	const progress = Math.max((displayStep / totalSteps) * 100, 5);

	return (
		<SafeAreaView className="bg-background" edges={["top"]}>
			<View className="flex-row items-center px-4 py-2">
				{hideBackArrow ? (
					<View className="-ml-2 p-2" style={{ width: 40 }} />
				) : (
					<Pressable className="-ml-2 p-2 active:opacity-60" onPress={handleBack}>
						<ChevronLeft color="#28B898" size={24} />
					</Pressable>
				)}

				<View className="flex-1 px-4">
					<View className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8F0F2]">
						<LinearGradient
							colors={["#28B898", "#2DE2E2"]}
							end={{ x: 1, y: 0 }}
							start={{ x: 0, y: 0 }}
							style={{
								height: "100%",
								width: `${progress}%`,
								borderRadius: 9999,
							}}
						/>
					</View>
				</View>

				<Text className="w-16 text-right font-medium text-[#73808C] text-sm">
					{displayStep} of {totalSteps}
				</Text>
			</View>
		</SafeAreaView>
	);
};
