import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
	Linking,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RESOURCES = [
	{
		name: "World Health Organization",
		url: "https://www.who.int",
		icon: "globe-outline" as const,
	},
	{
		name: "International Red Cross",
		url: "https://www.icrc.org",
		icon: "heart-outline" as const,
	},
	{
		name: "US CDC Resources",
		url: "https://www.cdc.gov",
		icon: "shield-checkmark-outline" as const,
	},
	{
		name: "French Resources (Ameli)",
		url: "https://www.ameli.fr",
		icon: "flag-outline" as const,
	},
];

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
					<Text style={styles.version}>Version 1.1.0</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.missionTitle}>About This App</Text>
					<Text style={styles.missionBody}>
						EZCare AI is a daily companion. It is not a device for measuring
						or assessing anything related to your body. It does not provide
						professional advice of any kind. For any concern about your
						wellbeing, please consult a qualified professional.
					</Text>

					<Text style={styles.disclaimer}>
						EZCare AI is for general informational and educational purposes only.
						It has not received regulatory clearance from the FDA or any other
						regulatory body. Always consult a qualified professional for any
						concerns.
					</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.missionTitle}>Helpful Resources</Text>
					<Text style={[styles.missionBody, { marginBottom: 16 }]}>
						For any concern about your wellbeing, please visit these trusted
						organizations:
					</Text>

					{RESOURCES.map((resource) => (
						<TouchableOpacity
							key={resource.name}
							onPress={() => Linking.openURL(resource.url)}
							style={styles.resourceRow}
						>
							<Ionicons color="#3EC9B5" name={resource.icon} size={20} />
							<View style={styles.resourceText}>
								<Text style={styles.resourceName}>{resource.name}</Text>
								<Text style={styles.resourceUrl}>{resource.url}</Text>
							</View>
							<Ionicons color="#94A3B8" name="open-outline" size={16} />
						</TouchableOpacity>
					))}
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
	content: { padding: 24, paddingBottom: 60 },
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
		marginBottom: 20,
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
	resourceRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0,0,0,0.05)",
		gap: 12,
	},
	resourceText: { flex: 1 },
	resourceName: {
		fontSize: 15,
		fontWeight: "700",
		color: "#1A1A2E",
		marginBottom: 2,
	},
	resourceUrl: {
		fontSize: 12,
		color: "#3EC9B5",
		fontWeight: "500",
	},
});
