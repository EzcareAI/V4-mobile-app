import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ProgressBoostScreen() {
	const router = useRouter();
	const { nextStep } = useOnboardingStore();

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/14");
	};

	return (
		<ScrollView className="flex-1 bg-gradient-to-b from-blue-50 to-purple-50">
			<View className="min-h-full items-center justify-center px-6 pt-12 pb-8">
				{/* Icon */}
				<Text className="mb-6 text-6xl">🚀</Text>

				{/* Main Message */}
				<Text className="mb-3 text-center font-bold text-3xl text-gray-900">
					You're making a smart choice!
				</Text>

				<Text className="mb-8 text-center text-gray-700 leading-6">
					By focusing on health today, you're investing in a stronger, more
					vibrant future.
				</Text>

				{/* Motivational Content */}
				<View className="mb-6 w-full rounded-2xl border-2 border-purple-200 bg-white p-6">
					<Text className="mb-3 font-bold text-purple-900 text-sm">
						📊 This questionnaire will help us create a plan that's:
					</Text>

					<View className="space-y-2">
						<View className="flex-row items-start">
							<Text className="mr-2 text-lg">✓</Text>
							<Text className="flex-1 text-gray-700 text-sm">
								Personalized to YOUR body and lifestyle
							</Text>
						</View>
						<View className="flex-row items-start">
							<Text className="mr-2 text-lg">✓</Text>
							<Text className="flex-1 text-gray-700 text-sm">
								Simple enough to actually follow
							</Text>
						</View>
						<View className="flex-row items-start">
							<Text className="mr-2 text-lg">✓</Text>
							<Text className="flex-1 text-gray-700 text-sm">
								Based on natural, science-backed approaches
							</Text>
						</View>
						<View className="flex-row items-start">
							<Text className="mr-2 text-lg">✓</Text>
							<Text className="flex-1 text-gray-700 text-sm">
								Achievable without extreme measures
							</Text>
						</View>
					</View>
				</View>

				{/* CTA */}
				<TouchableOpacity
					className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-green-500 py-4"
					onPress={handleContinue}
				>
					<Text className="text-center font-bold text-lg text-white">
						Continue →
					</Text>
				</TouchableOpacity>

				{/* Footer */}
				<Text className="mt-6 text-center text-gray-600 text-xs">
					The next few questions help us understand you better
				</Text>
			</View>
		</ScrollView>
	);
}
