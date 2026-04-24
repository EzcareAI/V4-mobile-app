import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
	Activity,
	Brain,
	ChevronRight,
	Dna,
	Dumbbell,
	FlaskConical,
	GraduationCap,
	HeartPulse,
	Microscope,
	Moon,
	Sparkles,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
	Animated,
	Dimensions,
	Linking,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Svg, {
	Circle,
	Defs,
	Stop,
	LinearGradient as SvgGradient,
} from "react-native-svg";
import { useOnboardingStore } from "@/stores/onboarding-store";

const ZONE_NAMES: Record<string, string> = {
	head: "Mental Clarity",
	chest: "Respiratory",
	stomach: "Digestion",
	joints: "Joint Comfort",
	inflammation: "Immune System",
	energy: "Energy Levels",
};

const getScoreColor = (score: number) => {
	if (score >= 70) {
		return {
			bg: "bg-emerald-50",
			border: "border-emerald-100",
			text: "text-emerald-700",
			gradient: ["#10B981", "#2DE2E2"],
		};
	}
	if (score >= 50) {
		return {
			bg: "bg-amber-50",
			border: "border-amber-100",
			text: "text-amber-700",
			gradient: ["#F59E0B", "#FBBF24"],
		};
	}
	return {
		bg: "bg-rose-50",
		border: "border-rose-100",
		text: "text-rose-700",
		gradient: ["#EF4444", "#F87171"],
	};
};

const PulseRing = ({ delay = 0, color = "#10B981" }) => {
	const pulseAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.delay(delay),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 2500,
					useNativeDriver: true,
				}),
			])
		).start();
	}, [pulseAnim, delay]);

	const scale = pulseAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0.8, 1.8],
	});

	const opacity = pulseAnim.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: [0, 0.4, 0],
	});

	const pulseSize = Math.min(Dimensions.get("window").width * 0.55, 220);
	return (
		<Animated.View
			style={{
				position: "absolute",
				width: pulseSize,
				height: pulseSize,
				borderRadius: pulseSize / 2,
				borderWidth: 2,
				borderColor: color,
				transform: [{ scale }],
				opacity,
			}}
		/>
	);
};

interface TwinkleStarProps {
	delay?: number;
	size?: number;
	color?: string;
	top?: number;
	left?: number;
	right?: number;
	bottom?: number;
}

const TwinkleStar = ({
	delay = 0,
	size = 20,
	color = "#FBBF24",
	top,
	left,
	right,
	bottom,
}: TwinkleStarProps) => {
	const twinkleAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.delay(delay),
				Animated.timing(twinkleAnim, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
				}),
				Animated.timing(twinkleAnim, {
					toValue: 0,
					duration: 1000,
					useNativeDriver: true,
				}),
			])
		).start();
	}, [twinkleAnim, delay]);

	return (
		<Animated.View
			style={{
				position: "absolute",
				top,
				left,
				right,
				bottom,
				opacity: twinkleAnim,
				transform: [
					{
						scale: twinkleAnim.interpolate({
							inputRange: [0, 1],
							outputRange: [0.5, 1.2],
						}),
					},
				],
				zIndex: 10,
			}}
		>
			<Sparkles color={color} fill={color} size={size} />
		</Animated.View>
	);
};

