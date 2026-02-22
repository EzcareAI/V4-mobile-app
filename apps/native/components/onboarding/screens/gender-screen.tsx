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
			<View className="flex-1 justify-between px-6 pb-10">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1">
						{/* Multi-layered Premium Icon Header */}
						<View className="mt-8 items-center">
							<View className="relative h-28 w-28 items-center justify-center">
								{/* Outer glow/shadow layer */}
								<View className="absolute inset-0 rounded-[40px] bg-[#3BAFDA]/10" />
								{/* Middle layer */}
								<View className="h-full w-full items-center justify-center rounded-[36px] bg-white shadow-blue-200 shadow-xl">
									{/* Inner container */}
									<View className="h-20 w-20 items-center justify-center rounded-[28px] bg-blue-50/80">
										<CircleDot color="#3BAFDA" fill="#3BAFDA" size={44} />
									</View>
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-8"
							description="This helps us personalize recommendations for your biology and health profile."
							title="What is your gender?"
						/>
						<View className="mt-4">
							<SingleSelectList
								onSelect={(value) => setAnswer("gender", value)}
								options={GENDER_OPTIONS}
								selectedId={gender ?? null}
							/>
						</View>
					</View>
				</ScrollView>

				<View className="pt-6">
					<ContinueButton isDisabled={!gender} onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
};
