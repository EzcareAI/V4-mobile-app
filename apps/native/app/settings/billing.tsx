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

export default function BillingScreen() {
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
				<Text style={styles.headerTitle}>Billing & Usage</Text>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
				{loading ? (
					<ActivityIndicator color="#3EC9B5" size="large" />
				) : (
					<View style={styles.emptyState}>
						<View style={styles.iconCircle}>
							<Ionicons color="#3EC9B5" name="receipt-outline" size={40} />
						</View>
						<Text style={styles.emptyTitle}>
							{activePlan === "pro" ? "No Past Invoices" : "No Billing History"}
						</Text>
						<Text style={styles.emptySub}>
							{activePlan === "pro"
								? "You are currently subscribed to EZCare Pro. You have no past invoices to display."
								: "You do not have any active subscriptions or past invoices. Upgrade to Pro to unlock advanced AI features."}
						</Text>

						{activePlan === "free" && (
							<TouchableOpacity
								onPress={() => router.push("/settings/subscription")}
								style={styles.ctaBtn}
							>
								<Text style={styles.ctaText}>View Plans</Text>
							</TouchableOpacity>
						)}
					</View>
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
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	emptyState: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 32,
		width: "100%",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.05,
		shadowRadius: 10,
		elevation: 4,
	},
	iconCircle: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "rgba(62,201,181,0.1)",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 20,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: "800",
		color: "#1A1A2E",
		marginBottom: 8,
	},
	emptySub: {
		fontSize: 15,
		color: "#73808C",
		textAlign: "center",
		lineHeight: 22,
		marginBottom: 24,
	},
	ctaBtn: {
		backgroundColor: "#1A1A2E",
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 12,
	},
	ctaText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
