import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import {
	MultiSelectList,
	type MultiSelectOption,
} from "../common/multi-select-list";
import { StepHeader } from "../common/step-header";

const CONDITION_OPTIONS: MultiSelectOption[] = [
	{ id: "none", label: "No conditions", emoji: "✅" },
	{ id: "diabetes", label: "Diabetes", emoji: "🩺" },
	{ id: "hypertension", label: "High blood pressure", emoji: "❤️" },
	{ id: "arthritis", label: "Arthritis", emoji: "🦴" },
	{ id: "thyroid", label: "Thyroid issues", emoji: "🧬" },
	{ id: "ibs", label: "IBS / IBD", emoji: "🫘" },
	{ id: "depression", label: "Depression / Anxiety", emoji: "🧠" },
];

export function HealthConditionsScreen() {
	const router = useRouter();
	const { healthConditions, setAnswer, nextStep } = useOnboardingStore();

	const handleToggle = (id: string) => {
		if (id === "none") {
			setAnswer("healthConditions", ["none"]);
			return;
		}

		let current = healthConditions || [];

		// If "none" was selected, clear it out when selecting a real condition
		if (current.includes("none")) {
			current = [];
		}

		if (current.includes(id)) {
			setAnswer(
				"healthConditions",
				current.filter((item) => item !== id)
			);
		} else {
			setAnswer("healthConditions", [...current, id]);
		}
	};

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/13");
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
									<Text style={{ fontSize: 48 }}>🩺</Text>
								</LinearGradient>
								{/* Badge */}
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-red-400"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 14 }}>❤️</Text>
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="Select the one that applies most. This helps us tailor your healing plan safely."
							title="Any existing health conditions?"
						/>

						<View className="mt-8">
							<MultiSelectList
								onToggle={handleToggle}
								options={CONDITION_OPTIONS}
								selectedIds={healthConditions || []}
							/>
						</View>
					</View>
				</ScrollView>

				<ContinueButton
					isDisabled={!healthConditions || healthConditions.length === 0}
					onPress={handleContinue}
				/>
			</View>
		</View>
	);
}
