import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const TEAL = "#3EC9B5";
const DARK = "#0B0E17";
const GREY = "#60708F";

const SOURCES = [
	{
		name: "National Institutes of Health",
		description: "Trusted source for educational health and lifestyle information.",
		url: "https://www.nih.gov",
	},
	{
		name: "Harvard Health Publishing",
		description: "Evidence-based educational articles on wellness and lifestyle.",
		url: "https://www.health.harvard.edu",
	},
	{
		name: "Mayo Clinic Patient Education",
		description: "Educational resources for understanding your body and lifestyle choices.",
		url: "https://www.mayoclinic.org",
	},
	{
		name: "World Health Organization",
		description: "Global educational resources on wellness and healthy living.",
		url: "https://www.who.int",
	},
	{
		name: "American Psychological Association",
		description: "Educational resources on mental wellness, stress, and mindfulness.",
		url: "https://www.apa.org",
	},
];

export default function LearningSources() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.header}>
				<TouchableOpacity hitSlop={8} onPress={() => router.back()} style={styles.backBtn}>
					<Ionicons color={DARK} name="arrow-back" size={24} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Learning Sources</Text>
				<View style={{ width: 44 }} />
			</View>

			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<Text style={styles.intro}>
					EZCare provides educational lifestyle awareness information. The general concepts
					referenced in this app are informed by publicly available educational resources
					from the following trusted organizations.
				</Text>

				{SOURCES.map((source) => (
					<TouchableOpacity
						key={source.name}
						onPress={() => Linking.openURL(source.url)}
						style={styles.sourceCard}
					>
						<View style={styles.sourceContent}>
							<Text style={styles.sourceName}>{source.name}</Text>
							<Text style={styles.sourceDesc}>{source.description}</Text>
							<Text style={styles.sourceUrl}>{source.url}</Text>
						</View>
						<Ionicons color={TEAL} name="open-outline" size={20} />
					</TouchableOpacity>
				))}

				<View style={styles.disclaimerBox}>
					<Ionicons color="#D97706" name="information-circle" size={18} />
					<Text style={styles.disclaimerText}>
						EZCare is an educational lifestyle awareness tool. It does not provide
						medical advice, diagnoses, or treatment recommendations. Always consult
						a qualified healthcare professional for any medical concerns.
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#F7FAFC" },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: "#FFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E2E8F0",
	},
	backBtn: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "#F1F5F9",
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: { fontSize: 18, fontWeight: "700", color: DARK },
	content: { padding: 20, paddingBottom: 60 },
	intro: {
		fontSize: 14,
		color: GREY,
		lineHeight: 22,
		marginBottom: 24,
	},
	sourceCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFF",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 5,
		elevation: 1,
	},
	sourceContent: { flex: 1, marginRight: 12 },
	sourceName: { fontSize: 16, fontWeight: "700", color: DARK, marginBottom: 4 },
	sourceDesc: { fontSize: 13, color: GREY, lineHeight: 18, marginBottom: 4 },
	sourceUrl: { fontSize: 12, color: TEAL, fontWeight: "500" },
	disclaimerBox: {
		flexDirection: "row",
		backgroundColor: "#FFFBEB",
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#FDE68A",
		gap: 12,
		marginTop: 12,
	},
	disclaimerText: {
		flex: 1,
		fontSize: 13,
		color: "#92400E",
		lineHeight: 18,
		fontWeight: "500",
	},
});
