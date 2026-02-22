import { useRouter } from "expo-router";
import { Brain, Frown, Meh, Smile } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import {
	SingleSelectList,
	type SingleSelectOption,
} from "../common/single-select-list";
import { StepHeader } from "../common/step-header";

const STRESS_OPTIONS: SingleSelectOption[] = [
	{
		id: "low",
		label: "Low",
		description: "Feeling calm and in control",
		icon: Smile,
		iconColor: "#4ADE80",
	}, // Green
	{
		id: "moderate",
		label: "Moderate",
		description: "Typical stress, manageable",
		icon: Meh,
		iconColor: "#FACC15",
	}, // Yellow
	{
		id: "high",
		label: "High",
		description: "Feeling overwhelmed or burnt out",
		icon: Frown,
		iconColor: "#F87171",
	}, // Red
];

export const StressLevelScreen = () => {
	const router = useRouter();
	const { stressLevel, setAnswer, nextStep } = useOnboardingStore();

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/8");
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
						{/* Icon Header */}
						<View className="mt-4 items-center">
							<View className="h-24 w-24 items-center justify-center rounded-full bg-white shadow-blue-100 shadow-lg">
								<View className="h-16 w-16 items-center justify-center rounded-full bg-blue-50/50">
									<Brain color="#28B898" fill="#28B898" size={40} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="Chronic stress is a major barrier to natural healing."
							title="How's your stress?"
						/>

						<View className="mt-8">
							<SingleSelectList
								onSelect={(value) => setAnswer("stressLevel", value)}
								options={STRESS_OPTIONS}
								selectedId={stressLevel ?? null}
							/>
						</View>
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton isDisabled={!stressLevel} onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
};
