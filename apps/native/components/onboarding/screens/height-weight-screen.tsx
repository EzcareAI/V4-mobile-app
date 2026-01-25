import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { Tabs } from "heroui-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import {
	type UnitPreference,
	useOnboardingStore,
} from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export const HeightWeightScreen = () => {
	const router = useRouter();
	const { heightCm, weightKg, unitPreference, setAnswer, nextStep } =
		useOnboardingStore();

	const [currentHeight, setCurrentHeight] = useState(heightCm || 170);
	const [currentWeight, setCurrentWeight] = useState(weightKg || 70);

	const toggleUnits = (pref: UnitPreference) => {
		setAnswer("unitPreference", pref);
	};

	const handleContinue = () => {
		setAnswer("heightCm", currentHeight);
		setAnswer("weightKg", currentWeight);
		nextStep();
		router.push("/(onboarding)/4");
	};

	return (
		<View className="flex-1 bg-background">
			<View className="flex-1 justify-between px-5 pb-8">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<StepHeader
						align="center"
						className="mt-6"
						description="We use this to calculate your metabolic health score."
						title="What is your body size?"
					/>

					<Tabs
						className="mb-4 self-center"
						onValueChange={(value: string) =>
							toggleUnits(value as UnitPreference)
						}
						value={unitPreference}
					>
						<Tabs.List>
							<Tabs.Indicator />
							<Tabs.Trigger value="imperial">
								<Tabs.Label>Imperial</Tabs.Label>
							</Tabs.Trigger>
							<Tabs.Trigger value="metric">
								<Tabs.Label>Metric</Tabs.Label>
							</Tabs.Trigger>
						</Tabs.List>
					</Tabs>

					<View className="mb-8">
						<Text className="mb-10 text-center font-bold text-xl">Height</Text>
						<View className="h-32 justify-center">
							{unitPreference === "metric" ? (
								<Picker
									onValueChange={setCurrentHeight}
									selectedValue={currentHeight}
								>
									{Array.from({ length: 151 }, (_, i) => i + 100).map((v) => (
										<Picker.Item key={v} label={`${v} cm`} value={v} />
									))}
								</Picker>
							) : (
								<View className="flex-row items-center justify-center">
									<Picker
										onValueChange={(ft) => {
											const inches = Math.round((currentHeight / 2.54) % 12);
											setCurrentHeight(Math.round((ft * 12 + inches) * 2.54));
										}}
										selectedValue={Math.floor(currentHeight / 2.54 / 12)}
										style={{ width: 100 }}
									>
										{Array.from({ length: 6 }, (_, i) => i + 3).map((v) => (
											<Picker.Item key={v} label={`${v}'`} value={v} />
										))}
									</Picker>
									<Picker
										onValueChange={(inc) => {
											const feet = Math.floor(currentHeight / 2.54 / 12);
											setCurrentHeight(Math.round((feet * 12 + inc) * 2.54));
										}}
										selectedValue={Math.round((currentHeight / 2.54) % 12)}
										style={{ width: 100 }}
									>
										{Array.from({ length: 12 }, (_, i) => i).map((v) => (
											<Picker.Item key={v} label={`${v}"`} value={v} />
										))}
									</Picker>
								</View>
							)}
						</View>
					</View>

					<View>
						<Text className="mb-10 text-center font-bold text-xl">Weight</Text>
						<View className="h-32 justify-center">
							<Picker
								onValueChange={(val) => {
									setCurrentWeight(
										unitPreference === "metric"
											? val
											: Math.round(val / 2.204_62)
									);
								}}
								selectedValue={
									unitPreference === "metric"
										? currentWeight
										: Math.round(currentWeight * 2.204_62)
								}
							>
								{unitPreference === "metric"
									? Array.from({ length: 171 }, (_, i) => i + 30).map((v) => (
											<Picker.Item key={v} label={`${v} kg`} value={v} />
										))
									: Array.from({ length: 375 }, (_, i) => i + 66).map((v) => (
											<Picker.Item key={v} label={`${v} lbs`} value={v} />
										))}
							</Picker>
						</View>
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
};
