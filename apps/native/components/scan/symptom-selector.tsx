import { Button } from "heroui-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface ConcernSelectorProps {
	zone: string;
	onSelect: (feeling: string) => void;
}

// Lifestyle-focused comfort descriptions per body zone
const FEELINGS_BY_ZONE: Record<string, string[]> = {
	head: ["Tension", "Foggy feeling", "Fatigue", "Tightness", "Low focus"],
	chest: [
		"Tightness",
		"Low energy",
		"Shallow breathing",
		"Tension",
		"General unease",
	],
	stomach: ["Bloating", "Unease", "Heaviness", "Sensitivity", "Fullness"],
	back: [
		"Lower back tightness",
		"Upper back tightness",
		"Stiffness",
		"Muscle tension",
		"General soreness",
	],
	arms: ["Stiffness", "Tingling", "Fatigue", "Soreness", "Tightness"],
	legs: ["Soreness", "Heaviness", "Tightness", "Restlessness", "Fatigue"],
};

export function ConcernSelector({ zone, onSelect }: ConcernSelectorProps) {
	const [selected, setSelected] = useState<string | null>(null);
	const feelings = FEELINGS_BY_ZONE[zone] || [];

	const handleSelect = (feeling: string) => {
		setSelected(feeling);
	};

	const handleContinue = () => {
		if (selected) {
			onSelect(selected);
		}
	};

	return (
		<View className="flex-1">
			<ScrollView className="flex-1 p-6">
				<Text className="mb-2 text-muted text-sm uppercase">
					{zone.toUpperCase()}
				</Text>
				<Text className="mb-6 font-bold text-2xl">
					How does this area feel?
				</Text>

				<View className="gap-3">
					{feelings.map((feeling) => (
						<Pressable
							className={`rounded-xl border-2 p-4 ${
								selected === feeling
									? "border-primary bg-primary/10"
									: "border-border bg-card"
							}`}
							key={feeling}
							onPress={() => handleSelect(feeling)}
						>
							<Text
								className={`text-base ${
									selected === feeling ? "font-semibold" : "font-normal"
								}`}
							>
								{feeling}
							</Text>
						</Pressable>
					))}
				</View>
			</ScrollView>

			<View className="border-border border-t p-6">
				<Button
					className="w-full"
					isDisabled={!selected}
					onPress={handleContinue}
					size="lg"
				>
					Continue
				</Button>
			</View>
		</View>
	);
}
