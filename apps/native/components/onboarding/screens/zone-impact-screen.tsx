import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

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
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					How does it affect you?
				</Text>
				<Text className="mb-8 text-gray-600">
					What's the biggest impact of your {zoneName} concerns?
				</Text>

				<View className="mb-8 gap-3">
					{[
						{
							value: 1,
							label: "Limits my activities",
							icon: "⛔",
							desc: "Can't do things I enjoy",
						},
						{
							value: 2,
							label: "Affects my sleep",
							icon: "😴",
							desc: "Wakes me up or prevents rest",
						},
						{
							value: 3,
							label: "Mental/emotional stress",
							icon: "😟",
							desc: "Worries or depresses me",
						},
						{
							value: 4,
							label: "Affects my work/productivity",
							icon: "💼",
							desc: "Interferes with daily tasks",
						},
						{
							value: 5,
							label: "Minimal impact",
							icon: "✓",
							desc: "I manage it fine",
						},
					].map(({ value, label, icon, desc }) => (
						<TouchableOpacity
							className="rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 p-4 active:bg-teal-100"
							key={value}
							onPress={() => handleSelect(value)}
						>
							<View className="flex-row items-start justify-between">
								<View className="flex-1">
									<Text className="font-semibold text-gray-900">{label}</Text>
									<Text className="mt-1 text-gray-600 text-xs">{desc}</Text>
								</View>
								<Text className="ml-2 text-2xl">{icon}</Text>
							</View>
						</TouchableOpacity>
					))}
				</View>

				<View className="rounded-lg border border-green-200 bg-green-50 p-3">
					<Text className="text-green-900 text-xs leading-4">
						✨ Understanding the impact helps us prioritize what matters most to
						you in your personalized plan.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
