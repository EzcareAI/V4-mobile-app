import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export function ZoneFrequencyScreen() {
	const router = useRouter();
	const { zoneFrequency, setAnswer, nextStep, scanMode, currentStep } =
		useOnboardingStore();
	const [selected, setSelected] = useState<string | null>(
		zoneFrequency ?? null
	);

	const handleContinue = () => {
		if (selected) {
			setAnswer(
				"zoneFrequency",
				selected as "constantly" | "often" | "sometimes" | "rarely"
			);
			nextStep();
			if (scanMode !== "home") {
				router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
			}
		}
	};

	const options = [
		{
			value: "constantly",
			label: "Constant",
			subtext: "All day, every day",
			icon: "🔴",
		},
		{ value: "often", label: "Frequently", subtext: "Most days", icon: "🟠" },
		{
			value: "sometimes",
			label: "Intermittent",
			subtext: "Some days",
			icon: "🟡",
		},
		{
			value: "rarely",
			label: "Occasionally",
			subtext: "Few times a week",
			icon: "🟢",
		},
		{
			value: "very_rarely",
			label: "Rarely",
			subtext: "Once in a while",
			icon: "💙",
		},
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
									<Text style={{ fontSize: 48 }}>🔄</Text>
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
							description="Is this constant or does it come and go?"
							title="How often does it happen?"
						/>

						<View className="mt-8 gap-3">
							{options.map(({ value, label, subtext, icon }) => {
								const isSelected = selected === value;
								return (
									<TouchableOpacity
										activeOpacity={0.7}
										className={`flex-row items-center justify-between overflow-hidden rounded-2xl border-2 p-4 ${
											isSelected
												? "border-[#28B898] bg-[#28B898]/10"
												: "border-transparent bg-white shadow-[#28B898]/5 shadow-sm"
										}`}
										key={value}
										onPress={() => setSelected(value)}
									>
										<View className="flex-1">
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
												{subtext}
											</Text>
										</View>
										<Text className="text-2xl">{icon}</Text>
									</TouchableOpacity>
								);
							})}
						</View>

						<View className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
							<Text className="text-[#64748B] text-xs leading-5">
								📊 Frequency patterns help us tailor strategies to your specific
								needs.
							</Text>
						</View>
					</View>
				</ScrollView>

				<View className="pt-6">
					<ContinueButton isDisabled={!selected} onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
}
