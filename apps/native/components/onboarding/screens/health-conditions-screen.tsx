import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function HealthConditionsScreen() {
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = () => {
		nextStep();
	};

	return (
		<ScrollView className="flex-1 bg-white">
			<View className="px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 mb-2">
					Any existing conditions?
				</Text>
				<Text className="text-gray-600 mb-1">
					Select any that apply to you
				</Text>
				<Text className="text-xs text-gray-500 mb-8">
					(You can pick multiple or skip)
				</Text>

				<View className="gap-3 mb-8">
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
							key={id}
							onPress={() => handleSelect()}
							className="bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl p-4 flex-row justify-between items-center active:bg-teal-100"
						>
							<Text className="font-semibold text-gray-900">{label}</Text>
							<Text className="text-2xl">{icon}</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Skip Option */}
				<TouchableOpacity
					onPress={() => handleSelect()}
					className="bg-gray-100 rounded-lg py-3 px-4 border border-gray-300"
				>
					<Text className="text-gray-900 font-semibold text-center">
						Prefer not to share
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}
