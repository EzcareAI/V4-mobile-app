import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowRight, MapPin, Sparkles } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { THEME } from "@/lib/theme";
import { useOnboardingStore } from "@/stores/onboarding-store";
import Body3DSelector from "../common/body-3d-selector";
import { StepHeader } from "../common/step-header";

export default function BodyDiagramScreen() {
	const router = useRouter();
	const { nextStep, setAnswer, bodyZoneSelected, currentStep } =
		useOnboardingStore();

	const initialZones = bodyZoneSelected || [];
	const [selectedZones, setSelectedZones] = useState<string[]>(initialZones);
	const [scrollEnabled, setScrollEnabled] = useState(true);

	const handleContinue = () => {
		if (selectedZones.length > 0) {
			setAnswer("bodyZoneSelected", selectedZones);
			setAnswer("intentType", "zone");
			nextStep();
			router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
		}
	};
	const handleOverallHealth = () => {
		setAnswer("bodyZoneSelected", []);
		setAnswer("intentType", "overall");
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	const hasSelection = selectedZones.length > 0;

	return (
		<View className="flex-1 bg-[#F8FBFA]">
			<View className="flex-1 justify-between px-6 pb-10">
				<ScrollView
					className="mt-4 flex-1 px-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
					scrollEnabled={scrollEnabled}
					showsVerticalScrollIndicator={false}
				>
					<StepHeader
						align="center"
						className="mb-2"
						description="Tap body areas to focus on specific issues, or skip for overall wellness."
						title="Focus Areas"
					/>

					{/* ── "Select body part(s)" label ── */}
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "center",
							gap: 6,
							marginBottom: 12,
							marginTop: 4,
						}}
					>
						<MapPin color={THEME.accent} size={13} strokeWidth={2.5} />
						<Text
							style={{
								color: THEME.accent,
								fontSize: 12,
								fontWeight: "700",
								letterSpacing: 1,
								textTransform: "uppercase",
							}}
						>
							Select body part(s)
						</Text>
						<MapPin color={THEME.accent} size={13} strokeWidth={2.5} />
					</View>

					{/* ── Interactive 3D Body Canvas ── */}
					<View className="pb-4">
						<Body3DSelector
							onChange={setSelectedZones}
							onInteractionEnd={() => setScrollEnabled(true)}
							onInteractionStart={() => setScrollEnabled(false)}
							value={selectedZones}
						/>
					</View>

					{/* ── Overall Wellness Option (shown when no zone selected) ── */}
					{!hasSelection && (
						<TouchableOpacity
							activeOpacity={0.88}
							onPress={handleOverallHealth}
							style={{
								marginTop: 8,
								borderRadius: 24,
								overflow: "hidden",
								shadowColor: THEME.accentShadow,
								shadowOffset: { width: 0, height: 8 },
								shadowOpacity: 0.22,
								shadowRadius: 16,
								elevation: 8,
							}}
						>
							<LinearGradient
								colors={["#1A9E8F", THEME.accent, "#4FD1C5"]}
								end={{ x: 1, y: 1 }}
								start={{ x: 0, y: 0 }}
								style={{ padding: 20 }}
							>
								{/* RECOMMENDED badge */}
								<View style={{ marginBottom: 12, flexDirection: "row" }}>
									<View
										style={{
											backgroundColor: "rgba(255,255,255,0.2)",
											borderRadius: 20,
											paddingHorizontal: 10,
											paddingVertical: 4,
											flexDirection: "row",
											alignItems: "center",
											gap: 4,
										}}
									>
										<Sparkles color="white" size={11} strokeWidth={2.5} />
										<Text
											style={{
												color: "white",
												fontSize: 10,
												fontWeight: "700",
												letterSpacing: 1,
											}}
										>
											RECOMMENDED
										</Text>
									</View>
								</View>

								<View
									style={{
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "space-between",
									}}
								>
									<View style={{ flex: 1 }}>
										<Text
											style={{
												color: "white",
												fontSize: 20,
												fontWeight: "800",
												letterSpacing: -0.3,
											}}
										>
											Overall Wellness
										</Text>
										<Text
											style={{
												color: "rgba(255,255,255,0.85)",
												fontSize: 13,
												fontWeight: "500",
												marginTop: 4,
											}}
										>
											Skip zones — scan your full health picture
										</Text>
									</View>

									{/* Circular arrow */}
									<View
										style={{
											height: 44,
											width: 44,
											borderRadius: 22,
											backgroundColor: "rgba(255,255,255,0.25)",
											alignItems: "center",
											justifyContent: "center",
											marginLeft: 12,
											borderWidth: 1,
											borderColor: "rgba(255,255,255,0.4)",
										}}
									>
										<ArrowRight color="white" size={20} strokeWidth={2.5} />
									</View>
								</View>
							</LinearGradient>
						</TouchableOpacity>
					)}
				</ScrollView>

				{/* ── Premium Continue Button ── */}
				<View style={{ paddingTop: 16 }}>
					<TouchableOpacity
						activeOpacity={hasSelection ? 0.85 : 1}
						disabled={!hasSelection}
						onPress={handleContinue}
						style={{
							borderRadius: 20,
							overflow: "hidden",
							shadowColor: hasSelection ? THEME.accentShadow : "transparent",
							shadowOffset: { width: 0, height: 8 },
							shadowOpacity: hasSelection ? 0.35 : 0,
							shadowRadius: 16,
							elevation: hasSelection ? 10 : 0,
						}}
					>
						<LinearGradient
							colors={
								hasSelection
									? ["#1A9E8F", THEME.accent, "#38B2AC"]
									: ["#CBD5E1", "#94A3B8"]
							}
							end={{ x: 1, y: 0 }}
							start={{ x: 0, y: 0 }}
							style={{
								paddingVertical: 18,
								paddingHorizontal: 28,
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
								gap: 10,
							}}
						>
							{hasSelection && (
								<Sparkles color="white" size={18} strokeWidth={2} />
							)}
							<Text
								style={{
									color: "white",
									fontSize: 16,
									fontWeight: "700",
									letterSpacing: 0.2,
								}}
							>
								{hasSelection
									? `Continue with ${selectedZones.length} Zone${selectedZones.length === 1 ? "" : "s"}`
									: "Select a zone to continue"}
							</Text>
							{hasSelection && (
								<ArrowRight color="white" size={18} strokeWidth={2.5} />
							)}
						</LinearGradient>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
