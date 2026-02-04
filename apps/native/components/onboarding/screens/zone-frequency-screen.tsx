import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ZoneFrequencyScreen() {
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (frequency: "constantly" | "often" | "sometimes" | "rarely") => {
		setAnswer("zoneFrequency", frequency);
		nextStep();
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					How often does it happen?
				</Text>
				<Text className="text-gray-600 mb-8">
					Is this constant or does it come and go?
				</Text>

				<View className="gap-3 mb-8">
					{[
					{ value: "constantly" as const, label: "Constant", subtext: "All day, every day", icon: "🔴" },
					{ value: "often" as const, label: "Frequently", subtext: "Most days", icon: "🟠" },
					{ value: "sometimes" as const, label: "Intermittent", subtext: "Some days", icon: "🟡" },
					{ value: "rarely" as const, label: "Occasionally", subtext: "Few times a week", icon: "🟢" },
					{ value: "rarely" as const, label: "Rarely", subtext: "Once in a while", icon: "💙" },
					].map(({ value, label, subtext, icon }) => (
						<TouchableOpacity
							key={value}
							onPress={() => handleSelect(value)}
							className="bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl p-4 flex-row justify-between items-center active:bg-teal-100"
						>
							<View className="flex-1">
								<Text className="font-semibold text-gray-900">{label}</Text>
								<Text className="text-xs text-gray-600">{subtext}</Text>
							</View>
							<Text className="text-2xl">{icon}</Text>
						</TouchableOpacity>
					))}
				</View>

				<View className="bg-blue-50 rounded-lg p-3 border border-blue-200">
					<Text className="text-xs text-blue-900 leading-4">
						📊 Frequency patterns help us tailor strategies to your specific needs.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
