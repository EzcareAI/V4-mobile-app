import { ScrollView, Text, TouchableOpacity, View } from "react-native";
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
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					Almost there!
				</Text>
				<Text className="mb-8 text-gray-600">
					Let's create your account to save your progress
				</Text>

				{/* Email Input */}
				<View className="mb-6">
					<Text className="mb-2 font-semibold text-gray-900 text-sm">
						Email Address
					</Text>
					<View className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-3">
						<Text className="text-gray-600">your@email.com</Text>
					</View>
				</View>

				{/* Auth Options */}
				<View className="mb-8">
					<Text className="mb-3 font-semibold text-gray-900 text-sm">
						Sign up with:
					</Text>

					<TouchableOpacity className="mb-3 flex-row items-center rounded-lg border-2 border-gray-300 bg-white p-4">
						<Text className="mr-3 text-xl">🍎</Text>
						<Text className="flex-1 font-semibold text-gray-900">
							Sign up with Apple
						</Text>
					</TouchableOpacity>

					<TouchableOpacity className="mb-3 flex-row items-center rounded-lg border-2 border-gray-300 bg-white p-4">
						<Text className="mr-3 text-xl">🔵</Text>
						<Text className="flex-1 font-semibold text-gray-900">
							Sign up with Google
						</Text>
					</TouchableOpacity>

					<TouchableOpacity className="flex-row items-center rounded-lg border-2 border-gray-300 bg-white p-4">
						<Text className="mr-3 text-xl">✉️</Text>
						<Text className="flex-1 font-semibold text-gray-900">
							Sign up with Email
						</Text>
					</TouchableOpacity>
				</View>

				{/* Benefits Callout */}
				<View className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4">
					<Text className="mb-2 font-bold text-green-900 text-sm">
						✓ By signing up, you get:
					</Text>
					<Text className="text-green-800 text-xs leading-4">
						Secure access to your plan from any device • Real-time progress
						tracking • Daily wellness reminders • EZBuddy AI support
					</Text>
				</View>

				{/* Privacy Notice */}
				<Text className="mb-6 text-center text-gray-500 text-xs leading-4">
					By creating an account, you agree to our{" "}
					<Text className="font-semibold text-teal-600">Terms</Text> and{" "}
					<Text className="font-semibold text-teal-600">Privacy Policy</Text>.
					We take your data seriously.
				</Text>

				{/* CTA */}
				<TouchableOpacity
					className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-green-500 py-4"
					onPress={handleContinue}
				>
					<Text className="text-center font-bold text-lg text-white">
						Create Account →
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}
