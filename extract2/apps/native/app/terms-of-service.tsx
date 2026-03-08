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
					<Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
						2. Medical Disclaimer
					</Text>
					<Text style={{ fontSize: 14, lineHeight: 22, color: "#444" }}>
						EZCare AI provides an AI-powered health guidance service. This
						service is NOT a substitute for professional medical advice.
					</Text>
				</View>

				{/* Add more sections as needed */}
				<Text style={{ marginTop: 40, color: "#888", textAlign: "center" }}>
					End of Terms of Service
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
}
