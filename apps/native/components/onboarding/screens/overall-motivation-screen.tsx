import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function OverallMotivationScreen() {
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (motivation: number) => {
		setAnswer("motivationLevel", motivation);
		nextStep();
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					What motivates you?
				</Text>
				<Text className="text-gray-600 mb-8">
					What drives you to make health changes?
				</Text>

				<View className="gap-3 mb-8">
					{[
					{ value: 5, label: "Feel Better", emoji: "😊", desc: "Want more vitality & comfort" },
					{ value: 4, label: "Perform Better", emoji: "🏃", desc: "Want to be stronger/faster" },
					{ value: 3, label: "Prevent Disease", emoji: "🛡️", desc: "Family history concerns" },
					{ value: 2, label: "Live Longer", emoji: "⏰", desc: "Want a long healthy life" },
					{ value: 1, label: "Look Better", emoji: "💪", desc: "Want to look & feel great" },
					].map(({ value, label, emoji, desc }) => (
						<TouchableOpacity
							key={value}
							onPress={() => handleSelect(value)}
							className="bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl p-4 active:bg-teal-100"
						>
							<View className="flex-row justify-between items-start">
								<View className="flex-1">
									<Text className="font-semibold text-gray-900 text-lg">{label}</Text>
									<Text className="text-xs text-gray-600 mt-1">{desc}</Text>
								</View>
								<Text className="text-2xl ml-2">{emoji}</Text>
							</View>
						</TouchableOpacity>
					))}
				</View>

				<View className="bg-green-50 rounded-lg p-3 border border-green-200">
					<Text className="text-xs text-green-900 leading-4">
						✨ Your motivation will shape how we frame your personalized plan.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
