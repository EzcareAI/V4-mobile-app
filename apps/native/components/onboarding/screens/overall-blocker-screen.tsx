import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function OverallBlockerScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (
		blocker: "consistency" | "stress" | "time" | "nutrition" | "other"
	) => {
		setAnswer("overallBlocker", blocker);
		nextStep();
		router.push("/(onboarding)/16");
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8">
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					What's blocking you?
				</Text>
				<Text className="mb-8 text-gray-600">
					What makes it hardest to reach your health goals?
				</Text>

				<View className="mb-8 gap-3">
					{[
						{
							value: "time" as const,
							label: "⏱️ Lack of Time",
							desc: "Too busy for health routines",
						},
						{
							value: "consistency" as const,
							label: "📅 Consistency",
							desc: "Can't stick to plans long-term",
						},
						{
							value: "nutrition" as const,
							label: "📚 Nutrition Knowledge",
							desc: "Don't know what to eat",
						},
						{
							value: "stress" as const,
							label: "⚡ Stress",
							desc: "Too stressed to focus on health",
						},
						{
							value: "other" as const,
							label: "🎯 Other",
							desc: "Something else",
						},
					].map(({ value, label, desc }) => (
						<TouchableOpacity
							className="rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 p-4 active:bg-teal-100"
							key={value}
							onPress={() => handleSelect(value)}
						>
							<Text className="mb-1 font-semibold text-gray-900 text-lg">
								{label}
							</Text>
							<Text className="text-gray-600 text-xs">{desc}</Text>
						</TouchableOpacity>
					))}
				</View>

				<View className="rounded-lg border border-green-200 bg-green-50 p-3">
					<Text className="text-green-900 text-xs leading-4">
						✨ We'll design your plan specifically around removing this blocker.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
