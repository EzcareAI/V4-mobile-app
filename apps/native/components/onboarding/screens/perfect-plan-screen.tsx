import {
	Circle as SkiaCircle,
	Line as SkiaLine,
	vec,
} from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
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

	const handleContinue = () => {
		router.push("/(onboarding)/15");
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
					<View className="flex-1 px-1">
						{/* Header Visualization */}
						<View className="mt-4 items-center">
							<View className="relative">
								<LinearGradient
									colors={["#4FD1C5", "#3BAFDA"]}
									start={{ x: 0, y: 0 }}
									style={{
										height: 112,
										width: 112,
										borderRadius: 56,
										alignItems: "center",
										justifyContent: "center",
										shadowColor: "#3BAFDA",
										shadowOffset: { width: 0, height: 10 },
										shadowOpacity: 0.2,
										shadowRadius: 15,
										elevation: 10,
									}}
								>
									<Text style={{ fontSize: 48 }}>💪</Text>
								</LinearGradient>
								{/* Sun Badge */}
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#FFD43B]"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 16 }}>☀️</Text>
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="You're much closer to your goals than you think."
							title="Your plan is working already"
						/>

						{/* Healing Score Progress Card */}
						<View
							className="mt-8 rounded-[40px] bg-white p-8"
							style={{
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 10 },
								shadowOpacity: 0.05,
								shadowRadius: 20,
								elevation: 5,
							}}
						>
							<View className="mb-8 flex-row items-center justify-between">
								<Text className="font-bold text-[#0d2137] text-lg">
									Healing Score Progress
								</Text>
								<View className="rounded-full bg-[#E6FFFA] px-4 py-1.5">
									<Text className="font-bold text-[#38B2AC] text-sm">
										↑ 68%
									</Text>
								</View>
							</View>

							{/* Graph Section */}
							<View className="h-52 flex-row">
								{/* Y-axis labels */}
								<View className="items-end justify-between pt-2.5 pr-4 pb-2.5">
									<Text className="font-medium text-[10px] text-slate-300">
										100%
									</Text>
									<Text className="font-medium text-[10px] text-slate-300">
										80%
									</Text>
									<Text className="font-medium text-[10px] text-slate-300">
										60%
									</Text>
									<Text className="font-medium text-[10px] text-slate-300">
										40%
									</Text>
									<Text className="font-medium text-[10px] text-slate-300">
										20%
									</Text>
									<Text className="font-medium text-[10px] text-slate-300">
										0%
									</Text>
								</View>

								{/* Graph area */}
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
												{/* Horizontal Grid Lines */}
												{[0, 20, 40, 60, 80, 100].map((v) => {
													const y =
														chartBounds.bottom -
														(v / 100) * (chartBounds.bottom - chartBounds.top);
													return (
														<SkiaLine
															color="#f1f5f9"
															key={v}
															p1={vec(chartBounds.left, y)}
															p2={vec(chartBounds.right, y)}
															strokeWidth={1}
														/>
													);
												})}

												<Line
													animate={{ type: "timing", duration: 800 }}
													color="#4FD1C5"
													points={points.score}
													strokeWidth={3}
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
																r={isSolid ? 7 : 5}
															/>
															<SkiaCircle
																color="#4FD1C5"
																cx={pointX}
																cy={pointY}
																r={isSolid ? 7 : 5}
																strokeWidth={2}
																style={isSolid ? "fill" : "stroke"}
															/>
														</React.Fragment>
													);
												})}
											</>
										)}
									</CartesianChart>

									{/* Static Tooltip on last point */}
									<View
										className="absolute items-center"
										style={{
											right: 15,
											top: 15,
											pointerEvents: "none",
										}}
									>
										<View className="rounded-lg bg-[#0d2137] px-2 py-1 shadow-sm">
											<Text className="font-bold text-[12px] text-white">
												72%
											</Text>
										</View>
										{/* Arrow */}
										<View
											style={{
												width: 0,
												height: 0,
												borderLeftWidth: 5,
												borderRightWidth: 5,
												borderTopWidth: 5,
												borderLeftColor: "transparent",
												borderRightColor: "transparent",
												borderTopColor: "#0d2137",
											}}
										/>
									</View>
								</View>
							</View>

							{/* X-axis labels */}
							<View className="mt-2 ml-10 flex-row justify-between">
								<Text className="font-medium text-[12px] text-slate-400">
									Week 1
								</Text>
								<Text className="font-medium text-[12px] text-slate-400">
									Week 2
								</Text>
								<Text className="font-medium text-[12px] text-slate-400">
									Week 3
								</Text>
								<Text className="font-medium text-[12px] text-slate-400">
									Week 4
								</Text>
							</View>
						</View>

						{/* Keep Going Card */}
						<LinearGradient
							colors={["#3EC9B5", "#3BAFDA"]}
							end={{ x: 1, y: 0.5 }}
							start={{ x: 0, y: 0.5 }}
							style={{
								marginTop: 32,
								marginBottom: 10,
								borderRadius: 32,
								padding: 24,
								shadowColor: "#3BAFDA",
								shadowOffset: { width: 0, height: 10 },
								shadowOpacity: 0.2,
								shadowRadius: 15,
								elevation: 8,
							}}
						>
							<View className="flex-row items-center gap-4">
								<View className="h-12 w-12 items-center justify-center rounded-full bg-white/30">
									<Heart color="white" fill="white" size={24} />
								</View>
								<Text className="font-bold text-2xl text-white">
									Keep Going!
								</Text>
							</View>
							<Text className="mt-4 font-medium text-[16px] text-white/90 leading-6">
								Your body is responding beautifully to natural healing. Every
								small step is creating lasting change.
							</Text>
						</LinearGradient>
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton label="Continue" onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
};
