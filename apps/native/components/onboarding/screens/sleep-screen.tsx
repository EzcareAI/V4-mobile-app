import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Lightbulb, Moon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

const LEVELS = [
	{ id: 1, label: "Very poor", emoji: "😢" },
	{ id: 2, label: "Poor", emoji: "🙁" },
	{ id: 3, label: "Fair", emoji: "😐" },
	{ id: 4, label: "Good", emoji: "😊" },
	{ id: 5, label: "Excellent", emoji: "😁" },
];

export const SleepScreen = () => {
	const router = useRouter();
	const { sleepQuality, setAnswer, nextStep } = useOnboardingStore();
	const [value, setValue] = useState(sleepQuality || 3);

	const handleContinue = () => {
		setAnswer("sleepQuality", value);
		nextStep();
		router.push("/(onboarding)/7");
	};

	const getTipText = () => {
		if (value <= 2) {
			return "Improving sleep quality can reduce inflammation by up to 30%. We'll show you how.";
		}
		if (value === 3) {
			return "Fair sleep quality is a good start. We'll help you improve it naturally.";
		}
		return "Great sleep helps maintain a healthy immune system and balanced glucose levels.";
	};

	return (
		<View className="flex-1 bg-background">
			<LinearGradient
				colors={["#F0F9FF", "#E1F5FE"]}
				style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
			/>

			<View className="flex-1 justify-between px-6 py-8">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1">
						{/* Icon Header */}
						<View className="mt-4 items-center">
							<View className="h-24 w-24 items-center justify-center rounded-full bg-white shadow-blue-100 shadow-lg">
								<View className="h-16 w-16 items-center justify-center rounded-full bg-blue-50/50">
									<Moon color="#3BAFDA" fill="#3BAFDA" size={40} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="Quality sleep reduces inflammation and stress"
							title="How would you rate your sleep?"
						/>

						{/* Rating Selector */}
						<View className="mt-8">
							<View className="flex-row items-end justify-between px-2">
								{LEVELS.map((level) => {
									const isSelected = value === level.id;
									return (
										<Pressable
											className="items-center"
											key={level.id}
											onPress={() => setValue(level.id)}
										>
											<View
												className={`mb-2 h-16 w-16 items-center justify-center rounded-full ${
													isSelected
														? "bg-white shadow-blue-200 shadow-lg"
														: "bg-transparent opacity-60"
												}`}
											>
												<Text
													className={`${isSelected ? "text-4xl" : "text-3xl"}`}
												>
													{level.emoji}
												</Text>
											</View>
											<Text
												className={`font-semibold text-xs ${
													isSelected ? "text-[#3EC9B5]" : "text-slate-400"
												}`}
											>
												{level.label}
											</Text>
										</Pressable>
									);
								})}
							</View>

							{/* Slider Control */}
							<View className="mt-10 px-4">
								<Slider
									maximumTrackTintColor="#E2E8F0"
									maximumValue={5}
									minimumTrackTintColor="#3EC9B5"
									minimumValue={1}
									onValueChange={(v) => setValue(v)}
									step={1}
									style={{ width: "100%", height: 40 }}
									thumbTintColor="#3EC9B5"
									value={value}
								/>

								{/* Scale Labels */}
								<View className="flex-row justify-between px-1">
									{LEVELS.map((l) => (
										<Text
											className={`font-bold text-[10px] ${
												value === l.id ? "text-slate-800" : "text-slate-400"
											}`}
											key={l.id}
										>
											{l.id}
										</Text>
									))}
								</View>
							</View>
						</View>

						{/* Tip Card */}
						<View className="mt-12 mb-10 overflow-hidden rounded-[32px] bg-[#E8F8F5] p-6 shadow-emerald-100 shadow-sm">
							<View className="flex-row items-center gap-4">
								<View className="h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
									<Lightbulb color="#3EC9B5" fill="#3EC9B5" size={24} />
								</View>
								<View className="flex-1">
									<Text className="font-bold text-[#0d2137] text-lg">
										Did you know?
									</Text>
									<Text className="mt-1 text-slate-500 text-sm leading-5">
										{getTipText()}
									</Text>
								</View>
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
