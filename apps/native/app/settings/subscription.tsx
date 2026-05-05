import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { revenueCatService, type SubscriptionTier } from "@/lib/revenuecat-service";
import { useOnboardingStore } from "@/stores/onboarding-store";

// Design Tokens
const BG = "#0A0A0F";
const SURFACE = "#1A1A24";
const PURPLE = "#9D4EDD";
const GREEN = "#06FFA5";
const GOLD = "#FFD60A";
const TEXT_COLOR = "#F5F5F7";
const TEXT_DIM = "#8E8E93";
const BORDER = "rgba(255,255,255,0.06)";

const TIERS: {
	key: SubscriptionTier;
	name: string;
	tagline: string;
	price: string;
	period: string;
	color: string;
	features: string[];
	icon: string;
}[] = [
	{
		key: "free",
		name: "Free",
		tagline: "Get started",
		price: "$0",
		period: "forever",
		color: TEXT_DIM,
		icon: "person-outline",
		features: [
			"Daily check-in",
			"3 AI quests per day",
			"Basic streak tracking",
			"EZBuddy chat (5/day)",
		],
	},
	{
		key: "pro",
		name: "Pro",
		tagline: "Full experience",
		price: "",
		period: "",
		color: GREEN,
		icon: "star",
		features: [
			"Everything in Free",
			"Unlimited EZBuddy chat",
			"AI meal scanner",
			"Awakening Ritual",
			"Leagues & achievements",
			"Advanced insights",
			"Vibe cards",
		],
	},
	{
		key: "family",
		name: "Family",
		tagline: "Up to 4 members",
		price: "$79.99",
		period: "/year",
		color: GOLD,
		icon: "people",
		features: [
			"Everything in Pro",
			"4 family profiles",
			"Family dashboard",
			"Family challenges",
			"Shared progress tracking",
			"Invite code system",
		],
	},
];

