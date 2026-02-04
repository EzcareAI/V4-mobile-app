import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

// ===== BASELINE SCREENS (Steps 0-11) =====
import { GenderScreen } from "@/components/onboarding/screens/gender-screen";
import { BirthdayScreen } from "@/components/onboarding/screens/birthday-screen";
import { HeightWeightScreen } from "@/components/onboarding/screens/height-weight-screen";
import { ActivityLevelScreen } from "@/components/onboarding/screens/activity-level-screen";
import { SleepScreen } from "@/components/onboarding/screens/sleep-screen";
import { StressLevelScreen } from "@/components/onboarding/screens/stress-level-screen";
import { SmokingScreen } from "@/components/onboarding/screens/smoking-screen";
import { AlcoholScreen } from "@/components/onboarding/screens/alcohol-screen";
import { HealthGoalsScreen } from "@/components/onboarding/screens/health-goals-screen";
import { PrimaryGoalScreen } from "@/components/onboarding/screens/primary-goal-screen";
import { HealthConditionsScreen } from "@/components/onboarding/screens/health-conditions-screen";
import { ProgressBoostScreen } from "@/components/onboarding/screens/progress-boost-screen";

// ===== INTENT SELECTOR (Step 12) =====
import BodyDiagramScreen from "@/components/onboarding/screens/body-diagram-screen";

// ===== PATH A SCREENS - ZONE SPECIFIC (Steps 13-17) =====
import { ZoneSymptomIntensityScreen } from "@/components/onboarding/screens/zone-symptom-intensity-screen";
import { ZoneDurationScreen } from "@/components/onboarding/screens/zone-duration-screen";
import { ZoneFrequencyScreen } from "@/components/onboarding/screens/zone-frequency-screen";
import { ZoneTriggerScreen } from "@/components/onboarding/screens/zone-trigger-screen";
import { ZoneImpactScreen } from "@/components/onboarding/screens/zone-impact-screen";

// ===== PATH B SCREENS - OVERALL HEALTH (Steps 13-17) =====
import { OverallPriorityScreen } from "@/components/onboarding/screens/overall-priority-screen";
import { OverallBlockerScreen } from "@/components/onboarding/screens/overall-blocker-screen";
import { OverallEnergyScreen } from "@/components/onboarding/screens/overall-energy-screen";
import { OverallDigestionScreen } from "@/components/onboarding/screens/overall-digestion-screen";
import { OverallMotivationScreen } from "@/components/onboarding/screens/overall-motivation-screen";

// ===== SHARED CONVERGENCE SCREENS (Steps 18+) =====
import { ConfidenceMomentScreen } from "@/components/onboarding/screens/confidence-moment-screen";
import ResultsPreviewScreen from "@/components/onboarding/screens/results-preview-screen";
import PaywallScreen from "@/components/onboarding/screens/paywall-screen";
import { DiscountWheelScreen } from "@/components/onboarding/screens/discount-wheel-screen";
import { AccountCreationScreen } from "@/components/onboarding/screens/account-creation-screen";
import { LoadingPlanScreen } from "@/components/onboarding/screens/loading-plan-screen";
import { PerfectPlanScreen } from "@/components/onboarding/screens/perfect-plan-screen";
import { NotificationsScreen } from "@/components/onboarding/screens/notifications-screen";
import { ReferralScreen } from "@/components/onboarding/screens/referral-screen";

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

	const renderStep = () => {
		// ===== BASELINE SCREENS (Steps 1-11) =====
		// These are universal - all users go through them
		if (stepNumber === 1) return <GenderScreen />;
		if (stepNumber === 2) return <BirthdayScreen />;
		if (stepNumber === 3) return <HeightWeightScreen />;
		if (stepNumber === 4) return <ActivityLevelScreen />;
		if (stepNumber === 5) return <SleepScreen />;
		if (stepNumber === 6) return <StressLevelScreen />;
		if (stepNumber === 7) return <SmokingScreen />;
		if (stepNumber === 8) return <AlcoholScreen />;
		if (stepNumber === 9) return <HealthGoalsScreen />;
		if (stepNumber === 10) return <PrimaryGoalScreen />;
		if (stepNumber === 11) return <HealthConditionsScreen />;
		if (stepNumber === 12) return <ProgressBoostScreen />;

		// ===== INTENT SELECTOR (Step 13) =====
		// User chooses: zone-specific path OR overall health path
		if (stepNumber === 13) return <BodyDiagramScreen />;

		// ===== CONDITIONAL PATH BRANCHING (Steps 14-18) =====
		// Path A: Zone-Specific (5 questions tailored to selected body zone)
		if (stepNumber === 14 && intentType === "zone") return <ZoneSymptomIntensityScreen />;
		if (stepNumber === 15 && intentType === "zone") return <ZoneDurationScreen />;
		if (stepNumber === 16 && intentType === "zone") return <ZoneFrequencyScreen />;
		if (stepNumber === 17 && intentType === "zone") return <ZoneTriggerScreen />;
		if (stepNumber === 18 && intentType === "zone") return <ZoneImpactScreen />;

		// Path B: Overall Health (5 questions about general wellness priorities)
		if (stepNumber === 14 && intentType === "overall") return <OverallPriorityScreen />;
		if (stepNumber === 15 && intentType === "overall") return <OverallBlockerScreen />;
		if (stepNumber === 16 && intentType === "overall") return <OverallEnergyScreen />;
		if (stepNumber === 17 && intentType === "overall") return <OverallDigestionScreen />;
		if (stepNumber === 18 && intentType === "overall") return <OverallMotivationScreen />;

		// ===== SHARED CONVERGENCE SCREENS (Steps 19+) =====
		// All users rejoin here after their path-specific questions
		if (stepNumber === 19) return <ConfidenceMomentScreen />;
		if (stepNumber === 20) return <ResultsPreviewScreen />;
		if (stepNumber === 21) return <PaywallScreen />;
		if (stepNumber === 22) return <DiscountWheelScreen />;
		if (stepNumber === 23) return <AccountCreationScreen />;
		if (stepNumber === 24) return <LoadingPlanScreen />;
		if (stepNumber === 25) return <PerfectPlanScreen />;
		if (stepNumber === 26) return <NotificationsScreen />;
		if (stepNumber === 27) return <ReferralScreen />;

		return null;
	};

	return <View className="flex-1 bg-white">{renderStep()}</View>;
};

export default OnboardingStep;
