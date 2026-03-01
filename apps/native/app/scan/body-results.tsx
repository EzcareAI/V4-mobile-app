import { SafeAreaView } from "react-native-safe-area-context";
import ResultsPreviewScreen from "@/components/onboarding/screens/results-preview-screen";

export default function BodyResultsEntry() {
	return (
		<SafeAreaView className="flex-1 bg-[#EBF5F4]" edges={["top", "bottom"]}>
			{/* Re-use the onboarding results screen completely.
          Because scanMode === "home" in the store, 
          its CTA will automatically route to the Paywall. */}
			<ResultsPreviewScreen />
		</SafeAreaView>
	);
}
