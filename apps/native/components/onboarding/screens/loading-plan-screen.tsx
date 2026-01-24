import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
	Bot,
	Check,
	CheckCircle2,
	Moon,
	Utensils,
	Wrench,
	Zap,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";

const STAGES = [
	{
		id: "energy",
		title: "Boosting energy & mental clarity",
		description: "Energy restoration plan created",
		icon: Zap,
		iconColor: "#F59E0B",
		bgColor: "bg-amber-50",
		doneAt: 30,
	},
	{
		id: "nutrition",
		title: "Optimizing nutrition plan",
		description: "personalized",
		icon: Utensils,
		iconColor: "#10B981",
		bgColor: "bg-emerald-50",
		doneAt: 65,
	},
	{
		id: "sleep",
		title: "Optimizing your sleep cycle",
		description: "Sleep improvement plan created",
		icon: Moon,
		iconColor: "#818CF8",
		bgColor: "bg-indigo-50",
		doneAt: 95,
	},
];

export const LoadingPlanScreen = () => {
	const router = useRouter();
	const { nextStep, dietType } = useOnboardingStore();
	const [progress, setProgress] = useState(0);
	const progressAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const duration = 6000; // 6 seconds for the sequence
		const interval = 50;
		const step = 100 / (duration / interval);

		const timer = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 100) {
					clearInterval(timer);
					return 100;
				}
				return Math.min(prev + step, 100);
			});
		}, interval);

		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		Animated.timing(progressAnim, {
			toValue: progress,
			duration: 50,
			useNativeDriver: false,
		}).start();
	}, [progress, progressAnim]);

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/19");
	};

	const getDietDescription = () => {
		const name = dietType
			? dietType.charAt(0).toUpperCase() + dietType.slice(1)
			: "Carnivore";
		return `${name} diet personalized`;
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
						{/* Bot Header */}
						<View className="mt-8 items-center">
							<View className="h-36 w-36 items-center justify-center">
								<View className="h-32 w-32 items-center justify-center rounded-full bg-cyan-400/20">
									<View className="h-28 w-28 items-center justify-center rounded-full bg-cyan-400/40">
										<View className="h-24 w-24 items-center justify-center rounded-full bg-white shadow-blue-100 shadow-xl">
											<Bot color="#3BAFDA" size={48} />
											<View className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-amber-400">
												<Wrench color="white" fill="white" size={20} />
											</View>
										</View>
									</View>
								</View>
							</View>

							<Text className="mt-8 text-center font-bold text-2xl text-[#0d2137] leading-9">
								EZBuddy is preparing your natural healing plan...
							</Text>
						</View>

						{/* Progress Section */}
						<View className="mt-10 items-center">
							<View className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/50">
								<Animated.View
									className="h-full bg-[#3EC9B5]"
									style={{
										width: progressAnim.interpolate({
											inputRange: [0, 100],
											outputRange: ["0%", "100%"],
										}),
									}}
								/>
							</View>
							<Text className="mt-3 font-bold text-lg text-slate-400">
								{Math.round(progress)}%
							</Text>
						</View>

						{/* Stages List */}
						<View className="mt-10 gap-y-4">
							{STAGES.map((stage) => {
								const isVisible = progress >= stage.doneAt - 10;
								const isDone = progress >= stage.doneAt;

								if (!isVisible) {
									return null;
								}

								return (
									<View
										className="flex-row items-center rounded-3xl bg-white/80 p-5 shadow-blue-100 shadow-sm"
										key={stage.id}
									>
										<View
											className={`mr-4 h-16 w-16 items-center justify-center rounded-full ${stage.bgColor}`}
										>
											<stage.icon color={stage.iconColor} size={28} />
										</View>
										<View className="flex-1">
											<Text className="font-bold text-[#0d2137] text-[17px]">
												{stage.title}
											</Text>
											<Text className="mt-0.5 text-slate-500 text-sm">
												{stage.id === "nutrition"
													? getDietDescription()
													: stage.description}
											</Text>
										</View>
										{isDone && <Check color="#3EC9B5" size={24} />}
									</View>
								);
							})}

							{/* Final Ready State */}
							{progress >= 100 && (
								<View className="mt-4 rounded-3xl bg-[#E6F9F6] p-8 shadow-emerald-100 shadow-sm">
									<View className="flex-row items-center">
										<View className="mr-5 h-16 w-16 items-center justify-center rounded-full bg-[#3EC9B5]">
											<CheckCircle2 color="white" size={32} />
										</View>
										<View className="flex-1">
											<Text className="font-bold text-[#0d2137] text-xl">
												Plan Ready!
											</Text>
											<Text className="mt-1 text-slate-500 text-sm leading-5">
												Your personalized natural healing journey is about to
												begin
											</Text>
										</View>
									</View>
								</View>
							)}
						</View>
					</View>
				</ScrollView>

				{/* Footer Button */}
				<View className="pt-4">
					<ContinueButton
						isDisabled={progress < 100}
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
};
