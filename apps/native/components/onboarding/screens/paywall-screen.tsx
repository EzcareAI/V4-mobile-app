import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	BackHandler,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/stores/onboarding-store";

const FEATURES = [
	"🎯 Custom health scoring based on your data",
	"📊 Progress tracking and analytics",
	"🤖 AI-powered EZBuddy recommendations",
	"🔔 Daily wellness reminders",
	"📱 Unlimited access on all devices",
];

export default function PaywallScreen() {
	const router = useRouter();
	const {
		setAnswer,
		nextStep,
		currentStep,
		onboardingRecordId,
	} = useOnboardingStore();
	const [isProcessing, setIsProcessing] = useState(false);

	useFocusEffect(
		useCallback(() => {
			const onBackPress = () => {
				const state = useOnboardingStore.getState();
				if (!state.discountWheelShown) {
					state.setAnswer("discountWheelShown", true);
					state.nextStep();
					router.push("/(onboarding)/21");
					return true;
				}
				return false;
			};
			const backSubscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
			return () => backSubscription.remove();
		}, [router])
	);

	useEffect(() => {
		// Log paywall view event to backend independent of draft
		supabase
			.from("events")
			.insert([
				{
					event_type: "paywall_view",
					session_id: onboardingRecordId,
					timestamp: new Date().toISOString(),
				},
			])
			.then();
	}, [onboardingRecordId]);

	const handlePayment = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {
				/* ignore */
			}
		}
		setIsProcessing(true);

		// Log checkout attempt
		await supabase.from("events").insert([
			{
				event_type: "checkout_attempted",
				session_id: onboardingRecordId,
				timestamp: new Date().toISOString(),
			},
		]);

		// TODO: Integrate with Stripe/RevenueCat
		setTimeout(async () => {
			setAnswer("subscriptionStatus", "active");
			setAnswer("paymentAttempted", true);

			// Log success
			await supabase.from("events").insert([
				{
					event_type: "checkout_success",
					session_id: onboardingRecordId,
					timestamp: new Date().toISOString(),
				},
			]);

			setIsProcessing(false);
			nextStep();
			router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
		}, 2000);
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

					<Text className="text-center font-bold text-[32px] text-ezcare-navy leading-10 tracking-tight">
						Unlock Your Full{"\n"}Health Core
					</Text>
					<Text className="mt-4 text-center text-[17px] text-ezcare-slate leading-6">
						Get personalized plans, daily check-ins, and continuous AI guidance
					</Text>
				</View>

				{/* Pricing Cards (Side-by-Side) */}
				<View className="-mt-4 flex-row gap-x-4 px-6">
					{/* Annual — Primary Card */}
					<TouchableOpacity
						activeOpacity={0.9}
						className="relative flex-1 overflow-hidden rounded-[28px] p-5 shadow-2xl shadow-blue-200"
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
						<View className="absolute top-0 right-0 rounded-bl-[16px] bg-yellow-400 px-3 py-1.5 shadow-sm">
							<Text className="font-bold text-[#29303D] text-[9px] uppercase tracking-widest">
								BEST VALUE
							</Text>
						</View>

						<Text className="mt-3 font-bold text-xl text-white">Annual</Text>
						<Text className="mt-1 text-xs text-white/80 h-8">Save 80%</Text>

						<View className="mt-3 mb-1">
							<Text className="font-black text-3xl text-white">$39.99</Text>
						</View>
						<Text className="font-medium text-[10px] text-white/80">
							$3.33/mo, billed yearly
						</Text>

						<View className="mt-6 rounded-2xl bg-white/20 py-3.5">
							<Text className="text-center font-bold text-sm text-white">
								{isProcessing ? "Wait..." : "Select"}
							</Text>
						</View>
					</TouchableOpacity>

					{/* Monthly — Secondary Card */}
					<TouchableOpacity
						activeOpacity={0.9}
						className="flex-1 rounded-[28px] border-2 border-slate-100 bg-slate-50 p-5"
						disabled={isProcessing}
						onPress={handlePayment}
					>
						<Text className="mt-3 font-bold text-[#29303D] text-xl">Monthly</Text>
						<Text className="mt-1 text-[#73808C] text-xs h-8">Zero commitment</Text>

						<View className="mt-3 mb-1">
							<Text className="font-black text-3xl text-[#29303D]">$11.99</Text>
						</View>
						<Text className="font-medium text-[10px] text-[#73808C]">
							Billed monthly
						</Text>

						<View className="mt-6 rounded-2xl border border-slate-200 bg-white py-3.5 shadow-sm">
							<Text className="text-center font-bold text-[#29303D] text-sm">
								Select
							</Text>
						</View>
					</TouchableOpacity>
				</View>

				{/* Features Checklist */}
				<View className="mx-6 mt-10 rounded-[28px] border border-blue-50 bg-blue-50/30 p-8 shadow-sm">
					<Text className="mb-6 font-bold text-[#29303D] text-lg">
						What's Included:
					</Text>
					{FEATURES.map((f) => (
						<View className="mb-4 flex-row items-start gap-3" key={f}>
							<Text className="text-lg leading-5">{f.split(" ")[0]}</Text>
							<Text className="flex-1 font-medium text-[#73808C] text-[15px] leading-6">
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
						<Text className="text-center font-bold text-[#73808C] text-[10px] uppercase leading-4 tracking-widest">
							Safe &{"\n"}Secure
						</Text>
					</View>
					<View className="items-center">
						<View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
							<Text className="text-2xl">🌱</Text>
						</View>
						<Text className="text-center font-bold text-[#73808C] text-[10px] uppercase leading-4 tracking-widest">
							Natural{"\n"}Approach
						</Text>
					</View>
					<View className="items-center">
						<View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
							<Text className="text-2xl">💡</Text>
						</View>
						<Text className="text-center font-bold text-[#73808C] text-[10px] uppercase leading-4 tracking-widest">
							AI{"\n"}Intelligence
						</Text>
					</View>
				</View>



				{/* Fine Print */}
				<Text className="mx-10 mt-8 text-center text-[#73808C] text-[11px] leading-5">
					By starting your subscription, you agree to our Terms of Service and
					Privacy Policy. Renewals are automatic. Manage in Apple/Google Play
					settings.
				</Text>
			</ScrollView>

		</View>
	);
}
