import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
	const router = useRouter();

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Ionicons color="#1A1A2E" name="arrow-back" size={24} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>About EZCare AI</Text>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
				<View style={styles.logoContainer}>
					<LinearGradient
						colors={["#4FD1C5", "#28B898"]}
						start={{ x: 0, y: 0 }}
						style={styles.logoBackground}
					>
						<Text style={styles.logoText}>EZ</Text>
					</LinearGradient>
					<Text style={styles.appName}>EZCare AI</Text>
					<Text style={styles.version}>Version 1.0.0</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.missionTitle}>Our Mission</Text>
					<Text style={styles.missionBody}>
						EZCare is designed to serve as your lifestyle wellness companion. We
						use AI to help you track daily wellness habits, explore general
						self-care ideas, and support you on your wellness journey.
					</Text>

					<Text style={styles.disclaimer}>
						Important: EZCare AI is a lifestyle and wellness tool for general
						informational and educational purposes only. It is not a substitute
						for professional advice. Always consult a qualified healthcare
						professional for any concerns.
					</Text>
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
	content: { padding: 24 },
	logoContainer: {
		alignItems: "center",
		marginTop: 20,
		marginBottom: 40,
	},
	logoBackground: {
		width: 80,
		height: 80,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#3EC9B5",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.2,
		shadowRadius: 15,
		elevation: 10,
		marginBottom: 16,
	},
	logoText: {
		color: "#FFFFFF",
		fontSize: 32,
		fontWeight: "900",
		letterSpacing: -1,
	},
	appName: {
		fontSize: 24,
		fontWeight: "900",
		color: "#1A1A2E",
		marginBottom: 4,
	},
	version: {
		fontSize: 14,
		color: "#94A3B8",
		fontWeight: "600",
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 24,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.05,
		shadowRadius: 10,
		elevation: 4,
	},
	missionTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#1A1A2E",
		marginBottom: 12,
	},
	missionBody: {
		fontSize: 15,
		color: "#475569",
		lineHeight: 24,
		marginBottom: 20,
	},
	disclaimer: {
		fontSize: 13,
		color: "#94A3B8",
		lineHeight: 18,
		fontStyle: "italic",
	},
});
