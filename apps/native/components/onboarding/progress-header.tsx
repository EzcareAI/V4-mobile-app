import { usePathname, useRouter } from "expo-router";
import { useThemeColor } from "heroui-native";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/stores/onboarding-store";

// Regex for matching onboarding step routes (/1, /2, etc.)
const STEP_ROUTE_PATTERN = /^\/\d+$/;

export const ProgressHeader = () => {
	const router = useRouter();
	const pathname = usePathname();
	const { currentStep, totalSteps, prevStep } = useOnboardingStore();
	const accentColor = useThemeColor("accent");

	// Only show header on onboarding step screens (not on the index)
	// Expo Router strips group names: /(onboarding)/1 becomes /1
	const isStepScreen = STEP_ROUTE_PATTERN.test(pathname);

	if (!isStepScreen) {
		return null;
	}

	const handleBack = () => {
		if (currentStep > 1) {
			prevStep();
			router.back();
		} else {
			// If at first step or somehow currentStep is 0/1, go to onboarding start
			router.replace("/(onboarding)");
		}
	};

	// Ensure progress is at least visible if on first step
	const progress = Math.max((currentStep / totalSteps) * 100, 5);

	return (
		<SafeAreaView className="bg-background" edges={["top"]}>
			<View className="flex-row items-center px-4 py-2">
				<Pressable className="-ml-2 p-2 active:opacity-60" onPress={handleBack}>
					<ChevronLeft color={accentColor} size={24} />
				</Pressable>

				<View className="flex-1 px-4">
					<View className="h-1.5 w-full overflow-hidden rounded-full bg-accent/10">
						<View
							className="h-full rounded-full bg-accent"
							style={{ width: `${progress}%` }}
						/>
					</View>
				</View>

				<Text className="w-16 text-right font-medium text-foreground/60 text-sm">
					{currentStep} of {totalSteps}
				</Text>
			</View>
		</SafeAreaView>
	);
};
