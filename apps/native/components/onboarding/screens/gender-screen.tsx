import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import {
	EyeOff,
	type LucideIcon,
	User,
	UserPlus,
	Users,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { type Gender, useOnboardingStore } from "@/stores/onboarding-store";

interface Option {
	id: Gender;
	label: string;
	icon: LucideIcon;
}

const GENDER_OPTIONS: Option[] = [
	{ id: "male", label: "Male", icon: User },
	{ id: "female", label: "Female", icon: UserPlus },
	{ id: "other", label: "Other", icon: Users },
	{ id: "prefer_not_to_say", label: "Prefer not to say", icon: EyeOff },
];

export const GenderScreen = () => {
	const router = useRouter();
	const { gender, setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (id: Gender) => {
		setAnswer("gender", id);
	};

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/2");
	};

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<View>
				<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
					What is your gender?
				</Text>
				<Text className="mb-8 text-lg text-muted-foreground">
					This helps us personalize recommendations for your biology.
				</Text>

				<View className="gap-y-4">
					{GENDER_OPTIONS.map((option) => (
						<Pressable
							className={`flex-row items-center rounded-3xl border-2 p-4 ${
								gender === option.id
									? "border-primary bg-primary/5"
									: "border-secondary/20 bg-card"
							}`}
							key={option.id}
							onPress={() => handleSelect(option.id)}
						>
							<View
								className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
									gender === option.id ? "bg-primary" : "bg-secondary/10"
								}`}
							>
								<option.icon
									color={gender === option.id ? "white" : "#666"}
									size={24}
								/>
							</View>
							<Text
								className={`font-semibold text-lg ${
									gender === option.id ? "text-primary" : "text-foreground"
								}`}
							>
								{option.label}
							</Text>
							<View
								className={`ml-auto h-6 w-6 items-center justify-center rounded-full border-2 ${
									gender === option.id
										? "border-primary bg-primary"
										: "border-secondary/20"
								}`}
							>
								{gender === option.id && (
									<View className="h-2 w-2 rounded-full bg-white" />
								)}
							</View>
						</Pressable>
					))}
				</View>
			</View>

			<Button
				className="h-14 rounded-full bg-primary"
				isDisabled={!gender}
				onPress={handleContinue}
			>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
