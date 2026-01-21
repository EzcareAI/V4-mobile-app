import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
	type UnitPreference,
	useOnboardingStore,
} from "@/stores/onboarding-store";

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
		<View className="flex-1 justify-between px-6 py-8">
			<View>
				<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
					What is your body size?
				</Text>
				<Text className="mb-4 text-lg text-muted-foreground">
					We use this to calculate your metabolic health score.
				</Text>

				<View className="mb-8 flex-row self-center rounded-2xl bg-secondary/10 p-1">
					<Pressable
						className={`rounded-xl px-6 py-2 ${unitPreference === "metric" ? "bg-white shadow-sm" : ""}`}
						onPress={() => toggleUnits("metric")}
					>
						<Text
							className={`font-semibold ${unitPreference === "metric" ? "text-primary" : "text-muted-foreground"}`}
						>
							Metric
						</Text>
					</Pressable>
					<Pressable
						className={`rounded-xl px-6 py-2 ${unitPreference === "imperial" ? "bg-white shadow-sm" : ""}`}
						onPress={() => toggleUnits("imperial")}
					>
						<Text
							className={`font-semibold ${unitPreference === "imperial" ? "text-primary" : "text-muted-foreground"}`}
						>
							Imperial
						</Text>
					</Pressable>
				</View>

				<View className="mb-8">
					<Text className="mb-2 text-center font-bold text-xl">Height</Text>
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
										<Picker.Item key={v} label={`${v} ft`} value={v} />
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
										<Picker.Item key={v} label={`${v} in`} value={v} />
									))}
								</Picker>
							</View>
						)}
					</View>
				</View>

				<View>
					<Text className="mb-2 text-center font-bold text-xl">Weight</Text>
					<View className="h-32 justify-center">
						<Picker
							onValueChange={(val) => {
								setCurrentWeight(
									unitPreference === "metric" ? val : Math.round(val / 2.204_62)
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

			<Button className="h-14 rounded-full bg-primary" onPress={handleContinue}>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
