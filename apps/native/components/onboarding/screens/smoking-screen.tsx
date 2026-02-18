import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
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
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					Do you smoke?
				</Text>
				<Text className="mb-8 text-gray-600">
					This helps us personalize your wellness recommendations
				</Text>

				<View className="mb-8 gap-3">
					{[
						{ value: "never" as const, label: "Never", desc: "I don't smoke" },
						{
							value: "occasionally" as const,
							label: "Occasionally",
							desc: "Few times a week",
						},
						{
							value: "regularly" as const,
							label: "Regular",
							desc: "Daily or most days",
						},
					].map(({ value, label, desc }) => (
						<TouchableOpacity
							className="flex-row items-center justify-between rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 p-4 active:bg-teal-100"
							key={value}
							onPress={() => handleSelect(value)}
						>
							<View className="flex-1">
								<Text className="font-semibold text-gray-900">{label}</Text>
								<Text className="text-gray-600 text-xs">{desc}</Text>
							</View>
						</TouchableOpacity>
					))}
				</View>

				<View className="rounded-lg border border-blue-200 bg-blue-50 p-3">
					<Text className="text-blue-900 text-xs leading-4">
						✓ Your answers help create a truly personalized plan that works for
						your lifestyle.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
