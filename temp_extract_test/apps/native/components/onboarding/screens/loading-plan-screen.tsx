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
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";

const FireworkParticle = ({
	delay,
	angle,
	distance,
	color,
}: {
	delay: number;
	angle: number;
	distance: number;
	color: string;
}) => {
	const progress = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.sequence([
			Animated.delay(delay),
			Animated.spring(progress, {
				toValue: 1,
				friction: 6,
				tension: 40,
				useNativeDriver: true,
			}),
		]).start();
	}, [delay, progress]);

	const translateX = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [0, Math.cos(angle) * distance],
	});
	const translateY = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [0, Math.sin(angle) * distance],
	});
	const opacity = progress.interpolate({
		inputRange: [0, 0.7, 1],
		outputRange: [1, 1, 0],
	});
	const scale = progress.interpolate({
		inputRange: [0, 0.2, 1],
		outputRange: [0, 1.5, 0],
	});

	return (
		<Animated.View
			style={{
				position: "absolute",
				width: 10,
				height: 10,
				borderRadius: 5,
				backgroundColor: color,
				transform: [{ translateX }, { translateY }, { scale }],
				opacity,
				zIndex: 100,
			}}
		/>
	);
};

const Fireworks = () => {
	// Generate random particles spanning 360 degrees
	const particles = Array.from({ length: 45 }).map((_, i) => ({
		id: i,
		angle: (Math.PI * 2 * i) / 20 + Math.random() * 0.8,
		distance: 80 + Math.random() * 120, // shoot out pretty far
		delay: Math.random() * 400,
		color: ["#F59E0B", "#10B981", "#3EC9B5", "#EC4899", "#8B5CF6", "#38BDF8"][
			Math.floor(Math.random() * 6)
		],
	}));

	return (
		<View
			pointerEvents="none"
			style={[
				StyleSheet.absoluteFill,
				{ alignItems: "center", justifyContent: "center", zIndex: 50 },
			]}
		>
			{particles.map((p) => (
				<FireworkParticle key={p.id} {...p} />
			))}
		</View>
	);
};

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
	const { nextStep, dietType, currentStep } = useOnboardingStore();
	const [progress, setProgress] = useState(0);
	const progressAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const duration = 3000; // 6 seconds for the sequence
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
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	const getDietDescription = () => {
		const name = dietType
			? dietType.charAt(0).toUpperCase() + dietType.slice(1)
			: "Carnivore";
		return `${name} diet personalized`;
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1 px-1">
						{/* Bot Header */}
						<View className="mt-8 items-center">
							<View className="relative h-40 w-40 items-center justify-center">
								{/* Pulse Rings */}
								<View className="absolute inset-0 items-center justify-center">
									<View className="h-36 w-36 rounded-full border border-cyan-100 bg-cyan-50/20" />
								</View>
								<View className="absolute inset-0 scale-90 items-center justify-center">
									<View className="h-32 w-32 rounded-full border border-cyan-200 bg-cyan-100/30 shadow-2xl shadow-indigo-200" />
								</View>

								<View className="h-28 w-28 items-center justify-center rounded-[32px] border-2 border-white bg-white shadow-2xl shadow-blue-100">
									<Bot color="#28B898" size={48} strokeWidth={2.5} />
									<View className="absolute -top-2 -right-2 h-10 w-10 items-center justify-center rounded-2xl border-4 border-white bg-amber-400 shadow-lg">
										<Wrench color="white" fill="white" size={20} />
									</View>
								</View>
							</View>

							<Text className="mt-10 text-center font-bold text-[#29303D] text-[28px] leading-[38px] tracking-tight">
								EZBuddy is preparing{"\n"}your natural plan...
							</Text>
						</View>

						{/* Progress Section */}
						<View className="mt-10 px-4">
							<View className="h-3 w-full overflow-hidden rounded-full border border-slate-50 bg-slate-100">
								<Animated.View
									className="h-full"
									style={{
										width: progressAnim.interpolate({
											inputRange: [0, 100],
											outputRange: ["0%", "100%"],
										}),
										backgroundColor: "#28B898",
									}}
								>
									<LinearGradient
										colors={["#28B898", "#2DE2E2"]}
										end={{ x: 1, y: 0.5 }}
										start={{ x: 0, y: 0.5 }}
										style={StyleSheet.absoluteFill}
									/>
								</Animated.View>
							</View>
							<View className="mt-4 flex-row items-center justify-between">
								<Text className="font-bold text-[#73808C] text-sm uppercase tracking-widest">
									Optimization Progress
								</Text>
								<Text className="font-black text-cyan-600 text-xl">
									{Math.round(progress)}%
								</Text>
							</View>
						</View>

						{/* Stages List */}
						<View className="mt-10 gap-y-4">
							{STAGES.map((stage) => {
								const isVisible = progress >= stage.doneAt - 15;
								const isDone = progress >= stage.doneAt;

								if (!isVisible) {
									return null;
								}

								return (
									<View
										className={`flex-row items-center rounded-[32px] border p-6 ${isDone ? "border-slate-50 bg-white shadow-blue-50 shadow-sm" : "border-slate-100 bg-slate-50/50"}`}
										key={stage.id}
									>
										<View
											className={`mr-4 h-14 w-14 items-center justify-center rounded-2xl ${stage.bgColor}`}
										>
											<stage.icon color={stage.iconColor} size={26} />
										</View>
										<View className="flex-1">
											<Text
												className={`font-bold text-[#29303D] text-[16px] ${!isDone && "opacity-60"}`}
											>
												{stage.title}
											</Text>
											{isDone && (
												<Text className="mt-0.5 font-medium text-[#73808C] text-[13px]">
													{stage.id === "nutrition"
														? getDietDescription()
														: stage.description}
												</Text>
											)}
										</View>
										{isDone ? (
											<View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
												<Check color="white" size={14} strokeWidth={4} />
											</View>
										) : (
											<View className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
										)}
									</View>
								);
							})}

							{/* Final Ready State */}
							{progress >= 100 && (
								<View className="relative mt-6 rounded-[32px] border border-emerald-100 bg-emerald-50 p-8 shadow-emerald-50 shadow-md">
									{/* Interactive Fireworks overlay bounded to the completion card */}
									<Fireworks />
									<View className="z-10 flex-row items-center">
										<View className="mr-5 h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 shadow-emerald-200 shadow-lg">
											<CheckCircle2 color="white" size={32} />
										</View>
										<View className="flex-1">
											<Text className="font-bold text-[#29303D] text-xl tracking-tight">
												Plan Ready!
											</Text>
											<Text className="mt-1 font-medium text-[#73808C] text-sm leading-5">
												Your natural healing journey is precisely tailored and
												ready.
											</Text>
										</View>
									</View>
								</View>
							)}
						</View>
					</View>
				</ScrollView>

				{/* Footer Button */}
				<View className="pt-6">
					<ContinueButton
						isDisabled={progress < 100}
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
};
