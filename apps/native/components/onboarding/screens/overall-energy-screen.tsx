import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function OverallEnergyScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (energyLevel: number) => {
		setAnswer("currentEnergyLevel", energyLevel);
		nextStep();
		router.push("/(onboarding)/17");
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					Rate your energy
				</Text>
				<Text className="text-gray-600 mb-8">
					How's your typical energy level throughout the day?
				</Text>

				<View className="gap-3 mb-8">
					{[
						{ level: 1, label: "Very Low", emoji: "🪫", desc: "Exhausted most of the day" },
						{ level: 2, label: "Low", emoji: "😴", desc: "Often tired, afternoon crash" },
						{ level: 3, label: "Fair", emoji: "😐", desc: "Okay, but inconsistent" },
						{ level: 4, label: "Good", emoji: "😊", desc: "Decent, some dips" },
						{ level: 5, label: "Excellent", emoji: "⚡", desc: "Consistently high energy" },
					].map(({ level, label, emoji, desc }) => (
						<TouchableOpacity
							key={level}
							onPress={() => handleSelect(level)}
							className="bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl p-4 flex-row justify-between items-center active:bg-teal-100"
						>
							<View className="flex-1">
								<Text className="font-semibold text-gray-900">{label}</Text>
								<Text className="text-xs text-gray-600">{desc}</Text>
							</View>
							<Text className="text-3xl">{emoji}</Text>
						</TouchableOpacity>
					))}
				</View>

				<View className="bg-blue-50 rounded-lg p-3 border border-blue-200">
					<Text className="text-xs text-blue-900 leading-4">
						🔋 Energy levels help us understand if you need focus on sleep quality,
						nutrition, or activity recovery.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
