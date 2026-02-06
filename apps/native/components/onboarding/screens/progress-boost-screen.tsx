import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ProgressBoostScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/14");
	};

	return (
		<ScrollView className="flex-1 bg-gradient-to-b from-blue-50 to-purple-50">
			<View className="px-6 pt-12 pb-8 items-center justify-center min-h-full">
				{/* Icon */}
				<Text className="text-6xl mb-6">🚀</Text>

				{/* Main Message */}
				<Text className="text-3xl font-bold text-gray-900 text-center mb-3">
					You're making a smart choice!
				</Text>

				<Text className="text-gray-700 text-center mb-8 leading-6">
					By focusing on health today, you're investing in a stronger, more vibrant future.
				</Text>

				{/* Motivational Content */}
				<View className="w-full bg-white rounded-2xl p-6 mb-6 border-2 border-purple-200">
					<Text className="text-sm font-bold text-purple-900 mb-3">
						📊 This questionnaire will help us create a plan that's:
					</Text>

					<View className="space-y-2">
						<View className="flex-row items-start">
							<Text className="text-lg mr-2">✓</Text>
							<Text className="text-gray-700 text-sm flex-1">
								Personalized to YOUR body and lifestyle
							</Text>
						</View>
						<View className="flex-row items-start">
							<Text className="text-lg mr-2">✓</Text>
							<Text className="text-gray-700 text-sm flex-1">
								Simple enough to actually follow
							</Text>
						</View>
						<View className="flex-row items-start">
							<Text className="text-lg mr-2">✓</Text>
							<Text className="text-gray-700 text-sm flex-1">
								Based on natural, science-backed approaches
							</Text>
						</View>
						<View className="flex-row items-start">
							<Text className="text-lg mr-2">✓</Text>
							<Text className="text-gray-700 text-sm flex-1">
								Achievable without extreme measures
							</Text>
						</View>
					</View>
				</View>

				{/* CTA */}
				<TouchableOpacity
					onPress={handleContinue}
					className="w-full bg-gradient-to-r from-teal-500 to-green-500 rounded-lg py-4"
				>
					<Text className="text-white font-bold text-center text-lg">
						Continue →
					</Text>
				</TouchableOpacity>

				{/* Footer */}
				<Text className="text-xs text-gray-600 text-center mt-6">
					The next few questions help us understand you better
				</Text>
			</View>
		</ScrollView>
	);
}
