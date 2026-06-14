import { useLocalSearchParams } from "expo-router";
import { lazy, Suspense, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AccountCreationScreen } from "@/components/onboarding/screens/account-creation-screen";
import { ActivityLevelScreen } from "@/components/onboarding/screens/activity-level-screen";
import { AlcoholScreen } from "@/components/onboarding/screens/alcohol-screen";
import { BirthdayScreen } from "@/components/onboarding/screens/birthday-screen";

// ===== SHARED CONVERGENCE SCREENS =====
import { ConfidenceMomentScreen } from "@/components/onboarding/screens/confidence-moment-screen";
import { DisclaimerScreen } from "@/components/onboarding/screens/disclaimer-screen";
import { DiscountWheelScreen } from "@/components/onboarding/screens/discount-wheel-screen";
import { DopamineScreen } from "@/components/onboarding/screens/dopamine-screen";
// ===== BASELINE SCREENS (Steps 1-11) =====
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
import { ShareUnlockScreen } from "@/components/onboarding/screens/share-unlock-screen";
import { SleepScreen } from "@/components/onboarding/screens/sleep-screen";
import { SmokingScreen } from "@/components/onboarding/screens/smoking-screen";
import { StressLevelScreen } from "@/components/onboarding/screens/stress-level-screen";
import { useOnboardingStore } from "@/stores/onboarding-store";

// Lazy-load Skia-dependent screens so @shopify/react-native-skia is NOT
// initialized at module load time (which crashes Android on first step).
const PerfectPlanScreen = lazy(
	() => import("@/components/onboarding/screens/perfect-plan-screen")
);
const ResultsPreviewScreen = lazy(
	() => import("@/components/onboarding/screens/results-preview-screen")
);

const LoadingFallback = () => (
	<View className="flex-1 items-center justify-center bg-white">
		<ActivityIndicator color="#3BAFDA" size="large" />
	</View>
);

// ── Step Layout ──────────────────────────────────────
// 1  Name
// 2  Gender
// 3  Birthday
// 4  Height/Weight
// 5  Activity Level
// 6  Dopamine (reinforcement)
// 7  Sleep
// 8  Stress Level
// 9  Smoking
// 10 Alcohol
// 11 Disclaimer (mandatory acknowledgment)
// 12-16 Overall path (priority, blocker, energy, digestion, motivation)
// 17 Confidence Moment
// 18 Results Preview
// 19 Paywall
// 20 Discount Wheel
// 21 Account Creation
// 22 Loading Plan
// 23 Perfect Plan
// 24 Notifications
// 25 Referral

const OnboardingStep = () => {
	const { step } = useLocalSearchParams<{ step: string }>();
	const stepNumber = Number.parseInt(step ?? "1", 10);
	const setAnswer = useOnboardingStore((state) => state.setAnswer);

	useEffect(() => {
		setAnswer("currentStep", stepNumber);
		// Auto-set intent to "overall" (body diagram removed)
		if (stepNumber === 12) {
			setAnswer("intentType", "overall");
		}
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
				return <DisclaimerScreen />;
			default:
				return null;
		}
	};

	const renderOverallPath = () => {
		switch (stepNumber) {
			case 12:
				return <OverallPriorityScreen />;
			case 13:
				return <OverallBlockerScreen />;
			case 14:
				return <OverallEnergyScreen />;
			case 15:
				return <OverallDigestionScreen />;
			case 16:
				return <OverallMotivationScreen />;
			default:
				return null;
		}
	};

	const renderConvergence = () => {
		switch (stepNumber) {
			case 17:
				return <ConfidenceMomentScreen />;
			case 18:
				return (
					<Suspense fallback={<LoadingFallback />}>
						<ResultsPreviewScreen />
					</Suspense>
				);
			case 19:
				return <PaywallScreen />;
			case 20:
				return <DiscountWheelScreen />;
			case 21:
				return <AccountCreationScreen />;
			case 22:
				return <LoadingPlanScreen />;
			case 23:
				return (
					<Suspense fallback={<LoadingFallback />}>
						<PerfectPlanScreen />
					</Suspense>
				);
			case 24:
				return <NotificationsScreen />;
			case 25:
				return <ReferralScreen />;
			// Share-to-unlock gate. Routed into from Results Preview (18) and
			// exits to the Paywall (19), so it sits "before the paywall" in the
			// user flow without renumbering steps 19-25.
			case 26:
				return <ShareUnlockScreen />;
			default:
				return null;
		}
	};

	const renderStep = () => {
		return renderBaseline() || renderOverallPath() || renderConvergence();
	};

	return <View className="flex-1 bg-white">{renderStep()}</View>;
};

export default OnboardingStep;
