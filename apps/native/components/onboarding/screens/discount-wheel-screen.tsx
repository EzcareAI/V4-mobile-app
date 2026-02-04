import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function DiscountWheelScreen() {
	const { discountWheelShown, setAnswer, nextStep } = useOnboardingStore();

	// If wheel was already shown, skip to next screen
	if (discountWheelShown) {
		return (
			<View className="flex-1 bg-white justify-center items-center">
				<Text className="text-gray-600 text-center">Loading...</Text>
			</View>
		);
	}

	const handleClaimDiscount = () => {
		setAnswer("discountWheelShown", true);
		nextStep();
	};

	const handleSkip = () => {
		setAnswer("discountWheelShown", true);
		nextStep();
	};

	return (
		<ScrollView className="flex-1 bg-gradient-to-b from-yellow-50 to-orange-50">
			<View className="px-6 pt-8 pb-8 items-center">
				{/* Header */}
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					🎡 Spin to Save!
				</Text>
				<Text className="text-gray-600 text-center mb-6">
					Get an exclusive one-time discount on your first subscription
				</Text>

				{/* Spinning Wheel (Simplified) */}
				<View className="w-48 h-48 bg-gradient-to-br from-teal-400 via-green-400 to-blue-400 rounded-full flex items-center justify-center mb-8 shadow-lg border-4 border-yellow-300">
					<View className="items-center">
						<Text className="text-6xl mb-2">🎡</Text>
						<Text className="text-white font-bold text-lg">TAP</Text>
						<Text className="text-white font-bold text-lg">TO SPIN</Text>
					</View>
				</View>

				{/* Result Box */}
				<View className="w-full bg-white rounded-2xl p-6 mb-6 border-4 border-yellow-300 shadow-lg">
					<View className="items-center mb-4">
						<Text className="text-5xl font-bold text-yellow-600 mb-2">
							€10 OFF
						</Text>
						<Text className="text-xl font-bold text-gray-900 text-center mb-2">
							Save €10 on Annual Plan
						</Text>
						<Text className="text-sm text-gray-600 text-center">
							€39.99 → €29.99/year
						</Text>
					</View>

					<View className="bg-red-50 border border-red-300 rounded-lg p-3">
						<Text className="text-xs font-bold text-red-700 text-center">
							⏰ This offer expires in 24 hours!
						</Text>
					</View>
				</View>

				{/* Info */}
				<View className="w-full bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
					<Text className="text-xs text-blue-900 leading-5">
						💡 This is a one-time offer. Use it now or claim it later, but make
						sure you don't miss out!
					</Text>
				</View>

				{/* CTA Buttons */}
				<TouchableOpacity
					onPress={handleClaimDiscount}
					className="w-full bg-gradient-to-r from-teal-500 to-green-500 rounded-lg py-4 mb-3"
				>
					<Text className="text-white font-bold text-center text-lg">
						Claim €10 Off Now
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={handleSkip}
					className="w-full bg-gray-100 rounded-lg py-3"
				>
					<Text className="text-gray-900 font-semibold text-center">
						I'll Pay Full Price
					</Text>
				</TouchableOpacity>

				{/* Footer */}
				<Text className="text-xs text-gray-500 text-center mt-6">
					The discount will be applied at checkout
				</Text>
			</View>
		</ScrollView>
	);
}