export default function SubscriptionScreen() {
	const router = useRouter();
	const { isPro, setPro, appliedDiscount } = useOnboardingStore();
	const [offering, setOffering] = useState<PurchasesOffering | null>(null);
	const [loading, setLoading] = useState(true);
	const [purchasing, setPurchasing] = useState(false);
	const [currentTier, setCurrentTier] = useState<SubscriptionTier>("free");

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
				setCurrentTier(tier);
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

				// Refresh tier
				const tier = await revenueCatService.getSubscriptionTier();
				setCurrentTier(tier);
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
				setCurrentTier(tier);
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

	// Get pricing from RevenueCat packages
	const monthlyPkg = offering?.availablePackages.find(
		(p) => p.packageType === "MONTHLY"
	);
	const annualPkgs = offering?.availablePackages
		.filter((p) => p.packageType === "ANNUAL")
		.sort((a, b) => b.product.price - a.product.price);
	const annualPkg = annualPkgs?.[0];

	// Update tier pricing from live data
	const tiersWithPricing = TIERS.map((tier) => {
		if (tier.key === "pro" && annualPkg) {
			return {
				...tier,
				price: annualPkg.product.priceString,
				period: "/year",
			};
		}
		return tier;
	});

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
				{/* Header */}
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

				{/* Current tier badge */}
				{currentTier !== "free" && (
					<View style={[styles.currentBadge, { borderColor: currentTier === "family" ? GOLD : GREEN }]}>
						<Ionicons
							name={currentTier === "family" ? "people" : "star"}
							size={16}
							color={currentTier === "family" ? GOLD : GREEN}
						/>
						<Text style={[styles.currentBadgeText, { color: currentTier === "family" ? GOLD : GREEN }]}>
							Current: {currentTier === "family" ? "Family" : "Pro"}
						</Text>
					</View>
				)}

				{/* Discount Banner */}
				{appliedDiscount && (
					<View style={styles.discountBanner}>
						<Ionicons color={GOLD} name="gift" size={18} />
						<Text style={styles.discountText}>
							Exclusive {appliedDiscount}% OFF Applied
						</Text>
					</View>
				)}

				{/* Tier Cards */}
				{tiersWithPricing.map((tier) => {
					const isCurrent = tier.key === currentTier;
					const isHighlighted = tier.key === "pro";

					return (
						<View
							key={tier.key}
							style={[
								styles.tierCard,
								isHighlighted && styles.tierCardHighlighted,
								isCurrent && { borderColor: tier.color, borderWidth: 2 },
							]}
						>
							{isHighlighted && (
								<View style={styles.popularBadge}>
									<Text style={styles.popularText}>MOST POPULAR</Text>
								</View>
							)}
							{tier.key === "family" && (
								<View style={[styles.popularBadge, { backgroundColor: GOLD }]}>
									<Text style={[styles.popularText, { color: "#000" }]}>NEW</Text>
								</View>
							)}

							<View style={styles.tierHeader}>
								<View style={[styles.tierIcon, { backgroundColor: tier.color + "20" }]}>
									<Ionicons name={tier.icon as any} size={22} color={tier.color} />
								</View>
								<View style={{ flex: 1 }}>
									<Text style={styles.tierName}>{tier.name}</Text>
									<Text style={styles.tierTagline}>{tier.tagline}</Text>
								</View>
								<View style={styles.tierPriceWrap}>
									<Text style={[styles.tierPrice, { color: tier.color }]}>{tier.price}</Text>
									{tier.period ? (
										<Text style={styles.tierPeriod}>{tier.period}</Text>
									) : null}
								</View>
							</View>

							<View style={styles.tierFeatures}>
								{tier.features.map((f) => (
									<View key={f} style={styles.featureRow}>
										<Ionicons name="checkmark-circle" size={16} color={tier.color} />
										<Text style={styles.featureText}>{f}</Text>
									</View>
								))}
							</View>

							{/* CTA */}
							{tier.key === "free" ? (
								isCurrent ? (
									<View style={styles.currentLabel}>
										<Text style={styles.currentLabelText}>Current Plan</Text>
									</View>
								) : null
							) : tier.key === "pro" ? (
								isCurrent ? (
									<View style={styles.currentLabel}>
										<Text style={styles.currentLabelText}>Current Plan</Text>
									</View>
								) : (
									<View style={styles.tierBtns}>
										{monthlyPkg && (
											<TouchableOpacity
												style={styles.tierBtnSecondary}
												onPress={() => handlePurchase(monthlyPkg)}
												disabled={purchasing}
											>
												<Text style={styles.tierBtnSecondaryText}>
													Monthly {monthlyPkg.product.priceString}/mo
												</Text>
											</TouchableOpacity>
										)}
										{annualPkg && (
											<TouchableOpacity
												style={styles.tierBtnPrimary}
												onPress={() => handlePurchase(annualPkg)}
												disabled={purchasing}
											>
												<LinearGradient
													colors={[GREEN, "#00CC88"]}
													start={{ x: 0, y: 0 }}
													end={{ x: 1, y: 0 }}
													style={styles.tierBtnGrad}
												>
													<Text style={styles.tierBtnPrimaryText}>
														Annual {annualPkg.product.priceString}/yr
													</Text>
												</LinearGradient>
											</TouchableOpacity>
										)}
									</View>
								)
							) : tier.key === "family" ? (
								isCurrent ? (
									<View style={styles.currentLabel}>
										<Text style={styles.currentLabelText}>Current Plan</Text>
									</View>
								) : (
									<TouchableOpacity
										style={styles.tierBtnPrimary}
										onPress={() => {
											// Family plan uses the family annual package if available,
											// otherwise show alert that it'll be available soon
											const familyPkg = offering?.availablePackages.find(
												(p) => p.product.identifier.toLowerCase().includes("family")
											);
											if (familyPkg) {
												handlePurchase(familyPkg);
											} else {
												Alert.alert(
													"Coming Soon",
													"The Family plan will be available shortly. Stay tuned!"
												);
											}
										}}
										disabled={purchasing}
									>
										<LinearGradient
											colors={[GOLD, "#FFAA00"]}
											start={{ x: 0, y: 0 }}
											end={{ x: 1, y: 0 }}
											style={styles.tierBtnGrad}
										>
											<Ionicons name="people" size={18} color="#000" />
											<Text style={[styles.tierBtnPrimaryText, { color: "#000" }]}>
												Get Family Plan
											</Text>
										</LinearGradient>
									</TouchableOpacity>
								)
							) : null}
						</View>
					);
				})}

				{/* No offerings fallback */}
				{!offering && !__DEV__ && (
					<View style={styles.placeholder}>
						<Text style={styles.placeholderText}>
							Could not load plans. Check your connection.
						</Text>
					</View>
				)}

				{/* Footer */}
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

	// Tier cards
	tierCard: {
		backgroundColor: SURFACE,
		borderRadius: 20,
		padding: 20,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: BORDER,
		overflow: "hidden",
	},
	tierCardHighlighted: {
		borderColor: `${GREEN}40`,
		borderWidth: 1,
	},

	popularBadge: {
		position: "absolute",
		top: 0,
		right: 0,
		backgroundColor: GREEN,
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderBottomLeftRadius: 12,
	},
	popularText: { fontSize: 10, fontWeight: "800", color: "#000", letterSpacing: 1 },

	tierHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 16,
	},
	tierIcon: {
		width: 44,
		height: 44,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	tierName: { fontSize: 18, fontWeight: "700", color: TEXT_COLOR },
	tierTagline: { fontSize: 13, color: TEXT_DIM, marginTop: 2 },
	tierPriceWrap: { alignItems: "flex-end" },
	tierPrice: { fontSize: 20, fontWeight: "800" },
	tierPeriod: { fontSize: 11, color: TEXT_DIM },

	tierFeatures: { gap: 8, marginBottom: 16 },
	featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	featureText: { fontSize: 14, color: TEXT_COLOR },

	tierBtns: { gap: 8 },
	tierBtnPrimary: { borderRadius: 14, overflow: "hidden" },
	tierBtnGrad: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 14,
	},
	tierBtnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#000" },
	tierBtnSecondary: {
		paddingVertical: 12,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: BORDER,
		alignItems: "center",
	},
	tierBtnSecondaryText: { fontSize: 14, fontWeight: "600", color: TEXT_DIM },

	currentLabel: {
		paddingVertical: 10,
		borderRadius: 14,
		backgroundColor: `${GREEN}15`,
		alignItems: "center",
	},
	currentLabelText: { fontSize: 14, fontWeight: "600", color: GREEN },

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
