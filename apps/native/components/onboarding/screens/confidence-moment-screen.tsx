import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Text, View, Animated, StyleSheet } from "react-native";
import { useEffect, useRef } from "react";
import { THEME } from "@/lib/theme";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

const BENEFITS = [
	{
		emoji: "🎯",
		title: "Personalized 7-day roadmap",
		desc: "A step-by-step natural health plan built around your answers.",
	},
	{
		emoji: "🤖",
		title: "EZBuddy AI guidance",
		desc: "Your AI health coach available 24/7 to support your journey.",
	},
	{
		emoji: "📊",
		title: "Health score & progress tracking",
		desc: "Watch your wellbeing improve with measurable milestones.",
	},
	{
		emoji: "💪",
		title: "Dopamine rewards & momentum",
		desc: "Small wins that keep you consistent and motivated every day.",
	},
];

const BADGES = [
	{ emoji: "✓", label: "Clinically\nTrusted" },
	{ emoji: "🌿", label: "100%\nNatural" },
	{ emoji: "🔒", label: "Your Data\nProtected" },
];

const FireworkParticle = ({ delay, angle, distance, color }: { delay: number, angle: number, distance: number, color: string }) => {
	const progress = useRef(new Animated.Value(0)).current;
	
	useEffect(() => {
		Animated.sequence([
			Animated.delay(delay),
			Animated.spring(progress, {
				toValue: 1,
				friction: 6,
				tension: 40,
				useNativeDriver: true,
			})
		]).start();
	}, []);

	const translateX = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [0, Math.cos(angle) * distance]
	});
	const translateY = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [0, Math.sin(angle) * distance]
	});
	const opacity = progress.interpolate({
		inputRange: [0, 0.7, 1],
		outputRange: [1, 1, 0]
	});
	const scale = progress.interpolate({
		inputRange: [0, 0.2, 1],
		outputRange: [0, 1.5, 0]
	});

	return (
		<Animated.View
			style={{
				position: 'absolute',
				width: 10,
				height: 10,
				borderRadius: 5,
				backgroundColor: color,
				transform: [{ translateX }, { translateY }, { scale }],
				opacity,
				zIndex: 100
			}}
		/>
	);
}

const Fireworks = () => {
	const particles = Array.from({ length: 45 }).map((_, i) => ({
		id: i,
		angle: (Math.PI * 2 * i) / 20 + (Math.random() * 0.8),
		distance: 80 + Math.random() * 120, // shoot out pretty far
		delay: Math.random() * 400,
		color: ['#F59E0B', '#10B981', '#3EC9B5', '#EC4899', '#8B5CF6', '#38BDF8'][Math.floor(Math.random() * 6)]
	}));

	return (
		<View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 50 }]} pointerEvents="none">
			{particles.map(p => (
				<FireworkParticle key={p.id} {...p} />
			))}
		</View>
	);
}

export function ConfidenceMomentScreen() {
	const router = useRouter();
	const { nextStep, currentStep } = useOnboardingStore();

	const handleContinue = () => {
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					showsVerticalScrollIndicator={false}
				>
					<View className="px-1">
						{/* Mascot Header */}
						<View className="mt-2 items-center">
							<View className="relative">
								<Fireworks />
								<LinearGradient
									colors={THEME.accentGradient}
									start={{ x: 0, y: 0 }}
									style={{
										height: 120,
										width: 120,
										borderRadius: 60,
										alignItems: "center",
										justifyContent: "center",
										shadowColor: THEME.accentShadow,
										shadowOffset: { width: 0, height: 10 },
										shadowOpacity: 0.25,
										shadowRadius: 15,
										elevation: 10,
									}}
								>
									<Text style={{ fontSize: 56 }}>🎉</Text>
								</LinearGradient>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-0"
							description="You've given us exactly what we need to build your personalized health plan."
							title="Great job!"
						/>

						{/* Benefits Card */}
						<View className="mt-4 rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-xl">
							<Text className="mb-4 font-bold text-[#0d2137] text-base">
								✨ Your Plan Includes:
							</Text>
							<View className="gap-y-4">
								{BENEFITS.map((b) => (
									<View className="flex-row items-start gap-3" key={b.emoji}>
										<View
											className="h-10 w-10 shrink-0 items-center justify-center rounded-xl"
											style={{ backgroundColor: THEME.accentBg }}
										>
											<Text style={{ fontSize: 18 }}>{b.emoji}</Text>
										</View>
										<View className="flex-1">
											<Text className="font-bold text-[#0d2137] text-sm">
												{b.title}
											</Text>
											<Text className="mt-0.5 text-[#73808C] text-xs leading-4">
												{b.desc}
											</Text>
										</View>
									</View>
								))}
							</View>
						</View>

						{/* Trust Badges */}
						<View className="mt-6 flex-row justify-center gap-6">
							{BADGES.map((b) => (
								<View className="items-center" key={b.label}>
									<View
										className="mb-2 h-12 w-12 items-center justify-center rounded-2xl"
										style={{ backgroundColor: THEME.accentBg }}
									>
										<Text style={{ fontSize: 22 }}>{b.emoji}</Text>
									</View>
									<Text className="text-center font-semibold text-[#73808C] text-xs">
										{b.label}
									</Text>
								</View>
							))}
						</View>
					</View>
				</ScrollView>

				<View className="pt-6">
					<ContinueButton label="See Your Results →" onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
}
