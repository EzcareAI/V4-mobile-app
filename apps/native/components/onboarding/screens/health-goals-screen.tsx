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
			<View className="flex-1 justify-between px-5 pb-8">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1 px-1">
						{/* Premium Icon Header */}
						<View className="mt-8 items-center">
							<View className="relative h-32 w-32 items-center justify-center">
								<View className="absolute h-28 w-28 rounded-[32px] bg-blue-50 shadow-2xl shadow-blue-100" />
								<View className="h-24 w-24 items-center justify-center rounded-[28px] border border-slate-50 bg-white shadow-sm">
									<Target color="#28B898" size={44} strokeWidth={2.5} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-10"
							description="Select all that apply. This helps us prioritize your daily natural protocols."
							title="Main health goals"
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
