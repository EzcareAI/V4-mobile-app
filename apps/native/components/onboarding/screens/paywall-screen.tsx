import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function PaywallScreen() {
	const { setAnswer, nextStep, prevStep, discountWheelShown } =
		useOnboardingStore();
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
		if (discountWheelShown) {
			// Normal back navigation
			prevStep();
		} else {
			// Show discount wheel for first time
			setAnswer("discountWheelShown", true);
			setShowDiscountWheel(true);
		}
	};

	if (showDiscountWheel) {
		return <DiscountWheelModal onClose={() => setShowDiscountWheel(false)} />;
	}

	return (
		<ScrollView className="flex-1 bg-white">
			{/* Header */}
			<View className="bg-gradient-to-b from-teal-50 to-blue-50 px-6 pt-8 pb-6">
				<Text className="mb-2 text-center font-bold text-2xl text-gray-900">
					Unlock Your Full Health Core
				</Text>
				<Text className="text-center text-gray-600 text-sm">
					Get personalized plans, daily check-ins, and continuous guidance
				</Text>
			</View>

			{/* Content */}
			<View className="px-6 pt-8">
				{/* Pricing Cards */}
				<View className="mb-8 gap-4">
					{/* Primary: Yearly */}
					<TouchableOpacity
						className="rounded-2xl border-2 border-transparent bg-gradient-to-br from-teal-500 to-green-500 p-6 shadow-lg active:opacity-90"
						disabled={isProcessing}
						onPress={handlePayment}
					>
						{/* Badge */}
						<View className="absolute top-4 right-4 rounded-full bg-yellow-400 px-3 py-1">
							<Text className="font-bold text-gray-900 text-xs">
								BEST VALUE
							</Text>
						</View>

						<View className="mb-4">
							<Text className="font-bold text-lg text-white">Annual Plan</Text>
							<Text className="mt-1 text-white text-xs opacity-90">
								Commit for a year and save
							</Text>
						</View>

						<View className="mb-6">
							<View className="flex-row items-baseline">
								<Text className="font-bold text-5xl text-white">€39.99</Text>
								<Text className="ml-2 text-lg text-white opacity-90">
									/year
								</Text>
							</View>
							<Text className="mt-2 text-white text-xs opacity-75">
								€3.33/month billed annually
							</Text>
						</View>

						{/* Benefits */}
						<View className="mb-6 space-y-2">
							<View className="flex-row items-center">
								<Text className="mr-2 text-lg text-white">✓</Text>
								<Text className="font-medium text-sm text-white">
									Full health analysis
								</Text>
							</View>
							<View className="flex-row items-center">
								<Text className="mr-2 text-lg text-white">✓</Text>
								<Text className="font-medium text-sm text-white">
									Personalized 7-day plans
								</Text>
							</View>
							<View className="flex-row items-center">
								<Text className="mr-2 text-lg text-white">✓</Text>
								<Text className="font-medium text-sm text-white">
									Daily check-ins
								</Text>
							</View>
							<View className="flex-row items-center">
								<Text className="mr-2 text-lg text-white">✓</Text>
								<Text className="font-medium text-sm text-white">
									EZBuddy guidance
								</Text>
							</View>
						</View>

						<View className="rounded-lg bg-white bg-opacity-20 px-4 py-3">
							<Text className="text-center font-bold text-white">
								{isProcessing ? "Processing..." : "Start Now →"}
							</Text>
						</View>
					</TouchableOpacity>

					{/* Secondary: Monthly */}
					<TouchableOpacity
						className="rounded-2xl border-2 border-gray-300 bg-gray-100 p-6 active:opacity-90"
						disabled={isProcessing}
						onPress={handlePayment}
					>
						<Text className="mb-2 font-bold text-gray-900 text-lg">
							Monthly Plan
						</Text>

						<View className="mb-4">
							<View className="flex-row items-baseline">
								<Text className="font-bold text-4xl text-gray-900">€11.99</Text>
								<Text className="ml-2 text-gray-600 text-lg">/month</Text>
							</View>
							<Text className="mt-1 text-gray-600 text-xs">
								Cancel anytime, no commitment
							</Text>
						</View>

						<View className="rounded-lg bg-teal-50 px-4 py-3">
							<Text className="text-center font-bold text-gray-900">
								{isProcessing ? "Processing..." : "Start Now →"}
							</Text>
						</View>
					</TouchableOpacity>
				</View>

				{/* Features List */}
				<View className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
					<Text className="mb-3 font-bold text-blue-900 text-sm">
						What's Included:
					</Text>
					<View className="space-y-2">
						<Text className="text-blue-900 text-xs">
							🎯 Custom health scoring based on your data
						</Text>
						<Text className="text-blue-900 text-xs">
							📊 Progress tracking and analytics
						</Text>
						<Text className="text-blue-900 text-xs">
							🤖 AI-powered EZBuddy recommendations
						</Text>
						<Text className="text-blue-900 text-xs">
							🔔 Daily wellness reminders
						</Text>
						<Text className="text-blue-900 text-xs">
							📱 Unlimited access on all devices
						</Text>
					</View>
				</View>

				{/* Trust Badges */}
				<View className="mb-8 flex-row justify-center gap-6">
					<View className="items-center">
						<Text className="mb-1 text-2xl">✓</Text>
						<Text className="text-center text-gray-600 text-xs">
							Clinically
							<br />
							Trusted
						</Text>
					</View>
					<View className="items-center">
						<Text className="mb-1 text-2xl">🌿</Text>
						<Text className="text-center text-gray-600 text-xs">
							100%
							<br />
							Natural
						</Text>
					</View>
					<View className="items-center">
						<Text className="mb-1 text-2xl">🔒</Text>
						<Text className="text-center text-gray-600 text-xs">
							Your Data
							<br />
							Protected
						</Text>
					</View>
				</View>

				{/* Back Button */}
				<TouchableOpacity
					className="mb-8 rounded-lg bg-gray-100 px-6 py-3"
					onPress={handleExit}
				>
					<Text className="text-center font-semibold text-gray-900">
						I'll Decide Later
					</Text>
				</TouchableOpacity>

				{/* Legal */}
				<View className="mb-8">
					<Text className="text-center text-gray-500 text-xs leading-5">
						By starting your subscription, you agree to our Terms of Service and
						Privacy Policy. Your subscription will renew automatically. Cancel
						anytime.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}

