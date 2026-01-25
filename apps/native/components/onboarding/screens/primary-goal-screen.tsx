import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
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
		<View className="flex-1 bg-background">
			<View className="flex-1 justify-between px-5 pb-8">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1 px-1">
						<StepHeader
							className="mt-6"
							description="This will be the main focus of your initial healing plan."
							title="Which goal is most important?"
						/>
						<View className="mt-8">
							<SingleSelectList
								onSelect={(id) => setAnswer("primaryGoal", id)}
								options={selectedGoalOptions}
								selectedId={primaryGoal ?? null}
							/>
						</View>
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton
						isDisabled={!primaryGoal}
						label="Set Primary Goal"
						onPress={() => {
							nextStep();
							router.push("/(onboarding)/12");
						}}
					/>
				</View>
			</View>
		</View>
	);
};
