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

const ALCOHOL_OPTIONS: SingleSelectOption[] = [
	{
		id: "never",
		label: "Never",
		description: "I don't drink alcohol",
		emoji: "🍃",
	},
	{
		id: "occasionally",
		label: "Occasionally",
		description: "A few times per month",
		emoji: "🥂",
	},
	{
		id: "weekly",
		label: "Weekly",
		description: "A few times per week",
		emoji: "🍷",
	},
	{
		id: "often",
		label: "Often",
		description: "Most days",
		emoji: "🍺",
	},
] as const;

export function AlcoholScreen() {
	const router = useRouter();
	const { alcoholFrequency, setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (id: string) => {
		setAnswer(
			"alcoholFrequency",
			id as "never" | "occasionally" | "weekly" | "often"
		);
	};

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/9");
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-5 pb-8">
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
									<Text style={{ fontSize: 48 }}>🥂</Text>
								</LinearGradient>
								{/* Badge */}
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-purple-400"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 14 }}>🧪</Text>
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="This helps us factor recovery, nutrition, and sleep patterns into your plan."
							title="How often do you drink alcohol?"
						/>

						<View className="mt-8">
							<SingleSelectList
								onSelect={handleSelect}
								options={ALCOHOL_OPTIONS}
								selectedId={alcoholFrequency ?? null}
							/>
						</View>
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton
						isDisabled={!alcoholFrequency}
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
}
