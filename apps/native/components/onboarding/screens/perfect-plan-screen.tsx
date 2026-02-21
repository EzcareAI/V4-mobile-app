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
import { ScrollView, Text, View } from "react-native";
import { CartesianChart, Line } from "victory-native";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

const CHART_DATA = [
	{ week: "Week 1", score: 18, id: "w1" },
	{ week: "Week 2", score: 32, id: "w2" },
	{ week: "Week 3", score: 50, id: "w3" },
	{ week: "Week 4", score: 72, id: "w4" },
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

	const handleContinue = async () => {
		try {
			await impactAsync(ImpactFeedbackStyle.Medium);
		} catch {
			/* ignore */
		}
		router.push("/(onboarding)/15");
	};

	return (
		<View className="flex-1 bg-background">
			<ScrollView
				className="flex-1"
				contentContainerClassName="pb-12"
				showsVerticalScrollIndicator={false}
			>
				<View className="px-6 pt-8">
					{/* Premium Header Visualization */}
					<View className="mb-6 items-center">
						<View className="relative h-32 w-32 items-center justify-center">
							<LinearGradient
								className="h-28 w-28 items-center justify-center rounded-[32px] shadow-blue-200 shadow-lg"
								colors={["#3BAFDA", "#3EC9B5"]}
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
								<Text className="font-bold text-lg text-slate-900">
									Health Recovery
								</Text>
								<Text className="mt-0.5 font-bold text-slate-400 text-xs uppercase tracking-widest">
									4-Week Projection
								</Text>
							</View>
							<View className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2">
								<Text className="font-black text-emerald-600 text-sm">
									+68% Vitality
								</Text>
							</View>
						</View>

						{/* Graph Section */}
						<View className="h-56 flex-row">
							<View className="items-end justify-between py-2 pr-4">
								{["100", "80", "60", "40", "20", "0"].map((v) => (
									<Text
										className="font-bold text-[10px] text-slate-300"
										key={v}
									>
										{v}%
									</Text>
								))}
							</View>

							<View className="relative flex-1">
								<CartesianChart
									data={chartData}
									domain={{ y: [0, 100] }}
									domainPadding={{ left: 20, right: 20 }}
									padding={{ top: 10, bottom: 10 }}
									xKey="week"
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
												color="#3BAFDA"
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
															color="#3BAFDA"
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

								{/* Projected Tooltip */}
								<View className="absolute top-2 right-2 items-center">
									<View className="rounded-xl bg-slate-900 px-3 py-1.5 shadow-lg">
										<Text className="font-black text-[14px] text-white">
											72%
										</Text>
									</View>
									<View className="-mt-1 h-2 w-2 rotate-45 bg-slate-900" />
								</View>
							</View>
						</View>

						<View className="mt-4 flex-row justify-between px-2">
							{["Wk 1", "Wk 2", "Wk 3", "Wk 4"].map((w) => (
								<Text
									className="font-bold text-[11px] text-slate-400 uppercase tracking-tighter"
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
							colors={["#3BAFDA", "#3EC9B5"]}
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

			<View className="bg-background px-6 py-8">
				<ContinueButton label="Begin My Journey →" onPress={handleContinue} />
			</View>
		</View>
	);
};
