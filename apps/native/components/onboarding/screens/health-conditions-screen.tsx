import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function HealthConditionsScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (id: string) => {
		setAnswer("healthConditions", id);
		nextStep();
		router.push("/(onboarding)/13");
	};

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/13");
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="mb-2 font-bold text-2xl text-gray-900">
					Any existing conditions?
				</Text>
				<Text className="mb-1 text-gray-600">Select any that apply to you</Text>
				<Text className="mb-8 text-gray-500 text-xs">
					(You can pick multiple or skip)
				</Text>

				<View className="mb-8 gap-3">
					{[
						{ id: "none", label: "No conditions", icon: "✓" },
						{ id: "diabetes", label: "Diabetes", icon: "🩺" },
						{ id: "hypertension", label: "High blood pressure", icon: "❤️" },
						{ id: "arthritis", label: "Arthritis", icon: "🦴" },
						{ id: "thyroid", label: "Thyroid issues", icon: "🧬" },
						{ id: "ibd", label: "IBS/IBD", icon: "🫘" },
						{ id: "depression", label: "Depression/Anxiety", icon: "🧠" },
					].map(({ id, label, icon }) => (
						<TouchableOpacity
							className="flex-row items-center justify-between rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 p-4 active:bg-teal-100"
							key={id}
							onPress={() => handleSelect(id)}
						>
							<Text className="font-semibold text-gray-900">{label}</Text>
							<Text className="text-2xl">{icon}</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Skip Option */}
				<TouchableOpacity
					className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-3"
					onPress={() => handleContinue()}
				>
					<Text className="text-center font-semibold text-gray-900">
						Prefer not to share
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}
