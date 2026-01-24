import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Target } from "lucide-react-native";
import { ScrollView, View } from "react-native";
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
		<View className="flex-1 bg-background">
			<LinearGradient
				colors={["#F0F9FF", "#E1F5FE"]}
				style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
			/>

			<View className="flex-1 justify-between px-6 py-8">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1">
						{/* Icon Header */}
						<View className="mt-4 items-center">
							<View className="h-24 w-24 items-center justify-center rounded-full bg-white shadow-blue-100 shadow-lg">
								<View className="h-16 w-16 items-center justify-center rounded-full bg-blue-50/50">
									<Target color="#3BAFDA" fill="#3BAFDA" size={40} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="Select all that apply."
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

				<View className="pt-4">
					<ContinueButton
						isDisabled={goals.length === 0}
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
};
