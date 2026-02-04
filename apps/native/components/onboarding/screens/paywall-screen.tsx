import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useState } from "react";

export default function PaywallScreen() {
	const { setAnswer, nextStep, prevStep, discountWheelShown } = useOnboardingStore();
	const [isProcessing, setIsProcessing] = useState(false);
	const [showDiscountWheel, setShowDiscountWheel] = useState(false);

	const handlePayment = async () => {
		setIsProcessing(true);
		// TODO: Integrate with Stripe/RevenueCat
		setTimeout(() => {
			setAnswer("subscriptionStatus", "active");
			setAnswer("paymentAttempted", true);
			setIsProcessing(false);
			nextStep();
		}, 2000);
	};

	const handleExit = () => {
		if (!discountWheelShown) {
			// Show discount wheel for first time
			setAnswer("discountWheelShown", true);
			setShowDiscountWheel(true);
		} else {
			// Normal back navigation
			prevStep();
		}
	};

	if (showDiscountWheel) {
		return <DiscountWheelModal onClose={() => setShowDiscountWheel(false)} />;
	}

	return (
		<ScrollView className="flex-1 bg-white">
			{/* Header */}
			<View className="bg-gradient-to-b from-teal-50 to-blue-50 px-6 pt-8 pb-6">
				<Text className="text-2xl font-bold text-gray-900 text-center mb-2">
					Unlock Your Full Health Core
				</Text>
				<Text className="text-gray-600 text-center text-sm">
					Get personalized plans, daily check-ins, and continuous guidance
				</Text>
			</View>

			{/* Content */}
			<View className="px-6 pt-8">
				{/* Pricing Cards */}
				<View className="gap-4 mb-8">
					{/* Primary: Yearly */}
					<TouchableOpacity
						onPress={handlePayment}
						disabled={isProcessing}
						className="bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl p-6 shadow-lg border-2 border-transparent active:opacity-90"
					>
						{/* Badge */}
						<View className="absolute top-4 right-4 bg-yellow-400 rounded-full px-3 py-1">
							<Text className="text-xs font-bold text-gray-900">BEST VALUE</Text>
						</View>

						<View className="mb-4">
							<Text className="text-white text-lg font-bold">Annual Plan</Text>
							<Text className="text-white text-xs opacity-90 mt-1">
								Commit for a year and save
							</Text>
						</View>

						<View className="mb-6">
							<View className="flex-row items-baseline">
								<Text className="text-5xl font-bold text-white">€39.99</Text>
								<Text className="text-white text-lg ml-2 opacity-90">/year</Text>
							</View>
							<Text className="text-white text-xs opacity-75 mt-2">
								€3.33/month billed annually
							</Text>
						</View>

						{/* Benefits */}
						<View className="space-y-2 mb-6">
							<View className="flex-row items-center">
								<Text className="text-white text-lg mr-2">✓</Text>
								<Text className="text-white text-sm font-medium">Full health analysis</Text>
							</View>
							<View className="flex-row items-center">
								<Text className="text-white text-lg mr-2">✓</Text>
								<Text className="text-white text-sm font-medium">
									Personalized 7-day plans
								</Text>
							</View>
							<View className="flex-row items-center">
								<Text className="text-white text-lg mr-2">✓</Text>
								<Text className="text-white text-sm font-medium">Daily check-ins</Text>
							</View>
							<View className="flex-row items-center">
								<Text className="text-white text-lg mr-2">✓</Text>
								<Text className="text-white text-sm font-medium">EZBuddy guidance</Text>
							</View>
						</View>

						<View className="bg-white bg-opacity-20 rounded-lg px-4 py-3">
							<Text className="text-white font-bold text-center">
								{isProcessing ? "Processing..." : "Start Now →"}
							</Text>
						</View>
					</TouchableOpacity>

					{/* Secondary: Monthly */}
					<TouchableOpacity
						onPress={handlePayment}
						disabled={isProcessing}
						className="bg-gray-100 rounded-2xl p-6 border-2 border-gray-300 active:opacity-90"
					>
						<Text className="text-gray-900 text-lg font-bold mb-2">Monthly Plan</Text>

						<View className="mb-4">
							<View className="flex-row items-baseline">
								<Text className="text-4xl font-bold text-gray-900">€11.99</Text>
								<Text className="text-gray-600 text-lg ml-2">/month</Text>
							</View>
							<Text className="text-gray-600 text-xs mt-1">
								Cancel anytime, no commitment
							</Text>
						</View>

						<View className="bg-teal-50 rounded-lg px-4 py-3">
							<Text className="text-gray-900 font-bold text-center">
								{isProcessing ? "Processing..." : "Start Now →"}
							</Text>
						</View>
					</TouchableOpacity>
				</View>

				{/* Features List */}
				<View className="bg-blue-50 rounded-lg p-4 mb-8 border border-blue-200">
					<Text className="text-sm font-bold text-blue-900 mb-3">What's Included:</Text>
					<View className="space-y-2">
						<Text className="text-xs text-blue-900">
							🎯 Custom health scoring based on your data
						</Text>
						<Text className="text-xs text-blue-900">
							📊 Progress tracking and analytics
						</Text>
						<Text className="text-xs text-blue-900">
							🤖 AI-powered EZBuddy recommendations
						</Text>
						<Text className="text-xs text-blue-900">
							🔔 Daily wellness reminders
						</Text>
						<Text className="text-xs text-blue-900">
							📱 Unlimited access on all devices
						</Text>
					</View>
				</View>

				{/* Trust Badges */}
				<View className="flex-row justify-center gap-6 mb-8">
					<View className="items-center">
						<Text className="text-2xl mb-1">✓</Text>
						<Text className="text-xs text-gray-600 text-center">
							Clinically<br />
							Trusted
						</Text>
					</View>
					<View className="items-center">
						<Text className="text-2xl mb-1">🌿</Text>
						<Text className="text-xs text-gray-600 text-center">
							100%<br />
							Natural
						</Text>
					</View>
					<View className="items-center">
						<Text className="text-2xl mb-1">🔒</Text>
						<Text className="text-xs text-gray-600 text-center">
							Your Data<br />
							Protected
						</Text>
					</View>
				</View>

				{/* Back Button */}
				<TouchableOpacity
					onPress={handleExit}
					className="py-3 px-6 mb-8 bg-gray-100 rounded-lg"
				>
					<Text className="text-gray-900 font-semibold text-center">
						I'll Decide Later
					</Text>
				</TouchableOpacity>

				{/* Legal */}
				<View className="mb-8">
					<Text className="text-xs text-gray-500 text-center leading-5">
						By starting your subscription, you agree to our Terms of Service and Privacy
						Policy. Your subscription will renew automatically. Cancel anytime.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}

function DiscountWheelModal({ onClose }: { onClose: () => void }) {
	return (
		<View className="flex-1 bg-black bg-opacity-50 justify-center items-center">
			<View className="bg-white rounded-2xl p-8 mx-6 items-center">
				<Text className="text-2xl font-bold text-gray-900 mb-4">🎁 Wait!</Text>

				{/* Spinning Wheel Animation */}
				<View className="w-40 h-40 bg-gradient-to-br from-teal-400 to-green-400 rounded-full flex items-center justify-center mb-6 shadow-lg">
					<Text className="text-5xl">🎡</Text>
				</View>

				{/* Result */}
				<View className="bg-yellow-50 rounded-lg p-4 mb-6 border-2 border-yellow-300 w-full">
					<Text className="text-center text-4xl font-bold text-yellow-600 mb-2">
						80% OFF
					</Text>
					<Text className="text-center text-lg font-bold text-gray-900 mb-2">
						Save €10 Today!
					</Text>
					<Text className="text-center text-xs text-gray-600">
						€39.99 → €29.99/year (limited time)
					</Text>
				</View>

				{/* Timer */}
				<View className="bg-red-50 rounded-lg p-3 mb-6 w-full">
					<Text className="text-center text-sm font-bold text-red-700">
						⏰ Offer valid for 24 hours
					</Text>
				</View>

				{/* CTA */}
				<TouchableOpacity className="bg-gradient-to-r from-teal-500 to-green-500 rounded-lg py-3 px-6 w-full mb-3">
					<Text className="text-white font-bold text-center">Claim Offer</Text>
				</TouchableOpacity>

				{/* Close */}
				<TouchableOpacity onPress={onClose} className="py-2">
					<Text className="text-gray-600 font-semibold">Return to Pricing</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
