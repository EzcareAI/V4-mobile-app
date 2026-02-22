import { useRouter } from "expo-router";
import { Leaf, Search, Stethoscope } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";
import { MultiSelectGrid, type MultiSelectOption } from "../multi-select-grid";

const SYMPTOM_OPTIONS: MultiSelectOption[] = [
	{ id: "bloating", label: "Bloating", emoji: "🟠" },
	{ id: "poor_digestion", label: "Poor digestion", emoji: "🍱" },
	{ id: "low_energy", label: "Low energy", emoji: "🔋" },
	{ id: "brain_fog", label: "Brain fog", emoji: "☁️" },
	{ id: "anxiety", label: "Anxiety / stress", emoji: "💖" },
	{ id: "poor_sleep", label: "Poor sleep", emoji: "🌙" },
	{ id: "joint_pain", label: "Joint pain", emoji: "🦴" },
	{ id: "skin_issues", label: "Skin issues", emoji: "🧴" },
	{ id: "inflammation", label: "Inflammation", emoji: "🔥" },
	{ id: "weight_issues", label: "Weight issues", emoji: "⚖️" },
];

export const SymptomsScreen = () => {
	const router = useRouter();
	const { symptoms, setAnswer, nextStep } = useOnboardingStore();

	const handleToggle = (id: string) => {
		const newSymptoms = symptoms.includes(id)
			? symptoms.filter((s) => s !== id)
			: [...symptoms, id];
		setAnswer("symptoms", newSymptoms);
	};

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/9");
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
					<View className="flex-1 px-1">
						{/* Stethoscope Header with Search Badge */}
						<View className="mt-4 items-center">
							<View className="relative">
								<View
									className="h-28 w-28 items-center justify-center rounded-full bg-white"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 10 },
										shadowOpacity: 0.1,
										shadowRadius: 15,
										elevation: 10,
									}}
								>
									<View className="h-20 w-20 items-center justify-center rounded-full border-4 border-[#2DE2E2]/10 bg-blue-50/30">
										<Stethoscope color="#00A8A8" size={48} />
									</View>
								</View>
								{/* Search Badge */}
								<View
									className="absolute -right-1 bottom-1 h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#00BFA5]"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.2,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Search color="white" size={24} strokeWidth={3} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-8"
							description="Select all that apply to personalize your natural healing plan"
							title="What symptoms are you currently experiencing?"
						/>

						<View className="mt-10">
							<MultiSelectGrid
								onToggle={handleToggle}
								options={SYMPTOM_OPTIONS}
								selectedIds={symptoms}
							/>
						</View>

						{/* Selection Counter */}
						{symptoms.length > 0 && (
							<View className="mt-8 items-center">
								<Text className="font-bold text-base text-muted">
									<Text className="text-[#2DE2E2]">{symptoms.length}</Text>{" "}
									symptoms selected
								</Text>
							</View>
						)}

						{/* Natural Approach Card */}
						{symptoms.length > 0 && (
							<View className="mt-10 mb-6 rounded-[32px] bg-[#E8F8F5] p-6 shadow-sm">
								<View className="flex-row items-center gap-4">
									<View
										className="h-12 w-12 items-center justify-center rounded-full bg-white"
										style={{
											shadowColor: "#000",
											shadowOffset: { width: 0, height: 4 },
											shadowOpacity: 0.15,
											shadowRadius: 6,
											elevation: 4,
										}}
									>
										<Leaf color="#2DE2E2" fill="#2DE2E2" size={24} />
									</View>
									<View className="flex-1">
										<Text className="font-bold text-[#0d2137] text-lg">
											Natural approach:
										</Text>
										<Text className="mt-1 text-ezcare-slate text-sm leading-5">
											We'll create a personalized plan using nutrition, herbs,
											and lifestyle changes to address your specific symptoms.
										</Text>
									</View>
								</View>
							</View>
						)}
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton
						isDisabled={symptoms.length === 0}
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
};
