import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import {
	MultiSelectList,
	type MultiSelectOption,
} from "../common/multi-select-list";
import { StepHeader } from "../common/step-header";

const GOAL_OPTIONS: MultiSelectOption[] = [
	{ id: "reduce_inflammation", label: "Reduce inflammation", emoji: "🔥" },
	{ id: "boost_energy", label: "Boost energy", emoji: "⚡" },
	{ id: "improve_sleep", label: "Improve sleep", emoji: "🌙" },
	{ id: "improve_digestion", label: "Improve digestion", emoji: "🍎" },
	{ id: "lose_weight", label: "Lose weight naturally", emoji: "⚖️" },
	{ id: "detox", label: "Detox", emoji: "💧" },
];

export const HealthGoalsScreen = () => {
	const router = useRouter();
	const { goals, setAnswer, nextStep } = useOnboardingStore();

	const handleToggle = (id: string) => {
		const newGoals = goals.includes(id)
			? goals.filter((g) => g !== id)
			: [...goals, id];
		setAnswer("goals", newGoals);
	};

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/11");
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-5">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1 px-1">
						{/* Mascot Header */}
						<View className="mt-4 items-center">
							<View className="relative">
								<LinearGradient
									colors={["#4FD1C5", "#28B898"]}
									start={{ x: 0, y: 0 }}
									style={{
										height: 112,
										width: 112,
										borderRadius: 56,
										alignItems: "center",
										justifyContent: "center",
										shadowColor: "#28B898",
										shadowOffset: { width: 0, height: 10 },
										shadowOpacity: 0.2,
										shadowRadius: 15,
										elevation: 10,
									}}
								>
									<Text style={{ fontSize: 48 }}>🎯</Text>
								</LinearGradient>
								{/* Badge */}
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-orange-400"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 14 }}>✨</Text>
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="Select all that apply. This helps us prioritize your daily natural protocols."
							title="What are your main health goals?"
						/>

						<View className="mt-8">
							<MultiSelectList
								onToggle={handleToggle}
								options={GOAL_OPTIONS}
								selectedIds={goals}
							/>
						</View>
					</View>
				</ScrollView>

				<ContinueButton
						isDisabled={goals.length === 0}
						onPress={handleContinue}
					/>
			</View>
		</View>
	);
};
