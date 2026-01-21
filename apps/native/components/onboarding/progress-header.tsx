import { usePathname, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/stores/onboarding-store";

export const ProgressHeader = () => {
	const router = useRouter();
	const pathname = usePathname();
	const { currentStep, totalSteps, prevStep } = useOnboardingStore();

	// Only show header on onboarding step screens
	if (
		!pathname.includes("/(onboarding)/") ||
		pathname.endsWith("/onboarding")
	) {
		return null;
	}

	const handleBack = () => {
		if (currentStep > 1) {
			prevStep();
			router.back();
		} else {
			router.replace("/(onboarding)");
		}
	};

	const progress = (currentStep / totalSteps) * 100;

	return (
		<SafeAreaView className="bg-background" edges={["top"]}>
			<View className="flex-row items-center px-4 py-2">
				<Pressable className="-ml-2 p-2" onPress={handleBack}>
					<ChevronLeft color="#0d2137" size={24} />
				</Pressable>

				<View className="flex-1 px-4">
					<View className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/20">
						<View
							className="h-full rounded-full bg-primary"
							style={{ width: `${progress}%` }}
						/>
					</View>
				</View>

				<Text className="w-16 text-right font-medium text-muted-foreground text-sm">
					{currentStep} of {totalSteps}
				</Text>
			</View>
		</SafeAreaView>
	);
};
