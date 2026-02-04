import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function AccountCreationScreen() {
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleContinue = () => {
		setAnswer("authMethod", "email");
		nextStep();
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					Almost there!
				</Text>
				<Text className="text-gray-600 mb-8">
					Let's create your account to save your progress
				</Text>

				{/* Email Input */}
				<View className="mb-6">
					<Text className="text-sm font-semibold text-gray-900 mb-2">
						Email Address
					</Text>
					<View className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3">
						<Text className="text-gray-600">your@email.com</Text>
					</View>
				</View>

				{/* Auth Options */}
				<View className="mb-8">
					<Text className="text-sm font-semibold text-gray-900 mb-3">
						Sign up with:
					</Text>

					<TouchableOpacity className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-3 flex-row items-center">
						<Text className="text-xl mr-3">🍎</Text>
						<Text className="text-gray-900 font-semibold flex-1">
							Sign up with Apple
						</Text>
					</TouchableOpacity>

					<TouchableOpacity className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-3 flex-row items-center">
						<Text className="text-xl mr-3">🔵</Text>
						<Text className="text-gray-900 font-semibold flex-1">
							Sign up with Google
						</Text>
					</TouchableOpacity>

					<TouchableOpacity className="bg-white border-2 border-gray-300 rounded-lg p-4 flex-row items-center">
						<Text className="text-xl mr-3">✉️</Text>
						<Text className="text-gray-900 font-semibold flex-1">
							Sign up with Email
						</Text>
					</TouchableOpacity>
				</View>

				{/* Benefits Callout */}
				<View className="bg-green-50 rounded-lg p-4 mb-8 border border-green-200">
					<Text className="text-sm font-bold text-green-900 mb-2">
						✓ By signing up, you get:
					</Text>
					<Text className="text-xs text-green-800 leading-4">
						Secure access to your plan from any device • Real-time progress
						tracking • Daily wellness reminders • EZBuddy AI support
					</Text>
				</View>

				{/* Privacy Notice */}
				<Text className="text-xs text-gray-500 text-center mb-6 leading-4">
					By creating an account, you agree to our{" "}
					<Text className="text-teal-600 font-semibold">Terms</Text> and{" "}
					<Text className="text-teal-600 font-semibold">Privacy Policy</Text>. We
					take your data seriously.
				</Text>

				{/* CTA */}
				<TouchableOpacity
					onPress={handleContinue}
					className="w-full bg-gradient-to-r from-teal-500 to-green-500 rounded-lg py-4"
				>
					<Text className="text-white font-bold text-center text-lg">
						Create Account →
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}
