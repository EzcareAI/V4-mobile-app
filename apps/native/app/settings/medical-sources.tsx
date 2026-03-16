import { Ionicons } from "@expo/vector-icons";
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

export default function MedicalSourcesScreen() {
	const router = useRouter();

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Ionicons color="#1A1A2E" name="arrow-back" size={24} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Medical Sources</Text>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
				<Text style={styles.preamble}>
					EZCare AI’s models are trained and routinely factual-checked against
					world-leading medical institutions and peer-reviewed journals.
				</Text>

				<View style={styles.card}>
					<TouchableOpacity
						activeOpacity={0.7}
						onPress={() => Linking.openURL("https://sleep.hms.harvard.edu/")}
						style={styles.sourceRow}
					>
						<Ionicons color="#3EC9B5" name="library-outline" size={24} />
						<View style={styles.sourceText}>
							<Text style={styles.sourceTitle}>Harvard Medical School</Text>
							<Text style={styles.sourceSub}>
								Sleep and circadian rhythm research.
							</Text>
						</View>
					</TouchableOpacity>
					<View style={styles.divider} />
					<TouchableOpacity
						activeOpacity={0.7}
						onPress={() => Linking.openURL("https://pubmed.ncbi.nlm.nih.gov/")}
						style={styles.sourceRow}
					>
						<Ionicons color="#3EC9B5" name="pulse-outline" size={24} />
						<View style={styles.sourceText}>
							<Text style={styles.sourceTitle}>PubMed Central</Text>
							<Text style={styles.sourceSub}>
								Peer-reviewed biomedical and life sciences research.
							</Text>
						</View>
					</TouchableOpacity>
					<View style={styles.divider} />
					<TouchableOpacity
						activeOpacity={0.7}
						onPress={() =>
							Linking.openURL("https://www.niddk.nih.gov/health-information")
						}
						style={styles.sourceRow}
					>
						<Ionicons color="#3EC9B5" name="medkit-outline" size={24} />
						<View style={styles.sourceText}>
							<Text style={styles.sourceTitle}>
								National Institutes of Health (NIH)
							</Text>
							<Text style={styles.sourceSub}>
								Clinical trials and preventative care guidelines.
							</Text>
						</View>
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
	content: { padding: 24, paddingBottom: 60 },
	preamble: {
		fontSize: 15,
		color: "#73808C",
		lineHeight: 22,
		marginBottom: 24,
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.05,
		shadowRadius: 10,
		elevation: 4,
	},
	sourceRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		gap: 16,
	},
	divider: {
		height: 1,
		backgroundColor: "rgba(0,0,0,0.05)",
		marginLeft: 40,
	},
	sourceText: { flex: 1 },
	sourceTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#1A1A2E",
		marginBottom: 4,
	},
	sourceSub: {
		fontSize: 13,
		color: "#94A3B8",
		lineHeight: 18,
	},
});
