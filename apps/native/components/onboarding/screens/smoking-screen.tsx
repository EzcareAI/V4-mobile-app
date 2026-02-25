import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { SingleSelectList } from "../common/single-select-list";
import { StepHeader } from "../common/step-header";

const SMOKING_OPTIONS = [
	{
		id: "never",
		label: "Non-Smoker",
		description: "I prefer clean air and lungs",
		emoji: "🍃",
	},
	{
		id: "occasionally",
		label: "Socially",
		description: "A few times per week",
		emoji: "💨",
	},
	{
		id: "regularly",
		label: "Regularly",
		description: "Daily or most days",
		emoji: "🚬",
	},
] as const;

export function SmokingScreen() {
	const router = useRouter();
	const { smokingFrequency, setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (id: string) => {
		setAnswer("smokingFrequency", id as "never" | "occasionally" | "regularly");
	};

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/8");
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
									<Text style={{ fontSize: 48 }}>🍃</Text>
								</LinearGradient>
								{/* Badge */}
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-rose-400"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 14 }}>🚬</Text>
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="Smoking impacts cardiovascular efficiency and cellular oxygenation levels."
							title="Do you smoke?"
						/>

						<View className="mt-8">
							<SingleSelectList
								onSelect={handleSelect}
								options={SMOKING_OPTIONS}
								selectedId={smokingFrequency || null}
							/>
						</View>
					</View>
				</ScrollView>

				<View className="pt-6">
					<ContinueButton
						isDisabled={!smokingFrequency}
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
}
