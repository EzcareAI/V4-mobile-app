import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { ShieldAlert, ShieldCheck } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

const DIGESTION_OPTIONS = [
	{
		id: "sensitive",
		label: "Sensitive",
		desc: "Frequent bloating, gas, or discomfort",
		icon: ShieldAlert,
	},
	{
		id: "normal",
		label: "Normal",
		desc: "Generally good, no major issues",
		icon: ShieldCheck,
	},
] as const;

export const DigestionScreen = () => {
	const router = useRouter();
	const { digestionSensitivity, setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (id: (typeof DIGESTION_OPTIONS)[number]["id"]) => {
		setAnswer("digestionSensitivity", id);
	};

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<View>
				<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
					How's your digestion?
				</Text>
				<Text className="mb-8 text-lg text-muted-foreground">
					Gut health is the foundation of overall wellness.
				</Text>

				<View className="gap-y-4">
					{DIGESTION_OPTIONS.map((option) => (
						<Pressable
							className={`flex-row items-center rounded-3xl border-2 p-6 ${
								digestionSensitivity === option.id
									? "border-primary bg-primary/5"
									: "border-secondary/20 bg-card"
							}`}
							key={option.id}
							onPress={() => handleSelect(option.id)}
						>
							<View
								className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
									digestionSensitivity === option.id
										? "bg-primary"
										: "bg-secondary/10"
								}`}
							>
								<option.icon
									color={digestionSensitivity === option.id ? "white" : "#666"}
									size={24}
								/>
							</View>
							<View className="flex-1">
								<Text
									className={`font-semibold text-lg ${
										digestionSensitivity === option.id
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
				isDisabled={!digestionSensitivity}
				onPress={() => {
					nextStep();
					router.push("/(onboarding)/16");
				}}
			>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
