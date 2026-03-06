import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function SubscriptionScreen() {
	const router = useRouter();
	const { onboardingRecordId, subscriptionStatus } = useOnboardingStore();

	const [loading, setLoading] = useState(true);
	const [activePlan, setActivePlan] = useState<string>(
		subscriptionStatus === "active" ? "pro" : "free"
	);

	useEffect(() => {
		async function fetchLiveSubscription() {
			try {
				const {
					data: { user },
				} = await supabase.auth.getUser();

				let query = supabase
					.from("onboarding_profiles")
					.select("paywall_plan_selected");

				if (user?.id) {
					query = query.eq("user_id", user.id);
				} else if (onboardingRecordId) {
					query = query.eq("id", onboardingRecordId);
				} else {
					setLoading(false);
					return;
				}

				const { data, error } = await query
					.order("created_at", { ascending: false })
					.limit(1)
					.single();

				if (data && !error) {
					if (data.paywall_plan_selected === "active") {
						setActivePlan("pro");
					} else {
						setActivePlan("free");
					}
				}
			} catch (e) {
				console.error("Failed to fetch live subscription data", e);
			} finally {
				setLoading(false);
			}
		}

		fetchLiveSubscription();
	}, [onboardingRecordId]);

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Ionicons color="#1A1A2E" name="arrow-back" size={24} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Subscription</Text>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator color="#3EC9B5" size="large" />
					</View>
				) : (
					<>
						{/* Current Plan Card */}
						<View
							style={[styles.card, activePlan === "free" && styles.activeCard]}
						>
							<View style={styles.planHeader}>
								<Text style={styles.planTitle}>Free Plan</Text>
								{activePlan === "free" && (
									<View style={styles.activeBadge}>
										<Text style={styles.activeBadgeText}>CURRENT</Text>
									</View>
								)}
							</View>
							<Text style={styles.planPrice}>
								$0 <Text style={styles.planPeriod}>/ mo</Text>
							</Text>

							<View style={styles.featuresList}>
								<View style={styles.featureRow}>
									<Ionicons color="#3EC9B5" name="checkmark-circle" size={18} />
									<Text style={styles.featureText}>Basic Body Scanning</Text>
								</View>
								<View style={styles.featureRow}>
									<Ionicons color="#3EC9B5" name="checkmark-circle" size={18} />
									<Text style={styles.featureText}>Daily Check-ins</Text>
								</View>
								<View style={styles.featureRow}>
									<Ionicons color="#3EC9B5" name="checkmark-circle" size={18} />
									<Text style={styles.featureText}>
										Limited EZBuddy Chats (10/day)
									</Text>
								</View>
							</View>
						</View>

						{/* Pro Plan Card */}
						<View
							style={[styles.card, activePlan === "pro" && styles.activeCard]}
						>
							<View style={styles.planHeader}>
								<Text style={styles.planTitle}>EZCare Pro</Text>
								{activePlan === "pro" && (
									<View style={styles.activeBadge}>
										<Text style={styles.activeBadgeText}>CURRENT</Text>
									</View>
								)}
							</View>
							<Text style={styles.planPrice}>
								$19.99 <Text style={styles.planPeriod}>/ mo</Text>
							</Text>

							<View style={styles.featuresList}>
								<View style={styles.featureRow}>
									<Ionicons color="#3EC9B5" name="checkmark-circle" size={18} />
									<Text style={styles.featureText}>
										Unlimited EZBuddy AI Chats
									</Text>
								</View>
								<View style={styles.featureRow}>
									<Ionicons color="#3EC9B5" name="checkmark-circle" size={18} />
									<Text style={styles.featureText}>
										Advanced Multimodal Input (Vision/Voice)
									</Text>
								</View>
								<View style={styles.featureRow}>
									<Ionicons color="#3EC9B5" name="checkmark-circle" size={18} />
									<Text style={styles.featureText}>
										Detailed Medical Source Analysis
									</Text>
								</View>
								<View style={styles.featureRow}>
									<Ionicons color="#3EC9B5" name="checkmark-circle" size={18} />
									<Text style={styles.featureText}>Priority Support</Text>
								</View>
							</View>

							{activePlan === "free" && (
								<TouchableOpacity
									onPress={() => router.push("/(onboarding)/20")}
									style={styles.upgradeBtn}
								>
									<Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
								</TouchableOpacity>
							)}
						</View>
					</>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#F4F6F8" },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0,0,0,0.05)",
	},
	backBtn: { width: 40, alignItems: "flex-start", paddingVertical: 4 },
	headerTitle: { fontSize: 18, fontWeight: "800", color: "#1A1A2E" },
	scroll: { flex: 1 },
	content: { padding: 24, paddingBottom: 60, flexGrow: 1 },
	loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 24,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.05,
		shadowRadius: 10,
		elevation: 4,
		borderWidth: 2,
		borderColor: "transparent",
	},
	activeCard: {
		borderColor: "rgba(62,201,181,0.3)",
		backgroundColor: "#FAFAFA",
	},
	planHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	planTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A2E" },
	activeBadge: {
		backgroundColor: "rgba(62,201,181,0.15)",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 6,
	},
	activeBadgeText: {
		color: "#3EC9B5",
		fontSize: 10,
		fontWeight: "800",
		letterSpacing: 1,
	},
	planPrice: {
		fontSize: 32,
		fontWeight: "900",
		color: "#1A1A2E",
		marginBottom: 20,
	},
	planPeriod: { fontSize: 16, fontWeight: "600", color: "#94A3B8" },
	featuresList: { gap: 12 },
	featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	featureText: { fontSize: 15, color: "#475569", fontWeight: "500", flex: 1 },
	upgradeBtn: {
		backgroundColor: "#3EC9B5",
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 24,
	},
	upgradeBtnText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "800",
	},
});
