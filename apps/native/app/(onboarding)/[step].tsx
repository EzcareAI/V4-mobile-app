import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { ActivityLevelScreen } from "@/components/onboarding/screens/activity-level-screen";
import { BirthdayScreen } from "@/components/onboarding/screens/birthday-screen";
import { CravingsScreen } from "@/components/onboarding/screens/cravings-screen";
import { DietTypeScreen } from "@/components/onboarding/screens/diet-type-screen";
import { DigestionScreen } from "@/components/onboarding/screens/digestion-screen";
import { GenderScreen } from "@/components/onboarding/screens/gender-screen";
import { GreatStartScreen } from "@/components/onboarding/screens/great-start-screen";
import { HealthGoalsScreen } from "@/components/onboarding/screens/health-goals-screen";
import { HeightWeightScreen } from "@/components/onboarding/screens/height-weight-screen";
import { LoadingPlanScreen } from "@/components/onboarding/screens/loading-plan-screen";
import { NotificationsScreen } from "@/components/onboarding/screens/notifications-screen";
import { ObstaclesScreen } from "@/components/onboarding/screens/obstacles-screen";
import { PerfectPlanScreen } from "@/components/onboarding/screens/perfect-plan-screen";
import { PrimaryGoalScreen } from "@/components/onboarding/screens/primary-goal-screen";
import { ProcessedFoodsScreen } from "@/components/onboarding/screens/processed-foods-screen";
import { ReferralScreen } from "@/components/onboarding/screens/referral-screen";
import { SleepScreen } from "@/components/onboarding/screens/sleep-screen";
import { StressLevelScreen } from "@/components/onboarding/screens/stress-level-screen";
import { SymptomResultsScreen } from "@/components/onboarding/screens/symptom-results-screen";
import { SymptomsScreen } from "@/components/onboarding/screens/symptoms-screen";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function OnboardingStep() {
	const { step } = useLocalSearchParams<{ step: string }>();
	const stepNumber = Number.parseInt(step ?? "1", 10);
	const setAnswer = useOnboardingStore((state) => state.setAnswer);

	useEffect(() => {
		setAnswer("currentStep", stepNumber);
	}, [stepNumber, setAnswer]);

	const renderStep = () => {
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
				return <GreatStartScreen />;
			case 6:
				return <SleepScreen />;
			case 7:
				return <StressLevelScreen />;
			case 8:
				return <SymptomsScreen />;
			case 9:
				return <SymptomResultsScreen />;
			case 10:
				return <HealthGoalsScreen />;
			case 11:
				return <PrimaryGoalScreen />;
			case 12:
				return <ObstaclesScreen />;
			case 13:
				return <DietTypeScreen />;
			case 14:
				return <PerfectPlanScreen />;
			case 15:
				return <DigestionScreen />;
			case 16:
				return <ProcessedFoodsScreen />;
			case 17:
				return <CravingsScreen />;
			case 18:
				return <LoadingPlanScreen />;
			case 19:
				return <NotificationsScreen />;
			case 20:
				return <ReferralScreen />;
			default:
				return null;
		}
	};

	return <View className="flex-1 bg-background">{renderStep()}</View>;
}
