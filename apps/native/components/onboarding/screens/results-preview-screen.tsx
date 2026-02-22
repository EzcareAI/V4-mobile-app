import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
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

const ZONE_NAMES = {
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
	} = useOnboardingStore();

	const [score, setScore] = useState(0);

	useEffect(() => {
		const computed = computeHealthScore();
		setScore(computed);
		setAnswer("healthScore", computed);
		setAnswer("resultsShown", new Date().toISOString());
	}, [computeHealthScore, setAnswer]);

	const scoreInfo = getScoreColor(score);

	const handleUnlock = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {
				/* ignore */
			}
		}
		nextStep();
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

	return (
		<ScrollView
			className="flex-1 bg-background"
			showsVerticalScrollIndicator={false}
		>
			{/* Premium Header */}
			<View className="relative px-6 pt-10 pb-12">
				<LinearGradient
					colors={["#F8FAFC", "#F1F5F9"]}
					style={StyleSheet.absoluteFill}
				/>
				<Text className="mb-2 text-center font-bold text-[28px] text-foreground tracking-tight">
					Your Health Core is Ready ✨
				</Text>
				<Text className="mb-10 text-center text-[17px] text-muted-foreground leading-6">
					We've analyzed your data to create your personalized blueprint.
				</Text>

				{/* Elevated Health Score Display */}
				<View
					className={`${scoreInfo.bg} mb-6 items-center rounded-[40px] border border-white p-10 shadow-2xl shadow-blue-100/50`}
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
							{/* Progress Bar */}
							<Circle
								cx="80"
								cy="80"
								fill="none"
								r="70"
								stroke="url(#scoreGradient)"
								strokeDasharray={`${(score / 100) * 440} 440`}
								strokeLinecap="round"
								strokeWidth="12"
								transform="rotate(-90 80 80)"
							/>
						</Svg>
						<View className="absolute items-center justify-center">
							<Text className="font-bold text-5xl text-foreground">
								{score}
							</Text>
							<Text className="font-medium text-muted-foreground text-sm">
								/ 100
							</Text>
						</View>
					</View>

					<Text
						className={`mt-6 text-center font-bold text-xl ${scoreInfo.text}`}
					>
						{getStatusText()}
					</Text>
				</View>
			</View>

			{/* Main Content Sections */}
			<View className="px-6 py-8">
				{/* Focus Area Card */}
				{intentType === "zone" && bodyZoneSelected && (
					<View className="mb-8 overflow-hidden rounded-[32px] border border-blue-50 bg-white p-6 shadow-blue-50/50 shadow-xl">
						<View className="flex-row items-center gap-4">
							<View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
								<Text className="text-2xl">📍</Text>
							</View>
							<View>
								<Text className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Area of Primary Focus
								</Text>
								<Text className="font-bold text-foreground text-xl">
									{ZONE_NAMES[bodyZoneSelected as keyof typeof ZONE_NAMES] ||
										bodyZoneSelected}
								</Text>
							</View>
						</View>
					</View>
				)}

				{/* Probable Causes with Rich Icons */}
				<View className="mb-10">
					<Text className="mb-6 font-bold text-2xl text-foreground">
						Personal Insights
					</Text>
					{probableCauses.map((cause) => (
						<View
							className="mb-4 flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
							key={cause.text}
						>
							<View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
								<Text className="text-lg">{cause.icon}</Text>
							</View>
							<Text className="font-medium text-ezcare-navy">{cause.text}</Text>
						</View>
					))}
				</View>

				{/* Premium Plan Preview Section */}
				<View className="mb-10">
					<Text className="mb-6 font-bold text-2xl text-foreground">
						Your Customized Plan
					</Text>

					<View className="relative overflow-hidden rounded-[32px] bg-slate-900 p-8 shadow-2xl">
						<View className="opacity-20">
							<View className="mb-8">
								<View className="mb-4 h-4 w-1/2 rounded bg-white/20" />
								<View className="mb-2 h-3 w-3/4 rounded bg-white/10" />
								<View className="h-3 w-2/3 rounded bg-white/10" />
							</View>
							<View>
								<View className="mb-4 h-4 w-1/3 rounded bg-white/20" />
								<View className="mb-2 h-3 w-4/5 rounded bg-white/10" />
								<View className="h-3 w-3/4 rounded bg-white/10" />
							</View>
						</View>

						{/* Premium Unlock Overlay */}
						<View className="absolute inset-0 items-center justify-center bg-slate-900/40">
							<View className="items-center rounded-3xl border border-white/20 bg-white/10 px-6 py-4">
								<Text className="font-bold text-base text-white">
									🔒 Personalized Logic Locked
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Methodology Card */}
				<View className="mb-12 rounded-[24px] border border-blue-100 bg-blue-50/50 p-6">
					<Text className="mb-2 font-bold text-[#00A8A8] text-xs uppercase tracking-widest">
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
					className="mb-12 overflow-hidden rounded-[28px] shadow-2xl shadow-[#00A8A8]/30"
					onPress={handleUnlock}
				>
					<LinearGradient
						colors={["#00A8A8", "#2DE2E2"]}
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
			</View>
		</ScrollView>
	);
}
