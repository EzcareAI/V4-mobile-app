import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { apptroveService } from "@/lib/apptrove-service";
import { authClient } from "@/lib/auth-client";
import {
	inferPlanFromPackageType,
	mixpanelService,
} from "@/lib/mixpanel-service";
import { revenueCatService } from "@/lib/revenuecat-service";
import { useOnboardingStore } from "@/stores/onboarding-store";

const BG = "#F0F7FA";
const SURFACE = "#FFFFFF";
const GREEN = "#34C759";
const PURPLE = "#5B9BD5";
const GOLD = "#FF9500";
const TEXT_COLOR = "#1C1C1E";
const TEXT_DIM = "#8E8E93";
const BORDER = "rgba(0,0,0,0.06)";

export default function SubscriptionScreen() {
	const router = useRouter();
	const { isPro, setPro, appliedDiscount } = useOnboardingStore();
	const [offering, setOffering] = useState<PurchasesOffering | null>(null);
	const [loading, setLoading] = useState(true);
	const [purchasing, setPurchasing] = useState(false);
	const [activeTier, setActiveTier] = useState<string>("none");

	const handleSignOut = async () => {
		await authClient.signOut();
		useOnboardingStore.getState().reset();
		router.replace("/(auth)/sign-in");
	};

	useEffect(() => {
		async function loadData() {
			try {
				await revenueCatService.initialize();
				const [currentOffering, tier] = await Promise.all([
					revenueCatService.getOfferings(),
					revenueCatService.getSubscriptionTier(),
				]);
				setOffering(currentOffering);
				setActiveTier(tier);
			} catch (err) {
				console.error("Load Offerings Error:", err);
			} finally {
				setLoading(false);
			}
		}
		loadData();
	}, []);

	const handlePurchase = async (pkg: PurchasesPackage) => {
		setPurchasing(true);
		try {
			const success = await revenueCatService.purchasePackage(pkg);
			if (success) {
				setPro(true);
				const hasIntroPrice = (pkg.product as unknown as { introPrice?: unknown }).introPrice != null;
				if (hasIntroPrice) {
					apptroveService.trackStartTrial(pkg.product.identifier, pkg.product.currencyCode);
				} else {
					apptroveService.trackSubscribe(pkg.product.identifier, pkg.product.price, pkg.product.currencyCode);
				}
				mixpanelService.trackSubscriptionStart({
					product_id: pkg.product.identifier,
					plan: inferPlanFromPackageType(pkg.packageType),
					type: hasIntroPrice ? "trial" : "paid",
					revenue: pkg.product.price,
					currency: pkg.product.currencyCode,
				});

				const tier = await revenueCatService.getSubscriptionTier();
				setActiveTier(tier);
				useOnboardingStore.getState().setAnswer("subscriptionTier", tier);

				Alert.alert(
					tier === "family" ? "Welcome to Family!" : "Welcome to Pro!",
					tier === "family"
						? "Your family features are now unlocked. Invite up to 3 members!"
						: "Your premium features are now unlocked."
				);
				router.back();
			}
		} catch (_err) {
			Alert.alert("Error", "Could not complete purchase. Please try again.");
		} finally {
			setPurchasing(false);
		}
	};

	const handleRestore = async () => {
		setLoading(true);
		try {
			const success = await revenueCatService.restorePurchases();
			if (success) {
				setPro(true);
				const tier = await revenueCatService.getSubscriptionTier();
				setActiveTier(tier);
				useOnboardingStore.getState().setAnswer("subscriptionTier", tier);
				Alert.alert("Success", "Restored your previous purchases.");
				router.back();
			} else {
				Alert.alert(
					"Nothing to Restore",
					"We couldn't find any active subscriptions."
				);
			}
		} finally {
			setLoading(false);
		}
	};

	const monthlyPkg = offering?.availablePackages.find(
		(p) => p.packageType === "MONTHLY"
	);
	const annualPkgs = offering?.availablePackages
		.filter((p) => p.packageType === "ANNUAL")
		.sort((a, b) => b.product.price - a.product.price);
	const annualPkg = annualPkgs?.[0];
	const discountedAnnualPkg = offering?.availablePackages.find(
		(p) => p.product.identifier.toLowerCase().includes("discount")
	);
	const familyPkg = offering?.availablePackages.find(
		(p) => p.product.identifier.toLowerCase().includes("family")
	);

	type PlanCard = {
		id: string;
		name: string;
		tagline: string;
		priceLabel: string;
		periodLabel: string;
		color: string;
		icon: keyof typeof Ionicons.glyphMap;
		badge: string | null;
		features: string[];
		pkg: PurchasesPackage | undefined;
	};

	const plans: PlanCard[] = [];

	plans.push({
		id: "monthly",
		name: "Monthly",
		tagline: "Flexible, cancel anytime",
		priceLabel: monthlyPkg?.product.priceString || "$9.99",
		periodLabel: "/month",
		color: PURPLE,
		icon: "calendar-outline",
		badge: null,
		features: [
			"Unlimited EZBuddy chat",
			"AI meal scanner",
			"Awakening Ritual",
			"Leagues & achievements",
			"Advanced insights",
		],
		pkg: monthlyPkg,
	});

	const annualMonthly = annualPkg
		? `${(annualPkg.product.price / 12).toFixed(2)}`
		: "4.16";
	const currSymbol = annualPkg?.product.priceString?.replace(/[\d.,\s]/g, "") || "$";

	plans.push({
		id: "yearly",
		name: "Yearly",
		tagline: `Just ${currSymbol}${annualMonthly}/mo`,
		priceLabel: annualPkg?.product.priceString || "$49.99",
		periodLabel: "/year",
		color: GREEN,
		icon: "star",
		badge: "3 DAYS FREE",
		features: [
			"Everything in Monthly",
			"3-day free trial",
			"Save over 50%",
			"Priority support",
			"Vibe cards",
		],
		pkg: annualPkg,
	});

	if (discountedAnnualPkg) {
		plans.push({
			id: "yearly_promo",
			name: "Yearly Promo",
			tagline: "Limited-time offer",
			priceLabel: discountedAnnualPkg.product.priceString,
			periodLabel: "/year",
			color: "#FF6B35",
			icon: "gift",
			badge: appliedDiscount ? `${appliedDiscount}% OFF` : "PROMO",
			features: [
				"Everything in Yearly",
				"Exclusive discount price",
				"3-day free trial",
				"All premium features",
			],
			pkg: discountedAnnualPkg,
		});
	}

	plans.push({
		id: "family",
		name: "Family",
		tagline: "Up to 4 members",
		priceLabel: familyPkg?.product.priceString || "$79.99",
		periodLabel: "/year",
		color: GOLD,
		icon: "people",
		badge: "NEW",
		features: [
			"Everything in Yearly",
			"4 family profiles",
			"Family dashboard & challenges",
			"Shared progress tracking",
			"Invite code system",
		],
		pkg: familyPkg,
	});

	const isCurrent = (planId: string) => {
		if (activeTier === "family" && planId === "family") return true;
		if (activeTier === "pro" && (planId === "monthly" || planId === "yearly")) return true;
		return false;
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator color={PURPLE} size="large" />
			</View>
		);
	}

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => {
							if (router.canGoBack()) {
								router.back();
							} else {
								router.replace("/(dashboard)");
							}
						}}
						style={styles.backBtn}
					>
						<Ionicons color={TEXT_COLOR} name="chevron-back" size={24} />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Choose Your Plan</Text>
					<View style={{ width: 40 }} />
				</View>

				{activeTier !== "free" && (
					<View style={[styles.currentBadge, { borderColor: activeTier === "family" ? GOLD : GREEN }]}>
						<Ionicons
							name={activeTier === "family" ? "people" : "star"}
							size={16}
							color={activeTier === "family" ? GOLD : GREEN}
						/>
						<Text style={[styles.currentBadgeText, { color: activeTier === "family" ? GOLD : GREEN }]}>
							Current: {activeTier === "family" ? "Family" : "Pro"}
						</Text>
					</View>
				)}

				{appliedDiscount && (
					<View style={styles.discountBanner}>
						<Ionicons color={GOLD} name="gift" size={18} />
						<Text style={styles.discountText}>
							Exclusive {appliedDiscount}% OFF Applied
						</Text>
					</View>
				)}

				{plans.map((plan) => {
					const current = isCurrent(plan.id);
					const isRecommended = plan.id === "yearly";

					return (
						<View
							key={plan.id}
							style={[
								styles.planCard,
								isRecommended && { borderColor: GREEN, borderWidth: 2 },
								current && { borderColor: plan.color, borderWidth: 2 },
							]}
						>
							{plan.badge && (
								<View style={[styles.badge, { backgroundColor: plan.color }]}>
									<Text style={styles.badgeText}>{plan.badge}</Text>
								</View>
							)}
							{isRecommended && !plan.badge && (
								<View style={[styles.badge, { backgroundColor: GREEN }]}>
									<Text style={styles.badgeText}>BEST VALUE</Text>
								</View>
							)}

							<View style={styles.planHeader}>
								<View style={[styles.planIcon, { backgroundColor: `${plan.color}15` }]}>
									<Ionicons name={plan.icon as any} size={22} color={plan.color} />
								</View>
								<View style={{ flex: 1 }}>
									<Text style={styles.planName}>{plan.name}</Text>
									<Text style={styles.planTagline}>{plan.tagline}</Text>
								</View>
								<View style={styles.planPriceWrap}>
									<Text style={[styles.planPrice, { color: plan.color }]}>
										{plan.priceLabel}
									</Text>
									<Text style={styles.planPeriod}>{plan.periodLabel}</Text>
								</View>
							</View>

							<View style={styles.planFeatures}>
								{plan.features.map((f) => (
									<View key={f} style={styles.featureRow}>
										<Ionicons name="checkmark-circle" size={16} color={plan.color} />
										<Text style={styles.featureText}>{f}</Text>
									</View>
								))}
							</View>

							{current ? (
								<View style={[styles.currentLabel, { backgroundColor: `${plan.color}15` }]}>
									<Text style={[styles.currentLabelText, { color: plan.color }]}>
										Current Plan
									</Text>
								</View>
							) : plan.pkg ? (
								<TouchableOpacity
									style={[styles.purchaseBtn, { backgroundColor: plan.color }]}
									onPress={() => handlePurchase(plan.pkg!)}
									disabled={purchasing}
								>
									<Text style={styles.purchaseBtnText}>
										{plan.id === "family" ? "Get Family Plan" : `Subscribe — ${plan.priceLabel}${plan.periodLabel}`}
									</Text>
								</TouchableOpacity>
							) : (
								<TouchableOpacity
									style={[styles.purchaseBtn, { backgroundColor: plan.color }]}
									onPress={() =>
										Alert.alert(
											"Coming Soon",
											"This plan will be available shortly. Stay tuned!"
										)
									}
									disabled={purchasing}
								>
									<Text style={styles.purchaseBtnText}>
										{plan.id === "family" ? "Get Family Plan" : "Subscribe"}
									</Text>
								</TouchableOpacity>
							)}
						</View>
					);
				})}

				{!offering && !__DEV__ && (
					<View style={styles.placeholder}>
						<Text style={styles.placeholderText}>
							Could not load plans. Check your connection.
						</Text>
					</View>
				)}

				<TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
					<Text style={styles.restoreText}>Restore Purchases</Text>
				</TouchableOpacity>

				<Text style={styles.legalText}>
					Subscriptions renew automatically unless canceled 24 hours before the end
					of the period. Manage in Apple/Google Play settings.
				</Text>

				<View style={{ flexDirection: "row", justifyContent: "center", marginTop: 12, gap: 16 }}>
					<TouchableOpacity onPress={() => router.push("/terms-of-service")}>
						<Text style={{ color: TEXT_DIM, fontSize: 12, textDecorationLine: "underline" }}>
							Terms of Use
						</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => router.push("/privacy-policy")}>
						<Text style={{ color: TEXT_DIM, fontSize: 12, textDecorationLine: "underline" }}>
							Privacy Policy
						</Text>
					</TouchableOpacity>
				</View>

				<TouchableOpacity onPress={handleSignOut} style={{ marginTop: 24, alignSelf: "center", padding: 10 }}>
					<Text style={{ color: "#F43F5E", fontSize: 13, fontWeight: "600" }}>
						Sign Out
					</Text>
				</TouchableOpacity>

				<View style={{ height: 40 }} />
			</ScrollView>

			{purchasing && (
				<View style={styles.overlay}>
					<ActivityIndicator color="#FFF" size="large" />
					<Text style={styles.overlayText}>Processing...</Text>
				</View>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: BG },
	scroll: { paddingHorizontal: 20, paddingBottom: 40 },
	center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG },

	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
	},
	backBtn: { width: 40, height: 40, justifyContent: "center" },
	headerTitle: { fontSize: 20, fontWeight: "700", color: TEXT_COLOR },

	currentBadge: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "center",
		gap: 6,
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: 12,
		borderWidth: 1,
		marginBottom: 16,
	},
	currentBadgeText: { fontSize: 13, fontWeight: "700" },

	discountBanner: {
		backgroundColor: `${GOLD}15`,
		padding: 12,
		borderRadius: 12,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		borderWidth: 1,
		borderColor: `${GOLD}30`,
		marginBottom: 16,
	},
	discountText: { color: GOLD, fontWeight: "700", fontSize: 14 },

	planCard: {
		backgroundColor: SURFACE,
		borderRadius: 20,
		padding: 20,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: BORDER,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
	},

	badge: {
		position: "absolute",
		top: 0,
		right: 0,
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderBottomLeftRadius: 12,
	},
	badgeText: { fontSize: 10, fontWeight: "800", color: "#FFF", letterSpacing: 1 },

	planHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 16,
	},
	planIcon: {
		width: 44,
		height: 44,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	planName: { fontSize: 18, fontWeight: "700", color: TEXT_COLOR },
	planTagline: { fontSize: 13, color: TEXT_DIM, marginTop: 2 },
	planPriceWrap: { alignItems: "flex-end" },
	planPrice: { fontSize: 20, fontWeight: "800" },
	planPeriod: { fontSize: 11, color: TEXT_DIM },

	planFeatures: { gap: 8, marginBottom: 16 },
	featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	featureText: { fontSize: 14, color: TEXT_COLOR },

	purchaseBtn: {
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	purchaseBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },

	currentLabel: {
		paddingVertical: 10,
		borderRadius: 14,
		alignItems: "center",
	},
	currentLabelText: { fontSize: 14, fontWeight: "600" },

	placeholder: {
		padding: 40,
		borderRadius: 20,
		borderStyle: "dashed",
		borderWidth: 1,
		borderColor: BORDER,
		alignItems: "center",
	},
	placeholderText: { color: TEXT_DIM, textAlign: "center", fontSize: 13 },

	restoreBtn: { marginTop: 20, alignSelf: "center" },
	restoreText: { color: TEXT_DIM, fontSize: 14, fontWeight: "600" },
	legalText: {
		fontSize: 11,
		color: TEXT_DIM,
		textAlign: "center",
		paddingHorizontal: 20,
		marginTop: 20,
		lineHeight: 16,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.6)",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 100,
	},
	overlayText: { color: "#FFF", marginTop: 15, fontWeight: "600" },
});
