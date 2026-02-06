import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function AlcoholScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (frequency: "never" | "occasionally" | "weekly" | "often") => {
		setAnswer("alcoholFrequency", frequency);
		nextStep();
		router.push("/(onboarding)/9");
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					How often do you drink?
				</Text>
				<Text className="text-gray-600 mb-8">
					Including wine, beer, spirits, and cocktails
				</Text>

				<View className="gap-3 mb-8">
					{[
					{ value: "never" as const, label: "Never", desc: "I don't drink alcohol" },
					{ value: "occasionally" as const, label: "Occasionally", desc: "Few times a month" },
					{ value: "weekly" as const, label: "Weekly", desc: "Few times a week" },
					{ value: "often" as const, label: "Often", desc: "Most days" },
					].map(({ value, label, desc }) => (
						<TouchableOpacity
							key={value}
							onPress={() => handleSelect(value)}
							className="bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl p-4 flex-row justify-between items-center active:bg-teal-100"
						>
							<View className="flex-1">
								<Text className="font-semibold text-gray-900">{label}</Text>
								<Text className="text-xs text-gray-600">{desc}</Text>
							</View>
						</TouchableOpacity>
					))}
				</View>

				<View className="bg-blue-50 rounded-lg p-3 border border-blue-200">
					<Text className="text-xs text-blue-900 leading-4">
						✓ This helps us factor recovery, nutrition, and sleep patterns into
						your plan.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
