import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function OverallBlockerScreen() {
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (blocker: "consistency" | "stress" | "time" | "nutrition" | "other") => {
		setAnswer("overallBlocker", blocker);
		nextStep();
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					What's blocking you?
				</Text>
				<Text className="text-gray-600 mb-8">
					What makes it hardest to reach your health goals?
				</Text>

				<View className="gap-3 mb-8">
					{[
					{ value: "time" as const, label: "⏱️ Lack of Time", desc: "Too busy for health routines" },
					{ value: "consistency" as const, label: "📅 Consistency", desc: "Can't stick to plans long-term" },
					{ value: "nutrition" as const, label: "📚 Nutrition Knowledge", desc: "Don't know what to eat" },
					{ value: "stress" as const, label: "⚡ Stress", desc: "Too stressed to focus on health" },
					{ value: "other" as const, label: "🎯 Other", desc: "Something else" },
					].map(({ value, label, desc }) => (
						<TouchableOpacity
							key={value}
							onPress={() => handleSelect(value)}
							className="bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl p-4 active:bg-teal-100"
						>
							<Text className="font-semibold text-gray-900 text-lg mb-1">{label}</Text>
							<Text className="text-xs text-gray-600">{desc}</Text>
						</TouchableOpacity>
					))}
				</View>

				<View className="bg-green-50 rounded-lg p-3 border border-green-200">
					<Text className="text-xs text-green-900 leading-4">
						✨ We'll design your plan specifically around removing this blocker.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
