import { useLocalSearchParams } from "expo-router";
import { lazy, Suspense, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AccountCreationScreen } from "@/components/onboarding/screens/account-creation-screen";
import { ActivityLevelScreen } from "@/components/onboarding/screens/activity-level-screen";
import { AlcoholScreen } from "@/components/onboarding/screens/alcohol-screen";
import { BirthdayScreen } from "@/components/onboarding/screens/birthday-screen";
// BodyDiagramScreen uses Body3DSelector (@react-three/fiber/native) — lazy-load
// to prevent the library from being evaluated at module load time in production APKs.
const BodyDiagramScreen = lazy(() =>
	import("@/components/onboarding/screens/body-diagram-screen")
);
// ===== SHARED CONVERGENCE SCREENS (Steps 17+) =====
import { ConfidenceMomentScreen } from "@/components/onboarding/screens/confidence-moment-screen";
import { DiscountWheelScreen } from "@/components/onboarding/screens/discount-wheel-screen";
import { DopamineScreen } from "@/components/onboarding/screens/dopamine-screen";
// ===== BASELINE SCREENS (Steps 1-10) =====
import { GenderScreen } from "@/components/onboarding/screens/gender-screen";
import { HeightWeightScreen } from "@/components/onboarding/screens/height-weight-screen";
import { LoadingPlanScreen } from "@/components/onboarding/screens/loading-plan-screen";
import { NameScreen } from "@/components/onboarding/screens/name-screen";
import { NotificationsScreen } from "@/components/onboarding/screens/notifications-screen";
import { OverallBlockerScreen } from "@/components/onboarding/screens/overall-blocker-screen";
import { OverallDigestionScreen } from "@/components/onboarding/screens/overall-digestion-screen";
import { OverallEnergyScreen } from "@/components/onboarding/screens/overall-energy-screen";
import { OverallMotivationScreen } from "@/components/onboarding/screens/overall-motivation-screen";
import { OverallPriorityScreen } from "@/components/onboarding/screens/overall-priority-screen";
import PaywallScreen from "@/components/onboarding/screens/paywall-screen";
import { ReferralScreen } from "@/components/onboarding/screens/referral-screen";
import { SleepScreen } from "@/components/onboarding/screens/sleep-screen";
import { SmokingScreen } from "@/components/onboarding/screens/smoking-screen";
import { StressLevelScreen } from "@/components/onboarding/screens/stress-level-screen";
import { ZoneDurationScreen } from "@/components/onboarding/screens/zone-duration-screen";
import { ZoneFrequencyScreen } from "@/components/onboarding/screens/zone-frequency-screen";
import { ZoneImpactScreen } from "@/components/onboarding/screens/zone-impact-screen";
import { ZoneSymptomIntensityScreen } from "@/components/onboarding/screens/zone-symptom-intensity-screen";
import { ZoneTriggerScreen } from "@/components/onboarding/screens/zone-trigger-screen";
import { useOnboardingStore } from "@/stores/onboarding-store";

// Lazy-load Skia-dependent screens so @shopify/react-native-skia is NOT
// initialized at module load time (which crashes Android on first step).
const PerfectPlanScreen = lazy(() =>
	import("@/components/onboarding/screens/perfect-plan-screen")
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
	const setAnswer = useOnboardingStore((state) => state.setAnswer);
	const intentType = useOnboardingStore((state) => state.intentType);

	useEffect(() => {
		setAnswer("currentStep", stepNumber);
	}, [stepNumber, setAnswer]);

	const renderBaseline = () => {
		switch (stepNumber) {
			case 1:
				return <NameScreen />;
			case 2:
				return <GenderScreen />;
			case 3:
				return <BirthdayScreen />;
			case 4:
				return <HeightWeightScreen />;
			case 5:
				return <ActivityLevelScreen />;
			case 6:
				return <DopamineScreen type="reinforcement" />;
			case 7:
				return <SleepScreen />;
			case 8:
				return <StressLevelScreen />;
			case 9:
				return <SmokingScreen />;
			case 10:
				return <AlcoholScreen />;
			case 11:
				return <DopamineScreen type="progress" />;
			case 12:
				return (
					<Suspense fallback={<LoadingFallback />}>
						<BodyDiagramScreen />
					</Suspense>
				);
			default:
				return null;
		}
	};

	const renderConditionalPath = () => {
		if (intentType === "zone") {
			switch (stepNumber) {
				case 13:
					return <ZoneSymptomIntensityScreen />;
				case 14:
					return <ZoneDurationScreen />;
				case 15:
					return <ZoneFrequencyScreen />;
				case 16:
					return <ZoneTriggerScreen />;
				case 17:
					return <ZoneImpactScreen />;
				default:
					return null;
			}
		}

		if (intentType === "overall") {
			switch (stepNumber) {
				case 13:
					return <OverallPriorityScreen />;
				case 14:
					return <OverallBlockerScreen />;
				case 15:
					return <OverallEnergyScreen />;
				case 16:
					return <OverallDigestionScreen />;
				case 17:
					return <OverallMotivationScreen />;
				default:
					return null;
			}
		}
		return null;
	};

	const renderConvergence = () => {
		switch (stepNumber) {
			case 18:
				return <ConfidenceMomentScreen />;
			case 19:
				return (
					<Suspense fallback={<LoadingFallback />}>
						<ResultsPreviewScreen />
					</Suspense>
				);
			case 20:
				return <PaywallScreen />;
			case 21:
				return <DiscountWheelScreen />;
			case 22:
				return <AccountCreationScreen />;
			case 23:
				return <LoadingPlanScreen />;
			case 24:
				return (
					<Suspense fallback={<LoadingFallback />}>
						<PerfectPlanScreen />
					</Suspense>
				);
			case 25:
				return <NotificationsScreen />;
			case 26:
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
