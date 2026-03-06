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
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function PersonalInfoScreen() {
	const router = useRouter();
	const { firstName, email, bodyZoneSelected } = useOnboardingStore();

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Ionicons color="#1A1A2E" name="arrow-back" size={24} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Personal Info</Text>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
				<View style={styles.card}>
					<Text style={styles.sectionLabel}>ACCOUNT DETAILS</Text>

					<View style={styles.row}>
						<Text style={styles.label}>Name</Text>
						<Text style={styles.value}>{firstName || "Not provided"}</Text>
					</View>
					<View style={styles.divider} />
					<View style={styles.row}>
						<Text style={styles.label}>Email</Text>
						<Text style={styles.value}>{email || "Not provided"}</Text>
					</View>
				</View>

				<View style={styles.card}>
					<Text style={styles.sectionLabel}>HEALTH PROFILE</Text>

					<View style={styles.row}>
						<Text style={styles.label}>Target Areas</Text>
						<Text style={styles.value}>
							{bodyZoneSelected && bodyZoneSelected.length > 0
								? bodyZoneSelected.join(", ")
								: "None selected"}
						</Text>
					</View>
				</View>

				<Text style={styles.footerNote}>
					To update your email or primary health targets, please contact
					support.
				</Text>
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
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
		zIndex: 10,
	},
	backBtn: { width: 40, alignItems: "flex-start", paddingVertical: 4 },
	headerTitle: { fontSize: 18, fontWeight: "800", color: "#1A1A2E" },
	scroll: { flex: 1 },
	content: { padding: 24, paddingBottom: 60 },
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 20,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.04,
		shadowRadius: 6,
		elevation: 2,
	},
	sectionLabel: {
		fontSize: 11,
		fontWeight: "800",
		color: "#94A3B8",
		letterSpacing: 1.2,
		marginBottom: 16,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 6,
	},
	divider: {
		height: 1,
		backgroundColor: "rgba(0,0,0,0.05)",
		marginVertical: 12,
	},
	label: { fontSize: 15, fontWeight: "600", color: "#1A1A2E" },
	value: {
		fontSize: 15,
		color: "#73808C",
		flex: 1,
		textAlign: "right",
		marginLeft: 16,
	},
	footerNote: {
		fontSize: 13,
		color: "#94A3B8",
		textAlign: "center",
		marginTop: 8,
		paddingHorizontal: 16,
		lineHeight: 18,
	},
});
