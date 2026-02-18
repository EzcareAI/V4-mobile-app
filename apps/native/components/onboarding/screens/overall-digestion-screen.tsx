import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function OverallDigestionScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (digestionComfort: number) => {
		setAnswer("currentDigestionComfort", digestionComfort);
		nextStep();
		router.push("/(onboarding)/18");
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					How's your digestion?
				</Text>
				<Text className="mb-8 text-gray-600">
					Any regular digestive challenges?
				</Text>

				<View className="mb-8 gap-3">
					{[
						{
							value: 5,
							label: "Excellent",
							emoji: "✓",
							desc: "No issues at all",
						},
						{
							value: 4,
							label: "Good",
							emoji: "👍",
							desc: "Minor occasional issues",
						},
						{
							value: 3,
							label: "Fair",
							emoji: "😐",
							desc: "Regular bloating/discomfort",
						},
						{ value: 2, label: "Poor", emoji: "😟", desc: "Frequent issues" },
						{
							value: 1,
							label: "Very Poor",
							emoji: "😩",
							desc: "Severely affecting me",
						},
					].map(({ value, label, emoji, desc }) => (
						<TouchableOpacity
							className="flex-row items-center justify-between rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 p-4 active:bg-teal-100"
							key={value}
							onPress={() => handleSelect(value)}
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
						🫘 Digestion is key to nutrient absorption and overall wellness.
						This helps us personalize your dietary approach.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
