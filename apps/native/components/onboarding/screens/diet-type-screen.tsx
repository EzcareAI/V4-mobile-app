import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

const DIET_OPTIONS = [
	{ id: "anything", label: "I eat anything", emoji: "🍽️" },
	{ id: "pescatarian", label: "Pescatarian", emoji: "🐟" },
	{ id: "vegetarian", label: "Vegetarian", emoji: "🥚" },
	{ id: "vegan", label: "Vegan", emoji: "🌿" },
	{ id: "keto", label: "Keto / Low Carb", emoji: "🥩" },
];

export const DietTypeScreen = () => {
	const router = useRouter();
	const { dietType, setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (id: string) => {
		setAnswer("dietType", id);
	};

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<ScrollView showsVerticalScrollIndicator={false}>
				<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
					What's your current diet?
				</Text>
				<Text className="mb-8 text-lg text-muted-foreground">
					We'll tailor your meal plans to your preference.
				</Text>

				<View className="mb-4 gap-y-4">
					{DIET_OPTIONS.map((option) => (
						<Pressable
							className={`h-20 flex-row items-center rounded-3xl border-2 p-4 ${
								dietType === option.id
									? "border-primary bg-primary/5"
									: "border-secondary/20 bg-card"
							}`}
							key={option.id}
							onPress={() => handleSelect(option.id)}
						>
							<View
								className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
									dietType === option.id ? "bg-primary" : "bg-secondary/10"
								}`}
							>
								<Text className="text-2xl">{option.emoji}</Text>
							</View>
							<Text
								className={`flex-1 font-semibold text-lg ${
									dietType === option.id ? "text-primary" : "text-foreground"
								}`}
							>
								{option.label}
							</Text>

							<View
								className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
									dietType === option.id
										? "border-primary bg-primary"
										: "border-secondary/20"
								}`}
							>
								{dietType === option.id && (
									<View className="h-2 w-2 rounded-full bg-white" />
								)}
							</View>
						</Pressable>
					))}
				</View>
			</ScrollView>

			<Button
				className="h-14 rounded-full bg-primary"
				isDisabled={!dietType}
				onPress={() => {
					nextStep();
					router.push("/(onboarding)/14");
				}}
			>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
