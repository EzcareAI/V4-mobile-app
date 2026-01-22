import { useRouter } from "expo-router";
import { Button, PressableFeedback } from "heroui-native";
import { Check } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

const GOAL_OPTIONS = [
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
				<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
					What are your main health goals?
				</Text>
				<Text className="mb-8 text-lg text-muted-foreground">
					Select all that apply.
				</Text>

				<View className="mb-4 gap-y-4">
					{GOAL_OPTIONS.map((option) => {
						const isSelected = goals.includes(option.id);
						return (
							<PressableFeedback
								className={`flex-row items-center rounded-3xl border-2 p-4 ${
									isSelected
										? "border-primary bg-primary/5"
										: "border-secondary/20 bg-card"
								}`}
								key={option.id}
								onPress={() => handleToggle(option.id)}
							>
								<View
									className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
										isSelected
											? "bg-primary"
											: "border border-secondary/10 bg-card"
									}`}
								>
									<Text className="text-2xl">{option.emoji}</Text>
								</View>
								<Text
									className={`flex-1 font-semibold text-lg ${
										isSelected ? "text-primary" : "text-foreground"
									}`}
								>
									{option.label}
								</Text>
								<View
									className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
										isSelected
											? "border-primary bg-primary"
											: "border-secondary/20"
									}`}
								>
									{isSelected && <Check color="white" size={14} />}
								</View>
							</PressableFeedback>
						);
					})}
				</View>
			</ScrollView>

			<Button
				className="mt-4 h-14 rounded-full bg-primary"
				isDisabled={goals.length === 0}
				onPress={() => {
					nextStep();
					router.push("/(onboarding)/11");
				}}
			>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
