import { useLocalSearchParams } from "expo-router";
import { lazy, Suspense, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AccountCreationScreen } from "@/components/onboarding/screens/account-creation-screen";
import { ActivityLevelScreen } from "@/components/onboarding/screens/activity-level-screen";
import { AlcoholScreen } from "@/components/onboarding/screens/alcohol-screen";
import { BirthdayScreen } from "@/components/onboarding/screens/birthday-screen";
// ===== INTENT SELECTOR (Step 12) =====
import BodyDiagramScreen from "@/components/onboarding/screens/body-diagram-screen";
// ===== SHARED CONVERGENCE SCREENS (Steps 18+) =====
import { ConfidenceMomentScreen } from "@/components/onboarding/screens/confidence-moment-screen";
import { DiscountWheelScreen } from "@/components/onboarding/screens/discount-wheel-screen";
// ===== BASELINE SCREENS (Steps 0-11) =====
import { GenderScreen } from "@/components/onboarding/screens/gender-screen";
import { HealthConditionsScreen } from "@/components/onboarding/screens/health-conditions-screen";
import { HealthGoalsScreen } from "@/components/onboarding/screens/health-goals-screen";
import { HeightWeightScreen } from "@/components/onboarding/screens/height-weight-screen";
import { LoadingPlanScreen } from "@/components/onboarding/screens/loading-plan-screen";
import { NotificationsScreen } from "@/components/onboarding/screens/notifications-screen";
import { OverallBlockerScreen } from "@/components/onboarding/screens/overall-blocker-screen";
import { OverallDigestionScreen } from "@/components/onboarding/screens/overall-digestion-screen";
import { OverallEnergyScreen } from "@/components/onboarding/screens/overall-energy-screen";
import { OverallMotivationScreen } from "@/components/onboarding/screens/overall-motivation-screen";
// ===== PATH B SCREENS - OVERALL HEALTH (Steps 13-17) =====
import { OverallPriorityScreen } from "@/components/onboarding/screens/overall-priority-screen";
import PaywallScreen from "@/components/onboarding/screens/paywall-screen";
import { PrimaryGoalScreen } from "@/components/onboarding/screens/primary-goal-screen";
import { ProgressBoostScreen } from "@/components/onboarding/screens/progress-boost-screen";
import { ReferralScreen } from "@/components/onboarding/screens/referral-screen";
import { SleepScreen } from "@/components/onboarding/screens/sleep-screen";
import { SmokingScreen } from "@/components/onboarding/screens/smoking-screen";
import { StressLevelScreen } from "@/components/onboarding/screens/stress-level-screen";
import { ZoneDurationScreen } from "@/components/onboarding/screens/zone-duration-screen";
import { ZoneFrequencyScreen } from "@/components/onboarding/screens/zone-frequency-screen";
import { ZoneImpactScreen } from "@/components/onboarding/screens/zone-impact-screen";
// ===== PATH A SCREENS - ZONE SPECIFIC (Steps 13-17) =====
import { ZoneSymptomIntensityScreen } from "@/components/onboarding/screens/zone-symptom-intensity-screen";
import { ZoneTriggerScreen } from "@/components/onboarding/screens/zone-trigger-screen";
import { useOnboardingStore } from "@/stores/onboarding-store";

// Lazy-load Skia-dependent screens so @shopify/react-native-skia is NOT
// initialized at module load time (which crashes Android on first step).
const PerfectPlanScreen = lazy(() =>
	import("@/components/onboarding/screens/perfect-plan-screen").then((m) => ({
		default: m.PerfectPlanScreen,
	}))
);
const ResultsPreviewScreen = lazy(
	() => import("@/components/onboarding/screens/results-preview-screen")
);

const LoadingFallback = () => (
	<View className="flex-1 items-center justify-center bg-white">
		<ActivityIndicator color="#3BAFDA" size="large" />
	</View>
);

const OnboardingStep = () => {
	const { step } = useLocalSearchParams<{ step: string }>();
	const stepNumber = Number.parseInt(step ?? "1", 10);
	const { setAnswer, intentType } = useOnboardingStore((state) => ({
		setAnswer: state.setAnswer,
		intentType: state.intentType,
	}));

	useEffect(() => {
		setAnswer("currentStep", stepNumber);
	}, [stepNumber, setAnswer]);

	const renderBaseline = () => {
		switch (stepNumber) {
			case 1:
				return <GenderScreen />;
			case 2:
				return <BirthdayScreen />;
			case 3:
				return <HeightWeightScreen />;
			case 4:
				return <ActivityLevelScreen />;
			case 5:
				return <SleepScreen />;
			case 6:
				return <StressLevelScreen />;
			case 7:
				return <SmokingScreen />;
			case 8:
				return <AlcoholScreen />;
			case 9:
				return <HealthGoalsScreen />;
			case 10:
				return <PrimaryGoalScreen />;
			case 11:
				return <HealthConditionsScreen />;
			case 12:
				return <ProgressBoostScreen />;
			case 13:
				return <BodyDiagramScreen />;
			default:
				return null;
		}
	};

	const renderConditionalPath = () => {
		if (intentType === "zone") {
			switch (stepNumber) {
				case 14:
					return <ZoneSymptomIntensityScreen />;
				case 15:
					return <ZoneDurationScreen />;
				case 16:
					return <ZoneFrequencyScreen />;
				case 17:
					return <ZoneTriggerScreen />;
				case 18:
					return <ZoneImpactScreen />;
				default:
					return null;
			}
		}

		if (intentType === "overall") {
			switch (stepNumber) {
				case 14:
					return <OverallPriorityScreen />;
				case 15:
					return <OverallBlockerScreen />;
				case 16:
					return <OverallEnergyScreen />;
				case 17:
					return <OverallDigestionScreen />;
				case 18:
					return <OverallMotivationScreen />;
				default:
					return null;
			}
		}
		return null;
	};

	const renderConvergence = () => {
		switch (stepNumber) {
			case 19:
				return <ConfidenceMomentScreen />;
			case 20:
				return (
					<Suspense fallback={<LoadingFallback />}>
						<ResultsPreviewScreen />
					</Suspense>
				);
			case 21:
				return <PaywallScreen />;
			case 22:
				return <DiscountWheelScreen />;
			case 23:
				return <AccountCreationScreen />;
			case 24:
				return <LoadingPlanScreen />;
			case 25:
				return (
					<Suspense fallback={<LoadingFallback />}>
						<PerfectPlanScreen />
					</Suspense>
				);
			case 26:
				return <NotificationsScreen />;
			case 27:
				return <ReferralScreen />;
			default:
				return null;
		}
	};

	const renderStep = () => {
		return renderBaseline() || renderConditionalPath() || renderConvergence();
	};

	return <View className="flex-1 bg-white">{renderStep()}</View>;
};

export default OnboardingStep;
