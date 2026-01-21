import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { MultiSelectGrid, type MultiSelectOption } from "../multi-select-grid";

const OBSTACLE_OPTIONS: MultiSelectOption[] = [
	{ id: "lack_of_time", label: "Lack of time", emoji: "⏰" },
	{ id: "picky_eater", label: "Picky eater", emoji: "🥦" },
	{ id: "stress", label: "Stress", emoji: "🤯" },
	{ id: "cravings", label: "Cravings", emoji: "🍩" },
	{ id: "low_motivation", label: "Low motivation", emoji: "📉" },
	{ id: "cost", label: "Cost", emoji: "💰" },
];

export const ObstaclesScreen = () => {
	const router = useRouter();
	const { obstacles, setAnswer, nextStep } = useOnboardingStore();

	const handleToggle = (id: string) => {
		const newObstacles = obstacles.includes(id)
			? obstacles.filter((o) => o !== id)
			: [...obstacles, id];
		setAnswer("obstacles", newObstacles);
	};

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<MultiSelectGrid
				onToggle={handleToggle}
				options={OBSTACLE_OPTIONS}
				selectedIds={obstacles}
				subtitle="Identifying obstacles is the first step to overcoming them."
				title="What's holding you back?"
			/>

			<Button
				className="mt-4 h-14 rounded-full bg-primary"
				isDisabled={obstacles.length === 0}
				onPress={() => {
					nextStep();
					router.push("/(onboarding)/13");
				}}
			>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
