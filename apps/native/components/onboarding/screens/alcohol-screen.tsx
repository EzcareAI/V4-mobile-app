import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function AlcoholScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (
		frequency: "never" | "occasionally" | "weekly" | "often"
	) => {
		setAnswer("alcoholFrequency", frequency);
		nextStep();
		router.push("/(onboarding)/9");
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					How often do you drink?
				</Text>
				<Text className="mb-8 text-gray-600">
					Including wine, beer, spirits, and cocktails
				</Text>

				<View className="mb-8 gap-3">
					{[
						{
							value: "never" as const,
							label: "Never",
							desc: "I don't drink alcohol",
						},
						{
							value: "occasionally" as const,
							label: "Occasionally",
							desc: "Few times a month",
						},
						{
							value: "weekly" as const,
							label: "Weekly",
							desc: "Few times a week",
						},
						{ value: "often" as const, label: "Often", desc: "Most days" },
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
						✓ This helps us factor recovery, nutrition, and sleep patterns into
						your plan.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