export default function ResultsPreviewScreen() {
	const {
		setAnswer,
		nextStep,
		computeHealthScore,
		bodyZoneSelected,
		intentType,
		currentStep,
		sleepQuality,
		stressLevel,
		activityLevel,
		smokingFrequency,
		alcoholFrequency,
		zoneSymptomIntensity,
		zoneFrequency,
		zoneDuration,
		overallPriority,
		overallBlocker,
		currentEnergyLevel,
		currentDigestionComfort,
		motivationLevel,
	} = useOnboardingStore();

	const router = useRouter();
	const [score, setScore] = useState(0);
	const [displayScore, setDisplayScore] = useState(0);

	// Animation Values
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnimY = useRef(new Animated.Value(40)).current;
	const floatAnimY = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const computed = computeHealthScore();
		setScore(computed);
		setAnswer("healthScore", computed);
		setAnswer("resultsShown", new Date().toISOString());

		// 1. Initial Entry Animation (Fade & Slide UP)
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 800,
				useNativeDriver: true,
			}),
			Animated.spring(slideAnimY, {
				toValue: 0,
				tension: 50,
				friction: 8,
				useNativeDriver: true,
			}),
		]).start();

		// 2. Continuous Floating Animation for the Score Circle
		Animated.loop(
			Animated.sequence([
				Animated.timing(floatAnimY, {
					toValue: -12,
					duration: 2000,
					useNativeDriver: true,
				}),
				Animated.timing(floatAnimY, {
					toValue: 0,
					duration: 2000,
					useNativeDriver: true,
				}),
			])
		).start();

		// 3. Ticker Animation for Score (0 to computed)
		let start = 0;
		const duration = 1500;
		const animateScore = (timestamp: number) => {
			if (!start) {
				start = timestamp;
			}
			const progress = Math.min((timestamp - start) / duration, 1);
			// Ease-out cubic polynomial
			const easeOut = 1 - (1 - progress) ** 3;
			setDisplayScore(Math.floor(easeOut * computed));

			if (progress < 1) {
				requestAnimationFrame(animateScore);
			}
		};
		requestAnimationFrame(animateScore);
	}, [computeHealthScore, setAnswer, fadeAnim, slideAnimY, floatAnimY]);

	const scoreInfo = getScoreColor(score);

	const handleUnlock = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {
				/* ignore */
			}
		}
		// Always navigate forward
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	const getPersonalInsights = () => {
		type Insight = { icon: React.ReactNode; iconBg: string; text: string };
		const insights: Insight[] = [];

		// ── Sleep-based insight ──
		if (sleepQuality !== undefined) {
			if (sleepQuality <= 2) {
				insights.push({
					icon: <Moon color="#8B5CF6" size={20} />,
					iconBg: "bg-purple-50",
					text: "Your sleep quality is low — better rest could boost your overall lifestyle",
				});
			} else if (sleepQuality >= 4) {
				insights.push({
					icon: <Moon color="#10B981" size={20} />,
					iconBg: "bg-emerald-50",
					text: "Great sleep habits — keep up the solid rest routine",
				});
			} else {
				insights.push({
					icon: <Moon color="#F59E0B" size={20} />,
					iconBg: "bg-amber-50",
					text: "Your sleep is fair — small improvements could make a big difference",
				});
			}
		}

		// ── Stress-based insight ──
		if (stressLevel === "high") {
			insights.push({
				icon: <HeartPulse color="#EF4444" size={20} />,
				iconBg: "bg-red-50",
				text: "High stress reported — relaxation and mindfulness could help",
			});
		} else if (stressLevel === "moderate") {
			insights.push({
				icon: <HeartPulse color="#F59E0B" size={20} />,
				iconBg: "bg-amber-50",
				text: "Moderate stress levels — building a consistent wind-down routine may help",
			});
		} else if (stressLevel === "low") {
			insights.push({
				icon: <HeartPulse color="#10B981" size={20} />,
				iconBg: "bg-emerald-50",
				text: "Low stress — you're managing well, keep it up",
			});
		}

		// ── Activity-based insight ──
		if (activityLevel !== undefined) {
			if (activityLevel <= 2) {
				insights.push({
					icon: <Dumbbell color="#F59E0B" size={20} />,
					iconBg: "bg-amber-50",
					text: "Low activity level — even light daily movement can improve how you feel",
				});
			} else if (activityLevel >= 4) {
				insights.push({
					icon: <Dumbbell color="#10B981" size={20} />,
					iconBg: "bg-emerald-50",
					text: "Active lifestyle — your exercise habits are a strong foundation",
				});
			}
		}

		// ── Zone-specific insight (if user chose a body zone) ──
		if (intentType === "zone" && bodyZoneSelected?.length > 0) {
			const zoneLabel = bodyZoneSelected.map(z => ZONE_NAMES[z] ?? z).join(" & ");
			if (zoneSymptomIntensity !== undefined && zoneSymptomIntensity >= 5) {
				insights.push({
					icon: <Activity color="#EF4444" size={20} />,
					iconBg: "bg-red-50",
					text: `Noticeable tension in ${zoneLabel} — targeted self-care could help`,
				});
			} else if (zoneSymptomIntensity !== undefined) {
				insights.push({
					icon: <Activity color="#3B82F6" size={20} />,
					iconBg: "bg-blue-50",
					text: `Mild tension in ${zoneLabel} — reflecting on this and gentle self-care recommended`,
				});
			}
			if (zoneFrequency === "constantly" || zoneDuration === "longterm") {
				insights.push({
					icon: <Brain color="#8B5CF6" size={20} />,
					iconBg: "bg-purple-50",
					text: `Ongoing ${zoneLabel} tension — consider consulting a professional if it persists`,
				});
			}
		}

		// ── Overall-health insight (if user chose "overall" intent) ──
		if (intentType === "overall") {
			if (overallPriority) {
				const priorityLabels: Record<string, string> = {
					energy: "energy levels",
					sleep: "sleep quality",
					digestion: "post-meal comfort",
					stress: "stress management",
					weight: "weight management",
				};
				insights.push({
					icon: <Brain color="#3B82F6" size={20} />,
					iconBg: "bg-blue-50",
					text: `Your top priority is ${priorityLabels[overallPriority] ?? overallPriority} — your plan will focus here`,
				});
			}
			if (currentEnergyLevel !== undefined && currentEnergyLevel <= 2) {
				insights.push({
					icon: <Activity color="#F59E0B" size={20} />,
					iconBg: "bg-amber-50",
					text: "Low energy reported — nutrition and rest improvements can help",
				});
			}
			if (currentDigestionComfort !== undefined && currentDigestionComfort <= 2) {
				insights.push({
					icon: <HeartPulse color="#F59E0B" size={20} />,
					iconBg: "bg-amber-50",
					text: "Post-meal comfort noted — dietary adjustments may help",
				});
			}
		}

		// ── Smoking / Alcohol insights ──
		if (smokingFrequency === "regularly") {
			insights.push({
				icon: <Activity color="#EF4444" size={20} />,
				iconBg: "bg-red-50",
				text: "Regular smoking impacts overall lifestyle — reducing intake can help significantly",
			});
		}
		if (alcoholFrequency === "often") {
			insights.push({
				icon: <Activity color="#F59E0B" size={20} />,
				iconBg: "bg-amber-50",
				text: "Frequent alcohol use reported — moderation could improve sleep and energy",
			});
		}

		// ── Motivation boost (if high) ──
		if (motivationLevel !== undefined && motivationLevel >= 4) {
			insights.push({
				icon: <Sparkles color="#10B981" size={20} />,
				iconBg: "bg-emerald-50",
				text: "High motivation — you're in a great mindset to build lasting habits",
			});
		}

		// Ensure we always show at least 2 and at most 4 insights
		if (insights.length === 0) {
			insights.push(
				{
					icon: <Activity color="#3B82F6" size={20} />,
					iconBg: "bg-blue-50",
					text: "Your awareness journey is just getting started — let's build great habits",
				},
				{
					icon: <Brain color="#10B981" size={20} />,
					iconBg: "bg-emerald-50",
					text: "Consistency is key — small daily actions add up over time",
				},
			);
		}

		return insights.slice(0, 4);
	};

	const personalInsights = getPersonalInsights();

	const getStatusText = () => {
		if (score >= 70) {
			return "Excellent Awareness Potential";
		}
		if (score >= 50) {
			return "Good Awareness Baseline";
		}
		return "Room for Growth";
	};

	// Display label for selected zones
	const primaryZone =
		bodyZoneSelected && bodyZoneSelected.length > 0
			? bodyZoneSelected[0]
			: null;
	const primaryZoneName = primaryZone
		? (ZONE_NAMES[primaryZone] ?? primaryZone)
		: null;
	const extraZones =
		bodyZoneSelected && bodyZoneSelected.length > 1
			? ` +${bodyZoneSelected.length - 1} more`
			: "";

	return (
		<ScrollView
			className="flex-1 bg-[#EBF5F4]"
			showsVerticalScrollIndicator={false}
		>
			{/* Premium Header */}
			<Animated.View
				className="relative px-6 pt-6 pb-6"
				style={{ opacity: fadeAnim }}
			>
				<LinearGradient
					colors={["#F8FAFC", "#F1F5F9"]}
					style={StyleSheet.absoluteFill}
				/>
				<Text className="mb-2 text-center font-bold text-[24px] text-ezcare-navy tracking-tight">
					Your AI Blueprint is Ready 🚀
				</Text>
				<Text className="mb-5 px-2 text-center text-[15px] text-ezcare-slate leading-6">
					We've reviewed your responses to create a personalized
					awareness plan tailored to your lifestyle.
				</Text>

				{/* Elevated Awareness Score Display */}
				<Animated.View
					className={`${scoreInfo.bg} mb-4 items-center overflow-hidden rounded-[32px] border border-white p-6 shadow-blue-100/50 shadow-xl`}
					style={{ transform: [{ translateY: floatAnimY }] }}
				>
					{/* Premium Magical Fireworks/Sparkles overlay */}
					<TwinkleStar
						color="#FBBF24"
						delay={100}
						left={10}
						size={32}
						top={10}
					/>
					<TwinkleStar
						color="#2DE2E2"
						delay={800}
						right={15}
						size={24}
						top={30}
					/>
					<TwinkleStar
						bottom={20}
						color="#FACC15"
						delay={400}
						left={25}
						size={36}
					/>
					<TwinkleStar
						bottom={40}
						color="#10B981"
						delay={1200}
						right={20}
						size={28}
					/>
					<TwinkleStar
						color="#60A5FA"
						delay={1600}
						left={-5}
						size={20}
						top={80}
					/>

					{(() => {
						const screenW = Dimensions.get("window").width;
						const circleSize = Math.min(screenW * 0.55, 220);
						const half = circleSize / 2;
						const outerR = half - 8;
						const mainR = half * 0.382 * 2; // ~84 at 220
						const circumference = 2 * Math.PI * mainR;
						const scoreFontSize = Math.round(circleSize * 0.33);
						return (
						<View style={{ width: circleSize, height: circleSize, alignItems: "center", justifyContent: "center" }}>
							<PulseRing color={scoreInfo.gradient[0]} delay={0} />
							<PulseRing color={scoreInfo.gradient[1]} delay={800} />
							<PulseRing color={scoreInfo.gradient[0]} delay={1600} />

							<Svg height={circleSize} viewBox={`0 0 ${circleSize} ${circleSize}`} width={circleSize}>
								<Defs>
									<SvgGradient
										id="scoreGradient"
										x1="0%"
										x2="100%"
										y1="0%"
										y2="100%"
									>
										<Stop offset="0%" stopColor={scoreInfo.gradient[0]} />
										<Stop offset="100%" stopColor={scoreInfo.gradient[1]} />
									</SvgGradient>
								</Defs>

								<Circle
									cx={half}
									cy={half}
									fill="none"
									r={outerR}
									stroke="#E2E8F0"
									strokeDasharray="2 10"
									strokeWidth="3"
								/>

								<Circle
									cx={half}
									cy={half}
									fill="none"
									r={mainR}
									stroke="#F1F5F9"
									strokeWidth={Math.round(circleSize * 0.073)}
								/>

								<Circle
									cx={half}
									cy={half}
									fill="none"
									r={mainR}
									stroke="url(#scoreGradient)"
									strokeDasharray={`${(displayScore / 100) * circumference} ${circumference}`}
									strokeLinecap="round"
									strokeWidth={Math.round(circleSize * 0.073)}
									transform={`rotate(-90 ${half} ${half})`}
								/>
							</Svg>
							<View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
								<Text
									className="text-center font-black"
									style={{
										fontSize: scoreFontSize,
										color: scoreInfo.gradient[0],
										letterSpacing: -2,
										lineHeight: scoreFontSize + 2,
									}}
								>
									{displayScore}
								</Text>
								<Text className="mt-1 font-extrabold text-[#94A3B8] text-[11px] uppercase tracking-[0.2em]">
									/ 100
								</Text>
							</View>
						</View>
						);
					})()}

					<Text
						className={`mt-6 text-center font-bold text-xl ${scoreInfo.text}`}
					>
						{getStatusText()}
					</Text>
				</Animated.View>
			</Animated.View>

			{/* Main Content Sections */}
			<Animated.View
				className="px-6 py-4"
				style={{ opacity: fadeAnim, transform: [{ translateY: slideAnimY }] }}
			>
				{/* Focus Area Card */}
				{intentType === "zone" && primaryZoneName && (
					<View className="mb-8 overflow-hidden rounded-[24px] border border-red-500 bg-red-500 p-4 shadow-red-500/30 shadow-xl">
						<View className="flex-row items-center gap-4">
							<View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
								<Text className="text-2xl">📍</Text>
							</View>
							<View>
								<Text className="font-medium text-slate-200 text-xs uppercase tracking-wider">
									Area of Primary Focus
								</Text>
								<Text className="font-bold text-white text-xl">
									{primaryZoneName}
									{extraZones}
								</Text>
							</View>
						</View>
					</View>
				)}

				{/* Personal Insights */}
				<View className="mb-8">
					<Text className="mb-3 font-bold text-ezcare-navy text-xl">
						Personal Insights
					</Text>
					{personalInsights.map((insight) => (
						<View
							className="mb-2 flex-row items-center rounded-2xl bg-white p-3 shadow-sm"
							key={insight.text}
						>
							<View
								className={`mr-4 h-10 w-10 shrink-0 items-center justify-center rounded-xl ${insight.iconBg || "bg-slate-50"}`}
							>
								{insight.icon}
							</View>
							<Text className="flex-1 font-medium text-[#29303D]">
								{insight.text}
							</Text>
						</View>
					))}
				</View>

				{/* Methodology Options Card */}
				<View className="mb-5 overflow-hidden rounded-[24px] border border-[#F1F5F9] bg-[#F8FAFC] p-5">
					<View className="mb-3 flex-row items-center gap-3">
						<View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100/50">
							<FlaskConical color="#10B981" size={20} />
						</View>
						<Text className="font-extrabold text-[#1E293B] text-[20px] tracking-tight">
							Based on Science
						</Text>
					</View>

					<Text className="mb-5 font-medium text-[#64748B] text-[15px] leading-6">
						Your plan is backed by peer-reviewed research from leading
						institutions:
					</Text>

					{/* Research Links */}
					<View className="gap-y-3">
						{/* Harvard */}
						<TouchableOpacity
							activeOpacity={0.7}
							className="flex-row items-center rounded-[16px] border border-[#E2E8F0] bg-white p-4"
							onPress={() => Linking.openURL("https://sleep.hms.harvard.edu/")}
						>
							<View className="mr-4 items-center justify-center">
								<GraduationCap color="#DC2626" fill="#DC2626" size={24} />
							</View>
							<View className="flex-1">
								<Text className="font-bold text-[#1E293B] text-[15px]">
									Harvard Sleep Studies
								</Text>
								<Text className="mt-0.5 font-medium text-[#94A3B8] text-[13px]">
									Sleep optimization research
								</Text>
							</View>
							<ChevronRight color="#CBD5E1" size={20} />
						</TouchableOpacity>

						{/* PubMed */}
						<TouchableOpacity
							activeOpacity={0.7}
							className="flex-row items-center rounded-[16px] border border-[#E2E8F0] bg-white p-4"
							onPress={() =>
								Linking.openURL("https://pubmed.ncbi.nlm.nih.gov/")
							}
						>
							<View className="mr-4 items-center justify-center">
								<Microscope color="#2563EB" size={24} strokeWidth={2.5} />
							</View>
							<View className="flex-1">
								<Text className="font-bold text-[#1E293B] text-[15px]">
									PubMed Information Studies
								</Text>
								<Text className="mt-0.5 font-medium text-[#94A3B8] text-[13px]">
									Nutrition and lifestyle tips
								</Text>
							</View>
							<ChevronRight color="#CBD5E1" size={20} />
						</TouchableOpacity>

						{/* NIH */}
						<TouchableOpacity
							activeOpacity={0.7}
							className="flex-row items-center rounded-[16px] border border-[#E2E8F0] bg-white p-4"
							onPress={() =>
								Linking.openURL(
									"https://www.niddk.nih.gov/health-information/digestive-diseases"
								)
							}
						>
							<View className="mr-4 items-center justify-center">
								<Dna color="#16A34A" size={24} strokeWidth={2.5} />
							</View>
							<View className="flex-1">
								<Text className="font-bold text-[#1E293B] text-[15px]">
									NIH Digestion Research
								</Text>
								<Text className="mt-0.5 font-medium text-[#94A3B8] text-[13px]">
									Gut health optimization
								</Text>
							</View>
							<ChevronRight color="#CBD5E1" size={20} />
						</TouchableOpacity>
					</View>
				</View>

				{/* Fixed Floating CTA */}
				<TouchableOpacity
					activeOpacity={0.9}
					className="mx-2 mt-6 mb-16 overflow-hidden rounded-[24px] shadow-2xl shadow-[#28B898]/30"
					onPress={handleUnlock}
				>
					<LinearGradient
						colors={["#28B898", "#2DE2E2"]}
						end={{ x: 1, y: 0 }}
						start={{ x: 0, y: 0 }}
						style={StyleSheet.absoluteFill}
					/>
					<View className="px-8 py-5">
						<Text className="text-center font-bold text-white text-xl">
							Unlock Detailed Results
						</Text>
						<Text className="mt-1 text-center text-sm text-white/80">
							Instant access to your 7-day blueprint
						</Text>
					</View>
				</TouchableOpacity>
			</Animated.View>
		</ScrollView>
	);
}
