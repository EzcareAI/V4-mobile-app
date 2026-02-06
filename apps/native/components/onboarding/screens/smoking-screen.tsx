import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function SmokingScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (frequency: "never" | "occasionally" | "regularly") => {
		setAnswer("smokingFrequency", frequency);
		nextStep();
		router.push("/(onboarding)/8");
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					Do you smoke?
				</Text>
				<Text className="text-gray-600 mb-8">
					This helps us personalize your wellness recommendations
				</Text>

				<View className="gap-3 mb-8">
					{[
					{ value: "never" as const, label: "Never", desc: "I don't smoke" },
					{ value: "occasionally" as const, label: "Occasionally", desc: "Few times a week" },
					{ value: "regularly" as const, label: "Regular", desc: "Daily or most days" },
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
						✓ Your answers help create a truly personalized plan that works for
						your lifestyle.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
