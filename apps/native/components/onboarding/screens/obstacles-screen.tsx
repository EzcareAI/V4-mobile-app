import { useRouter } from "expo-router";
import { Bot, HelpCircle } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";
import { MultiSelectGrid, type MultiSelectOption } from "../multi-select-grid";

const OBSTACLE_OPTIONS: MultiSelectOption[] = [
	{ id: "lack_of_consistency", label: "Lack of consistency", emoji: "📅" },
	{ id: "stress", label: "Stress", emoji: "😥" },
	{ id: "busy_schedule", label: "Busy schedule", emoji: "🕒" },
	{ id: "unhealthy_eating", label: "Unhealthy eating", emoji: "🍔" },
	{ id: "low_motivation", label: "Low motivation", emoji: "🔋" },
	{ id: "cravings", label: "Cravings", emoji: "🍪" },
	{ id: "poor_sleep", label: "Poor sleep routine", emoji: "🛌" },
	{ id: "low_discipline", label: "Low discipline", emoji: "🏋️" },
	{ id: "no_support", label: "No support", emoji: "👥", fullWidth: true },
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

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/13");
	};

	return (
		<View className="flex-1 bg-background">
			<View className="flex-1 justify-between px-5 pb-8">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1 px-1">
						{/* Robot Header */}
						<View className="mt-4 items-center">
							<View className="relative">
								<View
									className="h-28 w-28 items-center justify-center rounded-full bg-white"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 10 },
										shadowOpacity: 0.1,
										shadowRadius: 15,
										elevation: 10,
									}}
								>
									<View className="h-20 w-20 items-center justify-center rounded-full border-4 border-blue-50/50 bg-blue-50/30">
										<Bot color="#00A8A8" size={48} />
									</View>
								</View>
								{/* Question Mark Badge */}
								<View
									className="absolute top-0 -left-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-white"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<HelpCircle color="#00A8A8" size={20} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-8"
							description="Select all that apply"
							title="What's stopping you from reaching your goals?"
						/>

						<View className="mt-10">
							<MultiSelectGrid
								onToggle={handleToggle}
								options={OBSTACLE_OPTIONS}
								selectedIds={obstacles}
								// variant="bottom-center"
							/>
						</View>
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton
						isDisabled={obstacles.length === 0}
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
};
