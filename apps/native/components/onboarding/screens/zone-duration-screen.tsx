import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export function ZoneDurationScreen() {
	const router = useRouter();
	const { zoneDuration, setAnswer, nextStep, scanMode } = useOnboardingStore();
	const [selected, setSelected] = useState<string | null>(zoneDuration ?? null);

	const handleContinue = () => {
		if (selected) {
			setAnswer(
				"zoneDuration",
				selected as "days" | "weeks" | "months" | "longterm"
			);
			nextStep();
			if (scanMode !== "home") {
				router.push("/(onboarding)/16");
			}
		}
	};

	const options = [
		{ value: "days", label: "Less than a week", icon: "📅" },
		{ value: "weeks", label: "1-2 weeks", icon: "📆" },
		{ value: "months", label: "1-3 months", icon: "📊" },
		{ value: "months_long", label: "3-6 months", icon: "📈" },
		{ value: "longterm", label: "More than 6 months", icon: "⏱️" },
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
									<Text style={{ fontSize: 48 }}>⏳</Text>
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
							description="When did you first notice this discomfort?"
							title="How long has this been going on?"
						/>

						<View className="mt-8 gap-3">
							{options.map(({ value, label, icon }) => {
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
										<Text
											className={`font-bold text-base ${
												isSelected ? "text-[#28B898]" : "text-[#0d2137]"
											}`}
										>
											{label}
										</Text>
										<Text className="text-2xl">{icon}</Text>
									</TouchableOpacity>
								);
							})}
						</View>

						<View className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
							<Text className="text-[#64748B] text-xs leading-5">
								💡 The timeline helps us understand if this is acute (sudden) or
								chronic (long-term), which affects your personalized plan.
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
