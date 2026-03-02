import { useRouter } from "expo-router";
import { Dumbbell, Flame, Target, Trophy, Zap } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import {
	type ActivityLevel,
	useOnboardingStore,
} from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import {
	SingleSelectList,
	type SingleSelectOption,
} from "../common/single-select-list";
import { StepHeader } from "../common/step-header";

const ACTIVITY_OPTIONS: SingleSelectOption[] = [
	{
		id: "1",
		label: "Sedentary",
		description: "Little to no exercise, desk job",
		icon: Zap,
		iconColor: "#7C3AED",
	},
	{
		id: "2",
		label: "Lightly Active",
		description: "Light exercise 1-2 days/week",
		icon: Flame,
		iconColor: "#F59E0B",
	},
	{
		id: "3",
		label: "Moderately Active",
		description: "Moderate exercise 3-4 days/week",
		icon: Target,
		iconColor: "#10B981",
	},
	{
		id: "4",
		label: "Very Active",
		description: "Hard exercise 5-6 days/week",
		icon: Trophy,
		iconColor: "#3B82F6",
	},
	{
		id: "5",
		label: "Extra Active",
		description: "Physical job or training 2x/day",
		icon: Dumbbell,
		iconColor: "#EF4444",
	},
];

export const ActivityLevelScreen = () => {
	const router = useRouter();
	const { activityLevel, setAnswer, nextStep, currentStep } = useOnboardingStore();

	const selectedId = activityLevel ? String(activityLevel) : null;

	const handleContinue = () => {
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

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
						{/* Icon Header */}
						<View className="mt-4 items-center">
							<View className="h-24 w-24 items-center justify-center rounded-full bg-white shadow-blue-100 shadow-lg">
								<View className="h-16 w-16 items-center justify-center rounded-full bg-blue-50/50">
									<Trophy color="#28B898" fill="#28B898" size={40} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="This helps us calculate your daily metabolic needs."
							title="What is your activity level?"
						/>

						<View className="mt-8">
							<SingleSelectList
								onSelect={(value) =>
									setAnswer("activityLevel", Number(value) as ActivityLevel)
								}
								options={ACTIVITY_OPTIONS}
								selectedId={selectedId}
							/>
						</View>
					</View>
				</ScrollView>

				<View className="pt-6">
					<ContinueButton
						isDisabled={!activityLevel}
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
};
