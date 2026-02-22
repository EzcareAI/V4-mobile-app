import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { Tabs } from "heroui-native";
import { Ruler } from "lucide-react-native";
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
					{/* Premium Icon Header */}
					<View className="mt-8 items-center">
						<View className="relative h-32 w-32 items-center justify-center">
							<View className="absolute h-28 w-28 rounded-[32px] bg-blue-50 shadow-2xl shadow-blue-100" />
							<View className="h-24 w-24 items-center justify-center rounded-[28px] border border-slate-50 bg-white shadow-sm">
								<Ruler color="#00A8A8" size={44} strokeWidth={2.5} />
							</View>
						</View>
					</View>

					<StepHeader
						align="center"
						className="mt-10"
						description="Accurate sizing is critical for calculating your precise nutritional needs and metabolic index."
						title="What is your body size?"
					/>

					<View className="mt-12 items-center">
						<Tabs
							className="mb-10 w-[240px]"
							onValueChange={(value: string) =>
								toggleUnits(value as UnitPreference)
							}
							value={unitPreference}
						>
							<Tabs.List className="rounded-[20px] border border-slate-100 bg-slate-50 p-1.5">
								<Tabs.Indicator className="rounded-[14px] bg-white shadow-sm" />
								<Tabs.Trigger className="py-2.5" value="imperial">
									<Tabs.Label className="font-bold text-ezcare-slate active:text-ezcare-navy">
										Imperial
									</Tabs.Label>
								</Tabs.Trigger>
								<Tabs.Trigger className="py-2.5" value="metric">
									<Tabs.Label className="font-bold text-ezcare-slate active:text-ezcare-navy">
										Metric
									</Tabs.Label>
								</Tabs.Trigger>
							</Tabs.List>
						</Tabs>
					</View>

					<View className="gap-y-10">
						{/* Height Section */}
						<View className="rounded-[40px] border border-white/50 bg-white/60 p-8 shadow-2xl shadow-blue-100/30">
							<Text className="mb-6 text-center font-black text-[15px] text-ezcare-navy uppercase tracking-widest">
								Height
							</Text>
							<View className="h-32 justify-center overflow-hidden">
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

						{/* Weight Section */}
						<View className="rounded-[40px] border border-white/50 bg-white/60 p-8 shadow-2xl shadow-blue-100/30">
							<Text className="mb-6 text-center font-black text-[15px] text-ezcare-navy uppercase tracking-widest">
								Weight
							</Text>
							<View className="h-32 justify-center overflow-hidden">
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
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
};
