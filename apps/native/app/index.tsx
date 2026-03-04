import { Redirect } from "expo-router";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function Index() {
	const currentStep = useOnboardingStore((state) => state.currentStep);

	// Redirect to onboarding if not completed, otherwise to dashboard
	if (currentStep < 20) {
		return <Redirect href="/(onboarding)" />;
	}

	return <Redirect href="/(dashboard)" />;
}
