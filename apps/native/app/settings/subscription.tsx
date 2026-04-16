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
import { revenueCatService } from "@/lib/revenuecat-service";
import { useOnboardingStore } from "@/stores/onboarding-store";

// Design Tokens
const TEAL = "#3EC9B5";
const DARK = "#1A1A2E";
const BG = "#F4F6F8";

export default function SubscriptionScreen() {
	const router = useRouter();
	const { isPro, setPro, appliedDiscount } = useOnboardingStore();
	const [offering, setOffering] = useState<PurchasesOffering | null>(null);
	const [loading, setLoading] = useState(true);
	const [purchasing, setPurchasing] = useState(false);

	const handleSignOut = async () => {
		await authClient.signOut();
		useOnboardingStore.getState().reset();
		router.replace("/(auth)/sign-in");
	};

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

	const handlePurchase = async (pkg: PurchasesPackage) => {
		setPurchasing(true);
		try {
			const success = await revenueCatService.purchasePackage(pkg);
			if (success) {
				setPro(true);
				apptroveService.trackSubscribe(
					pkg.product.identifier,
					pkg.product.price,
					pkg.product.currencyCode
				);
				Alert.alert(
					"Welcome to Pro!",
					"Your premium features are now unlocked."
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

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator color={TEAL} size="large" />
			</View>
		);
	}

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			<ScrollView contentContainerStyle={styles.scroll}>
				{/* Header */}
				<View style={styles.header}>
					{isPro ? (
						<TouchableOpacity
							onPress={() => router.back()}
							style={styles.backBtn}
						>
							<Ionicons color={DARK} name="chevron-back" size={24} />
						</TouchableOpacity>
					) : (
						<View style={{ width: 40 }} />
					)}
					<Text style={styles.headerTitle}>Upgrade to Pro</Text>
					<View style={{ width: 24 }} />
				</View>

				{/* Hero Section */}
				<LinearGradient colors={["#3EC9B5", "#2BA999"]} style={styles.hero}>
					<Ionicons color="#FFF" name="sparkles" size={50} />
					<Text style={styles.heroTitle}>Level Up Your Health</Text>
					<Text style={styles.heroSub}>
						Get unlimited AI wellness insights, personalized guidance, and
						advanced tracking features.
					</Text>
				</LinearGradient>

				{/* Discount Banner */}
				{appliedDiscount && (
					<View style={styles.discountBanner}>
						<Ionicons color="#F5A623" name="gift" size={18} />
						<Text style={styles.discountText}>
							Exclusive {appliedDiscount}% OFF Applied
						</Text>
					</View>
				)}

				{/* Features list */}
				<View style={styles.featureSection}>
					<FeatureItem icon="body-outline" text="Unlimited AI Analysis" />
					<FeatureItem
						icon="chatbubble-ellipses-outline"
						text="Infinite EZBuddy Chat"
					/>
					<FeatureItem icon="analytics-outline" text="Advanced Trend Reports" />
				</View>

				{/* Pricing Cards */}
				<View style={styles.pricingSection}>
					{offering?.availablePackages
					.filter((pkg) => {
						if (pkg.packageType === "ANNUAL") {
							// Keep only the most expensive annual (full price)
							const allAnnuals = offering.availablePackages
								.filter(p => p.packageType === "ANNUAL")
								.sort((a, b) => b.product.price - a.product.price);
							return pkg.identifier === allAnnuals[0].identifier;
						}
						if (pkg.packageType === "MONTHLY") {
							// Keep only the cheapest monthly ($11.99)
							const allMonthlies = offering.availablePackages
								.filter(p => p.packageType === "MONTHLY")
								.sort((a, b) => a.product.price - b.product.price);
							return pkg.identifier === allMonthlies[0].identifier;
						}
						return true;
					})
					.map((pkg) => (
						<TouchableOpacity
							activeOpacity={0.9}
							key={pkg.identifier}
							onPress={() => handlePurchase(pkg)}
							style={[
								styles.pricingCard,
								pkg.packageType === "ANNUAL" && styles.bestValueCard,
							]}
						>
							<View>
								<Text style={styles.pkgTitle}>
									{pkg.packageType === "ANNUAL"
										? "Yearly Access"
										: "Monthly Access"}
								</Text>
								<Text style={styles.pkgSubtitle}>
									{pkg.packageType === "ANNUAL"
										? "Annual Discounted Rate"
										: "Standard Monthly Access"}
								</Text>
								<Text style={styles.fixedPriceText}>
									Exact amount: {pkg.product.priceString}
								</Text>
							</View>
							<View style={styles.priceWrap}>
								<Text style={styles.price}>{pkg.product.currencyCode === "USD" ? pkg.product.priceString : `$${pkg.product.price}`}</Text>
								<Text style={styles.pricePeriod}>
									/{pkg.packageType === "ANNUAL" ? "yr" : "mo"}
								</Text>
							</View>
						</TouchableOpacity>
					))}

					{/* Fallback if no offerings found in sandbox */}
					{!offering && (
						<View style={styles.placeholder}>
							<Text style={styles.placeholderText}>
								Waiting for RevenueCat Sandbox configuration...
							</Text>
						</View>
					)}
				</View>

				{/* Footer */}
				<TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
					<Text style={styles.restoreText}>Restore Purchases</Text>
				</TouchableOpacity>

				<Text style={styles.legalText}>
					Subscriptions will automatically renew unless canceled 24 hours before
					the end of the period. You can manage your subscription in your App
					Store settings.
				</Text>

				<View style={{ flexDirection: "row", justifyContent: "center", marginTop: 12, gap: 16 }}>
					<TouchableOpacity onPress={() => router.push("/terms-of-service")}>
						<Text style={{ color: "#64748B", fontSize: 12, textDecorationLine: "underline" }}>
							Terms of Use
						</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => router.push("/privacy-policy")}>
						<Text style={{ color: "#64748B", fontSize: 12, textDecorationLine: "underline" }}>
							Privacy Policy
						</Text>
					</TouchableOpacity>
				</View>

				<TouchableOpacity onPress={handleSignOut} style={{ marginTop: 24, alignSelf: "center", padding: 10 }}>
					<Text style={{ color: "#F43F5E", fontSize: 13, fontWeight: "600" }}>
						Sign Out
					</Text>
				</TouchableOpacity>
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

function FeatureItem({ icon, text }: { icon: any; text: string }) {
	return (
		<View style={styles.featureItem}>
			<View style={styles.iconCircle}>
				<Ionicons color={TEAL} name={icon} size={20} />
			</View>
			<Text style={styles.featureText}>{text}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: BG },
	scroll: { paddingBottom: 40 },
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 15,
	},
	backBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#FFF",
		justifyContent: "center",
		alignItems: "center",
	},
	headerTitle: { fontSize: 18, fontWeight: "700", color: DARK },
	hero: {
		marginHorizontal: 20,
		borderRadius: 24,
		padding: 30,
		alignItems: "center",
		elevation: 5,
		shadowColor: TEAL,
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
	},
	heroTitle: {
		color: "#FFF",
		fontSize: 24,
		fontWeight: "800",
		marginTop: 15,
		textAlign: "center",
	},
	heroSub: {
		color: "rgba(255,255,255,0.9)",
		fontSize: 14,
		textAlign: "center",
		marginTop: 10,
		lineHeight: 20,
	},
	featureSection: {
		paddingHorizontal: 25,
		marginTop: 30,
	},
	featureItem: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	iconCircle: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(62, 201, 181, 0.1)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 15,
	},
	featureText: { fontSize: 16, color: DARK, fontWeight: "500" },
	pricingSection: { marginTop: 20, paddingHorizontal: 20 },
	pricingCard: {
		backgroundColor: "#FFF",
		borderRadius: 20,
		padding: 24,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.05)",
	},
	bestValueCard: {
		borderColor: TEAL,
		borderWidth: 2,
		backgroundColor: "rgba(62, 201, 181, 0.02)",
	},
	pkgTitle: { fontSize: 18, fontWeight: "700", color: DARK },
	pkgSubtitle: { fontSize: 12, color: TEAL, fontWeight: "600", marginTop: 2 },
	priceWrap: { alignItems: "flex-end" },
	price: { fontSize: 20, fontWeight: "800", color: DARK },
	pricePeriod: { fontSize: 12, color: "#64748B" },
	restoreBtn: { marginTop: 20, alignSelf: "center" },
	restoreText: { color: "#64748B", fontSize: 14, fontWeight: "600" },
	legalText: {
		fontSize: 11,
		color: "#94A3B8",
		textAlign: "center",
		paddingHorizontal: 40,
		marginTop: 30,
		lineHeight: 16,
	},
	placeholder: {
		padding: 40,
		backgroundColor: "rgba(0,0,0,0.02)",
		borderRadius: 20,
		borderStyle: "dashed",
		borderWidth: 1,
		borderColor: "#CBD5E1",
		alignItems: "center",
	},
	placeholderText: { color: "#94A3B8", textAlign: "center", fontSize: 13 },
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.6)",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 100,
	},
	overlayText: { color: "#FFF", marginTop: 15, fontWeight: "600" },
	discountBanner: {
		backgroundColor: "rgba(245, 166, 35, 0.1)",
		marginHorizontal: 20,
		marginTop: 15,
		padding: 12,
		borderRadius: 12,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		borderWidth: 1,
		borderColor: "rgba(245, 166, 35, 0.2)",
	},
	discountText: {
		color: "#D97706",
		fontWeight: "700",
		fontSize: 14,
	},
	fixedPriceText: {
		fontSize: 11,
		color: "#64748B",
		marginTop: 4,
		fontWeight: "500",
	},
});
