import { useRouter } from "expo-router";
import { Button, RadioGroup } from "heroui-native";
import {
	EyeOff,
	type LucideIcon,
	User,
	UserPlus,
	Users,
} from "lucide-react-native";
import { Text, View } from "react-native";
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

				<RadioGroup
					className="gap-y-4"
					onValueChange={(value) => setAnswer("gender", value as Gender)}
					value={gender}
				>
					{GENDER_OPTIONS.map((option) => (
						<RadioGroup.Item
							className="flex-row items-center rounded-3xl border-2 p-4 data-[checked=false]:border-secondary/20 data-[checked=true]:border-primary data-[checked=false]:bg-card data-[checked=true]:bg-primary/5"
							key={option.id}
							value={option.id}
						>
							{({ isSelected }) => (
								<>
									<View
										className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
											isSelected ? "bg-primary" : "bg-secondary/10"
										}`}
									>
										<option.icon
											color={isSelected ? "white" : "#666"}
											size={24}
										/>
									</View>
									<RadioGroup.Label
										className={`font-semibold text-lg ${
											isSelected ? "text-primary" : "text-foreground"
										}`}
									>
										{option.label}
									</RadioGroup.Label>
									<RadioGroup.Indicator className="ml-auto">
										<RadioGroup.IndicatorThumb />
									</RadioGroup.Indicator>
								</>
							)}
						</RadioGroup.Item>
					))}
				</RadioGroup>
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
