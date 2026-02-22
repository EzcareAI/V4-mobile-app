import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import {
	SingleSelectList,
	type SingleSelectOption,
} from "../common/single-select-list";
import { StepHeader } from "../common/step-header";

const DIET_OPTIONS: SingleSelectOption[] = [
	{
		id: "classic",
		label: "Classic",
		description: "Balanced omnivore diet",
		emoji: "🍴",
	},
	{
		id: "vegetarian",
		label: "Vegetarian",
		description: "No meat, includes dairy & eggs",
		emoji: "🥬",
	},
	{ id: "vegan", label: "Vegan", description: "Plant-based only", emoji: "🌱" },
	{
		id: "pescatarian",
		label: "Pescatarian",
		description: "Fish & seafood included",
		emoji: "🐟",
	},
	{
		id: "gluten_free",
		label: "Gluten-free",
		description: "No wheat, barley, or rye",
		emoji: "🌾",
	},
	{
		id: "carnivore",
		label: "Carnivore",
		description: "Animal products only",
		emoji: "🥩",
	},
	{
		id: "mediterranean",
		label: "Mediterranean",
		description: "Olive oil, fish, whole grains",
		emoji: "🫒",
	},
	{
		id: "keto",
		label: "Keto-ish",
		description: "Low carb, high fat",
		emoji: "🥑",
	},
];

export const DietTypeScreen = () => {
	const router = useRouter();
	const { dietType, setAnswer, nextStep } = useOnboardingStore();

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/14");
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-5 pb-8">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1 px-1">
						{/* Mascot Header */}
						<View className="mt-4 items-center">
							<View className="relative">
								<LinearGradient
									colors={["#4FD1C5", "#28B898"]}
									start={{ x: 0, y: 0 }}
									style={{
										height: 112,
										width: 112,
										borderRadius: 56,
										alignItems: "center",
										justifyContent: "center",
										shadowColor: "#28B898",
										shadowOffset: { width: 0, height: 10 },
										shadowOpacity: 0.2,
										shadowRadius: 15,
										elevation: 10,
									}}
								>
									<Text style={{ fontSize: 48 }}>🥗</Text>
								</LinearGradient>
								{/* Badge */}
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-green-400"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 14 }}>🌱</Text>
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="We'll tailor your meal plans to your preference."
							title="What's your current diet?"
						/>

						<View className="mt-8">
							<SingleSelectList
								onSelect={(value) => setAnswer("dietType", value)}
								options={DIET_OPTIONS}
								selectedId={dietType ?? null}
							/>
						</View>
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton isDisabled={!dietType} onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
};
