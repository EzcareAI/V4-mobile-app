import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
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
			<View className="px-6 pt-8">
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					Rate your energy
				</Text>
				<Text className="mb-8 text-gray-600">
					How's your typical energy level throughout the day?
				</Text>

				<View className="mb-8 gap-3">
					{[
						{
							level: 1,
							label: "Very Low",
							emoji: "🪫",
							desc: "Exhausted most of the day",
						},
						{
							level: 2,
							label: "Low",
							emoji: "😴",
							desc: "Often tired, afternoon crash",
						},
						{
							level: 3,
							label: "Fair",
							emoji: "😐",
							desc: "Okay, but inconsistent",
						},
						{ level: 4, label: "Good", emoji: "😊", desc: "Decent, some dips" },
						{
							level: 5,
							label: "Excellent",
							emoji: "⚡",
							desc: "Consistently high energy",
						},
					].map(({ level, label, emoji, desc }) => (
						<TouchableOpacity
							className="flex-row items-center justify-between rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 p-4 active:bg-teal-100"
							key={level}
							onPress={() => handleSelect(level)}
						>
							<View className="flex-1">
								<Text className="font-semibold text-gray-900">{label}</Text>
								<Text className="text-gray-600 text-xs">{desc}</Text>
							</View>
							<Text className="text-3xl">{emoji}</Text>
						</TouchableOpacity>
					))}
				</View>

				<View className="rounded-lg border border-blue-200 bg-blue-50 p-3">
					<Text className="text-blue-900 text-xs leading-4">
						🔋 Energy levels help us understand if you need focus on sleep
						quality, nutrition, or activity recovery.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
