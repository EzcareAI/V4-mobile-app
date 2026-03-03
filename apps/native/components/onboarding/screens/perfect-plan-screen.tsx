import {
	Circle as SkiaCircle,
	Line as SkiaLine,
	vec,
} from "@shopify/react-native-skia";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Heart, TrendingUp, Zap } from "lucide-react-native";
import React from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { runOnJS, useAnimatedReaction, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { CartesianChart, Line, useChartPressState } from "victory-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

const CHART_DATA = [
	{ month: "Month 1", score: 18, id: "m1" },
	{ month: "Month 2", score: 32, id: "m2" },
	{ month: "Month 3", score: 50, id: "m3" },
	{ month: "Month 4", score: 72, id: "m4" },
];

export const PerfectPlanScreen = () => {
	const router = useRouter();

	const [chartData, setChartData] = React.useState(
		CHART_DATA.map((d) => ({ ...d, score: 0 }))
	);

	React.useEffect(() => {
		const timer = setTimeout(() => {
			setChartData(CHART_DATA);
		}, 300);
		return () => clearTimeout(timer);
	}, []);

	const { state: chartState, isActive } = useChartPressState({
		x: "Month 1",
		y: { score: 0 },
	});
	const [activeScore, setActiveScore] = React.useState<number | null>(null);

	useAnimatedReaction(
		() => {
			return chartState.y.score.value.value;
		},
		(score) => {
			if (typeof score === "number" && !isNaN(score)) {
				runOnJS(setActiveScore)(Math.round(score));
			}
		},
		[chartState]
	);

	React.useEffect(() => {
		if (!isActive) {
			setActiveScore(null);
		}
	}, [isActive]);

	const tooltipStyle = useAnimatedStyle(() => {
		return {
			opacity: withTiming(isActive ? 1 : 0, { duration: 150 }),
			transform: [
				{ translateX: chartState.x.position.value - 24 }, // align center (assumes ~48px width)
				{ translateY: chartState.y.score.position.value - 45 }, // elevate above pointer
			],
		};
	});

	const { nextStep, currentStep } = useOnboardingStore();

	const handleContinue = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {
				/* ignore */
			}
		}
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
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
					<View className="px-6 pt-8">
						{/* Premium Header Visualization */}
						<View className="mb-6 items-center">
							<View className="relative h-32 w-32 items-center justify-center">
								<LinearGradient
									className="h-28 w-28 items-center justify-center rounded-[32px] shadow-blue-200 shadow-lg"
									colors={["#28B898", "#2DE2E2"]}
									start={{ x: 0, y: 0 }}
								>
									<TrendingUp color="white" size={48} strokeWidth={2.5} />
								</LinearGradient>

								<View className="absolute -right-2 -bottom-2 h-12 w-12 items-center justify-center rounded-2xl border-4 border-white bg-amber-400 shadow-md">
									<Zap color="white" fill="white" size={20} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							description="You're much closer to your goals than you think. Our AI analysis shows rapid potential for recovery."
							title="Your plan is working already"
						/>

						{/* Healing Score Progress Card */}
						<View className="mt-8 rounded-[40px] border border-slate-50 bg-white p-8 shadow-2xl shadow-blue-100/50">
							<View className="mb-8 flex-row items-center justify-between">
								<View>
									<Text className="font-bold text-[#29303D] text-lg">
										Health Recovery
									</Text>
									<Text className="mt-0.5 font-bold text-[#73808C] text-xs uppercase tracking-widest">
										4-Month Projection
									</Text>
								</View>
								<View className="flex-shrink rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2">
									<Text className="font-black text-emerald-600 text-[13px]" numberOfLines={1} adjustsFontSizeToFit>
										+{activeScore !== null ? activeScore : 72}% Vitality
									</Text>
								</View>
							</View>

							{/* Graph Section */}
							<View className="h-56 flex-row">
								<View className="items-end justify-between py-2 pr-2">
									{["100", "80", "60", "40", "20", "0"].map((v) => (
										<Text
											className="font-bold text-[10px] text-slate-300"
											key={v}
										>
											{v}
										</Text>
									))}
								</View>

								<View className="relative flex-1">
									<CartesianChart
										chartPressState={chartState}
										data={chartData}
										domain={{ y: [0, 100] }}
										domainPadding={{ left: 24, right: 24, top: 10, bottom: 10 }}
										padding={0}
										xKey="month"
										yKeys={["score"]}
									>
										{({ points, chartBounds }) => (
											<>
												{[0, 20, 40, 60, 80, 100].map((v) => {
													const y =
														chartBounds.bottom -
														(v / 100) * (chartBounds.bottom - chartBounds.top);
													return (
														<SkiaLine
															color="#f8fafc"
															key={v}
															p1={vec(chartBounds.left, y)}
															p2={vec(chartBounds.right, y)}
															strokeWidth={1.5}
														/>
													);
												})}

												<Line
													animate={{ type: "timing", duration: 1000 }}
													color="#28B898"
													curveType="monotoneX"
													points={points.score}
													strokeWidth={4}
												/>
												{points.score.map((p, i) => {
													const isSolid = i >= 2;
													const pointX = p.x;
													const pointY = p.y;
													if (
														typeof pointX !== "number" ||
														typeof pointY !== "number"
													) {
														return null;
													}

													return (
														<React.Fragment key={CHART_DATA[i].id}>
															<SkiaCircle
																color="white"
																cx={pointX}
																cy={pointY}
																r={isSolid ? 8 : 6}
															/>
															<SkiaCircle
																color="#28B898"
																cx={pointX}
																cy={pointY}
																r={isSolid ? 8 : 6}
																strokeWidth={2.5}
																style={isSolid ? "fill" : "stroke"}
															/>
														</React.Fragment>
													);
												})}
											</>
										)}
									</CartesianChart>

									{/* Dynamic Animated Tooltip */}
									<Animated.View 
										style={[
											{ position: "absolute", top: 0, left: 0 },
											tooltipStyle,
										]}
										className="pointer-events-none z-50 items-center justify-center shadow-lg"
									>
										<View className="rounded-xl bg-slate-900 px-3 py-1.5">
											<Text className="font-black text-[14px] text-white">
												{activeScore !== null ? activeScore : 72}%
											</Text>
										</View>
									</Animated.View>
								</View>
							</View>

							<View className="mt-4 flex-row justify-between px-6">
								{["Mo 1", "Mo 2", "Mo 3", "Mo 4"].map((w) => (
									<Text
										className="font-bold text-[#73808C] text-[11px] uppercase tracking-tighter"
										key={w}
									>
										{w}
									</Text>
								))}
							</View>
						</View>

						{/* Keep Going Card */}
						<View className="mt-10 overflow-hidden rounded-[40px] shadow-2xl shadow-blue-200">
							<LinearGradient
								className="p-8"
								colors={["#28B898", "#2DE2E2"]}
								end={{ x: 1, y: 1 }}
								start={{ x: 0, y: 0 }}
							>
								<View className="mb-6 flex-row items-center gap-4">
									<View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
										<Heart color="white" fill="white" size={28} />
									</View>
									<Text className="font-black text-2xl text-white tracking-tight">
										Keep Going!
									</Text>
								</View>
								<View className="mb-6 h-1 w-12 rounded-full bg-white/30" />
								<Text className="font-semibold text-lg text-white leading-7">
									Your body is responding beautifully. Every small action today
									creates a massive ripple for your future health.
								</Text>
							</LinearGradient>
						</View>
					</View>
				</ScrollView>

				<View className="pt-6">
					<ContinueButton label="Begin My Journey →" onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
};
