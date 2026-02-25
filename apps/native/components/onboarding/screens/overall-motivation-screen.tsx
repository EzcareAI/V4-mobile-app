import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export function OverallMotivationScreen() {
	const router = useRouter();
	const { motivationLevel, setAnswer, nextStep } = useOnboardingStore();
	const [selected, setSelected] = useState<number | null>(
		motivationLevel ?? null
	);

	const handleContinue = () => {
		if (selected !== null) {
			setAnswer("motivationLevel", selected);
			nextStep();
			router.push("/(onboarding)/19");
		}
	};

	const options = [
		{
			value: 5,
			label: "Feel Better",
			emoji: "😊",
			desc: "Want more vitality & comfort",
		},
		{
			value: 4,
			label: "Perform Better",
			emoji: "🏃",
			desc: "Want to be stronger/faster",
		},
		{
			value: 3,
			label: "Prevent Disease",
			emoji: "🛡️",
			desc: "Family history concerns",
		},
		{
			value: 2,
			label: "Live Longer",
			emoji: "⏰",
			desc: "Want a long healthy life",
		},
		{
			value: 1,
			label: "Look Better",
			emoji: "💪",
			desc: "Want to look & feel great",
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
					<View className="flex-1">
						<StepHeader
							className="mt-8"
							description="What drives you to make health changes?"
							title="What motivates you?"
						/>

						<View className="mt-8 gap-3">
							{options.map(({ value, label, emoji, desc }) => {
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
												{desc}
											</Text>
										</View>
										<Text className="text-3xl">{emoji}</Text>
									</TouchableOpacity>
								);
							})}
						</View>

						<View className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
							<Text className="text-[#64748B] text-xs leading-5">
								✨ Your motivation will shape how we frame your personalized
								plan.
							</Text>
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
