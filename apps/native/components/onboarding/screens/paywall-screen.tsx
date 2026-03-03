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

	const handlePayment = async (planType: "annual" | "monthly") => {
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
					event_type: `checkout_success_${planType}`,
					session_id: onboardingRecordId,
					timestamp: new Date().toISOString(),
				},
			]);

			setIsProcessing(false);
			
			if (planType === "annual") {
				nextStep();
				router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
			} else {
				// Skip Wheel
				setAnswer("discountWheelShown", true);
				nextStep();
				nextStep();
				router.push(`/(onboarding)/${(currentStep || 0) + 2}`);
			}
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
						className={`relative flex-1 overflow-hidden rounded-[28px] p-5 shadow-2xl shadow-blue-200 transition-opacity duration-300 ${isProcessing ? "opacity-50" : "opacity-100"}`}
						disabled={isProcessing}
						onPress={() => handlePayment("annual")}
					>
						<LinearGradient
							colors={["#28B898", "#2DE2E2"]}
							end={{ x: 1, y: 1 }}
							start={{ x: 0, y: 0 }}
							style={StyleSheet.absoluteFill}
						/>

						{/* Best Value Badge */}
						<View className="absolute top-0 left-0 right-0 items-center bg-yellow-400 py-1.5 shadow-sm">
							<Text className="font-black text-[#29303D] text-[10px] uppercase tracking-[0.2em]">
								★★ MOST POPULAR ★★
							</Text>
						</View>

						<Text className="mt-6 font-bold text-xl text-white">Annual</Text>
						<View className="mt-1.5 self-start rounded-full bg-yellow-400 px-2.5 py-1 shadow-sm">
							<Text className="font-black text-[11px] text-[#1A2138] uppercase tracking-wider">Save 80%</Text>
						</View>

						<View className="mt-3 mb-1 flex-row items-baseline gap-1">
							<Text className="font-black text-4xl text-white">$3.33</Text>
							<Text className="font-bold text-white/80 text-sm">/mo</Text>
						</View>
						<Text className="font-medium text-[11px] text-white/90">
							Billed $39.99 yearly
						</Text>

						<View className="mt-4 rounded-2xl bg-white py-3.5 shadow-sm">
							<Text className="text-center font-black text-sm text-[#28B898] uppercase tracking-wider">
								Unlock Now
							</Text>
						</View>
					</TouchableOpacity>

					{/* Monthly — Secondary Card */}
					<TouchableOpacity
						activeOpacity={0.9}
						className={`flex-1 rounded-[28px] border-2 border-slate-100 bg-slate-50 p-5 transition-opacity duration-300 ${isProcessing ? "opacity-50" : "opacity-100"}`}
						disabled={isProcessing}
						onPress={() => handlePayment("monthly")}
					>
						<Text className="mt-6 font-bold text-[#29303D] text-lg">Monthly</Text>
						<Text className="mt-1 text-[#73808C] text-[11px] h-6">Zero commitment</Text>

						<View className="mt-3 mb-1 flex-row items-baseline gap-1">
							<Text className="font-black text-2xl text-[#29303D]">$11.99</Text>
							<Text className="font-bold text-[#73808C] text-xs">/mo</Text>
						</View>
						<Text className="font-medium text-[11px] text-[#73808C]">
							Billed monthly
						</Text>

						<View className="mt-4 rounded-2xl border border-slate-200 bg-white py-3.5 shadow-sm">
							<Text className="text-center font-bold text-[#73808C] text-sm">
								Select
							</Text>
						</View>
					</TouchableOpacity>
				</View>

				{/* Pros & Cons Comparison */}
				<View className="mx-6 mt-10 rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
					<Text className="mb-6 text-center font-bold text-[#29303D] text-lg">
						Choose Your Best Path
					</Text>
					
					{/* Annual Pros/Cons */}
					<View className="mb-6 rounded-2xl border-2 border-[#3EC9B5] bg-[#EBF5F4] p-4 shadow-sm relative">
						<View className="absolute -top-3 right-4 bg-[#3EC9B5] px-2 py-0.5 rounded-full">
							<Text className="text-[9px] font-bold text-white uppercase tracking-wider">Recommended</Text>
						</View>
						<Text className="mb-3 font-bold text-[#28B898] text-base">Annual Plan</Text>
						<View className="gap-y-2">
							<Text className="text-[#334155] text-[13px] leading-5">✅ Biggest discount (Save 80%)</Text>
							<Text className="text-[#334155] text-[13px] leading-5">✅ Full year commitment to results</Text>
							<Text className="text-[#334155] text-[13px] leading-5">✅ Lowest monthly cost ($3.33/mo)</Text>
							<Text className="text-[#73808C] text-[13px] leading-5">❌ Paid upfront</Text>
						</View>
					</View>

					{/* Monthly Pros/Cons */}
					<View className="rounded-2xl bg-slate-50 p-4">
						<Text className="mb-3 font-bold text-[#73808C] text-base">Monthly Plan</Text>
						<View className="gap-y-2">
							<Text className="text-[#334155] text-[13px] leading-5">✅ Zero long-term commitment</Text>
							<Text className="text-[#334155] text-[13px] leading-5">✅ Cancel anytime</Text>
							<Text className="text-[#334155] text-[13px] leading-5">✅ Lowest upfront cost</Text>
							<Text className="text-[#73808C] text-[13px] leading-5">❌ Nearly 4x more expensive</Text>
						</View>
					</View>
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
