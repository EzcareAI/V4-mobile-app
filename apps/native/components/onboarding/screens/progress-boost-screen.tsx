/**
 * ProgressBoostScreen — "Your Health Core" (Step 12).
 *
 * Features:
 *  - Animated entrance: mascot scales in, cards fade/slide up in stagger.
 *  - Tap-to-expand: each pillar card reveals its description on tap.
 *  - Micro-interaction: card presses scale down slightly.
 *  - Qualitative status label: "Action Plan Ready ✓"
 *  - Uses React Native's built-in Animated API (no new dependencies).
 */
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { THEME } from "@/lib/theme";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

// ── Pillar card data ──────────────────────────────────────────────────────────
const PILLARS = [
	{
		emoji: "🎯",
		title: "Personalized to YOUR body",
		desc: "Matches your lifestyle, metabolism, and health goals. No one-size-fits-all templates.",
		label: "Strong",
		labelColor: "#16A34A",
		labelBg: "#F0FDF4",
	},
	{
		emoji: "🌿",
		title: "Simple enough to actually follow",
		desc: "No extreme measures — natural, sustainable changes that stick for the long term.",
		label: "Improving",
		labelColor: "#0284C7",
		labelBg: "#F0F9FF",
	},
	{
		emoji: "🔬",
		title: "Science-backed & natural",
		desc: "Evidence-based protocols that your body is designed to respond to positively.",
		label: "Strong",
		labelColor: "#16A34A",
		labelBg: "#F0FDF4",
	},
	{
		emoji: "⚡",
		title: "Achievable from day one",
		desc: "Quick wins that build momentum and create lasting healthy habits step by step.",
		label: "Needs Attention",
		labelColor: "#D97706",
		labelBg: "#FFFBEB",
	},
] as const;

// ── Animated pillar card ──────────────────────────────────────────────────────
const PillarCard = ({
	pillar,
	delay,
}: {
	pillar: (typeof PILLARS)[number];
	delay: number;
}) => {
	const [expanded, setExpanded] = useState(false);
	const translateY = useRef(new Animated.Value(24)).current;
	const opacity = useRef(new Animated.Value(0)).current;
	const scale = useRef(new Animated.Value(1)).current;

	// Staggered entrance
	useEffect(() => {
		Animated.parallel([
			Animated.timing(translateY, {
				toValue: 0,
				duration: 380,
				delay,
				useNativeDriver: true,
			}),
			Animated.timing(opacity, {
				toValue: 1,
				duration: 380,
				delay,
				useNativeDriver: true,
			}),
		]).start();
	}, [delay, translateY, opacity]);

	// Press-in / press-out scale micro-interaction
	const handlePressIn = () => {
		Animated.spring(scale, {
			toValue: 0.97,
			useNativeDriver: true,
			speed: 40,
			bounciness: 4,
		}).start();
	};
	const handlePressOut = () => {
		Animated.spring(scale, {
			toValue: 1,
			useNativeDriver: true,
			speed: 20,
			bounciness: 6,
		}).start();
	};

	return (
		<Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
			<Pressable
				onPress={() => setExpanded((v) => !v)}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
			>
				<View
					className="rounded-2xl border border-white/60 bg-white/90 p-4"
					style={{
						shadowColor: THEME.accentShadow,
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.06,
						shadowRadius: 8,
						elevation: 2,
					}}
				>
					<View className="flex-row items-center justify-between">
						<View className="flex-1 flex-row items-center gap-3">
							{/* Emoji badge */}
							<View
								className="h-10 w-10 shrink-0 items-center justify-center rounded-xl"
								style={{ backgroundColor: THEME.accentBg }}
							>
								<Text style={{ fontSize: 18 }}>{pillar.emoji}</Text>
							</View>

							{/* Title + qualitative label */}
							<View className="flex-1">
								<Text className="font-bold text-[#0d2137] text-sm leading-5">
									{pillar.title}
								</Text>
								<View
									className="mt-1 self-start rounded-full px-2 py-0.5"
									style={{ backgroundColor: pillar.labelBg }}
								>
									<Text
										className="font-semibold text-[10px]"
										style={{ color: pillar.labelColor }}
									>
										{pillar.label}
									</Text>
								</View>
							</View>
						</View>

						{/* Expand chevron */}
						{expanded ? (
							<ChevronUp color={THEME.accent} size={16} />
						) : (
							<ChevronDown color={THEME.accent} size={16} />
						)}
					</View>

					{/* Expandable body */}
					{expanded && (
						<Text className="mt-3 pl-13 text-[#64748B] text-xs leading-5">
							{pillar.desc}
						</Text>
					)}
				</View>
			</Pressable>
		</Animated.View>
	);
};

// ── Main screen ───────────────────────────────────────────────────────────────
export function ProgressBoostScreen() {
	const router = useRouter();
	const { nextStep } = useOnboardingStore();

	// Mascot entrance animation
	const mascotScale = useRef(new Animated.Value(0.6)).current;
	const mascotOpacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.spring(mascotScale, {
				toValue: 1,
				useNativeDriver: true,
				speed: 10,
				bounciness: 14,
			}),
			Animated.timing(mascotOpacity, {
				toValue: 1,
				duration: 350,
				useNativeDriver: true,
			}),
		]).start();
	}, [mascotScale, mascotOpacity]);

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/14");
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-5 pb-6">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
					showsVerticalScrollIndicator={false}
				>
					<View className="px-1">
						{/* Mascot — animated entrance */}
						<Animated.View
							className="mt-6 items-center"
							style={{
								opacity: mascotOpacity,
								transform: [{ scale: mascotScale }],
							}}
						>
							<View className="relative">
								<LinearGradient
									colors={THEME.accentGradient}
									start={{ x: 0, y: 0 }}
									style={{
										height: 112,
										width: 112,
										borderRadius: 56,
										alignItems: "center",
										justifyContent: "center",
										shadowColor: THEME.accentShadow,
										shadowOffset: { width: 0, height: 10 },
										shadowOpacity: 0.3,
										shadowRadius: 18,
										elevation: 12,
									}}
								>
									<Text style={{ fontSize: 52 }}>🚀</Text>
								</LinearGradient>
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white"
									style={{
										backgroundColor: THEME.accentLight,
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 14 }}>💡</Text>
								</View>
							</View>
						</Animated.View>

						<StepHeader
							align="center"
							className="mt-5"
							description="Your personalized health plan is taking shape. Tap each card to explore what's included."
							title="Your Health Core is Ready"
						/>

						{/* Action plan ready badge */}
						<View
							className="mt-3 mb-5 flex-row items-center gap-2 self-center rounded-full px-4 py-2"
							style={{ backgroundColor: THEME.accentBg }}
						>
							<Text
								className="font-bold text-[12px]"
								style={{ color: THEME.accent }}
							>
								✓ Action Plan Ready
							</Text>
						</View>

						{/* Pillar cards with staggered entrance + tap-to-expand */}
						<View className="gap-y-3">
							{PILLARS.map((pillar, i) => (
								<PillarCard delay={i * 80} key={pillar.title} pillar={pillar} />
							))}
						</View>

						{/* Motivational footer note */}
						<View
							className="mt-5 rounded-2xl p-4"
							style={{ backgroundColor: THEME.accentBg }}
						>
							<Text
								className="text-center font-medium text-sm"
								style={{ color: THEME.accent }}
							>
								💡 The next questions help us pinpoint exactly where to focus
								your plan.
							</Text>
						</View>
					</View>
				</ScrollView>

				
					<ContinueButton onPress={handleContinue} />
				
			</View>
		</View>
	);
}
