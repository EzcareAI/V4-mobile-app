import { lazy, Suspense } from "react";
import { ActivityIndicator, View } from "react-native";

const ModelViewerDebugScreen = lazy(
	() => import("@/components/onboarding/screens/model-viewer-debug-screen")
);

export default function Debug3DRoute() {
	return (
		<Suspense
			fallback={
				<View
					style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
				>
					<ActivityIndicator size="large" />
				</View>
			}
		>
			<ModelViewerDebugScreen />
		</Suspense>
	);
}
