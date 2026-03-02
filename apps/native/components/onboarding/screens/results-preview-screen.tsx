import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
	Animated,
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
				{ icon: "🔴", text: "High stress levels detected" },
				{ icon: "⚠️", text: "Poor sleep quality metrics" },
				{ icon: "❌", text: "Limited physical activity" },
			];
		}
		if (score < 70) {
			return [
				{ icon: "🟡", text: "Moderate stress indicators" },
				{ icon: "🟡", text: "Variable sleep patterns" },
				{ icon: "🟡", text: "Inconsistent lifestyle habits" },
			];
		}
		return [
			{ icon: "✅", text: "Good lifestyle balance" },
			{ icon: "✅", text: "Consistent wellness routines" },
			{ icon: "✅", text: "Active health mindset" },
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
					className={`${scoreInfo.bg} mb-4 items-center rounded-[32px] border border-white p-6 shadow-blue-100/50 shadow-xl`}
				>
					<View className="relative h-[160px] w-[160px] items-center justify-center">
						<Svg height={160} viewBox="0 0 160 160" width={160}>
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
							{/* Background Track */}
							<Circle
								cx="80"
								cy="80"
								fill="none"
								r="70"
								stroke="#E2E8F0"
								strokeWidth="10"
							/>
							{/* Progress Bar (Animated) */}
							<Circle
								cx="80"
								cy="80"
								fill="none"
								r="70"
								stroke="url(#scoreGradient)"
								strokeDasharray={`${(displayScore / 100) * 440} 440`}
								strokeLinecap="round"
								strokeWidth="12"
								transform="rotate(-90 80 80)"
							/>
						</Svg>
						<View className="absolute items-center justify-center">
							<Text className="font-bold text-5xl text-ezcare-navy">
								{displayScore}
							</Text>
							<Text className="font-medium text-ezcare-slate text-sm">
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
								<Text className="text-lg">{cause.icon}</Text>
							</View>
							<Text className="font-medium text-[#29303D]">{cause.text}</Text>
						</View>
					))}
				</View>

				{/* Premium Plan Preview Section */}
				<View className="mb-4">
					<Text className="mb-3 font-bold text-ezcare-navy text-xl">
						Your Customized Protocol
					</Text>

					<View className="relative overflow-hidden rounded-[32px] border border-blue-50 bg-white p-6 shadow-2xl">
						{/* Faded/Skeleton Content Backdrop */}
						<View className="opacity-20 gap-y-4">
							<View className="flex-row items-center gap-4">
								<View className="h-12 w-12 rounded-full bg-blue-200" />
								<View className="flex-1 gap-y-2">
									<View className="h-3.5 w-3/4 rounded-full bg-slate-300" />
									<View className="h-2.5 w-1/2 rounded-full bg-slate-200" />
								</View>
							</View>
							<View className="flex-row items-center gap-4">
								<View className="h-12 w-12 rounded-full bg-emerald-200" />
								<View className="flex-1 gap-y-2">
									<View className="h-3.5 w-5/6 rounded-full bg-slate-300" />
									<View className="h-2.5 w-2/3 rounded-full bg-slate-200" />
								</View>
							</View>
							<View className="flex-row items-center gap-4">
								<View className="h-12 w-12 rounded-full bg-rose-200" />
								<View className="flex-1 gap-y-2">
									<View className="h-3.5 w-2/3 rounded-full bg-slate-300" />
									<View className="h-2.5 w-1/3 rounded-full bg-slate-200" />
								</View>
							</View>
						</View>

						{/* Premium Unlock Frosted Overlay */}
						<View className="absolute inset-0 items-center justify-center bg-white/75">
							<View className="items-center rounded-3xl border border-blue-100 bg-blue-50/90 px-8 py-5 shadow-sm">
								<Text className="mb-2 text-3xl">🧩</Text>
								<Text className="font-bold text-lg text-ezcare-navy text-center tracking-tight">
									Hidden AI Intelligence
								</Text>
								<Text className="mt-1 font-medium text-center text-xs text-ezcare-slate">
									Unlock to reveal your exact daily tasks
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Methodology Card */}
				<View className="mb-5 rounded-[16px] border border-blue-100 bg-blue-50/50 p-4">
					<Text className="mb-2 font-bold text-[#28B898] text-xs uppercase tracking-widest">
						Our Methodology
					</Text>
					<Text className="text-blue-900/70 text-sm leading-6">
						Our AI health core evaluates over 40 biomarkers including sleep
						latency, cortisol-related stress signals, and physical activity
						baselines to forecast your longevity score.
					</Text>
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
