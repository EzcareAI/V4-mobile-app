import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OverallBlockerScreen } from "@/components/onboarding/screens/overall-blocker-screen";
import { OverallDigestionScreen } from "@/components/onboarding/screens/overall-digestion-screen";
import { OverallEnergyScreen } from "@/components/onboarding/screens/overall-energy-screen";
import { OverallMotivationScreen } from "@/components/onboarding/screens/overall-motivation-screen";
import { OverallPriorityScreen } from "@/components/onboarding/screens/overall-priority-screen";
import { ZoneDurationScreen } from "@/components/onboarding/screens/zone-duration-screen";
import { ZoneFrequencyScreen } from "@/components/onboarding/screens/zone-frequency-screen";
import { ZoneImpactScreen } from "@/components/onboarding/screens/zone-impact-screen";
import { ZoneSymptomIntensityScreen } from "@/components/onboarding/screens/zone-symptom-intensity-screen";
import { ZoneTriggerScreen } from "@/components/onboarding/screens/zone-trigger-screen";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function BodyQuestionsScreen() {
	const router = useRouter();
	const { mode } = useLocalSearchParams<{ mode: string }>();

	// Card engine state: simple 0-4 index
	const [currentIndex, setCurrentIndex] = useState(0);
	const totalQuestions = 5;

	const { currentStep } = useOnboardingStore();
	// Keep track of the initial step so we know when it increments
	const [initialStep, setInitialStep] = useState(currentStep);

	useEffect(() => {
		// Whenever the global store step increments (because the child screens called nextStep()),
		// we intercept it and advance our local card index instead of letting the router change pages.
		if (currentStep > initialStep) {
			if (currentIndex < totalQuestions - 1) {
				setCurrentIndex((prev) => prev + 1);
				setInitialStep(currentStep);
			} else {
				// We reached the end
				router.push("/scan/body-results");
			}
		}
	}, [currentStep, initialStep, currentIndex, router]);

	// We mount all screens, but only display the active one
	// (we can't easily hijack their internal "nextStep" handlers without modifying them,
	// but we CAN let them render their content and capture state in the store.
	// Actually, the existing screens use `nextStep()` from onboarding-store natively.
	// Since we are not in the 'step' router, we intercept it by overriding the ContinueButton inside them,
	// OR we just intercept at the store level.
	// The safest way without modifying the common screens is to just render the active one,
	// and they will internally call nextStep. Since we aren't using the dynamic route `[step].tsx`,
	// we just let them call `nextStep()` which increments store.currentStep but doesn't change route.
	// Then we use OUR OWN continue button to handle the card engine.)

	const renderZoneCards = () => {
		switch (currentIndex) {
			case 0:
				return <ZoneSymptomIntensityScreen />;
			case 1:
				return <ZoneDurationScreen />;
			case 2:
				return <ZoneFrequencyScreen />;
			case 3:
				return <ZoneTriggerScreen />;
			case 4:
				return <ZoneImpactScreen />;
			default:
				return null;
		}
	};

	const renderOverallCards = () => {
		switch (currentIndex) {
			case 0:
				return <OverallPriorityScreen />;
			case 1:
				return <OverallBlockerScreen />;
			case 2:
				return <OverallEnergyScreen />;
			case 3:
				return <OverallDigestionScreen />;
			case 4:
				return <OverallMotivationScreen />;
			default:
				return null;
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 px-6 pt-4 pb-10">
				{/* Progress Indicator */}
				<View className="mb-4 flex-row gap-2">
					{Array.from({ length: totalQuestions }).map((_, i) => (
						<View
							className={`h-1.5 flex-1 rounded-full ${
								i <= currentIndex ? "bg-[#3EC9B5]" : "bg-black/10"
							}`}
							key={`progress-${i}`}
						/>
					))}
				</View>

				{/* Questions container */}
				<View className="flex-1">
					{mode === "overall" ? renderOverallCards() : renderZoneCards()}
				</View>
			</View>
		</SafeAreaView>
	);
}
