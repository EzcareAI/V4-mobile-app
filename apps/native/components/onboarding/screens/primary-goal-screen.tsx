import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Pressable, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

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

	const handleSelect = (id: string) => {
		setAnswer("primaryGoal", id);
	};

	const selectedGoalOptions = goals
		.map((id) => ({ id, ...GOAL_OPTIONS_MAP[id] }))
		.filter((g) => g.label);

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<View>
				<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
					Which goal is most important?
				</Text>
				<Text className="mb-8 text-lg text-muted-foreground">
					This will be the main focus of your initial healing plan.
				</Text>

				<View className="gap-y-4">
					{selectedGoalOptions.map((option) => (
						<Pressable
							className={`flex-row items-center rounded-3xl border-2 p-4 ${
								primaryGoal === option.id
									? "border-primary bg-primary/5"
									: "border-secondary/20 bg-card"
							}`}
							key={option.id}
							onPress={() => handleSelect(option.id)}
						>
							<View
								className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
									primaryGoal === option.id ? "bg-primary" : "bg-secondary/10"
								}`}
							>
								<Text className="text-2xl">{option.emoji}</Text>
							</View>
							<Text
								className={`font-semibold text-lg ${
									primaryGoal === option.id ? "text-primary" : "text-foreground"
								}`}
							>
								{option.label}
							</Text>

							<View
								className={`ml-auto h-6 w-6 items-center justify-center rounded-full border-2 ${
									primaryGoal === option.id
										? "border-primary bg-primary"
										: "border-secondary/20"
								}`}
							>
								{primaryGoal === option.id && (
									<View className="h-2 w-2 rounded-full bg-white" />
								)}
							</View>
						</Pressable>
					))}
				</View>
			</View>

			<Button
				className="h-14 rounded-full bg-primary"
				isDisabled={!primaryGoal}
				onPress={() => {
					nextStep();
					router.push("/(onboarding)/12");
				}}
			>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
