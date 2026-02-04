import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ZoneTriggerScreen() {
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (triggers: string[]) => {
		setAnswer("zoneTriggers", triggers);
		nextStep();
	};

	const triggerOptions = [
		{ id: "activity", label: "Physical activity", icon: "🏃" },
		{ id: "food", label: "Certain foods", icon: "🍽️" },
		{ id: "stress", label: "Stress", icon: "😰" },
		{ id: "weather", label: "Weather changes", icon: "🌦️" },
		{ id: "posture", label: "Posture/position", icon: "🧘" },
		{ id: "unknown", label: "No clear trigger", icon: "❓" },
	];

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					What makes it worse?
				</Text>
				<Text className="text-gray-600 mb-1">
					Select any triggers you've noticed
				</Text>
				<Text className="text-xs text-gray-500 mb-8">
					(You can pick multiple)
				</Text>

				<View className="gap-3 mb-8">
					{triggerOptions.map(({ id, label, icon }) => (
						<TouchableOpacity
							key={id}
							onPress={() => handleSelect([id])} // Simplified for MVP - full version would support multi-select
							className="bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl p-4 flex-row justify-between items-center active:bg-teal-100"
						>
							<Text className="font-semibold text-gray-900">{label}</Text>
							<Text className="text-2xl">{icon}</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Divider */}
				<View className="border-t border-gray-200 pt-6 mb-6" />

				{/* Skip Option */}
				<TouchableOpacity
					onPress={() => handleSelect(["not-sure"])}
					className="bg-gray-100 rounded-lg py-3 px-4 border border-gray-300"
				>
					<Text className="text-gray-900 font-semibold text-center">
						I'm not sure
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}
