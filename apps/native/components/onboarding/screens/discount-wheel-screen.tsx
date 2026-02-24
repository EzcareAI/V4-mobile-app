import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function DiscountWheelScreen() {
	const { discountWheelShown, setAnswer, nextStep } = useOnboardingStore();

	// If wheel was already shown, skip to next screen
	if (discountWheelShown) {
		return (
			<View className="flex-1 items-center justify-center bg-white">
				<Text className="text-center text-gray-600">Loading...</Text>
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
			<View className="items-center px-6 pt-8">
				{/* Header */}
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					🎡 Spin to Save!
				</Text>
				<Text className="mb-6 text-center text-gray-600">
					Get an exclusive one-time discount on your first subscription
				</Text>

				{/* Spinning Wheel (Simplified) */}
				<View className="mb-8 flex h-48 w-48 items-center justify-center rounded-full border-4 border-yellow-300 bg-gradient-to-br from-teal-400 via-green-400 to-blue-400 shadow-lg">
					<View className="items-center">
						<Text className="mb-2 text-6xl">🎡</Text>
						<Text className="font-bold text-lg text-white">TAP</Text>
						<Text className="font-bold text-lg text-white">TO SPIN</Text>
					</View>
				</View>

				{/* Result Box */}
				<View className="mb-6 w-full rounded-2xl border-4 border-yellow-300 bg-white p-6 shadow-lg">
					<View className="mb-4 items-center">
						<Text className="mb-2 font-bold text-5xl text-yellow-600">
							€10 OFF
						</Text>
						<Text className="mb-2 text-center font-bold text-gray-900 text-xl">
							Save €10 on Annual Plan
						</Text>
						<Text className="text-center text-gray-600 text-sm">
							€39.99 → €29.99/year
						</Text>
					</View>

					<View className="rounded-lg border border-red-300 bg-red-50 p-3">
						<Text className="text-center font-bold text-red-700 text-xs">
							⏰ This offer expires in 24 hours!
						</Text>
					</View>
				</View>

				{/* Info */}
				<View className="mb-6 w-full rounded-lg border border-blue-200 bg-blue-50 p-4">
					<Text className="text-blue-900 text-xs leading-5">
						💡 This is a one-time offer. Use it now or claim it later, but make
						sure you don't miss out!
					</Text>
				</View>

				{/* CTA Buttons */}
				<TouchableOpacity
					className="mb-3 w-full rounded-lg bg-gradient-to-r from-teal-500 to-green-500 py-4"
					onPress={handleClaimDiscount}
				>
					<Text className="text-center font-bold text-lg text-white">
						Claim €10 Off Now
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					className="w-full rounded-lg bg-gray-100 py-3"
					onPress={handleSkip}
				>
					<Text className="text-center font-semibold text-gray-900">
						I'll Pay Full Price
					</Text>
				</TouchableOpacity>

				{/* Footer */}
				<Text className="mt-6 text-center text-gray-500 text-xs">
					The discount will be applied at checkout
				</Text>
			</View>
		</ScrollView>
	);
}
