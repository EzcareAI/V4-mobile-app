import { Stack, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
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
					Privacy Policy
				</Text>
				<View style={{ width: 24 }} />
			</View>

			<ScrollView
				contentContainerStyle={{ padding: 24 }}
				showsVerticalScrollIndicator={false}
				style={{ flex: 1 }}
			>
				<Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
					Privacy Policy Content
				</Text>
				<Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
					Updated September 20th, 2025
				</Text>

				<Text style={{ fontSize: 16, lineHeight: 24, color: "#333" }}>
					At EZCare AI, we take your privacy seriously. This Privacy Policy
					explains how we collect, use, and protect your information when you
					use our AI body awareness learning service.
				</Text>

				<View style={{ marginTop: 24 }}>
					<Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12 }}>
						Information We Collect
					</Text>
					<Text style={{ fontSize: 14, lineHeight: 22, color: "#444" }}>
						• Account Information: Email address, password, and subscription
						details{"\n"}• Lifestyle Quiz Responses: Your answers to our onboarding
						lifestyle questionnaire{"\n"}• Chat Messages: Your conversations with
						Ez, our AI awareness companion
						{"\n"}• Usage Data: How you interact with our service{"\n"}• Payment
						Information: Billing details processed securely through Stripe
					</Text>
				</View>

				<View style={{ marginTop: 24 }}>
					<Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12 }}>
						How We Use Your Information
					</Text>
					<Text style={{ fontSize: 14, lineHeight: 22, color: "#444" }}>
						• Provide personalized AI educational awareness content{"\n"}• Improve our AI
						models and service quality{"\n"}• Process payments and manage your
						subscription{"\n"}• Send important service updates{"\n"}• Ensure
						platform security
					</Text>
				</View>

				{/* Add more sections as needed */}
				<Text style={{ marginTop: 40, color: "#888", textAlign: "center" }}>
					End of Privacy Policy
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
}
