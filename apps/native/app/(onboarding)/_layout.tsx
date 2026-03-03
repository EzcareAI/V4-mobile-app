import { Stack } from "expo-router";
import { View } from "react-native";
import { ProgressHeader } from "@/components/onboarding/progress-header";

export default function OnboardingLayout() {
	return (
		<View style={{ flex: 1, backgroundColor: "#EBF5F4" }}>
			<ProgressHeader />
			<View style={{ flex: 1 }}>
				<Stack
					screenOptions={{
						headerShown: false,
						animation: "slide_from_right",
						gestureEnabled: false,
					}}
				/>
			</View>
		</View>
	);
}
