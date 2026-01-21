import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { MultiSelectGrid, type MultiSelectOption } from "../multi-select-grid";

const CRAVING_OPTIONS: MultiSelectOption[] = [
	{ id: "sugar", label: "Sweets & Sugars", emoji: "🍭" },
	{ id: "salt", label: "Salty & Savory", emoji: "🍟" },
	{ id: "carbs", label: "Bread & Carbs", emoji: "🍞" },
	{ id: "caffeine", label: "Caffeine", emoji: "☕" },
	{ id: "dairy", label: "Cheese & Dairy", emoji: "🧀" },
	{ id: "alcohol", label: "Alcohol", emoji: "🍷" },
];

export const CravingsScreen = () => {
	const router = useRouter();
	const { cravings, setAnswer, nextStep } = useOnboardingStore();

	const handleToggle = (id: string) => {
		const newCravings = cravings.includes(id)
			? cravings.filter((c) => c !== id)
			: [...cravings, id];
		setAnswer("cravings", newCravings);
	};

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<MultiSelectGrid
				onToggle={handleToggle}
				options={CRAVING_OPTIONS}
				selectedIds={cravings}
				subtitle="Cravings can indicate specific nutrient deficiencies."
				title="Any recurring cravings?"
			/>

			<Button
				className="mt-4 h-14 rounded-full bg-primary"
				isDisabled={cravings.length === 0}
				onPress={() => {
					nextStep();
					router.push("/(onboarding)/18");
				}}
			>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
