import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MoveRight } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { THEME } from "@/lib/theme";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { Body3DSelector } from "../common/body-3d-selector";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export default function BodyDiagramScreen() {
	const router = useRouter();
	const { nextStep, setAnswer, bodyZoneSelected } = useOnboardingStore();

	// `bodyZoneSelected` is now enforced as `string[]` in the Zustand store.
	const initialZones = bodyZoneSelected || [];
	const [selectedZones, setSelectedZones] = useState<string[]>(initialZones);

	// Track whether the user is interacting with the 3D canvas so we can freeze the outer scroll
	const [scrollEnabled, setScrollEnabled] = useState(true);

	const handleContinue = () => {
		// Store the array of selected zones natively
		setAnswer("bodyZoneSelected", selectedZones);
		setAnswer("intentType", "zone");
		nextStep();
		router.push("/(onboarding)/14");
	};

	const handleOverallHealth = () => {
		setSelectedZones([]);
		setAnswer("bodyZoneSelected", []);
		setAnswer("intentType", "overall");
		nextStep();
		router.push("/(onboarding)/14");
	};

	const hasSelection = selectedZones.length > 0;

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
				<ScrollView
					className="mt-4 flex-1 px-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
					scrollEnabled={scrollEnabled}
					showsVerticalScrollIndicator={false}
				>
					<StepHeader
						align="center"
						className="mb-4"
						description="Tap body areas to focus on specific issues, or skip for overall wellness."
						title="Focus Areas"
					/>

					{/* ── Interactive 3D Body Canvas ── */}
					<View className="min-h-[450px] flex-1 pb-4">
						<Body3DSelector
							onChange={setSelectedZones}
							onInteractionEnd={() => setScrollEnabled(true)}
							onInteractionStart={() => setScrollEnabled(false)}
							value={selectedZones}
						/>
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
				</ScrollView>

				<View className="pt-4">
					{/* Only show Continue if they tapped zones (otherwise they tap "Overall Wellness") */}
					<View className="pt-6">
						<ContinueButton
						isDisabled={!hasSelection}
						label={`Continue with ${selectedZones.length} Zone${selectedZones.length === 1 ? "" : "s"}`}
						onPress={handleContinue}
					/>
					</View>
				</View>
			</View>
		</View>
	);
}
