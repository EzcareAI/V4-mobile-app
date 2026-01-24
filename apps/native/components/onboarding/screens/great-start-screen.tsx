import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ThumbsUp } from "lucide-react-native";
import { Dimensions, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const GreatStartScreen = () => {
	const router = useRouter();

	return (
		<View className="flex-1 justify-between bg-background px-6 py-8">
			<LinearGradient
				colors={["#F0F9FF", "#E1F5FE"]}
				style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
			/>
			<View className="flex-1">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ paddingBottom: 40 }}
					showsVerticalScrollIndicator={false}
				>
					{/* Mascot Section */}
					<View className="items-center">
						<View className="relative h-32 w-32 items-center justify-center rounded-full bg-white shadow-blue-100 shadow-lg">
							<Text className="text-6xl">🤖</Text>
							<View className="absolute right-0 bottom-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#3EC9B5]">
								<ThumbsUp color="white" size={14} />
							</View>
						</View>

						<StepHeader
							align="center"
							description="Most people never take the first step toward natural healing. You're already ahead."
							title="Great Start!"
						/>
					</View>

					{/* Progress Card */}
					<View className="mt-10 rounded-[32px] bg-white p-6 shadow-md">
						<View className="items-center">
							<Text className="font-bold text-[#0d2137] text-lg">
								Your Journey Progress
							</Text>
							<Text className="mt-1 font-medium text-slate-400 text-sm">
								Energy ↑ Inflammation ↓
							</Text>
						</View>

						{/* Chart Section */}
						<View className="mt-8 items-center justify-center">
							<View className="relative">
								<Svg
									height="120"
									viewBox="0 0 300 120"
									width={SCREEN_WIDTH - 120}
								>
									{/* Grid Lines */}
									{[0, 40, 80, 120].map((y) => (
										<Line
											key={y}
											stroke="#F1F5F9"
											strokeWidth="1"
											x1="0"
											x2="300"
											y1={y}
											y2={y}
										/>
									))}

									{/* Energy Line (Blue) */}
									<Polyline
										fill="none"
										points="0,80 75,75 150,70 225,40"
										stroke="#60A5FA"
										strokeLinecap="round"
										strokeWidth="3"
									/>
									<Circle cx="0" cy="80" fill="#60A5FA" r="4" />
									<Circle
										cx="225"
										cy="40"
										fill="white"
										r="6"
										stroke="#60A5FA"
										strokeWidth="3"
									/>

									{/* Inflammation Line (Green) */}
									<Polyline
										fill="none"
										points="0,100 75,105 150,105 225,120"
										stroke="#3EC9B5"
										strokeLinecap="round"
										strokeWidth="3"
									/>
									<Circle cx="0" cy="100" fill="#3EC9B5" r="4" />
									<Circle
										cx="225"
										cy="120"
										fill="white"
										r="6"
										stroke="#3EC9B5"
										strokeWidth="3"
									/>
								</Svg>

								{/* Tooltip Overlay */}
								<View
									className="absolute -top-4 -right-2 rounded-xl border border-slate-100 bg-white p-2 shadow-sm"
									style={{ elevation: 3 }}
								>
									<Text className="font-bold text-[10px] text-slate-800">
										Week 4
									</Text>
									<View className="flex-row items-center gap-1">
										<View className="h-1.5 w-1.5 rounded-sm bg-blue-400" />
										<Text className="text-[9px] text-slate-500">
											Energy Level: 82%
										</Text>
									</View>
									<View className="flex-row items-center gap-1">
										<View className="h-1.5 w-1.5 rounded-sm bg-[#3EC9B5]" />
										<Text className="text-[9px] text-slate-500">
											Inflammation: 26%
										</Text>
									</View>
								</View>
							</View>

							{/* Week Labels */}
							<View className="mt-4 w-full flex-row justify-between px-2">
								<Text className="font-medium text-[11px] text-slate-400">
									Week 1
								</Text>
								<Text className="font-medium text-[11px] text-slate-400">
									Week 2
								</Text>
								<Text className="font-medium text-[11px] text-slate-400">
									Week 3
								</Text>
								<Text className="font-medium text-[11px] text-slate-400">
									Week 4
								</Text>
							</View>
						</View>

						{/* Legend */}
						<View className="mt-6 flex-row justify-center gap-6">
							<View className="flex-row items-center gap-2">
								<View className="h-2 w-2 rounded-full bg-blue-400" />
								<Text className="font-medium text-slate-500 text-xs">
									Energy Level
								</Text>
							</View>
							<View className="flex-row items-center gap-2">
								<View className="h-2 w-2 rounded-full bg-[#3EC9B5]" />
								<Text className="font-medium text-slate-500 text-xs">
									Inflammation
								</Text>
							</View>
						</View>
					</View>

					{/* Stat Cards Row */}
					<View className="mt-6 flex-row gap-4">
						<View className="flex-1 items-center rounded-[24px] bg-white p-5 shadow-md">
							<Text className="font-bold text-2xl text-blue-400">+31%</Text>
							<Text className="mt-1 text-center font-medium text-[13px] text-slate-500">
								Expected Energy Boost
							</Text>
						</View>
						<View className="flex-1 items-center rounded-[24px] bg-white p-5 shadow-md">
							<Text className="font-bold text-2xl text-[#3EC9B5]">-25%</Text>
							<Text className="mt-1 text-center font-medium text-[13px] text-slate-500">
								Inflammation Reduction
							</Text>
						</View>
					</View>
				</ScrollView>
				<ContinueButton onPress={() => router.push("/(onboarding)/6")} />
			</View>
		</View>
	);
};
