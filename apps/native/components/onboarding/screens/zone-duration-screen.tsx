import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ZoneDurationScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (duration: "days" | "weeks" | "months" | "longterm") => {
		setAnswer("zoneDuration", duration);
		nextStep();
		router.push("/(onboarding)/16");
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8">
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					How long has this been going on?
				</Text>
				<Text className="mb-8 text-gray-600">
					When did you first notice this discomfort?
				</Text>

				<View className="mb-8 gap-3">
					{[
						{ value: "days" as const, label: "Less than a week", icon: "📅" },
						{ value: "weeks" as const, label: "1-2 weeks", icon: "📆" },
						{ value: "months" as const, label: "1-3 months", icon: "📊" },
						{ value: "months" as const, label: "3-6 months", icon: "📈" },
						{
							value: "longterm" as const,
							label: "More than 6 months",
							icon: "⏱️",
						},
					].map(({ value, label, icon }) => (
						<TouchableOpacity
							className="flex-row items-center justify-between rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 p-4 active:bg-teal-100"
							key={value}
							onPress={() => handleSelect(value)}
						>
							<Text className="font-semibold text-gray-900">{label}</Text>
							<Text className="text-2xl">{icon}</Text>
						</TouchableOpacity>
					))}
				</View>

				<View className="rounded-lg border border-blue-200 bg-blue-50 p-3">
					<Text className="text-blue-900 text-xs leading-4">
						💡 The timeline helps us understand if this is acute (sudden) or
						chronic (long-term), which affects your personalized plan.
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
