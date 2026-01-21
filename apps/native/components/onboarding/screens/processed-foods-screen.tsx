import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Pizza, Salad, Utensils } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

const FREQUENCY_OPTIONS = [
	{
		id: "rarely",
		label: "Rarely",
		desc: "Real, whole foods 90% of the time",
		icon: Salad,
	},
	{
		id: "sometimes",
		label: "Sometimes",
		desc: "Mixed whole foods and processed",
		icon: Utensils,
	},
	{
		id: "often",
		label: "Often",
		desc: "Mostly packaged or fast foods",
		icon: Pizza,
	},
] as const;

export const ProcessedFoodsScreen = () => {
	const router = useRouter();
	const { processedFoodsFrequency, setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (id: (typeof FREQUENCY_OPTIONS)[number]["id"]) => {
		setAnswer("processedFoodsFrequency", id);
	};

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<View>
				<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
					How often do you eat processed foods?
				</Text>
				<Text className="mb-8 text-lg text-muted-foreground">
					This includes packaged snacks, fast food, and refined sugars.
				</Text>

				<View className="gap-y-4">
					{FREQUENCY_OPTIONS.map((option) => (
						<Pressable
							className={`flex-row items-center rounded-3xl border-2 p-6 ${
								processedFoodsFrequency === option.id
									? "border-primary bg-primary/5"
									: "border-secondary/20 bg-card"
							}`}
							key={option.id}
							onPress={() => handleSelect(option.id)}
						>
							<View
								className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
									processedFoodsFrequency === option.id
										? "bg-primary"
										: "bg-secondary/10"
								}`}
							>
								<option.icon
									color={
										processedFoodsFrequency === option.id ? "white" : "#666"
									}
									size={24}
								/>
							</View>
							<View className="flex-1">
								<Text
									className={`font-semibold text-lg ${
										processedFoodsFrequency === option.id
											? "text-primary"
											: "text-foreground"
									}`}
								>
									{option.label}
								</Text>
								<Text className="text-muted-foreground text-sm">
									{option.desc}
								</Text>
							</View>
						</Pressable>
					))}
				</View>
			</View>

			<Button
				className="h-14 rounded-full bg-primary"
				isDisabled={!processedFoodsFrequency}
				onPress={() => {
					nextStep();
					router.push("/(onboarding)/17");
				}}
			>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
