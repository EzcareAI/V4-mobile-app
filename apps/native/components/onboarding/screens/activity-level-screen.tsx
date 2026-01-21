import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Dumbbell, Flame, Target, Trophy, Zap } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
	type ActivityLevel,
	useOnboardingStore,
} from "@/stores/onboarding-store";

const ACTIVITY_OPTIONS = [
	{
		id: 1,
		label: "Sedentary",
		desc: "Little to no exercise, desk job",
		icon: Zap,
	},
	{
		id: 2,
		label: "Lightly Active",
		desc: "Light exercise 1-3 days/week",
		icon: Flame,
	},
	{
		id: 3,
		label: "Moderately Active",
		desc: "Moderate exercise 3-5 days/week",
		icon: Target,
	},
	{
		id: 4,
		label: "Very Active",
		desc: "Hard exercise 6-7 days/week",
		icon: Trophy,
	},
	{
		id: 5,
		label: "Extra Active",
		desc: "Physical job or training 2x/day",
		icon: Dumbbell,
	},
];

export const ActivityLevelScreen = () => {
	const router = useRouter();
	const { activityLevel, setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (id: ActivityLevel) => {
		setAnswer("activityLevel", id);
	};

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<ScrollView showsVerticalScrollIndicator={false}>
				<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
					What is your activity level?
				</Text>
				<Text className="mb-8 text-lg text-muted-foreground">
					This helps us calculate your daily metabolic needs.
				</Text>

				<View className="mb-4 gap-y-4">
					{ACTIVITY_OPTIONS.map((option) => (
						<Pressable
							className={`flex-row items-center rounded-3xl border-2 p-4 ${
								activityLevel === option.id
									? "border-primary bg-primary/5"
									: "border-secondary/20 bg-card"
							}`}
							key={option.id}
							onPress={() => handleSelect(option.id as ActivityLevel)}
						>
							<View
								className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
									activityLevel === option.id ? "bg-primary" : "bg-secondary/10"
								}`}
							>
								<option.icon
									color={activityLevel === option.id ? "white" : "#666"}
									size={24}
								/>
							</View>
							<View className="flex-1">
								<Text
									className={`font-semibold text-lg ${
										activityLevel === option.id
											? "text-primary"
											: "text-foreground"
									}`}
								>
									{option.label}
								</Text>
								<Text className="text-muted-foreground text-sm">
									{option.desc}
								</Text>
							</View>

							<View
								className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
									activityLevel === option.id
										? "border-primary bg-primary"
										: "border-secondary/20"
								}`}
							>
								{activityLevel === option.id && (
									<View className="h-2 w-2 rounded-full bg-white" />
								)}
							</View>
						</Pressable>
					))}
				</View>
			</ScrollView>

			<Button
				className="h-14 rounded-full bg-primary"
				isDisabled={!activityLevel}
				onPress={() => {
					nextStep();
					router.push("/(onboarding)/5");
				}}
			>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
