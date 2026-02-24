import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ZoneSymptomIntensityScreen() {
	const router = useRouter();
	const { bodyZoneSelected, setAnswer, nextStep } = useOnboardingStore();
	const zoneName = bodyZoneSelected || "this area";

	const handleSelect = (intensity: number) => {
		setAnswer("zoneSymptomIntensity", intensity);
		nextStep();
		router.push("/(onboarding)/15");
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8">
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					Rate the intensity
				</Text>
				<Text className="mb-8 text-gray-600">
					How intense is the discomfort in your {zoneName}?
				</Text>

				<View className="mb-8 gap-3">
					{[
						{ level: 1, label: "Mild", emoji: "😌" },
						{ level: 3, label: "Moderate", emoji: "😐" },
						{ level: 5, label: "Significant", emoji: "😕" },
						{ level: 7, label: "Severe", emoji: "😣" },
						{ level: 10, label: "Unbearable", emoji: "😩" },
					].map(({ level, label, emoji }) => (
						<TouchableOpacity
							className="flex-row items-center justify-between rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 p-4 active:bg-teal-100"
							key={level}
							onPress={() => handleSelect(level)}
						>
							<View>
								<Text className="font-semibold text-gray-900">{label}</Text>
								<Text className="text-gray-600 text-xs">Level {level}</Text>
							</View>
							<Text className="text-3xl">{emoji}</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Visual Scale */}
				<View className="rounded-lg bg-gray-100 p-3">
					<Text className="mb-2 font-bold text-gray-700 text-xs">Scale:</Text>
					<View className="h-1 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />
					<View className="mt-1 flex-row justify-between">
						<Text className="text-gray-600 text-xs">No pain</Text>
						<Text className="text-gray-600 text-xs">Unbearable</Text>
					</View>
				</View>
			</View>
		</ScrollView>
	);
}
