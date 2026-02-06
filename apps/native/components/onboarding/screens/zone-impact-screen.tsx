import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useOnboardingStore, type BodyZone } from "@/stores/onboarding-store";

export function ZoneImpactScreen() {
	const router = useRouter();
	const { bodyZoneSelected, setAnswer, nextStep } = useOnboardingStore();
	const zoneName = bodyZoneSelected || "this area";

	const handleSelect = (impact: number) => {
		setAnswer("zoneImpact", impact);
		nextStep();
		router.push("/(onboarding)/19");
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					How does it affect you?
				</Text>
				<Text className="text-gray-600 mb-8">
					What's the biggest impact of your {zoneName} concerns?
				</Text>

				<View className="gap-3 mb-8">
					{[
					{ value: 1, label: "Limits my activities", icon: "⛔", desc: "Can't do things I enjoy" },
					{ value: 2, label: "Affects my sleep", icon: "😴", desc: "Wakes me up or prevents rest" },
					{ value: 3, label: "Mental/emotional stress", icon: "😟", desc: "Worries or depresses me" },
					{ value: 4, label: "Affects my work/productivity", icon: "💼", desc: "Interferes with daily tasks" },
					{ value: 5, label: "Minimal impact", icon: "✓", desc: "I manage it fine" },
					].map(({ value, label, icon, desc }) => (
						<TouchableOpacity
							key={value}
							onPress={() => handleSelect(value)}
							className="bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl p-4 active:bg-teal-100"
						>
							<View className="flex-row justify-between items-start">
								<View className="flex-1">
									<Text className="font-semibold text-gray-900">{label}</Text>
									<Text className="text-xs text-gray-600 mt-1">{desc}</Text>
								</View>
								<Text className="text-2xl ml-2">{icon}</Text>
							</View>
						</TouchableOpacity>
					))}
				</View>

				<View className="bg-green-50 rounded-lg p-3 border border-green-200">
					<Text className="text-xs text-green-900 leading-4">
						✨ Understanding the impact helps us prioritize what matters most to
						you in your personalized plan.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
