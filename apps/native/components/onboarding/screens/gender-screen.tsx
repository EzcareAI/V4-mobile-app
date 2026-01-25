import { useRouter } from "expo-router";
import { CircleDot, Mars, Venus } from "lucide-react-native";
import { ScrollView, View } from "react-native";
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
		<View className="flex-1 bg-background">
			<View className="flex-1 justify-between px-5 pb-8">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1">
						{/* Icon Header */}
						<View className="mt-4 items-center">
							<View className="h-24 w-24 items-center justify-center rounded-full bg-white shadow-blue-100 shadow-lg">
								<View className="h-16 w-16 items-center justify-center rounded-full bg-blue-50/50">
									<CircleDot color="#3BAFDA" fill="#3BAFDA" size={40} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="This helps us personalize recommendations for your biology."
							title="What is your gender?"
						/>
						<View className="mt-8 px-1">
							<SingleSelectList
								onSelect={(value) => setAnswer("gender", value)}
								options={GENDER_OPTIONS}
								selectedId={gender ?? null}
							/>
						</View>
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton isDisabled={!gender} onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
};
