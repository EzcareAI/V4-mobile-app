import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Frown, Meh, Smile } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
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
	const { stressLevel, setAnswer, nextStep, currentStep } =
		useOnboardingStore();

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
									<Text style={{ fontSize: 48 }}>🧠</Text>
								</LinearGradient>
								{/* Badge */}
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-amber-400"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 14 }}>⚡</Text>
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

				<View className="pt-6">
					<ContinueButton isDisabled={!stressLevel} onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
};
