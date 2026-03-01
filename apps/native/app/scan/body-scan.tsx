import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BodyDiagramScreen from "@/components/onboarding/screens/body-diagram-screen";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function BodyScanEntry() {
	const { setAnswer } = useOnboardingStore();
	const router = useRouter();

	useEffect(() => {
		// Set store mode to 'home' so ResultsPreviewScreen routes differently
		setAnswer("scanMode", "home");
	}, [setAnswer]);

	return (
		<SafeAreaView className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1">
				{/* Re-use the onboarding diagram completely */}
				<BodyDiagramScreen />
			</View>
		</SafeAreaView>
	);
}
