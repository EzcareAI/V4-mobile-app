import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
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
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-5">
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
									<Text style={{ fontSize: 48 }}>🤔</Text>
								</LinearGradient>
								{/* Badge */}
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-orange-400"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 14 }}>❓</Text>
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

				<ContinueButton
						isDisabled={obstacles.length === 0}
						onPress={handleContinue}
					/>
			</View>
		</View>
	);
};
