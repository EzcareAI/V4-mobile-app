import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ConfidenceMomentScreen() {
	const router = useRouter();
	const { nextStep } = useOnboardingStore();

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/20");
	};

	return (
		<ScrollView className="flex-1 bg-gradient-to-b from-green-50 to-blue-50">
			<View className="min-h-full items-center justify-center px-6 pt-12 pb-8">
				{/* Celebration Icon */}
				<Text className="mb-6 text-6xl">🎉</Text>

				{/* Main Message */}
				<Text className="mb-3 text-center font-bold text-3xl text-gray-900">
					Great job!
				</Text>

				<Text className="mb-8 text-center text-gray-700 text-lg leading-6">
					You've given us exactly what we need to build your personalized health
					plan.
				</Text>

				{/* Feature Callouts */}
				<View className="mb-8 w-full rounded-2xl border-2 border-green-200 bg-white p-6">
					<View className="mb-4">
						<Text className="mb-2 font-bold text-gray-900 text-lg">
							✨ Your Plan Includes:
						</Text>
					</View>

					<View className="space-y-3">
						<View className="flex-row items-start">
							<Text className="mr-3 text-lg">🎯</Text>
							<Text className="flex-1 text-gray-700">
								Personalized 7-day roadmap
							</Text>
						</View>
						<View className="flex-row items-start">
							<Text className="mr-3 text-lg">🤖</Text>
							<Text className="flex-1 text-gray-700">EZBuddy AI guidance</Text>
						</View>
						<View className="flex-row items-start">
							<Text className="mr-3 text-lg">📊</Text>
							<Text className="flex-1 text-gray-700">
								Health score & progress tracking
							</Text>
						</View>
						<View className="flex-row items-start">
							<Text className="mr-3 text-lg">💪</Text>
							<Text className="flex-1 text-gray-700">
								Dopamine rewards & momentum
							</Text>
						</View>
					</View>
				</View>

				{/* Trust Badge */}
				<View className="mb-8 flex-row justify-center gap-4">
					<View className="items-center">
						<Text className="mb-1 text-2xl">✓</Text>
						<Text className="text-center font-semibold text-gray-600 text-xs">
							Clinically
							<br />
							Trusted
						</Text>
					</View>
					<View className="items-center">
						<Text className="mb-1 text-2xl">🌿</Text>
						<Text className="text-center font-semibold text-gray-600 text-xs">
							100%
							<br />
							Natural
						</Text>
					</View>
					<View className="items-center">
						<Text className="mb-1 text-2xl">🔒</Text>
						<Text className="text-center font-semibold text-gray-600 text-xs">
							Your Data
							<br />
							Protected
						</Text>
					</View>
				</View>

				{/* CTA Button */}
				<TouchableOpacity
					className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-green-500 py-4"
					onPress={handleContinue}
				>
					<Text className="text-center font-bold text-lg text-white">
						See Your Results →
					</Text>
				</TouchableOpacity>

				{/* Subtext */}
				<Text className="mt-4 text-center text-gray-600 text-xs">
					Next: Health score & preview of your personalized plan
				</Text>
			</View>
		</ScrollView>
	);
}
