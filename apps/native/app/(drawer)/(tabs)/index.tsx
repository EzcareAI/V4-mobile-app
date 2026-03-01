import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
	Activity,
	Bell,
	ChevronRight,
	Heart,
	MessageSquare,
	TrendingUp,
	Wind,
	Zap,
} from "lucide-react-native";
import {
	Image,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { Body3DSelector } from "@/components/onboarding/common/body-3d-selector";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function Home() {
	const { healthScore, bodyZoneSelected, setAnswer, firstName } =
		useOnboardingStore();

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

	return (
		<SafeAreaView className="flex-1 bg-[#0B0E17]" edges={["top"]}>
			<ScrollView
				contentContainerClassName="px-6 pb-32"
				showsVerticalScrollIndicator={false}
			>
				{/* --- 1. Top Header --- */}
				<View className="flex-row items-center justify-between pt-6 pb-6">
					<View>
						<Text className="text-[#94A3B8] text-sm">Good Morning,</Text>
						<Text className="font-bold text-2xl text-white">
							{firstName || "Alice"}
						</Text>
					</View>
					<View className="flex-row items-center gap-4">
						<TouchableOpacity className="relative h-11 w-11 items-center justify-center rounded-full bg-[#1A2138] ring-1 ring-white/10">
							<Bell color="#94A3B8" size={20} />
							<View className="absolute top-3 right-3 h-2 w-2 rounded-full border-2 border-[#0B0E17] bg-[#FF4F6E]" />
						</TouchableOpacity>
						<TouchableOpacity className="h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#1A2138] ring-1 ring-[#3EC9B5]">
							<Image
								source={{
									uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
								}}
								style={{ width: "100%", height: "100%" }}
							/>
						</TouchableOpacity>
					</View>
				</View>

				{/* --- 2. Main Body Scan Card --- */}
				<View className="mb-10">
					<View
						className="relative h-[440px] w-full overflow-hidden rounded-[48px] bg-[#1A2138]"
						style={{
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 20 },
							shadowOpacity: 0.4,
							shadowRadius: 30,
						}}
					>
						{/* Background Glow */}
						<LinearGradient
							colors={["transparent", "rgba(62, 201, 181, 0.05)"]}
							style={StyleSheet.absoluteFill}
						/>

						{/* Interactive 3D Canvas */}
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

						{/* Score Ring (Top Right) */}
						<View className="absolute top-8 right-8 z-20">
							<View className="h-20 w-20 items-center justify-center rounded-full bg-[#1A2138]/80 backdrop-blur-md">
								<Svg height={68} viewBox="0 0 68 68" width={68}>
									<Circle
										cx="34"
										cy="34"
										fill="none"
										r="28"
										stroke="rgba(255,255,255,0.05)"
										strokeWidth="6"
									/>
									<Circle
										cx="34"
										cy="34"
										fill="none"
										r="28"
										stroke="#3EC9B5"
										strokeDasharray={`${(healthScore || 82 / 100) * 176} 176`}
										strokeLinecap="round"
										strokeWidth="6"
										transform="rotate(-90 34 34)"
									/>
								</Svg>
								<View className="absolute items-center justify-center">
									<Text className="font-black text-2xl text-white">
										{healthScore || "82"}
									</Text>
									<Text className="text-[#94A3B8] text-[8px] uppercase tracking-tighter">
										Health
									</Text>
								</View>
							</View>
						</View>

						{/* SCAN MY BODY Button (Bottom) */}
						<View className="absolute right-8 bottom-8 left-8 z-20">
							<TouchableOpacity
								activeOpacity={0.9}
								className="h-14 w-full flex-row items-center justify-center overflow-hidden rounded-full"
								onPress={handleStartScan}
							>
								<LinearGradient
									colors={["#28B898", "#3EC9B5"]}
									end={{ x: 1, y: 0.5 }}
									start={{ x: 0, y: 0.5 }}
									style={StyleSheet.absoluteFill}
								/>
								<Text className="font-black text-sm text-white uppercase tracking-widest">
									Scan My Body
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>

				{/* --- 3. Daily Actions (Horizontal) --- */}
				<View className="mb-10">
					<Text className="mb-5 font-bold text-white text-xl">
						Daily Actions
					</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={{ marginHorizontal: -24, paddingHorizontal: 24 }}
					>
						{/* Action 1 */}
						<TouchableOpacity
							activeOpacity={0.8}
							className="mr-4 w-[200px] rounded-[32px] bg-white p-6"
						>
							<View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-[#E6FFFA]">
								<Zap color="#3EC9B5" size={24} />
							</View>
							<Text className="font-bold text-[#1A2138] text-lg leading-tight">
								Morning Mobility
							</Text>
							<View className="mt-2 flex-row items-center">
								<Text className="text-[#94A3B8] text-sm">15 mins</Text>
								<ChevronRight color="#CBD5E1" size={16} />
							</View>
						</TouchableOpacity>

						{/* Action 2 */}
						<TouchableOpacity
							activeOpacity={0.8}
							className="mr-4 w-[200px] rounded-[32px] bg-white p-6"
						>
							<View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF5F5]">
								<Wind color="#F87171" size={24} />
							</View>
							<Text className="font-bold text-[#1A2138] text-lg leading-tight">
								Deep Breathing
							</Text>
							<View className="mt-2 flex-row items-center">
								<Text className="text-[#94A3B8] text-sm">5 mins</Text>
								<ChevronRight color="#CBD5E1" size={16} />
							</View>
						</TouchableOpacity>
					</ScrollView>
				</View>

				{/* --- 4. Healing Score Chart --- */}
				<View className="mb-10">
					<Text className="mb-5 font-bold text-white text-xl">
						Healing Score
					</Text>
					<View
						className="w-full overflow-hidden rounded-[40px] border border-white/5 bg-white/5 p-8"
						style={{ backdropFilter: "blur(20px)" }}
					>
						<View className="flex-row items-center justify-between pb-4">
							<View>
								<Text className="font-black text-[44px] text-white">91%</Text>
								<Text className="text-[#94A3B8] text-sm">Vitality Trend</Text>
							</View>
							<View className="flex-row items-center gap-1.5 rounded-full bg-[#3EC9B515] px-3 py-1">
								<TrendingUp color="#3EC9B5" size={14} />
								<Text className="font-bold text-[#3EC9B5] text-xs">+12%</Text>
							</View>
						</View>

						{/* Mini Line Chart (Static SVG for POC) */}
						<View className="h-24 w-full">
							<Svg height="100%" width="100%">
								<Path
									d="M0 60 Q 40 50, 80 70 T 160 40 T 240 50 T 320 10"
									fill="none"
									stroke="#3EC9B5"
									strokeLinecap="round"
									strokeWidth="4"
								/>
								<Circle cx="320" cy="10" fill="#3EC9B5" r="4" />
							</Svg>
						</View>
					</View>
				</View>

				{/* --- 5. EZBuddy Floating Card (Mini) --- */}
				<TouchableOpacity
					activeOpacity={0.95}
					className="h-24 w-full flex-row items-center overflow-hidden rounded-[32px] bg-[#1A2138] px-6"
					onPress={() => router.push("/chat")}
				>
					<View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
						<MessageSquare color="#3EC9B5" size={24} />
					</View>
					<View className="ml-4 flex-1">
						<Text className="font-bold text-lg text-white">
							Talk to EZBuddy
						</Text>
						<Text className="text-[#94A3B8] text-sm">
							Instant wellness guidance
						</Text>
					</View>
					<View className="h-10 w-10 items-center justify-center rounded-full bg-white/5">
						<ChevronRight color="#3EC9B5" size={20} />
					</View>
				</TouchableOpacity>
			</ScrollView>

			{/* --- Fake Bottom Nav (Visual Only) --- */}
			<View className="absolute right-0 bottom-0 left-0 h-24 flex-row items-center justify-around border-white/5 border-t bg-[#0B0E17]/95 px-6 pb-6 shadow-2xl backdrop-blur-md">
				<TouchableOpacity className="items-center gap-1">
					<Heart color="#3EC9B5" size={24} />
					<View className="h-1.5 w-1.5 rounded-full bg-[#3EC9B5]" />
				</TouchableOpacity>
				<TouchableOpacity className="items-center gap-1">
					<Activity color="#60708F" size={24} />
				</TouchableOpacity>
				<TouchableOpacity className="items-center gap-1">
					<Text className="font-bold text-[#60708F] text-xs">Profile</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}
