import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export function DiscountWheelScreen() {
	const router = useRouter();
	const { setAnswer, nextStep, currentStep, discountWheelShown } =
		useOnboardingStore();

	// If wheel was already shown, skip to next screen
	if (discountWheelShown) {
		setTimeout(() => {
			nextStep();
			router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
		}, 500);
		return (
			<View className="flex-1 items-center justify-center bg-[#EBF5F4]">
				<Text className="text-center text-[#73808C]">Loading...</Text>
			</View>
		);
	}

	const handleClaimDiscount = () => {
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	const handleSkip = () => {
		setAnswer("discountWheelShown", true);
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1">
						{/* Header */}
						<View className="mt-8">
							<StepHeader
								align="center"
								description="Get an exclusive one-time discount on your first subscription"
								title="🎡 Spin to Save!"
							/>
						</View>

						{/* Spinning Wheel (Simplified) */}
						<View className="mt-8 mb-8 flex h-48 w-48 items-center justify-center self-center rounded-full border-4 border-yellow-300 bg-gradient-to-br from-[#28B898] to-[#2DE2E2] shadow-blue-200 shadow-xl">
							<View className="items-center">
								<Text className="mb-2 text-6xl">🎡</Text>
								<Text className="font-bold text-lg text-white">TAP</Text>
								<Text className="font-black text-lg text-white">TO SPIN</Text>
							</View>
						</View>

						{/* Result Box */}
						<View className="mb-6 w-full rounded-[32px] border-4 border-yellow-300 bg-white p-6 shadow-blue-100 shadow-lg">
							<View className="mb-4 items-center">
								<Text className="mb-2 font-black text-5xl text-yellow-500">
									€10 OFF
								</Text>
								<Text className="mb-2 text-center font-bold text-[#29303D] text-xl">
									Save €10 on Annual Plan
								</Text>
								<Text className="text-center font-medium text-[#73808C] text-sm">
									€39.99 → €29.99/year
								</Text>
							</View>

							<View className="rounded-2xl border border-red-200 bg-red-50 p-4">
								<Text className="text-center font-bold text-[13px] text-red-600 tracking-tight">
									⏰ This offer expires in 24 hours!
								</Text>
							</View>
						</View>

						{/* Info */}
						<View className="mb-6 w-full rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
							<Text className="font-medium text-[#0d2137] text-[13px] leading-5">
								💡 This is a one-time offer. Use it now or claim it later, but
								make sure you don't miss out!
							</Text>
						</View>
					</View>
				</ScrollView>

				<View className="gap-y-3 pt-6">
					{/* CTA Buttons */}
					<ContinueButton
						label="Claim €10 Off Now"
						onPress={handleClaimDiscount}
					/>

					<TouchableOpacity
						activeOpacity={0.7}
						className="w-full rounded-[28px] border-2 border-slate-200 bg-slate-100 py-4 shadow-sm"
						onPress={handleSkip}
					>
						<Text className="text-center font-bold text-[#73808C] text-[17px]">
							I'll Pay Full Price
						</Text>
					</TouchableOpacity>

					{/* Footer */}
					<Text className="mt-4 text-center font-medium text-[#94a3b8] text-xs">
						The discount will be applied at checkout
					</Text>
				</View>
			</View>
		</View>
	);
}
