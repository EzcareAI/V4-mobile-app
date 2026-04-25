import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

/**
 * Body diagram step — auto-skips to "overall" intent.
 * The interactive body map was removed to comply with App Store guidelines.
 */
export default function BodyDiagramScreen() {
	const router = useRouter();
	const { nextStep, setAnswer, currentStep } = useOnboardingStore();

	useEffect(() => {
		setAnswer("bodyZoneSelected", []);
		setAnswer("intentType", "overall");
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	}, []);

	return (
		<View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FBFA" }}>
			<ActivityIndicator color="#3EC9B5" size="large" />
		</View>
	);
}
