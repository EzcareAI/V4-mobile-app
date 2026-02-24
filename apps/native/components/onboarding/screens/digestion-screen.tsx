import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Lightbulb } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import {
	SingleSelectList,
	type SingleSelectOption,
} from "../common/single-select-list";
import { StepHeader } from "../common/step-header";

const DIGESTION_OPTIONS: SingleSelectOption[] = [
	{
		id: "sensitive",
		label: "Sensitive",
		description:
			"I often experience bloating, discomfort, or reactions to certain foods",
		emoji: "🤢",
		iconColor: "#FB7185",
	},
	{
		id: "normal",
		label: "Normal",
		description:
			"I can eat most foods without major issues, occasional mild discomfort",
		emoji: "😌",
		iconColor: "#3B82F6",
	},
	{
		id: "strong",
		label: "Strong",
		description:
			"I can eat anything without problems, iron stomach, no sensitivities",
		emoji: "🛡️",
		iconColor: "#10B981",
	},
];

export const DigestionScreen = () => {
	const router = useRouter();
	const { digestionSensitivity, setAnswer, nextStep } = useOnboardingStore();

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/16");
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-5">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1 px-1">
						{/* Illustrative Header */}
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
									<Text style={{ fontSize: 48 }}>🤗</Text>
								</LinearGradient>
								{/* Fork/Knife Badge */}
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#FFD43B]"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 16 }}>🍴</Text>
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="This helps us create a personalized meal healing plan for you."
							title="How sensitive is your digestion?"
						/>

						<View className="mt-8">
							<SingleSelectList
								onSelect={(value) => setAnswer("digestionSensitivity", value)}
								options={DIGESTION_OPTIONS}
								selectedId={digestionSensitivity ?? null}
							/>
						</View>

						{/* Why this matters card */}
						<View className="mt-10 rounded-[32px] bg-[#FFFBEB] p-8 shadow-sm">
							<View className="flex-row items-start gap-4">
								<View className="h-12 w-12 items-center justify-center rounded-full bg-amber-100">
									<Lightbulb color="#D97706" size={24} />
								</View>
								<View className="flex-1">
									<Text className="font-bold text-[#92400E] text-lg">
										Why this matters
									</Text>
									<Text className="mt-2 text-[#B45309] text-[16px] leading-6">
										Your digestion sensitivity helps us recommend the right
										foods, timing, and preparation methods to optimize your
										healing journey.
									</Text>
								</View>
							</View>
						</View>
					</View>
				</ScrollView>

				<ContinueButton
						isDisabled={!digestionSensitivity}
						onPress={handleContinue}
					/>
			</View>
		</View>
	);
};
