import { Stack, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsOfServiceScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
			<Stack.Screen options={{ headerShown: false }} />

			{/* Header */}
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: 16,
					paddingVertical: 16,
					borderBottomWidth: 1,
					borderBottomColor: "#eee",
				}}
			>
				<TouchableOpacity onPress={() => router.back()}>
					<ChevronLeft color="#000" size={24} />
				</TouchableOpacity>
				<Text style={{ fontWeight: "bold", fontSize: 20, color: "#000" }}>
					Terms of Service
				</Text>
				<View style={{ width: 24 }} />
			</View>

			<ScrollView
				contentContainerStyle={{ padding: 24 }}
				showsVerticalScrollIndicator={false}
				style={{ flex: 1 }}
			>
				<Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
					Terms of Service
				</Text>
				<Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
					Updated September 20th, 2025
				</Text>

				<View style={{ marginBottom: 20 }}>
					<Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
						1. Acceptance of Terms
					</Text>
					<Text style={{ fontSize: 14, lineHeight: 22, color: "#444" }}>
						By accessing or using EZCare AI, you agree to be bound by these
						Terms of Service.
					</Text>
				</View>

				<View style={{ marginBottom: 20 }}>
					<Text
						style={{
							fontWeight: "bold",
							fontSize: 16,
							marginBottom: 8,
							color: "#C53030",
						}}
					>
						2. STRICT MEDICAL DISCLAIMER — NOT MEDICAL ADVICE
					</Text>
					<Text style={{ fontSize: 14, lineHeight: 22, color: "#444" }}>
						EZCare is a holistic wellness and gamification tracking tool. The AI
						analysis, symptom insights, suggested exercises, and dietary
						recommendations provided by the App are for informational and
						educational purposes only.
						{"\n\n"}
						THE APP DOES NOT PROVIDE MEDICAL ADVICE, CLINICAL DIAGNOSES, OR
						MEDICAL TREATMENT. You must not rely on the App as an alternative to
						medical advice from your doctor or other professional healthcare
						provider. If you have any specific questions about any medical
						matter, you should consult your doctor immediately. If you think you
						may be suffering from any medical condition, you should seek
						immediate medical attention. NEVER delay seeking medical advice,
						disregard medical advice, or discontinue medical treatment because
						of information on this App.
					</Text>
				</View>

				<View style={{ marginBottom: 20 }}>
					<Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
						3. No Warranties ("As-Is" Service)
					</Text>
					<Text style={{ fontSize: 14, lineHeight: 22, color: "#444" }}>
						The App is provided on an "AS IS" and "AS AVAILABLE" basis. The App
						owner expressly disclaims all warranties of any kind, whether
						express or implied, including, but not limited to, the implied
						warranties of merchantability, fitness for a particular purpose, and
						non-infringement. We make no warranty that the App will meet your
						requirements, be uninterrupted, timely, secure, or defect-free.
					</Text>
				</View>

				<View style={{ marginBottom: 20 }}>
					<Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
						4. Limitation of Liability
					</Text>
					<Text
						style={{
							fontSize: 14,
							lineHeight: 22,
							color: "#444",
							textTransform: "uppercase",
						}}
					>
						To the fullest extent permitted by applicable law, in no event will
						the app owner, developers, or affiliates be liable for any personal
						injury, wrongful death, property damage, indirect, incidental,
						special, consequential, or punitive damages arising out of or
						related to your use of or inability to use the app, even if advised
						of the possibility of such damages. Your sole remedy for
						dissatisfaction with the app is to stop using it.
					</Text>
				</View>

				<View style={{ marginBottom: 20 }}>
					<Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
						5. Indemnification
					</Text>
					<Text style={{ fontSize: 14, lineHeight: 22, color: "#444" }}>
						You agree to indemnify, defend, and hold harmless the App owner, its
						affiliates, officers, directors, employees, agents, and licensors
						from and against any and all claims, liabilities, damages, losses,
						costs, expenses, or fees (including reasonable attorneys' fees) that
						arise from your use of the App or your violation of these Terms of
						Service.
					</Text>
				</View>

				<View style={{ marginBottom: 20 }}>
					<Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
						6. User Data & AI Processing
					</Text>
					<Text style={{ fontSize: 14, lineHeight: 22, color: "#444" }}>
						By using the symptom analysis features, you acknowledge that
						anonymized health inputs may be processed by third-party AI services
						(e.g., Anthropic) to generate insights. Do not input personally
						identifiable health information (PHI) or sensitive identifiers.
					</Text>
				</View>

				<View style={{ marginBottom: 32 }}>
					<Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
						7. Modifications to Terms
					</Text>
					<Text style={{ fontSize: 14, lineHeight: 22, color: "#444" }}>
						We reserve the right to modify these Terms at any time. We will
						notify users of significant changes, but it is your responsibility
						to review these terms periodically. Continued use of the App after
						changes constitutes acceptance.
					</Text>
				</View>

				<Text style={{ marginTop: 20, color: "#888", textAlign: "center" }}>
					End of Terms of Service
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
}
