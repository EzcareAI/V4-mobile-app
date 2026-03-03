import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
	Animated,
	Linking,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { ChevronRight, Dna, FlaskConical, GraduationCap, Microscope, Moon, HeartPulse, Dumbbell, Activity, Brain, Sparkles } from "lucide-react-native";
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
	joints: "Joint Health",
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

	return (
		<Animated.View
			style={{
				position: "absolute",
				width: 220,
				height: 220,
				borderRadius: 110,
				borderWidth: 2,
				borderColor: color,
				transform: [{ scale }],
				opacity,
			}}
		/>
	);
};

const TwinkleStar = ({ delay = 0, size = 20, color = "#FBBF24", top, left, right, bottom }: any) => {
	const twinkleAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.delay(delay),
				Animated.timing(twinkleAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
				Animated.timing(twinkleAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
			])
		).start();
	}, [twinkleAnim, delay]);

	return (
		<Animated.View style={{ position: "absolute", top, left, right, bottom, opacity: twinkleAnim, transform: [{ scale: twinkleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] }) }], zIndex: 10 }}>
			<Sparkles color={color} size={size} fill={color} />
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
			if (!start) start = timestamp;
			const progress = Math.min((timestamp - start) / duration, 1);
			// Ease-out cubic polynomial
			const easeOut = 1 - Math.pow(1 - progress, 3);
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

	const getProbableCauses = () => {
		if (score < 50) {
			return [
				{ icon: <HeartPulse color="#EF4444" size={20} />, text: "High stress levels detected" },
				{ icon: <Moon color="#EF4444" size={20} />, text: "Poor sleep quality metrics" },
				{ icon: <Dumbbell color="#EF4444" size={20} />, text: "Limited physical activity" },
			];
		}
		if (score < 70) {
			return [
				{ icon: <HeartPulse color="#F59E0B" size={20} />, text: "Moderate stress indicators" },
				{ icon: <Moon color="#F59E0B" size={20} />, text: "Variable sleep patterns" },
				{ icon: <Activity color="#F59E0B" size={20} />, text: "Inconsistent lifestyle habits" },
			];
		}
		return [
			{ icon: <Activity color="#10B981" size={20} />, text: "Good lifestyle balance" },
			{ icon: <Brain color="#10B981" size={20} />, text: "Consistent wellness routines" },
			{ icon: <HeartPulse color="#10B981" size={20} />, text: "Active health mindset" },
		];
	};

	const probableCauses = getProbableCauses();

	const getStatusText = () => {
		if (score >= 70) {
			return "Excellent Wellness Potential";
		}
		if (score >= 50) {
			return "Good Baseline Health";
		}
		return "Immediate Attention Recommended";
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
			<Animated.View style={{ opacity: fadeAnim }} className="relative px-6 pt-6 pb-6">
				<LinearGradient
					colors={["#F8FAFC", "#F1F5F9"]}
					style={StyleSheet.absoluteFill}
				/>
				<Text className="mb-2 text-center font-bold text-[28px] text-ezcare-navy tracking-tight">
					Your AI Blueprint is Ready 🚀
				</Text>
				<Text className="mb-5 text-center text-[15px] text-ezcare-slate leading-6 px-2">
					We've analyzed 40+ distinct biomarkers to engineer a highly personalized longevity protocol for you.
				</Text>

				{/* Elevated Health Score Display */}
				<Animated.View
					style={{ transform: [{ translateY: floatAnimY }] }}
					className={`${scoreInfo.bg} mb-4 items-center rounded-[32px] border border-white p-6 shadow-blue-100/50 shadow-xl overflow-hidden`}
				>
					{/* Premium Magical Fireworks/Sparkles overlay */}
					<TwinkleStar delay={100} size={32} color="#FBBF24" top={10} left={10} />
					<TwinkleStar delay={800} size={24} color="#2DE2E2" top={30} right={15} />
					<TwinkleStar delay={400} size={36} color="#FACC15" bottom={20} left={25} />
					<TwinkleStar delay={1200} size={28} color="#10B981" bottom={40} right={20} />
					<TwinkleStar delay={1600} size={20} color="#60A5FA" top={80} left={-5} />

					<View className="relative h-[220px] w-[220px] items-center justify-center">
						<PulseRing delay={0} color={scoreInfo.gradient[0]} />
						<PulseRing delay={800} color={scoreInfo.gradient[1]} />
						<PulseRing delay={1600} color={scoreInfo.gradient[0]} />
						
						<Svg height={220} viewBox="0 0 220 220" width={220}>
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
							
							{/* Outer Decorative Tech Track */}
							<Circle
								cx="110"
								cy="110"
								fill="none"
								r="102"
								stroke="#E2E8F0"
								strokeDasharray="2 10"
								strokeWidth="3"
							/>
							
							{/* Background Main Track */}
							<Circle
								cx="110"
								cy="110"
								fill="none"
								r="84"
								stroke="#F1F5F9"
								strokeWidth="16"
							/>
							
							{/* Progress Bar (Animated) */}
							<Circle
								cx="110"
								cy="110"
								fill="none"
								r="84"
								stroke="url(#scoreGradient)"
								strokeDasharray={`${(displayScore / 100) * 527.7} 527.7`}
								strokeLinecap="round"
								strokeWidth="16"
								transform="rotate(-90 110 110)"
							/>
						</Svg>
						<View className="absolute items-center justify-center mt-2">
							<Text 
								className="text-center font-black" 
								style={{ fontSize: 72, color: scoreInfo.gradient[0], letterSpacing: -3, lineHeight: 74 }}
							>
								{displayScore}
							</Text>
							<Text className="font-extrabold text-[#94A3B8] text-[13px] uppercase tracking-[0.2em] mt-1">
								/ 100
							</Text>
						</View>
					</View>

					<Text
						className={`mt-6 text-center font-bold text-xl ${scoreInfo.text}`}
					>
						{getStatusText()}
					</Text>
				</Animated.View>
			</Animated.View>

			{/* Main Content Sections */}
			<Animated.View 
				style={{ opacity: fadeAnim, transform: [{ translateY: slideAnimY }] }} 
				className="px-6 py-4"
			>
				{/* Focus Area Card */}
				{intentType === "zone" && primaryZoneName && (
					<View className="mb-4 overflow-hidden rounded-[24px] border border-blue-50 bg-white p-4 shadow-blue-50/50 shadow-xl">
						<View className="flex-row items-center gap-4">
							<View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
								<Text className="text-2xl">📍</Text>
							</View>
							<View>
								<Text className="font-medium text-ezcare-slate text-xs uppercase tracking-wider">
									Area of Primary Focus
								</Text>
								<Text className="font-bold text-ezcare-navy text-xl">
									{primaryZoneName}
									{extraZones}
								</Text>
							</View>
						</View>
					</View>
				)}

				{/* Probable Causes with Rich Icons */}
				<View className="mb-4">
					<Text className="mb-3 font-bold text-ezcare-navy text-xl">
						Personal Insights
					</Text>
					{probableCauses.map((cause) => (
						<View
							className="mb-2 flex-row items-center rounded-2xl bg-white p-3 shadow-sm"
							key={cause.text}
						>
							<View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
								{cause.icon}
							</View>
							<Text className="font-medium text-[#29303D]">{cause.text}</Text>
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

					<Text className="mb-5 text-[#64748B] text-[15px] leading-6 font-medium">
						Your plan is backed by peer-reviewed research from leading institutions:
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
								<GraduationCap fill="#DC2626" color="#DC2626" size={24} />
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
							onPress={() => Linking.openURL("https://pubmed.ncbi.nlm.nih.gov/")}
						>
							<View className="mr-4 items-center justify-center">
								<Microscope strokeWidth={2.5} color="#2563EB" size={24} />
							</View>
							<View className="flex-1">
								<Text className="font-bold text-[#1E293B] text-[15px]">
									PubMed Information Studies
								</Text>
								<Text className="mt-0.5 font-medium text-[#94A3B8] text-[13px]">
									Anti-inflammatory protocols
								</Text>
							</View>
							<ChevronRight color="#CBD5E1" size={20} />
						</TouchableOpacity>

						{/* NIH */}
						<TouchableOpacity
							activeOpacity={0.7}
							className="flex-row items-center rounded-[16px] border border-[#E2E8F0] bg-white p-4"
							onPress={() => Linking.openURL("https://www.niddk.nih.gov/health-information/digestive-diseases")}
						>
							<View className="mr-4 items-center justify-center">
								<Dna strokeWidth={2.5} color="#16A34A" size={24} />
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
					className="mt-6 mb-16 overflow-hidden rounded-[24px] shadow-2xl shadow-[#28B898]/30 mx-2"
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
