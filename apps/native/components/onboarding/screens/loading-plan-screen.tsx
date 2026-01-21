import { useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export const LoadingPlanScreen = () => {
	const router = useRouter();
	const nextStep = useOnboardingStore((state) => state.nextStep);

	useEffect(() => {
		const timer = setTimeout(() => {
			nextStep();
			router.push("/(onboarding)/19");
		}, 4500); // Simulated plan preparation time

		return () => clearTimeout(timer);
	}, [router, nextStep]);

	return (
		<View className="flex-1 items-center justify-center px-6 py-8">
			<View className="mb-8 h-32 w-32 items-center justify-center rounded-full bg-primary/10">
				<Sparkles color="#0d2137" size={64} />
			</View>

			<Text className="mb-4 text-center font-bold text-3xl text-foreground">
				Preparing your healing plan...
			</Text>
			<Text className="mb-12 text-center text-lg text-muted-foreground">
				Our AI Buddy is analyzing your data to customize your natural health
				journey.
			</Text>

			<ActivityIndicator color="#0d2137" size="large" />

			<View className="mt-12 w-full gap-y-4">
				<Text className="text-center font-medium text-primary text-sm">
					✓ Personalizing your health score
				</Text>
				<Text className="text-center font-medium text-primary text-sm">
					✓ Customizing daily check-ins
				</Text>
				<Text className="text-center font-medium text-primary text-sm opacity-50">
					○ Tailoring AI companion
				</Text>
			</View>
		</View>
	);
};
