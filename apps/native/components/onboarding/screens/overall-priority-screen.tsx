import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
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
		description: "Fewer bloating & digestive concerns",
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
	const { overallPriority, setAnswer, nextStep, scanMode, currentStep } =
		useOnboardingStore();

	const handleContinue = () => {
		nextStep();
		if (scanMode !== "home") {
			router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
		}
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
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
									colors={["#4FD1C5", "#28B898"]}
									start={{ x: 0, y: 0 }}
									style={{
										height: 112,
										width: 112,
										borderRadius: 56,
										alignItems: "center",
										justifyContent: "center",
										shadowColor: "#28B898",
										shadowOffset: { width: 0, height: 10 },
										shadowOpacity: 0.2,
										shadowRadius: 15,
										elevation: 10,
									}}
								>
									<Text style={{ fontSize: 48 }}>🌟</Text>
								</LinearGradient>
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-green-400"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 14 }}>🌱</Text>
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="We'll focus your plan on this priority while keeping your overall wellness on track."
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

				<View className="pt-6">
					<ContinueButton
						isDisabled={!overallPriority}
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
}