function DiscountWheelModal({ onClose }: { onClose: () => void }) {
	return (
		<View className="flex-1 items-center justify-center bg-black bg-opacity-50">
			<View className="mx-6 items-center rounded-2xl bg-white p-8">
				<Text className="mb-4 font-bold text-2xl text-gray-900">🎁 Wait!</Text>

				{/* Spinning Wheel Animation */}
				<View className="mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-green-400 shadow-lg">
					<Text className="text-5xl">🎡</Text>
				</View>

				{/* Result */}
				<View className="mb-6 w-full rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
					<Text className="mb-2 text-center font-bold text-4xl text-yellow-600">
						80% OFF
					</Text>
					<Text className="mb-2 text-center font-bold text-gray-900 text-lg">
						Save €10 Today!
					</Text>
					<Text className="text-center text-gray-600 text-xs">
						€39.99 → €29.99/year (limited time)
					</Text>
				</View>

				{/* Timer */}
				<View className="mb-6 w-full rounded-lg bg-red-50 p-3">
					<Text className="text-center font-bold text-red-700 text-sm">
						⏰ Offer valid for 24 hours
					</Text>
				</View>

				{/* CTA */}
				<TouchableOpacity className="mb-3 w-full rounded-lg bg-gradient-to-r from-teal-500 to-green-500 px-6 py-3">
					<Text className="text-center font-bold text-white">Claim Offer</Text>
				</TouchableOpacity>

				{/* Close */}
				<TouchableOpacity className="py-2" onPress={onClose}>
					<Text className="font-semibold text-gray-600">Return to Pricing</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
