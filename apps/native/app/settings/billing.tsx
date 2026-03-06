import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BillingScreen() {
	const router = useRouter();

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
				<View style={styles.emptyState}>
					<View style={styles.iconCircle}>
						<Ionicons color="#3EC9B5" name="receipt-outline" size={40} />
					</View>
					<Text style={styles.emptyTitle}>No Billing History</Text>
					<Text style={styles.emptySub}>
						You do not have any active subscriptions or past invoices. Upgrade
						to Pro to unlock advanced AI features.
					</Text>

					<TouchableOpacity
						onPress={() => router.push("/settings/subscription")}
						style={styles.ctaBtn}
					>
						<Text style={styles.ctaText}>View Plans</Text>
					</TouchableOpacity>
				</View>
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
