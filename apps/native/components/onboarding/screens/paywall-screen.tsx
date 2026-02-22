import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/stores/onboarding-store";

const FEATURES = [
	"🎯 Custom health scoring based on your data",
	"📊 Progress tracking and analytics",
	"🤖 AI-powered EZBuddy recommendations",
	"🔔 Daily wellness reminders",
	"📱 Unlimited access on all devices",
];

const BENEFITS = [
	"Full health analysis",
	"Personalized 7-day plans",
	"Daily check-ins",
	"EZBuddy guidance",
];

export default function PaywallScreen() {
	const { setAnswer, nextStep, prevStep, discountWheelShown } =
		useOnboardingStore();
	const [isProcessing, setIsProcessing] = useState(false);
	const [showDiscountWheel, setShowDiscountWheel] = useState(false);

	const handlePayment = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {
				/* ignore */
			}
		}
		setIsProcessing(true);
		// TODO: Integrate with Stripe/RevenueCat
		setTimeout(() => {
			setAnswer("subscriptionStatus", "active");
			setAnswer("paymentAttempted", true);
			setIsProcessing(false);
			nextStep();
		}, 2000);
	};

	const handleExit = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Light);
			} catch {
				/* ignore */
			}
		}
		if (discountWheelShown) {
			prevStep();
		} else {
			setAnswer("discountWheelShown", true);
			setShowDiscountWheel(true);
		}
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<ScrollView
				contentContainerClassName="pb-16"
				showsVerticalScrollIndicator={false}
			>
				{/* Premium Header Overlay */}
				<View className="relative overflow-hidden px-6 pt-12 pb-10">
					<LinearGradient
						colors={["#F8FAFC", "#F1F5F9"]}
						style={StyleSheet.absoluteFill}
					/>
					<View className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-blue-50/50 opacity-50" />

					<Text className="text-center font-bold text-[32px] text-foreground leading-10 tracking-tight">
						Unlock Your Full{"\n"}Health Core
					</Text>
					<Text className="mt-4 text-center text-[17px] text-muted-foreground leading-6">
						Get personalized plans, daily check-ins, and continuous AI guidance
					</Text>
				</View>

				{/* Pricing Cards */}
				<View className="-mt-4 gap-y-6 px-6">
					{/* Annual — Primary Card */}
					<TouchableOpacity
						activeOpacity={0.9}
						className="relative overflow-hidden rounded-[32px] p-8 shadow-2xl shadow-blue-200"
						disabled={isProcessing}
						onPress={handlePayment}
					>
						<LinearGradient
							colors={["#28B898", "#2DE2E2"]}
							end={{ x: 1, y: 1 }}
							start={{ x: 0, y: 0 }}
							style={StyleSheet.absoluteFill}
						/>

						{/* Best Value Badge */}
						<View className="absolute top-6 right-6 rounded-full bg-yellow-400 px-4 py-1.5 shadow-sm">
							<Text className="font-bold text-[10px] text-[#29303D] uppercase tracking-widest">
								BEST VALUE
							</Text>
						</View>

						<View className="mb-6 pr-20">
							<Text className="font-bold text-2xl text-white">Annual Plan</Text>
							<Text className="mt-1 text-sm text-white/80">
								Commit for a year and save 60%
							</Text>
						</View>

						<View className="mb-2 flex-row items-baseline">
							<Text className="font-black text-5xl text-white">€39.99</Text>
							<Text className="ml-2 font-bold text-lg text-white/80">
								/year
							</Text>
						</View>
						<Text className="mb-8 font-medium text-sm text-white/70">
							€3.33/month billed annually
						</Text>

						{/* Benefits List */}
						<View className="mb-8 gap-y-3">
							{BENEFITS.map((b) => (
								<View className="flex-row items-center gap-3" key={b}>
									<View className="h-5 w-5 items-center justify-center rounded-full bg-white/20">
										<Text className="text-[10px] text-white">✓</Text>
									</View>
									<Text className="font-semibold text-[15px] text-white">
										{b}
									</Text>
								</View>
							))}
						</View>

						<View className="rounded-2xl bg-white/20 py-4">
							<Text className="text-center font-bold text-lg text-white">
								{isProcessing ? "Processing Analysis…" : "Start Now →"}
							</Text>
						</View>
					</TouchableOpacity>

					{/* Monthly — Secondary Card */}
					<TouchableOpacity
						activeOpacity={0.9}
						className="rounded-[32px] border-2 border-slate-100 bg-slate-50 p-8"
						disabled={isProcessing}
						onPress={handlePayment}
					>
						<View className="mb-4">
							<Text className="font-bold text-[#29303D] text-xl">
								Monthly Plan
							</Text>
							<Text className="mt-1 text-[#73808C] text-sm">
								Cancel anytime, zero commitment
							</Text>
						</View>

						<View className="mb-6 flex-row items-baseline">
							<Text className="font-black text-4xl text-[#29303D]">€11.99</Text>
							<Text className="ml-2 font-bold text-lg text-[#73808C]">
								/month
							</Text>
						</View>

						<View className="rounded-2xl border border-slate-200 bg-white py-4 shadow-sm">
							<Text className="text-center font-bold text-lg text-[#29303D]">
								Get Monthly Access
							</Text>
						</View>
					</TouchableOpacity>
				</View>

				{/* Features Checklist */}
				<View className="mx-6 mt-10 rounded-[28px] border border-blue-50 bg-blue-50/30 p-8 shadow-sm">
					<Text className="mb-6 font-bold text-lg text-[#29303D]">
						What's Included:
					</Text>
					{FEATURES.map((f) => (
						<View className="mb-4 flex-row items-start gap-3" key={f}>
							<Text className="text-lg leading-5">{f.split(" ")[0]}</Text>
							<Text className="flex-1 font-medium text-[15px] text-[#73808C] leading-6">
								{f.split(" ").slice(1).join(" ")}
							</Text>
						</View>
					))}
				</View>

				{/* Trust Badges */}
				<View className="mt-12 flex-row justify-between px-8">
					<View className="items-center">
						<View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
							<Text className="text-2xl">🛡️</Text>
						</View>
						<Text className="text-center font-bold text-[10px] text-[#73808C] uppercase leading-4 tracking-widest">
							Safe &{"\n"}Secure
						</Text>
					</View>
					<View className="items-center">
						<View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
							<Text className="text-2xl">🌱</Text>
						</View>
						<Text className="text-center font-bold text-[10px] text-[#73808C] uppercase leading-4 tracking-widest">
							Natural{"\n"}Approach
						</Text>
					</View>
					<View className="items-center">
						<View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
							<Text className="text-2xl">💡</Text>
						</View>
						<Text className="text-center font-bold text-[10px] text-[#73808C] uppercase leading-4 tracking-widest">
							AI{"\n"}Intelligence
						</Text>
					</View>
				</View>

				{/* Decline Link */}
				<TouchableOpacity className="mt-12 items-center" onPress={handleExit}>
					<Text className="font-bold text-base text-[#73808C] tracking-tight">
						I'll decide later
					</Text>
				</TouchableOpacity>

				{/* Fine Print */}
				<Text className="mx-10 mt-8 text-center text-[11px] text-[#73808C] leading-5">
					By starting your subscription, you agree to our Terms of Service and
					Privacy Policy. Renewals are automatic. Manage in Apple/Google Play
					settings.
				</Text>
			</ScrollView>

			<DiscountWheelModal
				onClaim={handlePayment}
				onClose={() => setShowDiscountWheel(false)}
				visible={showDiscountWheel}
			/>
		</View>
	);
}

