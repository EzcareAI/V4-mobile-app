import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function OverallPriorityScreen() {
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (priority: "energy" | "sleep" | "digestion" | "stress" | "weight") => {
		setAnswer("overallPriority", priority);
		nextStep();
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					What matters most?
				</Text>
				<Text className="text-gray-600 mb-8">
					What's your top wellness priority right now?
				</Text>

				<View className="gap-3 mb-8">
					{[
					{ value: "energy" as const, label: "🔋 More Energy", desc: "Feel less tired & sluggish" },
					{ value: "digestion" as const, label: "🫘 Better Digestion", desc: "Fewer bloating & discomfort" },
					{ value: "sleep" as const, label: "😴 Better Sleep", desc: "Deeper, more restful sleep" },
					{ value: "stress" as const, label: "💪 Reduce Stress", desc: "Less anxiety & tension" },
					{ value: "weight" as const, label: "⚖️ Manage Weight", desc: "Feel more comfortable" },
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

				<View className="bg-blue-50 rounded-lg p-3 border border-blue-200">
					<Text className="text-xs text-blue-900 leading-4">
						💡 We'll focus your plan on this priority while addressing foundational
						health.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
