import { Redirect } from "expo-router";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function Index() {
	const currentStep = useOnboardingStore((state) => state.currentStep);
	const onboardingComplete = useOnboardingStore(
		(state) => state.onboardingComplete
	);

	// Redirect to dashboard if they have explicitly completed onboarding
	if (onboardingComplete) {
		return <Redirect href="/(dashboard)" />;
	}

	// Restore the user to their active onboarding step instead of dropping them at the splash
	if (currentStep > 0 && currentStep <= 26) {
		return <Redirect href={`/(onboarding)/${currentStep}`} />;
	}

	// Default to the onboarding splash screen
	return <Redirect href="/(onboarding)" />;
}
