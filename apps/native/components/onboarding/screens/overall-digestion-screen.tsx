import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function OverallDigestionScreen() {
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (digestion: number) => {
		setAnswer("currentDigestionComfort", digestion);
		nextStep();
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					How's your digestion?
				</Text>
				<Text className="text-gray-600 mb-8">
					Any regular digestive challenges?
				</Text>

				<View className="gap-3 mb-8">
					{[
					{ value: 5, label: "Excellent", emoji: "✓", desc: "No issues at all" },
					{ value: 4, label: "Good", emoji: "👍", desc: "Minor occasional issues" },
					{ value: 3, label: "Fair", emoji: "😐", desc: "Regular bloating/discomfort" },
					{ value: 2, label: "Poor", emoji: "😟", desc: "Frequent issues" },
					{ value: 1, label: "Very Poor", emoji: "😩", desc: "Severely affecting me" },
					].map(({ value, label, emoji, desc }) => (
						<TouchableOpacity
							key={value}
							onPress={() => handleSelect(value)}
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
						🫘 Digestion is key to nutrient absorption and overall wellness. This
						helps us personalize your dietary approach.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
