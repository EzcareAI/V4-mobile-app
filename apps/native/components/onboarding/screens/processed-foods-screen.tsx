import { useRouter } from "expo-router";
import { Pizza, Salad, TrendingUp, Utensils } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import {
	type OnboardingState,
	useOnboardingStore,
} from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { SingleSelectList } from "../common/single-select-list";
import { StepHeader } from "../common/step-header";

const FREQUENCY_OPTIONS = [
	{
		id: "rarely",
		label: "Rarely",
		description:
			"I mostly eat whole foods, fresh ingredients, and home-cooked meals",
		icon: Salad,
		iconColor: "#10B981",
	},
	{
		id: "sometimes",
		label: "Sometimes",
		description:
			"I have a balanced mix of fresh foods and some packaged/convenience items",
		icon: Utensils,
		iconColor: "#F59E0B",
	},
	{
		id: "often",
		label: "Often",
		description:
			"I frequently eat packaged foods, takeout, and convenience meals",
		icon: Pizza,
		iconColor: "#EF4444",
	},
] as const;

export const ProcessedFoodsScreen = () => {
	const router = useRouter();
	const { processedFoodsFrequency, setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (id: string) => {
		setAnswer(
			"processedFoodsFrequency",
			id as OnboardingState["processedFoodsFrequency"]
		);
	};

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/17");
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
									<Utensils color="#28B898" fill="#28B898" size={40} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="This includes packaged snacks, fast food, and refined sugars."
							title="How often do you eat processed foods?"
						/>

						<View className="mt-8">
							<SingleSelectList
								onSelect={handleSelect}
								options={FREQUENCY_OPTIONS}
								selectedId={processedFoodsFrequency ?? null}
							/>
						</View>

						{/* Wellness Score Impact */}
						<View className="mt-10 flex-row items-start rounded-[32px] border border-indigo-50/50 bg-[#F8FAFF] p-6">
							<View className="mr-4 rounded-2xl bg-[#FFF4E5] p-3.5">
								<TrendingUp color="#818CF8" size={22} />
							</View>
							<View className="flex-1">
								<Text className="font-bold text-[#0d2137] text-[17px] leading-6">
									Wellness Score Impact
								</Text>
								<Text className="mt-1 text-[#73808C] text-[14px] leading-[22px]">
									Understanding your current eating patterns helps us create
									realistic goals and track meaningful improvements in your
									health journey.
								</Text>
							</View>
						</View>
					</View>
				</ScrollView>

				<View className="pt-6">
					<ContinueButton
						isDisabled={!processedFoodsFrequency}
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
};
