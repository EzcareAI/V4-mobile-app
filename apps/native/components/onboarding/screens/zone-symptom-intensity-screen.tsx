import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export function ZoneSymptomIntensityScreen() {
	const router = useRouter();
	const {
		zoneSymptomIntensity,
		bodyZoneSelected,
		setAnswer,
		nextStep,
		scanMode,
		currentStep,
	} = useOnboardingStore();
	const [selected, setSelected] = useState<number | null>(
		zoneSymptomIntensity ?? null
	);

	const zoneName = bodyZoneSelected?.length
		? bodyZoneSelected.join(" & ")
		: "this area";

	const handleContinue = () => {
		if (selected !== null) {
			setAnswer("zoneSymptomIntensity", selected);
			nextStep();
			if (scanMode !== "home") {
				router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
			}
		}
	};

	const options = [
		{ level: 1, label: "Mild", emoji: "😌" },
		{ level: 3, label: "Moderate", emoji: "😐" },
		{ level: 5, label: "Significant", emoji: "😕" },
		{ level: 7, label: "Severe", emoji: "😣" },
		{ level: 10, label: "Unbearable", emoji: "😩" },
	];

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1 px-1">
						{/* Mascot Header */}
						<View className="mt-4 items-center">
							<View className="relative">
								<LinearGradient
									colors={["#4FD1C5", "#28B898"]}
									start={{ x: 0, y: 0 }}
									style={{
										height: 112,
										width: 112,
										borderRadius: 56,
										alignItems: "center",
										justifyContent: "center",
										shadowColor: "#28B898",
										shadowOffset: { width: 0, height: 10 },
										shadowOpacity: 0.2,
										shadowRadius: 15,
										elevation: 10,
									}}
								>
									<Text style={{ fontSize: 48 }}>🎯</Text>
								</LinearGradient>
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-blue-400"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 14 }}>🎯</Text>
								</View>
							</View>
						</View>

						<StepHeader
							className="mt-8"
							description={`How does your ${zoneName} feel?`}
							title="Rate the intensity"
						/>

						<View className="mt-8 gap-3">
							{options.map(({ level, label, emoji }) => {
								const isSelected = selected === level;
								return (
									<TouchableOpacity
										activeOpacity={0.7}
										className={`flex-row items-center justify-between overflow-hidden rounded-2xl border-2 p-4 ${
											isSelected
												? "border-[#28B898] bg-[#28B898]/10"
												: "border-transparent bg-white shadow-[#28B898]/5 shadow-sm"
										}`}
										key={level}
										onPress={() => setSelected(level)}
									>
										<View>
											<Text
												className={`font-bold text-base ${
													isSelected ? "text-[#28B898]" : "text-[#0d2137]"
												}`}
											>
												{label}
											</Text>
											<Text
												className={`mt-1 text-xs ${
													isSelected ? "text-[#28B898]/80" : "text-[#73808C]"
												}`}
											>
												Level {level}
											</Text>
										</View>
										<Text className="text-3xl">{emoji}</Text>
									</TouchableOpacity>
								);
							})}
						</View>

						<View className="mt-8 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
							<Text className="mb-3 font-semibold text-[#0d2137] text-xs uppercase tracking-wider">
								Comfort Scale
							</Text>
							<View className="h-2 rounded-full bg-gradient-to-r from-green-400 via-amber-400 to-red-500" />
							<View className="mt-2 flex-row justify-between">
								<Text className="font-medium text-[#64748B] text-xs">
									Comfortable
								</Text>
								<Text className="font-medium text-[#64748B] text-xs">
									Unbearable
								</Text>
							</View>
						</View>
					</View>
				</ScrollView>

				<View className="pt-6">
					<ContinueButton
						isDisabled={selected === null}
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
}
