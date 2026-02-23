import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { THEME } from "@/lib/theme";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import {
	SingleSelectList,
	type SingleSelectOption,
} from "../common/single-select-list";
import { StepHeader } from "../common/step-header";

const PRIORITY_OPTIONS: SingleSelectOption[] = [
	{
		id: "energy",
		label: "More Energy",
		description: "Feel less tired & sluggish throughout the day",
		emoji: "🔋",
	},
	{
		id: "digestion",
		label: "Better Digestion",
		description: "Fewer bloating & digestive discomforts",
		emoji: "🫘",
	},
	{
		id: "sleep",
		label: "Better Sleep",
		description: "Deeper, more restful, uninterrupted sleep",
		emoji: "😴",
	},
	{
		id: "stress",
		label: "Reduce Stress",
		description: "Less anxiety, tension & mental fatigue",
		emoji: "💆",
	},
	{
		id: "weight",
		label: "Manage Weight",
		description: "Feel more comfortable and confident",
		emoji: "⚖️",
	},
];

export function OverallPriorityScreen() {
	const router = useRouter();
	const { overallPriority, setAnswer, nextStep } = useOnboardingStore();

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/15");
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-5 pb-8">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1 px-1">
						{/* Mascot Header */}
						<View className="mt-4 items-center">
							<View className="relative">
								<LinearGradient
									colors={THEME.accentGradient}
									start={{ x: 0, y: 0 }}
									style={{
										height: 112,
										width: 112,
										borderRadius: 56,
										alignItems: "center",
										justifyContent: "center",
										shadowColor: THEME.accentShadow,
										shadowOffset: { width: 0, height: 10 },
										shadowOpacity: 0.2,
										shadowRadius: 15,
										elevation: 10,
									}}
								>
									{/* This inner LinearGradient seems redundant based on the instruction's replacement.
									    The instruction implies a single LinearGradient for the background and then the emoji.
									    I'm removing the inner one as per the provided replacement structure. */}
								</LinearGradient>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="We'll focus your plan on this priority while keeping your overall health on track."
							title="What matters most?"
						/>

						<View className="mt-6">
							<SingleSelectList
								onSelect={(id) => {
									setAnswer(
										"overallPriority",
										id as "energy" | "sleep" | "digestion" | "stress" | "weight"
									);
								}}
								options={PRIORITY_OPTIONS}
								selectedId={overallPriority ?? null}
							/>
						</View>
					</View>
				</ScrollView>

				<SafeAreaView edges={["bottom"]}>
					<View className="pt-4">
						<ContinueButton
							isDisabled={!overallPriority}
							onPress={handleContinue}
						/>
					</View>
				</SafeAreaView>
			</View>
		</View>
	);
}
