import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ConfidenceMomentScreen() {
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleContinue = () => {
		nextStep();
	};

	return (
		<ScrollView className="flex-1 bg-gradient-to-b from-green-50 to-blue-50">
			<View className="px-6 pt-12 pb-8 items-center justify-center min-h-full">
				{/* Celebration Icon */}
				<Text className="text-6xl mb-6">🎉</Text>

				{/* Main Message */}
				<Text className="text-3xl font-bold text-gray-900 text-center mb-3">
					Great job!
				</Text>

				<Text className="text-lg text-gray-700 text-center mb-8 leading-6">
					You've given us exactly what we need to build your personalized health
					plan.
				</Text>

				{/* Feature Callouts */}
				<View className="w-full bg-white rounded-2xl p-6 mb-8 border-2 border-green-200">
					<View className="mb-4">
						<Text className="text-lg font-bold text-gray-900 mb-2">✨ Your Plan Includes:</Text>
					</View>

					<View className="space-y-3">
						<View className="flex-row items-start">
							<Text className="text-lg mr-3">🎯</Text>
							<Text className="text-gray-700 flex-1">Personalized 7-day roadmap</Text>
						</View>
						<View className="flex-row items-start">
							<Text className="text-lg mr-3">🤖</Text>
							<Text className="text-gray-700 flex-1">EZBuddy AI guidance</Text>
						</View>
						<View className="flex-row items-start">
							<Text className="text-lg mr-3">📊</Text>
							<Text className="text-gray-700 flex-1">Health score & progress tracking</Text>
						</View>
						<View className="flex-row items-start">
							<Text className="text-lg mr-3">💪</Text>
							<Text className="text-gray-700 flex-1">Dopamine rewards & momentum</Text>
						</View>
					</View>
				</View>

				{/* Trust Badge */}
				<View className="flex-row justify-center gap-4 mb-8">
					<View className="items-center">
						<Text className="text-2xl mb-1">✓</Text>
						<Text className="text-xs text-gray-600 text-center font-semibold">
							Clinically<br />
							Trusted
						</Text>
					</View>
					<View className="items-center">
						<Text className="text-2xl mb-1">🌿</Text>
						<Text className="text-xs text-gray-600 text-center font-semibold">
							100%<br />
							Natural
						</Text>
					</View>
					<View className="items-center">
						<Text className="text-2xl mb-1">🔒</Text>
						<Text className="text-xs text-gray-600 text-center font-semibold">
							Your Data<br />
							Protected
						</Text>
					</View>
				</View>

				{/* CTA Button */}
				<TouchableOpacity
					onPress={handleContinue}
					className="w-full bg-gradient-to-r from-teal-500 to-green-500 rounded-lg py-4"
				>
					<Text className="text-white font-bold text-center text-lg">
						See Your Results →
					</Text>
				</TouchableOpacity>

				{/* Subtext */}
				<Text className="text-xs text-gray-600 text-center mt-4">
					Next: Health score & preview of your personalized plan
				</Text>
			</View>
		</ScrollView>
	);
}
