import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function OverallPriorityScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (
		priority: "energy" | "sleep" | "digestion" | "stress" | "weight"
	) => {
		setAnswer("overallPriority", priority);
		nextStep();
		router.push("/(onboarding)/15");
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					What matters most?
				</Text>
				<Text className="mb-8 text-gray-600">
					What's your top wellness priority right now?
				</Text>

				<View className="mb-8 gap-3">
					{[
						{
							value: "energy" as const,
							label: "🔋 More Energy",
							desc: "Feel less tired & sluggish",
						},
						{
							value: "digestion" as const,
							label: "🫘 Better Digestion",
							desc: "Fewer bloating & discomfort",
						},
						{
							value: "sleep" as const,
							label: "😴 Better Sleep",
							desc: "Deeper, more restful sleep",
						},
						{
							value: "stress" as const,
							label: "💪 Reduce Stress",
							desc: "Less anxiety & tension",
						},
						{
							value: "weight" as const,
							label: "⚖️ Manage Weight",
							desc: "Feel more comfortable",
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

				<View className="rounded-lg border border-blue-200 bg-blue-50 p-3">
					<Text className="text-blue-900 text-xs leading-4">
						💡 We'll focus your plan on this priority while addressing
						foundational health.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
