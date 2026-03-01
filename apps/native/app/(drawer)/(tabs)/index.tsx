import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Card } from "heroui-native";
import { Activity, Bell, ChevronRight, Heart } from "lucide-react-native";
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
	const { healthScore, bodyZoneSelected, setAnswer } = useOnboardingStore();

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

	const handleOverallScan = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {
				/* ignore */
			}
		}

		setAnswer("scanMode", "home");
		setAnswer("intentType", "overall");
		setAnswer("bodyZoneSelected", []);
		router.push("/scan/body-questions?mode=overall");
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView
				contentContainerClassName="p-6 pb-24"
				showsVerticalScrollIndicator={false}
			>
				{/* Top Bar */}
				<View className="mb-8 flex-row items-center justify-between">
					<View>
						<Text className="font-medium text-muted-foreground">
							Good Morning
						</Text>
						<Text className="font-bold text-3xl text-[#0d2137]">
							Morning, Alice
						</Text>
					</View>
					<TouchableOpacity className="rounded-full bg-surface p-2 shadow-sm">
						<Bell color="#4F46E5" size={24} />
					</TouchableOpacity>
				</View>

				{/* Premium Hero CTA Card (V3) */}
				<View className="mb-10 overflow-hidden rounded-[32px] bg-slate-900 shadow-xl">
					<LinearGradient
						colors={["#0F172A", "#1E293B"]}
						end={{ x: 1, y: 1 }}
						start={{ x: 0, y: 0 }}
						style={StyleSheet.absoluteFill}
					/>

					{/* Top Section: Score Ring */}
					<View className="px-6 pt-6 pb-2">
						<View className="flex-row items-center justify-between">
							<View>
								<Text className="font-bold text-3xl text-white">
									Your Health Core
								</Text>
								<Text className="text-sm text-white/70">
									{healthScore ? "Updated recently" : "Analysis required"}
								</Text>
							</View>

							{/* Mini Score Ring */}
							<View className="relative h-16 w-16 items-center justify-center rounded-full bg-white/5">
								<Svg height={64} viewBox="0 0 64 64" width={64}>
									{/* Background Track */}
									<Circle
										cx="32"
										cy="32"
										fill="none"
										r="28"
										stroke="rgba(255,255,255,0.1)"
										strokeWidth="5"
									/>
									{/* Progress Bar */}
									{healthScore && (
										<Circle
											cx="32"
											cy="32"
											fill="none"
											r="28"
											stroke="#3EC9B5"
											strokeDasharray={`${(healthScore / 100) * 176} 176`}
											strokeLinecap="round"
											strokeWidth="6"
											transform="rotate(-90 32 32)"
										/>
									)}
								</Svg>
								<View className="absolute items-center justify-center">
									<Text className="font-bold text-white text-xl">
										{healthScore || "--"}
									</Text>
								</View>
							</View>
						</View>
					</View>

					{/* Middle Section: 3D Body Selector */}
					<View className="px-4">
						<View className="mt-2 mb-2 h-[300px] w-full overflow-hidden rounded-[24px] bg-black/20">
							{/* We wrap Body3DSelector in a non-scrollable container. It handles its own gestures. */}
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
					</View>

					{/* Bottom Section: CTAs */}
					<View className="px-6 pt-2 pb-6">
						<TouchableOpacity
							activeOpacity={0.9}
							className="h-14 w-full flex-row items-center justify-center overflow-hidden rounded-2xl"
							onPress={handleStartScan}
						>
							<LinearGradient
								colors={["#28B898", "#2DE2E2"]}
								end={{ x: 1, y: 0 }}
								start={{ x: 0, y: 0 }}
								style={StyleSheet.absoluteFill}
							/>
							<Text className="font-bold text-lg text-white">
								{bodyZoneSelected.length > 0
									? `Scan ${bodyZoneSelected.length} Zone${bodyZoneSelected.length > 1 ? "s" : ""}`
									: "Scan My Body"}
							</Text>
						</TouchableOpacity>

						{bodyZoneSelected.length === 0 && (
							<TouchableOpacity
								className="mt-4 items-center"
								onPress={handleOverallScan}
							>
								<Text className="font-medium text-sm text-white/60">
									Scan my overall health instead
								</Text>
							</TouchableOpacity>
						)}
					</View>
				</View>

				{/* Daily Actions Section */}
				<View className="mb-4 flex-row items-center justify-between">
					<Text className="font-bold text-2xl text-[#0d2137]">
						Daily Actions
					</Text>
					<TouchableOpacity>
						<Text className="font-medium text-[#28B898]">View All</Text>
					</TouchableOpacity>
				</View>

				<View className="gap-4">
					<Card className="rounded-[32px] border-none bg-white p-6 shadow-sm">
						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center gap-4">
								<View className="h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
									<Activity color="#F97316" size={24} />
								</View>
								<View>
									<Text className="font-bold text-[#0d2137] text-lg">
										Morning Mobility
									</Text>
									<Text className="text-[#73808C]">10 min • Low Intensity</Text>
								</View>
							</View>
							<ChevronRight color="#94A3B8" size={20} />
						</View>
					</Card>

					<Card className="rounded-[32px] border-none bg-white p-6 shadow-sm">
						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center gap-4">
								<View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
									<Heart color="#3B82F6" size={24} />
								</View>
								<View>
									<Text className="font-bold text-[#0d2137] text-lg">
										Deep Breathing
									</Text>
									<Text className="text-[#73808C]">5 min • Stress Relief</Text>
								</View>
							</View>
							<ChevronRight color="#94A3B8" size={20} />
						</View>
					</Card>
				</View>

				{/* Healing Score Summary */}
				<View className="mt-10 mb-6">
					<View className="flex-row items-center justify-between">
						<Text className="font-bold text-2xl text-[#0d2137]">
							Healing Score
						</Text>
						<View className="rounded-full bg-[#EBF5F4] px-3 py-1">
							<Text className="font-bold text-[#28B898] text-sm">
								+12% this week
							</Text>
						</View>
					</View>

					<Card className="mt-4 overflow-hidden rounded-[32px] border-none bg-slate-900 p-8 shadow-xl">
						<LinearGradient
							colors={["#0d2137", "#1e293b"]}
							style={StyleSheet.absoluteFill}
						/>
						<View className="flex-row items-center justify-between">
							<View>
								<Text className="font-bold text-4xl text-white">
									{healthScore || "72"}
								</Text>
								<Text className="mt-1 text-white/60">
									Current Vitality Index
								</Text>
							</View>
							<View className="h-16 w-32 items-center justify-center opacity-50">
								{/* Placeholder for Sparkline/Graph */}
								<View className="h-1 w-full bg-white/20" />
								<View className="absolute bottom-0 left-4 h-4 w-1 bg-white/40" />
								<View className="absolute bottom-0 left-8 h-8 w-1 bg-white/40" />
								<View className="absolute bottom-0 left-12 h-12 w-1 bg-white/40" />
								<View className="absolute bottom-0 left-16 h-6 w-1 bg-white/40" />
								<View className="absolute bottom-0 left-20 h-10 w-1 bg-white/40" />
							</View>
						</View>
					</Card>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
