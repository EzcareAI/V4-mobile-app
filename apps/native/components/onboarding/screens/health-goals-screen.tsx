import { useRouter } from "expo-router";
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

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<ScrollView showsVerticalScrollIndicator={false}>
				<StepHeader
					description="Select all that apply."
					title="What are your main health goals?"
				/>
				<MultiSelectList
					onToggle={handleToggle}
					options={GOAL_OPTIONS}
					selectedIds={goals}
				/>
			</ScrollView>

			<ContinueButton
				isDisabled={goals.length === 0}
				onPress={() => {
					nextStep();
					router.push("/(onboarding)/11");
				}}
			/>
		</View>
	);
};
