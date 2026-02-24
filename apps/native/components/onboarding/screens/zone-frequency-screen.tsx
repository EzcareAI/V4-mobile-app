import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ZoneFrequencyScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (
		frequency: "constantly" | "often" | "sometimes" | "rarely"
	) => {
		setAnswer("zoneFrequency", frequency);
		nextStep();
		router.push("/(onboarding)/17");
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8">
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					How often does it happen?
				</Text>
				<Text className="mb-8 text-gray-600">
					Is this constant or does it come and go?
				</Text>

				<View className="mb-8 gap-3">
					{[
						{
							value: "constantly" as const,
							label: "Constant",
							subtext: "All day, every day",
							icon: "🔴",
						},
						{
							value: "often" as const,
							label: "Frequently",
							subtext: "Most days",
							icon: "🟠",
						},
						{
							value: "sometimes" as const,
							label: "Intermittent",
							subtext: "Some days",
							icon: "🟡",
						},
						{
							value: "rarely" as const,
							label: "Occasionally",
							subtext: "Few times a week",
							icon: "🟢",
						},
						{
							value: "rarely" as const,
							label: "Rarely",
							subtext: "Once in a while",
							icon: "💙",
						},
					].map(({ value, label, subtext, icon }) => (
						<TouchableOpacity
							className="flex-row items-center justify-between rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 p-4 active:bg-teal-100"
							key={value}
							onPress={() => handleSelect(value)}
						>
							<View className="flex-1">
								<Text className="font-semibold text-gray-900">{label}</Text>
								<Text className="text-gray-600 text-xs">{subtext}</Text>
							</View>
							<Text className="text-2xl">{icon}</Text>
						</TouchableOpacity>
					))}
				</View>

				<View className="rounded-lg border border-blue-200 bg-blue-50 p-3">
					<Text className="text-blue-900 text-xs leading-4">
						📊 Frequency patterns help us tailor strategies to your specific
						needs.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
