import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MoveRight } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { THEME } from "@/lib/theme";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { Body3DSelector } from "../common/body-3d-selector";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export default function BodyDiagramScreen() {
	const router = useRouter();
	const { nextStep, setAnswer, bodyZoneSelected } = useOnboardingStore();

	// Since we are changing UX from single-to-multi-select but the existing
	// store field is likely typed string | null, we just use local state for the array
	// and join them into a string (or store the first one if the backend expects one).
	// We'll store the raw array as a JSON string so it doesn't break typed contracts:
	const initialZones = bodyZoneSelected ? bodyZoneSelected.split(",") : [];
	const [selectedZones, setSelectedZones] = useState<string[]>(initialZones);

	const handleContinue = () => {
		// Store comma-separated list of selected zones
		setAnswer("bodyZoneSelected", selectedZones.join(","));
		setAnswer("intentType", "zone");
		nextStep();
		router.push("/(onboarding)/14");
	};

	const handleOverallHealth = () => {
		setSelectedZones([]);
		setAnswer("bodyZoneSelected", "overall");
		setAnswer("intentType", "overall");
		nextStep();
		router.push("/(onboarding)/14");
	};

	const hasSelection = selectedZones.length > 0;

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-5 pb-8">
				<View className="mt-4 flex-1 px-1">
					<StepHeader
						align="center"
						className="mb-4"
						description="Tap body areas to focus on specific issues, or skip for overall wellness."
						title="Focus Areas"
					/>

					{/* ── Interactive 3D Body Canvas ── */}
					<View className="min-h-[400px] flex-1 pb-4">
						<Body3DSelector onChange={setSelectedZones} value={selectedZones} />
					</View>

					{/* ── Overall Wellness Skip Option ── */}
					{!hasSelection && (
						<TouchableOpacity
							activeOpacity={0.9}
							className="mt-8 overflow-hidden rounded-[28px] shadow-lg"
							onPress={handleOverallHealth}
							style={{
								shadowColor: THEME.accentShadow,
								shadowOpacity: 0.15,
								shadowRadius: 10,
							}}
						>
							{/* Subtle blue gradient matching theme */}
							<LinearGradient
								colors={[THEME.accent, THEME.accentLight]}
								end={{ x: 1, y: 0 }}
								start={{ x: 0, y: 0 }}
								style={{
									position: "absolute",
									width: "100%",
									height: "100%",
								}}
							/>
							<View className="p-6">
								<View className="flex-row items-center justify-between">
									<View>
										<Text className="font-bold text-white text-xl">
											Overall Wellness
										</Text>
										<Text className="mt-1 font-medium text-sm text-white/80">
											Skip specific zones, focus on general longevity
										</Text>
									</View>
									<View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
										<MoveRight color="white" size={20} />
									</View>
								</View>
							</View>
						</TouchableOpacity>
					)}
				</View>

				<SafeAreaView edges={["bottom"]}>
					<View className="pt-4">
						{/* Only show Continue if they tapped zones (otherwise they tap "Overall Wellness") */}
						<ContinueButton
							isDisabled={!hasSelection}
							label={`Continue with ${selectedZones.length} Zone${selectedZones.length === 1 ? "" : "s"}`}
							onPress={handleContinue}
						/>
					</View>
				</SafeAreaView>
			</View>
		</View>
	);
}
