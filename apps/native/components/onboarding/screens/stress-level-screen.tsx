import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Frown, Meh, Smile } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

const STRESS_OPTIONS = [
	{ id: "low", label: "Low", desc: "Feeling calm and in control", icon: Smile },
	{
		id: "moderate",
		label: "Moderate",
		desc: "Typical stress, manageable",
		icon: Meh,
	},
	{
		id: "high",
		label: "High",
		desc: "Feeling overwhelmed or burnt out",
		icon: Frown,
	},
] as const;

export const StressLevelScreen = () => {
	const router = useRouter();
	const { stressLevel, setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (id: (typeof STRESS_OPTIONS)[number]["id"]) => {
		setAnswer("stressLevel", id);
	};

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<View>
				<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
					How's your stress?
				</Text>
				<Text className="mb-8 text-lg text-muted-foreground">
					Chronic stress is a major barrier to natural healing.
				</Text>

				<View className="gap-y-4">
					{STRESS_OPTIONS.map((option) => (
						<Pressable
							className={`flex-row items-center rounded-3xl border-2 p-4 ${
								stressLevel === option.id
									? "border-primary bg-primary/5"
									: "border-secondary/20 bg-card"
							}`}
							key={option.id}
							onPress={() => handleSelect(option.id)}
						>
							<View
								className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
									stressLevel === option.id ? "bg-primary" : "bg-secondary/10"
								}`}
							>
								<option.icon
									color={stressLevel === option.id ? "white" : "#666"}
									size={24}
								/>
							</View>
							<View className="flex-1">
								<Text
									className={`font-semibold text-lg ${
										stressLevel === option.id
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
				isDisabled={!stressLevel}
				onPress={() => {
					nextStep();
					router.push("/(onboarding)/8");
				}}
			>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
