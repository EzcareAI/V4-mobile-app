import { useRouter } from "expo-router";
import { CircleDot, Mars, Venus } from "lucide-react-native";
import { View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import {
	SingleSelectList,
	type SingleSelectOption,
} from "../common/single-select-list";
import { StepHeader } from "../common/step-header";

const GENDER_OPTIONS: SingleSelectOption[] = [
	{
		id: "female",
		label: "Female",
		description: "Tailored for women's health",
		icon: Venus,
		iconColor: "#FF8099",
	},
	{
		id: "male",
		label: "Male",
		description: "Tailored for men's health",
		icon: Mars,
		iconColor: "#66B3FF",
	},
	{
		id: "other",
		label: "Other / Prefer not to say",
		description: "Personalized approach",
		icon: CircleDot,
		iconColor: "#B388FF",
	},
];

export const GenderScreen = () => {
	const router = useRouter();
	const { gender, setAnswer, nextStep } = useOnboardingStore();

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/2");
	};

	return (
		<View className="flex-1 justify-between bg-background px-6 py-8">
			<View>
				<StepHeader
					description="This helps us personalize recommendations for your biology."
					title="What is your gender?"
				/>
				<SingleSelectList
					onSelect={(value) => setAnswer("gender", value)}
					options={GENDER_OPTIONS}
					selectedId={gender ?? null}
				/>
			</View>

			<ContinueButton isDisabled={!gender} onPress={handleContinue} />
		</View>
	);
};
