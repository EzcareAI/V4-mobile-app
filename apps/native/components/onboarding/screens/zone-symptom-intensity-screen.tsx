import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ZoneSymptomIntensityScreen() {
	const { bodyZoneSelected, setAnswer, nextStep } = useOnboardingStore();
	const zoneName = bodyZoneSelected || "this area";

	const handleSelect = (intensity: number) => {
		setAnswer("zoneSymptomIntensity", intensity);
		nextStep();
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					Rate the intensity
				</Text>
				<Text className="text-gray-600 mb-8">
					How intense is the discomfort in your {zoneName}?
				</Text>

				<View className="gap-3 mb-8">
					{[
						{ level: 1, label: "Mild", emoji: "😌" },
						{ level: 3, label: "Moderate", emoji: "😐" },
						{ level: 5, label: "Significant", emoji: "😕" },
						{ level: 7, label: "Severe", emoji: "😣" },
						{ level: 10, label: "Unbearable", emoji: "😩" },
					].map(({ level, label, emoji }) => (
						<TouchableOpacity
							key={level}
							onPress={() => handleSelect(level)}
							className="bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl p-4 flex-row justify-between items-center active:bg-teal-100"
						>
							<View>
								<Text className="font-semibold text-gray-900">{label}</Text>
								<Text className="text-xs text-gray-600">Level {level}</Text>
							</View>
							<Text className="text-3xl">{emoji}</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Visual Scale */}
				<View className="bg-gray-100 rounded-lg p-3">
					<Text className="text-xs font-bold text-gray-700 mb-2">Scale:</Text>
					<View className="h-1 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full" />
					<View className="flex-row justify-between mt-1">
						<Text className="text-xs text-gray-600">No pain</Text>
						<Text className="text-xs text-gray-600">Unbearable</Text>
					</View>
				</View>
			</View>
		</ScrollView>
	);
}
