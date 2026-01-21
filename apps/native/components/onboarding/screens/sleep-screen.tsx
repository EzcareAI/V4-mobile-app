import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

const EMOJIS = ["😴", "😌", "😐", "😫", "😭"];
const LABELS = ["Excellent", "Good", "Fair", "Poor", "Very Poor"];

export const SleepScreen = () => {
	const router = useRouter();
	const { sleepQuality, setAnswer, nextStep } = useOnboardingStore();
	const [value, setValue] = useState(sleepQuality || 3);

	const handleContinue = () => {
		setAnswer("sleepQuality", value);
		nextStep();
		router.push("/(onboarding)/7");
	};

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<View>
				<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
					How's your sleep?
				</Text>
				<Text className="mb-12 text-lg text-muted-foreground">
					Quality rest is vital for natural healing.
				</Text>

				<View className="items-center rounded-3xl border-2 border-secondary/10 bg-card py-8">
					<Text className="mb-4 text-6xl">{EMOJIS[value - 1]}</Text>
					<Text className="mb-8 font-bold text-2xl text-primary">
						{LABELS[value - 1]}
					</Text>
					<View className="w-full flex-row items-center gap-x-2 px-8">
						{[1, 2, 3, 4, 5].map((i) => (
							<Pressable
								className={`h-3 flex-1 rounded-full ${value >= i ? "bg-primary" : "bg-secondary/20"}`}
								key={i}
								onPress={() => setValue(i)}
							/>
						))}
					</View>
					<View className="mt-2 w-full flex-row justify-between px-8">
						<Text className="text-muted-foreground text-xs">1</Text>
						<Text className="text-muted-foreground text-xs">5</Text>
					</View>
				</View>
				<View className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-4">
					<Text className="mb-1 font-bold text-primary">Did you know?</Text>
					<Text className="text-muted-foreground text-sm leading-5">
						Consistent sleep improves glucose metabolism and reduces
						inflammation by up to 30%.
					</Text>
				</View>
			</View>
			<Button className="h-14 rounded-full bg-primary" onPress={handleContinue}>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
