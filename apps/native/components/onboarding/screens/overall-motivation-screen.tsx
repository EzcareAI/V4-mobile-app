import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function OverallMotivationScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (motivationLevel: number) => {
		setAnswer("motivationLevel", motivationLevel);
		nextStep();
		router.push("/(onboarding)/19");
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					What motivates you?
				</Text>
				<Text className="mb-8 text-gray-600">
					What drives you to make health changes?
				</Text>

				<View className="mb-8 gap-3">
					{[
						{
							value: 5,
							label: "Feel Better",
							emoji: "😊",
							desc: "Want more vitality & comfort",
						},
						{
							value: 4,
							label: "Perform Better",
							emoji: "🏃",
							desc: "Want to be stronger/faster",
						},
						{
							value: 3,
							label: "Prevent Disease",
							emoji: "🛡️",
							desc: "Family history concerns",
						},
						{
							value: 2,
							label: "Live Longer",
							emoji: "⏰",
							desc: "Want a long healthy life",
						},
						{
							value: 1,
							label: "Look Better",
							emoji: "💪",
							desc: "Want to look & feel great",
						},
					].map(({ value, label, emoji, desc }) => (
						<TouchableOpacity
							className="rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 p-4 active:bg-teal-100"
							key={value}
							onPress={() => handleSelect(value)}
						>
							<View className="flex-row items-start justify-between">
								<View className="flex-1">
									<Text className="font-semibold text-gray-900 text-lg">
										{label}
									</Text>
									<Text className="mt-1 text-gray-600 text-xs">{desc}</Text>
								</View>
								<Text className="ml-2 text-2xl">{emoji}</Text>
							</View>
						</TouchableOpacity>
					))}
				</View>

				<View className="rounded-lg border border-green-200 bg-green-50 p-3">
					<Text className="text-green-900 text-xs leading-4">
						✨ Your motivation will shape how we frame your personalized plan.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
