import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export const PerfectPlanScreen = () => {
	const router = useRouter();

	const handleContinue = () => {
		router.push("/(onboarding)/15");
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
							className="mt-10"
							description="You're much closer to your goals than you think."
							title="Your plan is working already"
						/>

						{/* Healing Score Progress Card */}
						<View
							className="mt-10 rounded-[40px] bg-white p-8"
							style={{
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 10 },
								shadowOpacity: 0.05,
								shadowRadius: 20,
								elevation: 5,
							}}
						>
							<View className="flex-row items-center justify-between mb-8">
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
							<View className="flex-row h-52">
								{/* Y-axis labels */}
								<View className="justify-between pr-4 items-end">
									<Text className="text-[10px] font-medium text-slate-300">
										100%
									</Text>
									<Text className="text-[10px] font-medium text-slate-300">
										80%
									</Text>
									<Text className="text-[10px] font-medium text-slate-300">
										60%
									</Text>
									<Text className="text-[10px] font-medium text-slate-300">
										40%
									</Text>
									<Text className="text-[10px] font-medium text-slate-300">
										20%
									</Text>
									<Text className="text-[10px] font-medium text-slate-300">
										0%
									</Text>
								</View>

								{/* Graph area */}
								<View className="flex-1">
									<View className="absolute inset-0 justify-between">
										{[...Array(6)].map((_, i) => (
											<View className="h-px bg-slate-100" key={i.toString()} />
										))}
									</View>

									<Svg className="flex-1" height="100%" width="100%">
										<Polyline
											fill="none"
											points="0,170 60,140 120,105 180,65"
											stroke="#4FD1C5"
											strokeWidth="3"
										/>
										<Circle
											cx="0"
											cy="170"
											fill="white"
											r="4"
											stroke="#4FD1C5"
											strokeWidth="2"
										/>
										<Circle
											cx="60"
											cy="140"
											fill="white"
											r="4"
											stroke="#4FD1C5"
											strokeWidth="2"
										/>
										<Circle cx="120" cy="105" fill="#4FD1C5" r="7" />
										<Circle cx="180" cy="65" fill="#4FD1C5" r="7" />
									</Svg>
								</View>
							</View>

							{/* X-axis labels */}
							<View className="ml-10 mt-2 flex-row justify-between">
								<Text className="text-[12px] font-medium text-slate-400">
									Week 1
								</Text>
								<Text className="text-[12px] font-medium text-slate-400">
									Week 2
								</Text>
								<Text className="text-[12px] font-medium text-slate-400">
									Week 3
								</Text>
								<Text className="text-[12px] font-medium text-slate-400">
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
								<Text className="font-bold text-white text-2xl">
									Keep Going!
								</Text>
							</View>
							<Text className="mt-4 text-white/90 text-[16px] leading-6 font-medium">
								Your body is responding beautifully to natural healing. Every
								small step is creating lasting change.
							</Text>
						</LinearGradient>
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton
						label="Continue My Journey"
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
};
