import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
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

import { apptroveService } from "@/lib/apptrove-service";
import {
	inferPlanFromPackageType,
	mixpanelService,
} from "@/lib/mixpanel-service";
import { revenueCatService } from "@/lib/revenuecat-service";
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function PaywallScreen() {
	const router = useRouter();
	const { setAnswer, nextStep, currentStep, onboardingRecordId, setPro } =
		useOnboardingStore();
	const [isProcessing, setIsProcessing] = useState(false);
	const [offering, setOffering] = useState<PurchasesOffering | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedPlan, setSelectedPlan] = useState<"yearly" | "monthly">("yearly");

	useEffect(() => {
		async function loadOfferings() {
			try {
				await revenueCatService.initialize();
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
					router.replace("/(onboarding)/18");
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

		mixpanelService.trackSubscriptionCtaSeen({
			source: "onboarding_paywall",
			offering: offering?.identifier,
		});
	}, [onboardingRecordId, offering?.identifier]);

	const monthlyPkg = offering?.availablePackages.find(p => p.packageType === "MONTHLY");
	const annualPkgs = offering?.availablePackages
		.filter(p => p.packageType === "ANNUAL")
		.sort((a, b) => b.product.price - a.product.price) || [];
	const annualPkg = annualPkgs[0];
	const familyPkg = offering?.availablePackages.find(
		p => p.identifier === "family_annual" || p.product.identifier.includes("family")
	);

	const activePkg = selectedPlan === "yearly" ? annualPkg : monthlyPkg;
	const yearlyMonthlyPrice = annualPkg ? (annualPkg.product.price / 12).toFixed(2) : "0";
	const currencySymbol = annualPkg?.product.priceString?.replace(/[\d.,\s]/g, "").trim() || "$";

	const handlePurchase = async () => {
		if (!activePkg || isProcessing) return;

		if (Platform.OS === "ios") {
			try { await impactAsync(ImpactFeedbackStyle.Medium); } catch { /* */ }
		}
		setIsProcessing(true);

		await supabase.from("events").insert([
			{
				event_type: "checkout_attempted",
				session_id: onboardingRecordId,
				timestamp: new Date().toISOString(),
			},
		]);

		try {
			const success = await revenueCatService.purchasePackage(activePkg);
			if (success) {
				setPro(true);
				setAnswer("subscriptionStatus", "active");
				setAnswer("paymentAttempted", true);
				const hasIntroPrice = (activePkg.product as unknown as { introPrice?: unknown }).introPrice != null;
				if (hasIntroPrice) {
					apptroveService.trackStartTrial(activePkg.product.identifier, activePkg.product.currencyCode);
				} else {
					apptroveService.trackSubscribe(activePkg.product.identifier, activePkg.product.price, activePkg.product.currencyCode);
				}
				mixpanelService.trackSubscriptionStart({
					product_id: activePkg.product.identifier,
					plan: inferPlanFromPackageType(activePkg.packageType),
					type: hasIntroPrice ? "trial" : "paid",
					revenue: activePkg.product.price,
					currency: activePkg.product.currencyCode,
				});

				await supabase.from("events").insert([
					{
						event_type: `checkout_success_${activePkg.packageType}`,
						session_id: onboardingRecordId,
						timestamp: new Date().toISOString(),
					},
				]);

				const targetStep = 21;
				setAnswer("currentStep", targetStep);
				router.push(`/(onboarding)/${targetStep}`);
			}
		} catch (_err) {
			Alert.alert("Error", "Could not complete purchase. Please try again.");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleFamilyPurchase = async () => {
		if (!familyPkg || isProcessing) return;
		if (Platform.OS === "ios") {
			try { await impactAsync(ImpactFeedbackStyle.Medium); } catch { /* */ }
		}
		setIsProcessing(true);
		try {
			const success = await revenueCatService.purchasePackage(familyPkg);
			if (success) {
				setPro(true);
				setAnswer("subscriptionStatus", "active");
				setAnswer("paymentAttempted", true);
				const targetStep = 21;
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
				const targetStep = 21;
				setAnswer("currentStep", targetStep);
				router.push(`/(onboarding)/${targetStep}`);
			} else {
				Alert.alert("Nothing to Restore", "We couldn't find any active subscriptions.");
			}
		} finally {
			setIsProcessing(false);
		}
	};

	const handleBack = () => {
		router.replace("/(onboarding)/18");
	};

	const handleSkipToWheel = () => {
		setAnswer("paymentAttempted", false);
		setAnswer("subscriptionStatus", "skipped");
		router.push("/(onboarding)/20");
	};

	return (
		<View style={s.container}>
			<ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
				{/* Back button */}
				<TouchableOpacity style={s.backBtn} onPress={handleBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
					<Text style={s.backArrow}>{"<"}</Text>
				</TouchableOpacity>

				{/* Header */}
				<Text style={s.title}>
					Start your 3-day{"\n"}FREE trial.
				</Text>

				{/* Timeline */}
				<View style={s.timeline}>
					<View style={s.timelineItem}>
						<View style={[s.dot, s.dotActive]} />
						<View style={s.timelineText}>
							<Text style={s.timelineTitle}>Today</Text>
							<Text style={s.timelineSub}>Unlock all features like AI meal scanning, EZBuddy chat, and more.</Text>
						</View>
					</View>
					<View style={s.timelineLine} />
					<View style={s.timelineItem}>
						<View style={[s.dot, s.dotWarning]} />
						<View style={s.timelineText}>
							<Text style={s.timelineTitle}>In 2 Days - Reminder</Text>
							<Text style={s.timelineSub}>We'll send you a reminder that your trial is ending soon.</Text>
						</View>
					</View>
					<View style={s.timelineLine} />
					<View style={s.timelineItem}>
						<View style={[s.dot, s.dotGrey]} />
						<View style={s.timelineText}>
							<Text style={s.timelineTitle}>In 3 Days - Billing Starts</Text>
							<Text style={s.timelineSub}>You'll be charged unless you cancel anytime before.</Text>
						</View>
					</View>
				</View>

				{/* Plan selector */}
				<View style={s.planRow}>
					<TouchableOpacity
						style={[s.planCard, selectedPlan === "monthly" && s.planSelected]}
						onPress={() => setSelectedPlan("monthly")}
						activeOpacity={0.8}
					>
						<Text style={[s.planName, selectedPlan === "monthly" && s.planNameSelected]}>Monthly</Text>
						<Text style={[s.planPrice, selectedPlan === "monthly" && s.planPriceSelected]}>
							{monthlyPkg?.product.priceString || `${currencySymbol}9.99`}/mo
						</Text>
						<View style={[s.radio, selectedPlan === "monthly" && s.radioSelected]} />
					</TouchableOpacity>

					<TouchableOpacity
						style={[s.planCard, selectedPlan === "yearly" && s.planSelected]}
						onPress={() => setSelectedPlan("yearly")}
						activeOpacity={0.8}
					>
						{selectedPlan === "yearly" && (
							<View style={s.trialBadge}>
								<Text style={s.trialBadgeText}>3 DAYS FREE</Text>
							</View>
						)}
						<Text style={[s.planName, selectedPlan === "yearly" && s.planNameSelected]}>Yearly</Text>
						<Text style={[s.planPrice, selectedPlan === "yearly" && s.planPriceSelected]}>
							{currencySymbol}{yearlyMonthlyPrice}/mo
						</Text>
						<View style={[s.radio, selectedPlan === "yearly" && s.radioSelected]}>
							{selectedPlan === "yearly" && <View style={s.radioInner} />}
						</View>
					</TouchableOpacity>
				</View>

				{/* No payment due */}
				{selectedPlan === "yearly" && (
					<View style={s.noPaymentRow}>
						<Text style={s.checkmark}>✓</Text>
						<Text style={s.noPaymentText}>No Payment Due Now</Text>
					</View>
				)}

				{/* CTA */}
				{loading ? (
					<View style={s.ctaBtn}>
						<ActivityIndicator color="#FFF" />
					</View>
				) : offering?.availablePackages ? (
					<TouchableOpacity
						style={[s.ctaBtn, isProcessing && s.ctaDisabled]}
						onPress={handlePurchase}
						disabled={isProcessing}
						activeOpacity={0.85}
					>
						<Text style={s.ctaText}>
							{selectedPlan === "yearly" ? "Start My 3-Day Free Trial" : "Start My Journey"}
						</Text>
					</TouchableOpacity>
				) : (
					<TouchableOpacity
						style={s.ctaBtn}
						onPress={__DEV__ ? handleSkipToWheel : async () => {
							setLoading(true);
							try {
								await revenueCatService.initialize();
								const o = await revenueCatService.getOfferings();
								setOffering(o);
							} catch {} finally { setLoading(false); }
						}}
					>
						<Text style={s.ctaText}>{__DEV__ ? "Continue (Dev)" : "Try Again"}</Text>
					</TouchableOpacity>
				)}

				{/* Price detail */}
				<Text style={s.priceDetail}>
					{selectedPlan === "yearly"
						? `3 days free, then ${annualPkg?.product.priceString || `${currencySymbol}49.99`}/year (${currencySymbol}${yearlyMonthlyPrice}/mo)`
						: `Just ${monthlyPkg?.product.priceString || `${currencySymbol}9.99`} per month`
					}
				</Text>

				{/* No Commitment */}
				<View style={s.noCommitRow}>
					<Text style={s.checkmark}>✓</Text>
					<Text style={s.noCommitText}>No Commitment - Cancel Anytime</Text>
				</View>

				{/* Family plan section */}
				{familyPkg && (
					<TouchableOpacity style={s.familyCard} onPress={handleFamilyPurchase} activeOpacity={0.8}>
						<View style={s.familyLeft}>
							<Text style={s.familyEmoji}>👨‍👩‍👧‍👦</Text>
							<View>
								<Text style={s.familyTitle}>Family Plan</Text>
								<Text style={s.familySub}>Up to 4 members</Text>
							</View>
						</View>
						<Text style={s.familyPrice}>{familyPkg.product.priceString}/yr</Text>
					</TouchableOpacity>
				)}

				{/* Restore */}
				<TouchableOpacity onPress={handleRestore} style={s.restoreBtn}>
					<Text style={s.restoreText}>Restore Purchases</Text>
				</TouchableOpacity>

				{/* Skip to discount wheel */}
				<TouchableOpacity onPress={handleSkipToWheel} style={s.skipBtn}>
					<Text style={s.skipText}>Not now</Text>
				</TouchableOpacity>

				{/* Terms */}
				<Text style={s.terms}>
					By starting your subscription, you agree to our{" "}
					<Text style={s.termsLink} onPress={() => router.push("/terms-of-service")}>Terms of Use</Text>
					{" "}and{" "}
					<Text style={s.termsLink} onPress={() => router.push("/privacy-policy")}>Privacy Policy</Text>
					. Renewals are automatic. Manage in Apple/Google Play settings.
				</Text>
			</ScrollView>

			{isProcessing && (
				<View style={s.overlay}>
					<ActivityIndicator color="#FFF" size="large" />
					<Text style={s.overlayText}>Processing...</Text>
				</View>
			)}
		</View>
	);
}

const s = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#FFFFFF" },
	scroll: { paddingBottom: 40 },

	backBtn: {
		paddingTop: Platform.OS === "ios" ? 60 : 40,
		paddingLeft: 20,
		paddingBottom: 8,
		alignSelf: "flex-start",
	},
	backArrow: { fontSize: 28, color: "#8E8E93", fontWeight: "300" },

	title: {
		fontSize: 28,
		fontWeight: "900",
		color: "#1C1C1E",
		textAlign: "center",
		marginTop: 8,
		marginBottom: 32,
		lineHeight: 36,
	},

	timeline: { marginHorizontal: 32, marginBottom: 32 },
	timelineItem: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
	timelineLine: {
		width: 2,
		height: 24,
		backgroundColor: "#E5E5EA",
		marginLeft: 11,
		marginVertical: 4,
	},
	dot: {
		width: 24,
		height: 24,
		borderRadius: 12,
		marginTop: 2,
		alignItems: "center",
		justifyContent: "center",
	},
	dotActive: { backgroundColor: "#34C759" },
	dotWarning: { backgroundColor: "#FF9500" },
	dotGrey: { backgroundColor: "#C7C7CC" },
	timelineText: { flex: 1 },
	timelineTitle: { fontSize: 16, fontWeight: "700", color: "#1C1C1E", marginBottom: 2 },
	timelineSub: { fontSize: 13, color: "#8E8E93", lineHeight: 18 },

	planRow: {
		flexDirection: "row",
		gap: 12,
		marginHorizontal: 24,
		marginBottom: 16,
	},
	planCard: {
		flex: 1,
		borderWidth: 2,
		borderColor: "#E5E5EA",
		borderRadius: 16,
		padding: 16,
		alignItems: "center",
		position: "relative",
		overflow: "visible",
	},
	planSelected: {
		borderColor: "#1C1C1E",
		backgroundColor: "#FAFAFA",
	},
	trialBadge: {
		position: "absolute",
		top: -12,
		backgroundColor: "#34C759",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 8,
	},
	trialBadgeText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.5 },
	planName: { fontSize: 15, fontWeight: "600", color: "#8E8E93", marginBottom: 4, marginTop: 4 },
	planNameSelected: { color: "#1C1C1E" },
	planPrice: { fontSize: 16, fontWeight: "800", color: "#8E8E93", marginBottom: 8 },
	planPriceSelected: { color: "#1C1C1E" },
	radio: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 2,
		borderColor: "#D1D1D6",
		alignItems: "center",
		justifyContent: "center",
	},
	radioSelected: { borderColor: "#1C1C1E" },
	radioInner: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: "#1C1C1E",
	},

	noPaymentRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		marginBottom: 16,
	},
	checkmark: { fontSize: 16, color: "#1C1C1E", fontWeight: "700" },
	noPaymentText: { fontSize: 14, fontWeight: "600", color: "#1C1C1E" },

	ctaBtn: {
		marginHorizontal: 24,
		backgroundColor: "#1C1C1E",
		borderRadius: 16,
		paddingVertical: 18,
		alignItems: "center",
		marginBottom: 12,
	},
	ctaDisabled: { opacity: 0.5 },
	ctaText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },

	priceDetail: {
		textAlign: "center",
		fontSize: 13,
		color: "#8E8E93",
		marginBottom: 12,
	},

	noCommitRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		marginBottom: 24,
	},
	noCommitText: { fontSize: 14, fontWeight: "600", color: "#1C1C1E" },

	familyCard: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginHorizontal: 24,
		marginBottom: 24,
		padding: 16,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: "#7C3AED",
		backgroundColor: "#F5F0FF",
	},
	familyLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
	familyEmoji: { fontSize: 28 },
	familyTitle: { fontSize: 16, fontWeight: "700", color: "#1C1C1E" },
	familySub: { fontSize: 12, color: "#8E8E93", marginTop: 2 },
	familyPrice: { fontSize: 16, fontWeight: "800", color: "#7C3AED" },

	restoreBtn: { alignSelf: "center", paddingVertical: 8, marginBottom: 16 },
	restoreText: { fontSize: 14, fontWeight: "600", color: "#8E8E93" },

	skipBtn: { alignSelf: "center", paddingVertical: 8, marginBottom: 16 },
	skipText: { fontSize: 13, color: "#C7C7CC" },

	terms: {
		marginHorizontal: 32,
		textAlign: "center",
		fontSize: 11,
		color: "#C7C7CC",
		lineHeight: 16,
	},
	termsLink: { fontWeight: "700", textDecorationLine: "underline" },

	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.6)",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 50,
	},
	overlayText: { color: "#FFF", fontWeight: "600", marginTop: 12 },
});
