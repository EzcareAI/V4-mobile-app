import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Animated,
	BackHandler,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import type {
	PurchasesOffering,
	PurchasesPackage,
} from "react-native-purchases";

import { revenueCatService } from "@/lib/revenuecat-service";
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function PaywallScreen() {
	const router = useRouter();
	const { setAnswer, nextStep, currentStep, onboardingRecordId, setPro } =
		useOnboardingStore();
	const [isProcessing, setIsProcessing] = useState(false);
	const pulseAnim = useRef(new Animated.Value(1)).current;
	const [offering, setOffering] = useState<PurchasesOffering | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.02,
					duration: 800,
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 800,
					useNativeDriver: true,
				}),
			])
		).start();
	}, [pulseAnim]);

	useEffect(() => {
		async function loadOfferings() {
			try {
				const currentOffering = await revenueCatService.getOfferings();
				setOffering(currentOffering);
			} catch (err) {
				console.error("Load Offerings Error:", err);
			} finally {
				setLoading(false);
			}
		}
		loadOfferings();
	}, []);

	useFocusEffect(
		useCallback(() => {
			const onBackPress = () => {
				const state = useOnboardingStore.getState();
				if (!state.discountWheelShown) {
					router.replace("/(onboarding)/21");
					return true;
				}
				return false;
			};
			const backSubscription = BackHandler.addEventListener(
				"hardwareBackPress",
				onBackPress
			);
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

	const handlePurchase = async (pkg: PurchasesPackage) => {
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

		try {
			const success = await revenueCatService.purchasePackage(pkg);
			if (success) {
				setPro(true);
				setAnswer("subscriptionStatus", "active");
				setAnswer("paymentAttempted", true);

				// Log success
				await supabase.from("events").insert([
					{
						event_type: `checkout_success_${pkg.packageType}`,
						session_id: onboardingRecordId,
						timestamp: new Date().toISOString(),
					},
				]);

				// Successful payment always leads to Account Creation (Step 22)
				nextStep();
				// Ensure we skip to Step 22 specifically
				const targetStep = 22;
				setAnswer("currentStep", targetStep);
				router.push(`/(onboarding)/${targetStep}`);
			}
		} catch (_err) {
			Alert.alert("Error", "Could not complete purchase. Please try again.");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleRestore = async () => {
		setIsProcessing(true);
		try {
			const success = await revenueCatService.restorePurchases();
			if (success) {
				setPro(true);
				setAnswer("subscriptionStatus", "active");
				setAnswer("paymentAttempted", true);
				Alert.alert("Success", "Restored your previous purchases.");
				nextStep();
				router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
			} else {
				Alert.alert(
					"Nothing to Restore",
					"We couldn't find any active subscriptions."
				);
			}
		} finally {
			setIsProcessing(false);
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

					<Text className="text-center font-bold text-[26px] sm:text-[32px] text-ezcare-navy leading-9 tracking-tight">
						Unlock Your Full{"\n"}Wellness Journey
					</Text>
					<Text className="mt-4 text-center text-[15px] text-ezcare-slate leading-6">
						Get personalized plans, daily check-ins, and continuous AI guidance
					</Text>
				</View>

				{/* Pricing Cards */}
				<View className="-mt-4 flex-row gap-x-4 px-6">
					{loading ? (
						<View className="flex-1 items-center justify-center py-10">
							<ActivityIndicator color="#3EC9B5" size="large" />
							<Text className="mt-4 text-[#94A3B8]">Loading plans...</Text>
						</View>
					) : offering?.availablePackages ? (
						offering.availablePackages
							.filter((pkg) => {
								// Filter out any packages that look like discounts/alternate annuals
								if (pkg.packageType === "ANNUAL") {
									// If there are multiple annuals, only keep the most expensive one (Full Price)
									const allAnnuals = offering.availablePackages
										.filter(p => p.packageType === "ANNUAL")
										.sort((a, b) => b.product.price - a.product.price);
									return pkg.identifier === allAnnuals[0].identifier;
								}
								// Keep MONTHLY and potentially WEEKLY if they exist
								return pkg.packageType === "MONTHLY" || pkg.packageType === "WEEKLY";
							})
							.map((pkg) => {
								const isAnnual = pkg.packageType === "ANNUAL";
								return (
									<TouchableOpacity
										activeOpacity={0.9}
										className={`relative flex-1 overflow-hidden rounded-[28px] px-3.5 py-5 shadow-2xl transition-opacity duration-300 ${isProcessing ? "opacity-50" : "opacity-100"} ${isAnnual ? "shadow-blue-200" : "border-2 border-slate-100 bg-slate-50"}`}
										disabled={isProcessing}
										key={pkg.identifier}
										onPress={() => handlePurchase(pkg)}
									>
									{isAnnual && (
										<LinearGradient
											colors={["#28B898", "#2DE2E2"]}
											end={{ x: 1, y: 1 }}
											start={{ x: 0, y: 0 }}
											style={StyleSheet.absoluteFill}
										/>
									)}

									{isAnnual && (
										<View className="absolute top-0 right-0 left-0 items-center bg-yellow-400 py-1 shadow-sm">
											<Text className="text-center font-black text-[#29303D] text-[9px] uppercase leading-3 tracking-widest">
												MOST{"\n"}POPULAR
											</Text>
										</View>
									)}

									<Text
										className={`mt-6 font-bold text-lg ${isAnnual ? "text-white" : "text-[#29303D]"}`}
									>
										{isAnnual ? "Annual" : "Monthly"}
									</Text>
									
									<Text
										className={`mt-1 h-6 text-[11px] ${isAnnual ? "text-white/80" : "text-[#73808C]"}`}
									>
										{isAnnual ? "Best value" : "Zero commitment"}
									</Text>

									<View className="mt-3 mb-1">
										<Text
											className={`font-black text-2xl tracking-tighter ${isAnnual ? "text-white" : "text-[#29303D]"}`}
										>
											{pkg.product.currencyCode === "USD" ? pkg.product.priceString : `$${pkg.product.price}`}
										</Text>
										<Text
											className={`mt-0.5 font-bold text-xs ${isAnnual ? "text-white/80" : "text-[#73808C]"}`}
										>
											{isAnnual ? "/ yr" : "/ mo"}
										</Text>
									</View>

									<View
										className={`mt-4 rounded-[14px] py-3.5 shadow-sm ${isAnnual ? "bg-white" : "border border-slate-200 bg-white"}`}
									>
										<Text
											className={`text-center font-bold text-[13px] ${isAnnual ? "text-[#28B898] uppercase tracking-wide" : "text-[#73808C]"}`}
										>
											{isAnnual ? "Unlock Now" : "Select"}
										</Text>
									</View>
								</TouchableOpacity>
							);
						})
					) : (
						<View className="flex-1 items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-slate-50 py-10">
							<Text className="text-center text-[#94A3B8] text-sm">
								Waiting for RevenueCat configuration...
							</Text>
						</View>
					)}
				</View>

				{/* Pros & Cons Comparison */}
				<View className="mx-6 mt-10 rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
					<Text className="mb-6 text-center font-bold text-[#29303D] text-lg">
						Choose Your Best Path
					</Text>

					{/* Annual Pros/Cons */}
					<Animated.View
						style={{ transform: [{ scale: pulseAnim }], zIndex: 10 }}
					>
						<View className="relative mb-6 rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-4 shadow-lg shadow-yellow-200">
							<View className="absolute -top-3 right-4 rounded-full bg-yellow-400 px-3 py-1 shadow-sm">
								<Text className="font-black text-[#422006] text-[9px] uppercase tracking-wider">
									Recommended
								</Text>
							</View>
							<Text className="mb-3 font-black text-[#502808] text-base tracking-wide">
								✨ Annual Plan
							</Text>
							<View className="gap-y-2">
								<Text className="font-medium text-[#422006] text-[13px] leading-5">
									✅ Biggest discount (Save 80%)
								</Text>
								<Text className="font-medium text-[#422006] text-[13px] leading-5">
									✅ Full year commitment to results
								</Text>
								<Text className="font-medium text-[#422006] text-[13px] leading-5">
									✅ Lowest monthly average
								</Text>
								<Text className="text-[#422006]/60 text-[13px] leading-5">
									❌ Paid upfront
								</Text>
							</View>
						</View>
					</Animated.View>

					{/* Monthly Pros/Cons */}
					<View className="rounded-2xl bg-slate-50 p-4">
						<Text className="mb-3 font-bold text-[#73808C] text-base">
							Monthly Plan
						</Text>
						<View className="gap-y-2">
							<Text className="text-[#334155] text-[13px] leading-5">
								✅ Zero long-term commitment
							</Text>
							<Text className="text-[#334155] text-[13px] leading-5">
								✅ Cancel anytime
							</Text>
							<Text className="text-[#334155] text-[13px] leading-5">
								✅ Lowest upfront cost
							</Text>
							<Text className="text-[#73808C] text-[13px] leading-5">
								❌ Nearly 4x more expensive
							</Text>
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
				<TouchableOpacity onPress={handleRestore} className="mt-8 self-center">
					<Text className="font-semibold text-[#64748B] text-sm">
						Restore Purchases
					</Text>
				</TouchableOpacity>

				<Text className="mx-10 mt-6 text-center text-[#73808C] text-[11px] leading-5">
					By starting your subscription, you agree to our{" "}
					<Text className="underline font-bold text-[#73808C]" onPress={() => router.push("/terms-of-service")}>
						Terms of Use
					</Text>{" "}
					and{" "}
					<Text className="underline font-bold text-[#73808C]" onPress={() => router.push("/privacy-policy")}>
						Privacy Policy
					</Text>
					. Renewals are automatic. Manage in Apple/Google Play
					settings.
				</Text>
			</ScrollView>

			{isProcessing && (
				<View className="absolute inset-0 z-50 items-center justify-center bg-black/60">
					<ActivityIndicator color="#FFF" size="large" />
					<Text className="mt-4 font-semibold text-white">Processing...</Text>
				</View>
			)}
		</View>
	);
}
