import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { MultiSelectGrid, type MultiSelectOption } from "../multi-select-grid";

const SYMPTOM_OPTIONS: MultiSelectOption[] = [
	{ id: "bloating", label: "Bloating", emoji: "🎈" },
	{ id: "poor_digestion", label: "Poor digestion", emoji: "🤢" },
	{ id: "low_energy", label: "Low energy", emoji: "🔋" },
	{ id: "brain_fog", label: "Brain fog", emoji: "🌫️" },
	{ id: "anxiety", label: "Anxiety", emoji: "😰" },
	{ id: "poor_sleep", label: "Poor sleep", emoji: "😴" },
	{ id: "joint_pain", label: "Joint pain", emoji: "🦶" },
	{ id: "skin_issues", label: "Skin issues", emoji: "🧴" },
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

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<MultiSelectGrid
				onToggle={handleToggle}
				options={SYMPTOM_OPTIONS}
				selectedIds={symptoms}
				subtitle="Select all that apply to help us understand your baseline."
				title="Do you deal with any of these?"
			/>

			<Button
				className="mt-4 h-14 rounded-full bg-primary"
				isDisabled={symptoms.length === 0}
				onPress={() => {
					nextStep();
					router.push("/(onboarding)/9");
				}}
			>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
