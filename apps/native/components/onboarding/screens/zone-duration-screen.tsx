import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ZoneDurationScreen() {
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (duration: "days" | "weeks" | "months" | "longterm") => {
		setAnswer("zoneDuration", duration);
		nextStep();
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					How long has this been going on?
				</Text>
				<Text className="text-gray-600 mb-8">
					When did you first notice this discomfort?
				</Text>

				<View className="gap-3 mb-8">
					{[
					{ value: "days" as const, label: "Less than a week", icon: "📅" },
					{ value: "weeks" as const, label: "1-2 weeks", icon: "📆" },
					{ value: "months" as const, label: "1-3 months", icon: "📊" },
					{ value: "months" as const, label: "3-6 months", icon: "📈" },
					{ value: "longterm" as const, label: "More than 6 months", icon: "⏱️" },
					].map(({ value, label, icon }) => (
						<TouchableOpacity
							key={value}
							onPress={() => handleSelect(value)}
							className="bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl p-4 flex-row justify-between items-center active:bg-teal-100"
						>
							<Text className="font-semibold text-gray-900">{label}</Text>
							<Text className="text-2xl">{icon}</Text>
						</TouchableOpacity>
					))}
				</View>

				<View className="bg-blue-50 rounded-lg p-3 border border-blue-200">
					<Text className="text-xs text-blue-900 leading-4">
						💡 The timeline helps us understand if this is acute (sudden) or chronic
						(long-term), which affects your personalized plan.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
