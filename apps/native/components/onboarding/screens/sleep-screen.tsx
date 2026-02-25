import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Moon } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { THEME } from "@/lib/theme";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import {
	SingleSelectList,
	type SingleSelectOption,
} from "../common/single-select-list";
import { StepHeader } from "../common/step-header";

const SLEEP_OPTIONS: SingleSelectOption[] = [
	{
		id: "1",
		label: "Very Poor",
		description: "Constant trouble falling or staying asleep",
		emoji: "😢",
	},
	{
		id: "2",
		label: "Poor",
		description: "Often restless or waking through the night",
		emoji: "🙁",
	},
	{
		id: "3",
		label: "Fair",
		description: "Inconsistent — some good nights, some bad",
		emoji: "😐",
	},
	{
		id: "4",
		label: "Good",
		description: "Usually rested, occasional off nights",
		emoji: "😊",
	},
	{
		id: "5",
		label: "Excellent",
		description: "Consistently deep, uninterrupted sleep",
		emoji: "😁",
	},
];

export const SleepScreen = () => {
	const router = useRouter();
	const { sleepQuality, setAnswer, nextStep } = useOnboardingStore();

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/7");
	};

	const selectedId = sleepQuality ? String(sleepQuality) : null;

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
				{/* ── Scrollable content ──────────────────────────────────────── */}
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
					showsVerticalScrollIndicator={false}
				>
					{/* Mascot Header */}
					<View className="mt-4 items-center">
						<View className="relative">
							<LinearGradient
								colors={THEME.accentGradient}
								start={{ x: 0, y: 0 }}
								style={{
									height: 112,
									width: 112,
									borderRadius: 56,
									alignItems: "center",
									justifyContent: "center",
									shadowColor: THEME.accentShadow,
									shadowOffset: { width: 0, height: 10 },
									shadowOpacity: 0.25,
									shadowRadius: 15,
									elevation: 10,
								}}
							>
								<Moon color="white" fill="white" size={52} />
							</LinearGradient>
							{/* Badge */}
							<View
								className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white"
								style={{
									backgroundColor: THEME.accentLight,
									shadowColor: "#000",
									shadowOffset: { width: 0, height: 4 },
									shadowOpacity: 0.1,
									shadowRadius: 5,
									elevation: 5,
								}}
							>
								<Moon color="white" fill="white" size={14} />
							</View>
						</View>
					</View>

					<StepHeader
						align="center"
						className="mt-6"
						description="Quality sleep is the foundation of natural healing and energy recovery."
						title="How would you rate your sleep?"
					/>

					<View className="mt-6">
						<SingleSelectList
							onSelect={(id) => setAnswer("sleepQuality", Number(id))}
							options={SLEEP_OPTIONS}
							selectedId={selectedId}
						/>
					</View>
				</ScrollView>

				{/* ── Docked Continue Button (never scrolls away) ─────────────── */}
				
					<View className="pt-6">
						<ContinueButton
							isDisabled={!sleepQuality}
							onPress={handleContinue}
						/>
					</View>
				
			</View>
		</View>
	);
};
