import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	Linking,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

const RESOURCES = [
	{ name: "World Health Organization", url: "https://www.who.int" },
	{ name: "International Red Cross", url: "https://www.icrc.org" },
	{ name: "US CDC", url: "https://www.cdc.gov" },
	{ name: "French Resources (Ameli)", url: "https://www.ameli.fr" },
];

export function DisclaimerScreen() {
	const router = useRouter();
	const { nextStep, currentStep } = useOnboardingStore();
	const [accepted, setAccepted] = useState(false);

	const handleContinue = () => {
		if (accepted) {
			nextStep();
			router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
		}
	};

	return (
		<View style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.iconContainer}>
					<LinearGradient
						colors={["#FEF3C7", "#FDE68A"]}
						style={styles.iconBg}
					>
						<Ionicons color="#D97706" name="information-circle" size={40} />
					</LinearGradient>
				</View>

				<Text style={styles.title}>Important Information</Text>

				<View style={styles.card}>
					<Text style={styles.bodyText}>
						EZCare AI is a <Text style={styles.bold}>lifestyle companion</Text>.
						It is designed to help you build daily habits and routines.
					</Text>

					<Text style={styles.bodyText}>
						EZCare AI is <Text style={styles.bold}>not</Text> a device for
						assessing or measuring anything related to your body. It does not
						provide professional advice of any kind.
					</Text>

					<Text style={styles.bodyText}>
						For any concern about your wellbeing, please consult a qualified
						professional.
					</Text>
				</View>

				<View style={styles.resourcesCard}>
					<Text style={styles.resourcesTitle}>Helpful Resources</Text>
					{RESOURCES.map((r) => (
						<TouchableOpacity
							key={r.name}
							onPress={() => Linking.openURL(r.url)}
							style={styles.resourceRow}
						>
							<Ionicons color="#3EC9B5" name="open-outline" size={16} />
							<Text style={styles.resourceName}>{r.name}</Text>
						</TouchableOpacity>
					))}
				</View>
			</ScrollView>

			<View style={styles.footer}>
				<TouchableOpacity
					onPress={() => setAccepted(!accepted)}
					style={styles.checkboxRow}
				>
					<View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
						{accepted && <Ionicons color="#FFFFFF" name="checkmark" size={16} />}
					</View>
					<Text style={styles.checkboxLabel}>
						I understand that EZCare AI is a lifestyle companion and does not
						provide professional advice
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					disabled={!accepted}
					onPress={handleContinue}
					style={[styles.continueBtn, !accepted && styles.continueBtnDisabled]}
				>
					<LinearGradient
						colors={accepted ? ["#28B898", "#3EC9B5"] : ["#CBD5E1", "#CBD5E1"]}
						end={{ x: 1, y: 0 }}
						start={{ x: 0, y: 0 }}
						style={StyleSheet.absoluteFill}
					/>
					<Text
						style={[
							styles.continueBtnText,
							!accepted && styles.continueBtnTextDisabled,
						]}
					>
						I Understand
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F4F6F8" },
	scrollContent: { padding: 24, paddingBottom: 200 },
	iconContainer: { alignItems: "center", marginTop: 40, marginBottom: 24 },
	iconBg: {
		width: 80,
		height: 80,
		borderRadius: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 26,
		fontWeight: "900",
		color: "#1A1A2E",
		textAlign: "center",
		marginBottom: 24,
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 24,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 3,
	},
	bodyText: {
		fontSize: 16,
		color: "#475569",
		lineHeight: 26,
		marginBottom: 16,
	},
	bold: { fontWeight: "700", color: "#1A1A2E" },
	resourcesCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 3,
	},
	resourcesTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#1A1A2E",
		marginBottom: 12,
	},
	resourceRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0,0,0,0.05)",
	},
	resourceName: { fontSize: 14, color: "#3EC9B5", fontWeight: "600" },
	footer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "#F4F6F8",
		paddingHorizontal: 24,
		paddingBottom: 40,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: "rgba(0,0,0,0.05)",
	},
	checkboxRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
		marginBottom: 16,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: "#CBD5E1",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 2,
	},
	checkboxChecked: {
		backgroundColor: "#28B898",
		borderColor: "#28B898",
	},
	checkboxLabel: {
		flex: 1,
		fontSize: 14,
		color: "#475569",
		lineHeight: 20,
	},
	continueBtn: {
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	continueBtnDisabled: { opacity: 0.5 },
	continueBtnText: {
		fontSize: 18,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	continueBtnTextDisabled: { color: "#94A3B8" },
});
