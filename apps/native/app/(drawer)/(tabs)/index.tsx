import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
	Activity,
	Bell,
	Check,
	ChevronRight,
	Clock,
	Heart,
	MessageSquare,
	Sparkles,
} from "lucide-react-native";
import { useState } from "react";
import {
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { Body3DSelector } from "@/components/onboarding/common/body-3d-selector";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function Home() {
	const { healthScore, bodyZoneSelected, setAnswer, firstName } =
		useOnboardingStore();
	// Check-in state (Morning / Evening / Completed)
	// For demo: Let's assume Morning is not completed yet
	const [checkInDone, setCheckInDone] = useState(false);

	const handleStartScan = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {
				/* ignore */
			}
		}

		setAnswer("scanMode", "home");

		if (bodyZoneSelected && bodyZoneSelected.length > 0) {
			router.push("/scan/body-questions?mode=zone");
		} else {
			router.push("/scan/body-scan");
		}
	};

	const handleCheckIn = () => {
		setCheckInDone(true);
	};

	return (
		<SafeAreaView className="flex-1 bg-[#F8FBFA]" edges={["top"]}>
			<ScrollView
				contentContainerClassName="px-6 pb-24"
				showsVerticalScrollIndicator={false}
			>
				{/* --- 1. Header --- */}
				<View className="flex-row items-center justify-between pt-4 pb-8">
					<View>
						<Text className="font-bold text-[#1A2138] text-[28px] leading-tight">
							Welcome back,
						</Text>
						<Text className="font-black text-[#28B898] text-[36px] leading-[44px]">
							{firstName || "Friend"}! 👋
						</Text>
					</View>
					<TouchableOpacity className="relative h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#3EC9B520]">
						<Bell color="#3EC9B5" size={24} />
						<View className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#FF4F6E]" />
					</TouchableOpacity>
				</View>

				{/* --- 2. Daily Check-In (V3) --- */}
				<View className="mb-10">
					<View
						style={{
							backgroundColor: "white",
							borderRadius: 32,
							padding: 24,
							shadowColor: "#1A2138",
							shadowOffset: { width: 0, height: 12 },
							shadowOpacity: 0.08,
							shadowRadius: 24,
							elevation: 10,
						}}
					>
						{checkInDone ? (
							<View className="items-center py-4">
								<View className="mb-4 h-16 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-[#E6FFFA]">
									<View className="h-6 w-6 items-center justify-center rounded-full bg-[#3EC9B5]">
										<Check color="white" size={14} strokeWidth={3} />
									</View>
									<Text className="font-bold text-[#1A9E8F] text-lg">
										Morning Check-In Completed
									</Text>
								</View>

								<Clock className="my-6 opacity-20" color="#3EC9B5" size={48} />

								<Text className="font-bold text-[#1A2138] text-xl">
									Next One: Evening Check-In
								</Text>
								<Text className="mt-1 font-medium text-[#60708F]">
									Analysis scheduled for tonight
								</Text>

								<View className="mt-8 items-center justify-center rounded-[24px] border-2 border-accent/20 bg-[#F0FDF4] px-10 py-6">
									<Text className="mb-2 font-bold text-[#3EC9B5] text-xs uppercase tracking-[2px]">
										NEXT ONE IN
									</Text>
									<Text className="font-bold text-[#1A2138] text-[48px] leading-[48px]">
										7h 2m
									</Text>
								</View>
							</View>
						) : (
							<>
								<View className="mb-6 flex-row items-center justify-between">
									<View className="flex-row items-center gap-3">
										<View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#E6FFFA]">
											<Sparkles color="#3EC9B5" size={20} />
										</View>
										<View>
											<Text className="font-bold text-[#1A2138] text-xl">
												Daily Check-In (Morning)
											</Text>
											<Text className="text-[#60708F] text-sm">
												How did you sleep and how do you feel?
											</Text>
										</View>
									</View>
								</View>

								{/* Slider Placeholders (UI only for Dashboard POC) */}
								<View className="gap-6">
									{[
										{
											label: "Sleep Quality",
											icon: "🌙",
											color: "#818CF8",
											val: 3,
										},
										{
											label: "Energy Level",
											icon: "⚡",
											color: "#FBBF24",
											val: 4,
										},
										{
											label: "Stress Level",
											icon: "🧘",
											color: "#F87171",
											val: 2,
										},
										{
											label: "Digestion",
											icon: "🌱",
											color: "#34D399",
											val: 5,
										},
									].map((item) => (
										<View key={item.label}>
											<View className="mb-2 flex-row items-center justify-between">
												<View className="flex-row items-center gap-2">
													<Text className="text-lg">{item.icon}</Text>
													<Text className="font-bold text-[#1A2138]">
														{item.label}
													</Text>
												</View>
												<Text
													className="font-bold text-lg"
													style={{ color: item.color }}
												>
													{item.val}
												</Text>
											</View>
											<View className="h-2.5 w-full rounded-full bg-[#F1F5F9]">
												<View
													className="h-full rounded-full"
													style={{
														width: `${(item.val / 5) * 100}%`,
														backgroundColor: item.color,
													}}
												/>
												<View
													className="absolute h-6 w-6 items-center justify-center rounded-full border-4 border-white shadow-black/20 shadow-md"
													style={{
														left: `${(item.val / 5) * 100 - 3}%`,
														top: -8,
														backgroundColor: item.color,
													}}
												/>
											</View>
											<View className="mt-2 flex-row justify-between">
												<Text className="font-bold text-[#94A3B8] text-[10px] uppercase tracking-wider">
													Poor
												</Text>
												<Text className="font-bold text-[#94A3B8] text-[10px] uppercase tracking-wider">
													Excellent
												</Text>
											</View>
										</View>
									))}
								</View>

								<TouchableOpacity
									activeOpacity={0.85}
									className="mt-8 h-16 w-full items-center justify-center overflow-hidden rounded-[20px]"
									onPress={handleCheckIn}
								>
									<LinearGradient
										colors={["#28B898", "#3EC9B5", "#4FD1C5"]}
										end={{ x: 1, y: 0 }}
										start={{ x: 0, y: 0 }}
										style={StyleSheet.absoluteFill}
									/>
									<Text className="font-bold text-lg text-white">
										Save Today's Check-In
									</Text>
								</TouchableOpacity>
							</>
						)}
					</View>
				</View>

				{/* --- 3. Body Diagram (MAIN CORE) --- */}
				<View className="mb-10">
					<View className="mb-5 flex-row items-center justify-between">
						<Text className="font-bold text-[#1A2138] text-[24px]">
							Your Health Core
						</Text>
						<View className="flex-row items-center gap-1.5 rounded-full bg-[#3EC9B515] px-3 py-1.5">
							<Activity color="#3EC9B5" size={14} />
							<Text className="font-bold text-[#3EC9B5] text-xs">
								Live Analysis
							</Text>
						</View>
					</View>

					<View className="relative h-[480px] w-full items-center justify-center overflow-hidden rounded-[40px] bg-white ring-1 ring-[#3EC9B510]">
						<View className="z-10 h-full w-full">
							<Body3DSelector
								onChange={(zones) => {
									setAnswer("bodyZoneSelected", zones);
									if (zones.length > 0) {
										setAnswer("intentType", "zone");
									}
								}}
								value={bodyZoneSelected}
							/>
						</View>

						{/* Overlaid Score Ring (Integrated) */}
						<View className="absolute top-6 left-6 z-20">
							<View className="h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-black/5 shadow-xl">
								<Svg height={80} viewBox="0 0 80 80" width={80}>
									<Circle
										cx="40"
										cy="40"
										fill="none"
										r="34"
										stroke="#F1F5F9"
										strokeWidth="8"
									/>
									<Circle
										cx="40"
										cy="40"
										fill="none"
										r="34"
										stroke="#3EC9B5"
										strokeDasharray={`${(healthScore || 72 / 100) * 213} 213`}
										strokeLinecap="round"
										strokeWidth="8"
										transform="rotate(-90 40 40)"
									/>
								</Svg>
								<View className="absolute items-center justify-center">
									<Text className="font-bold text-[#1A2138] text-[28px]">
										{healthScore || "72"}
									</Text>
								</View>
							</View>
							<View className="mt-3 rounded-full bg-[#1A2138] px-3 py-1 shadow-md">
								<Text className="font-bold text-[10px] text-white uppercase tracking-wider">
									Vitality Score
								</Text>
							</View>
						</View>

						{/* Bottom CTA Overlay */}
						<View className="absolute right-6 bottom-6 left-6 z-20">
							<TouchableOpacity
								activeOpacity={0.9}
								className="h-16 w-full flex-row items-center justify-center overflow-hidden rounded-[24px]"
								onPress={handleStartScan}
							>
								<LinearGradient
									colors={["#1A2138", "#2D3748"]}
									style={StyleSheet.absoluteFill}
								/>
								<Sparkles className="mr-3" color="#3EC9B5" size={20} />
								<Text className="font-bold text-lg text-white">
									{bodyZoneSelected.length > 0
										? `Analyze ${bodyZoneSelected.length} Focus Zone${bodyZoneSelected.length > 1 ? "s" : ""}`
										: "Full Body Analysis"}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>

				{/* --- 4. Daily Actions (V3 Pastel) --- */}
				<View className="mb-10">
					<View className="mb-5 flex-row items-center justify-between">
						<Text className="font-bold text-[#1A2138] text-[24px]">
							Daily Actions
						</Text>
						<TouchableOpacity>
							<Text className="font-bold text-[#3EC9B5]">See all</Text>
						</TouchableOpacity>
					</View>

					<View className="gap-4">
						{[
							{
								label: "Wellness Focus",
								desc: "Take short movement breaks to reduce fatigue",
								icon: Heart,
								bg: "#F5F3FF",
								color: "#8B5CF6",
							},
							{
								label: "Daily Action",
								desc: "Stand up and move every hour",
								icon: Activity,
								bg: "#EFF6FF",
								color: "#3B82F6",
							},
							{
								label: "Mindful Practice",
								desc: "Support your body with rest and patience",
								icon: Sparkles,
								bg: "#F0FDF4",
								color: "#10B981",
							},
						].map((item) => (
							<TouchableOpacity
								activeOpacity={0.7}
								key={item.label}
								style={{
									backgroundColor: item.bg,
									borderRadius: 24,
									padding: 20,
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<View className="flex-1 flex-row items-center gap-4">
									<View
										className="h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
										style={{ backgroundColor: "white" }}
									>
										<item.icon color={item.color} size={28} />
									</View>
									<View className="flex-1">
										<Text className="font-bold text-[#1A2138] text-lg">
											{item.label}
										</Text>
										<Text className="mt-1 text-[#60708F] text-sm leading-tight">
											{item.desc}
										</Text>
									</View>
								</View>
								<ChevronRight color="#94A3B8" size={20} />
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* --- 5. chat Card (Bottom CTA) --- */}
				<TouchableOpacity
					activeOpacity={0.9}
					className="h-[200px] w-full overflow-hidden rounded-[32px] bg-slate-100"
					onPress={() => router.push("/chat")}
				>
					<LinearGradient
						colors={["#E6FFFA", "#F0FDF4"]}
						style={StyleSheet.absoluteFill}
					/>
					<View className="flex-1 p-8">
						<View className="flex-row items-center justify-between">
							<View className="flex-1">
								<View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
									<MessageSquare color="#3EC9B5" size={24} />
								</View>
								<Text className="font-bold text-2xl text-[#1A2138]">
									Chat With EZBuddy
								</Text>
								<Text className="mt-1 font-medium text-[#60708F]">
									Your AI healing companion
								</Text>
							</View>
							<View className="h-20 w-20 items-center justify-center rounded-full bg-white/50">
								<ChevronRight color="#3EC9B5" size={32} />
							</View>
						</View>

						<View className="mt-auto flex-row items-center gap-2">
							<Sparkles color="#3EC9B5" size={14} />
							<Text className="font-bold text-[#3EC9B5] text-xs uppercase tracking-wider">
								Powered by EZCare AI
							</Text>
						</View>
					</View>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
