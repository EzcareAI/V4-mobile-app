import { useRouter } from "expo-router";
import { View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import {
	SingleSelectList,
	type SingleSelectOption,
} from "../common/single-select-list";
import { StepHeader } from "../common/step-header";

const GOAL_OPTIONS_MAP: Record<string, { label: string; emoji: string }> = {
	reduce_inflammation: { label: "Reduce inflammation", emoji: "🔥" },
	boost_energy: { label: "Boost energy", emoji: "⚡" },
	improve_sleep: { label: "Improve sleep", emoji: "🌙" },
	improve_digestion: { label: "Improve digestion", emoji: "🍎" },
	lose_weight: { label: "Lose weight naturally", emoji: "⚖️" },
	detox: { label: "Detox", emoji: "💧" },
};

export const PrimaryGoalScreen = () => {
	const router = useRouter();
	const { goals, primaryGoal, setAnswer, nextStep } = useOnboardingStore();

	const selectedGoalOptions: SingleSelectOption[] = goals
		.map((id) => ({
			id,
			label: GOAL_OPTIONS_MAP[id]?.label ?? "",
			emoji: GOAL_OPTIONS_MAP[id]?.emoji,
			iconColor: "#10B981",
		}))
		.filter((g) => g.label);

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<View>
				<StepHeader
					description="This will be the main focus of your initial healing plan."
					title="Which goal is most important?"
				/>
				<SingleSelectList
					onSelect={(id) => setAnswer("primaryGoal", id)}
					options={selectedGoalOptions}
					selectedId={primaryGoal ?? null}
				/>
			</View>

			<ContinueButton
				isDisabled={!primaryGoal}
				onPress={() => {
					nextStep();
					router.push("/(onboarding)/12");
				}}
			/>
		</View>
	);
};
