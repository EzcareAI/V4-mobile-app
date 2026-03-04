import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Activity, Sparkles, Zap, TrendingUp } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from "react-native-svg";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";

interface DopamineScreenProps {
	type: "reinforcement" | "progress";
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function DopamineScreen({ type }: DopamineScreenProps) {
	const router = useRouter();
	const { nextStep, currentStep } = useOnboardingStore();

	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.9)).current;
	const pathAnim = useRef(new Animated.Value(400)).current;
	const fillOpacityAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		// Entrance animations
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 600,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				friction: 8,
				tension: 40,
				useNativeDriver: true,
			}),
		]).start();

		// Graph drawing sequence
		Animated.sequence([
			Animated.delay(400),
			Animated.timing(pathAnim, {
				toValue: 0,
				duration: 1500,
				useNativeDriver: true,
			}),
			Animated.timing(fillOpacityAnim, {
				toValue: 1,
				duration: 600,
				useNativeDriver: true,
			}),
		]).start();
	}, [fadeAnim, scaleAnim, pathAnim, fillOpacityAnim]);

	const handleContinue = () => {
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	const isReinforcement = type === "reinforcement";

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-center px-8">
				<Animated.View
					style={{
						opacity: fadeAnim,
						transform: [{ scale: scaleAnim }],
						alignItems: "center",
					}}
				>
					<LinearGradient
						colors={["#E6FFFA", "#F0FDF4"]}
						style={{
							height: 100,
							width: 100,
							borderRadius: 50,
							alignItems: "center",
							justifyContent: "center",
							marginBottom: 24,
						}}
					>
						{isReinforcement ? (
							<Zap color="#3EC9B5" size={40} strokeWidth={2.5} />
						) : (
							<Activity color="#3EC9B5" size={40} strokeWidth={2.5} />
						)}
					</LinearGradient>

					<Text className="text-center font-bold text-[#1A2138] text-[32px] leading-tight">
						{isReinforcement
							? "Great start."
							: "Your path to recovery."}
					</Text>

					<Text className="mt-4 text-center font-medium text-[#60708F] text-lg leading-6">
						{isReinforcement
							? "Most people never take this step — you already did."
							: "Your personalized strategy is coming together."}
					</Text>

					{/* Premium Animated Graph Card */}
					<View className="mt-8 w-full overflow-hidden rounded-[32px] bg-white p-6 shadow-black/5 shadow-xl">
						<View className="mb-4 flex-row items-center justify-between">
							<Text className="font-bold text-[#1A2138] text-base">
								{isReinforcement ? "Projected Energy" : "Expected Progress"}
							</Text>
						</View>

						<View className="h-[140px] w-full">
							<Svg width="100%" height="100%" viewBox="0 0 310 150" preserveAspectRatio="none">
								<Defs>
									<SvgGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
										<Stop offset="0" stopColor="#3EC9B5" stopOpacity="0.2" />
										<Stop offset="0.5" stopColor="#3EC9B5" stopOpacity="0.8" />
										<Stop offset="1" stopColor="#28B898" stopOpacity="1" />
									</SvgGradient>
									<SvgGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
										<Stop offset="0" stopColor="#3EC9B5" stopOpacity="0.25" />
										<Stop offset="1" stopColor="#3EC9B5" stopOpacity="0" />
									</SvgGradient>
									<SvgGradient id="fillRedGrad" x1="0" y1="0" x2="0" y2="1">
										<Stop offset="0" stopColor="#EF4444" stopOpacity="0.18" />
										<Stop offset="1" stopColor="#EF4444" stopOpacity="0" />
									</SvgGradient>
								</Defs>
								
								{/* Grid Lines */}
								<Path d="M 0 35 L 310 35" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />
								<Path d="M 0 70 L 310 70" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />
								<Path d="M 0 105 L 310 105" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />

								{/* Animated Fill (With EZCare) */}
								<AnimatedPath
									d={
										isReinforcement
											? "M 0 120 C 100 120, 100 32, 190 32 S 240 30, 270 30 L 270 140 L 0 140 Z"
											: "M 0 120 C 60 100, 100 40, 150 30 S 220 10, 270 5 L 270 140 L 0 140 Z"
									}
									fill="url(#fillGrad)"
									opacity={fillOpacityAnim}
								/>
								
								{/* Without EZCare Red Fill */}
								<AnimatedPath
									d={
										isReinforcement
											? "M 0 120 Q 45 105, 90 110 S 180 138, 270 138 L 270 140 L 0 140 Z"
											: "M 0 120 Q 65 100, 135 110 L 190 138 L 270 138 L 270 140 L 0 140 Z"
									}
									fill="url(#fillRedGrad)"
									opacity={fillOpacityAnim}
								/>

								{/* Without EZCare Baseline Curve (Crashing Trend to 0%) */}
								<AnimatedPath
									d={
										isReinforcement
											? "M 0 120 Q 45 105, 90 110 S 180 138, 270 138"
											: "M 0 120 Q 65 100, 135 110 L 190 138 L 270 138"
									}
									fill="none"
									stroke="#EF4444"
									strokeWidth="3"
									strokeLinecap="round"
									strokeDasharray="400"
									strokeDashoffset={pathAnim}
								/>

								{/* With EZCare Animated Curve */}
								<AnimatedPath
									d={
										isReinforcement
											? "M 0 120 C 100 120, 100 32, 190 32 S 240 30, 270 30"
											: "M 0 120 C 60 100, 100 40, 150 30 S 220 10, 270 5"
									}
									fill="none"
									stroke="url(#lineGrad)"
									strokeWidth="4"
									strokeLinecap="round"
									strokeDasharray="400"
									strokeDashoffset={pathAnim}
								/>

								{/* Terminal End Labels */}
								<SvgText x={278} y={isReinforcement ? 34 : 9} fill="#3EC9B5" fontSize="13" fontWeight="900">
									{isReinforcement ? "+42%" : "+85%"}
								</SvgText>

								<SvgText x={278} y={142} fill="#EF4444" fontSize="12" fontWeight="bold">
									0%
								</SvgText>
							</Svg>
						</View>

						{/* Timestamps */}
						<View className="mt-2 flex-row justify-between px-1">
							<Text className="font-medium text-[#94A3B8] text-[11px] uppercase tracking-wider">Today</Text>
							<Text className="font-medium text-[#94A3B8] text-[11px] uppercase tracking-wider">
								{isReinforcement ? "Week 4" : "Month 3"}
							</Text>
							<Text className="font-medium text-[#94A3B8] text-[11px] uppercase tracking-wider">
								{isReinforcement ? "Week 12" : "Month 6"}
							</Text>
						</View>
						
						<View className="mt-4 flex-row justify-center gap-6">
							<View className="flex-row items-center gap-2">
								<View className="h-2.5 w-2.5 rounded-full bg-[#3EC9B5]" />
								<Text className="font-medium text-[#60708F] text-xs">With EZCare</Text>
							</View>
							<View className="flex-row items-center gap-2">
								<View className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
								<Text className="font-medium text-[#EF4444] text-xs">Without</Text>
							</View>
						</View>
					</View>
				</Animated.View>
			</View>

			<View className="px-6 pb-12">
				<ContinueButton onPress={handleContinue} />
			</View>
		</View>
	);
}
