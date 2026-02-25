import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
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
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
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
									<Text style={{ fontSize: 48 }}>⚡</Text>
								</LinearGradient>
								{/* Badge */}
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-yellow-400"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 14 }}>🎯</Text>
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="This will be the main focus of your healing plan."
							title="Which one should EZBuddy focus on first?"
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

				<View className="pt-6">
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
