import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ZoneTriggerScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (triggers: string[]) => {
		setAnswer("zoneTriggers", triggers);
		nextStep();
		router.push("/(onboarding)/18");
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
			<View className="px-6 pt-8">
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					What makes it worse?
				</Text>
				<Text className="mb-1 text-gray-600">
					Select any triggers you've noticed
				</Text>
				<Text className="mb-8 text-gray-500 text-xs">
					(You can pick multiple)
				</Text>

				<View className="mb-8 gap-3">
					{triggerOptions.map(({ id, label, icon }) => (
						<TouchableOpacity
							className="flex-row items-center justify-between rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 p-4 active:bg-teal-100"
							key={id} // Simplified for MVP - full version would support multi-select
							onPress={() => handleSelect([id])}
						>
							<Text className="font-semibold text-gray-900">{label}</Text>
							<Text className="text-2xl">{icon}</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Divider */}
				<View className="mb-6 border-gray-200 border-t pt-6" />

				{/* Skip Option */}
				<TouchableOpacity
					className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-3"
					onPress={() => handleSelect(["not-sure"])}
				>
					<Text className="text-center font-semibold text-gray-900">
						I'm not sure
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}
