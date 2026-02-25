import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export function OverallBlockerScreen() {
	const router = useRouter();
	const { overallBlocker, setAnswer, nextStep } = useOnboardingStore();
	const [selected, setSelected] = useState<string | null>(
		overallBlocker ?? null
	);

	const handleContinue = () => {
		if (selected) {
			setAnswer(
				"overallBlocker",
				selected as "consistency" | "stress" | "time" | "nutrition" | "other"
			);
			nextStep();
			router.push("/(onboarding)/16");
		}
	};

	const options = [
		{
			value: "time",
			label: "⏱️ Lack of Time",
			desc: "Too busy for health routines",
		},
		{
			value: "consistency",
			label: "📅 Consistency",
			desc: "Can't stick to plans long-term",
		},
		{
			value: "nutrition",
			label: "📚 Nutrition Knowledge",
			desc: "Don't know what to eat",
		},
		{
			value: "stress",
			label: "⚡ Stress",
			desc: "Too stressed to focus on health",
		},
		{ value: "other", label: "🎯 Other", desc: "Something else" },
	];

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1">
						<StepHeader
							className="mt-8"
							description="What makes it hardest to reach your health goals?"
							title="What's blocking you?"
						/>

						<View className="mt-8 gap-3">
							{options.map(({ value, label, desc }) => {
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
											{desc && (
												<Text
													className={`mt-1 text-xs ${
														isSelected ? "text-[#28B898]/80" : "text-[#73808C]"
													}`}
												>
													{desc}
												</Text>
											)}
										</View>
									</TouchableOpacity>
								);
							})}
						</View>

						<View className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
							<Text className="text-[#64748B] text-xs leading-5">
								✨ We'll design your plan specifically around removing this
								blocker.
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