function DiscountWheelModal({
	visible,
	onClose,
	onClaim,
}: {
	visible: boolean;
	onClose: () => void;
	onClaim: () => void;
}) {
	return (
		<Modal
			animationType="slide"
			onRequestClose={onClose}
			transparent
			visible={visible}
		>
			<View className="flex-1 items-center justify-end bg-slate-900/60 p-6">
				<SafeAreaView
					className="w-full items-center rounded-[40px] bg-white p-8 shadow-2xl"
					edges={["bottom"]}
				>
					<View className="mb-4 h-1 w-12 rounded-full bg-slate-100" />

					<View className="mb-6 h-20 w-20 items-center justify-center rounded-[28px] bg-yellow-50">
						<Text className="text-5xl">🎁</Text>
					</View>

					<Text className="mb-2 font-black text-3xl text-[#29303D]">Wait!</Text>
					<Text className="mb-8 text-center text-[17px] text-[#73808C] leading-6">
						We've unlocked an exclusive, one-time reward for your first year.
					</Text>

					{/* Reward Showcase */}
					<View className="relative mb-10 w-full items-center overflow-hidden rounded-[32px] border-4 border-yellow-400 bg-yellow-50/50 p-8">
						<Text className="font-black text-[56px] text-yellow-600 tracking-tighter">
							80% OFF
						</Text>
						<Text className="mt-2 font-bold text-lg text-[#29303D] tracking-tight">
							Claim €10 instant credit
						</Text>
						<Text className="mt-1 font-medium text-[#73808C]">
							€39.99 →{" "}
							<Text className="font-bold text-[#29303D]">€29.99/year</Text>
						</Text>
					</View>

					<View className="mb-8 w-full rounded-2xl bg-rose-50 py-3">
						<Text className="text-center font-bold text-[13px] text-rose-600 uppercase tracking-widest">
							⏰ Offer expires in 24 hours
						</Text>
					</View>

					<TouchableOpacity
						activeOpacity={0.9}
						className="relative w-full overflow-hidden rounded-[24px] py-5 shadow-blue-200 shadow-xl"
						onPress={onClaim}
					>
						<LinearGradient
							colors={["#28B898", "#2DE2E2"]}
							end={{ x: 1, y: 0 }}
							start={{ x: 0, y: 0 }}
							style={StyleSheet.absoluteFill}
						/>
						<Text className="text-center font-bold text-white text-xl">
							Claim My Offer
						</Text>
					</TouchableOpacity>

					<TouchableOpacity className="mt-6" onPress={onClose}>
						<Text className="font-bold text-base text-[#73808C]">
							Return to pricing
						</Text>
					</TouchableOpacity>
				</SafeAreaView>
			</View>
		</Modal>
	);
}
