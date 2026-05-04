/**
 * Awakening Ritual — A guided 60-second morning experience.
 *
 * 7 steps: Intro → Breath → Sleep → Energy → Intention → Generating → Quest Reveal
 * Replaces the basic check-in with a meditative, gamified flow.
 */

import { Ionicons } from "@expo/vector-icons";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Animated,
	Dimensions,
	Easing,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { levelsService } from "@/lib/levels-service";
import { streakService } from "@/lib/streak-service";
import { questGenerator, type Quest } from "@/lib/quest-generator";
import { supabase } from "@/lib/supabase";
import { mixpanelService } from "@/lib/mixpanel-service";
import { achievementsService } from "@/lib/achievements-service";

const { width: SW, height: SH } = Dimensions.get("window");

// ── Design Tokens ───────────────────────────────────
const BG = "#0A0A0F";
const SURFACE = "#1A1A24";
const PURPLE = "#9D4EDD";
const GREEN = "#06FFA5";
const GOLD = "#FFD60A";
const TEXT = "#F5F5F7";
const TEXT_DIM = "#8E8E93";

// ── Types ───────────────────────────────────────────
type RitualStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface RitualData {
	sleepScore: number;
	energyScore: number;
	intention: string;
	breathCompleted: boolean;
}

// ── Haptic helper ───────────────────────────────────
const haptic = (style: ImpactFeedbackStyle) => {
	if (Platform.OS === "ios") impactAsync(style).catch(() => {});
};

// ═══════════════════════════════════════════════════════
// STEP 0: INTRO
// ═══════════════════════════════════════════════════════
function IntroStep({ onNext, firstName, dayCount }: { onNext: () => void; firstName: string; dayCount: number }) {
	const fadeTitle = useRef(new Animated.Value(0)).current;
	const fadeSub = useRef(new Animated.Value(0)).current;
	const fadeTap = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.sequence([
			Animated.timing(fadeTitle, { toValue: 1, duration: 800, useNativeDriver: true }),
			Animated.timing(fadeSub, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
			Animated.timing(fadeTap, { toValue: 1, duration: 500, delay: 400, useNativeDriver: true }),
		]).start();

		// Auto-advance after 5 seconds
		const timer = setTimeout(() => onNext(), 5000);
		return () => clearTimeout(timer);
	}, [fadeTitle, fadeSub, fadeTap, onNext]);

	return (
		<TouchableOpacity activeOpacity={1} onPress={onNext} style={styles.stepContainer}>
			<LinearGradient
				colors={["#1A0A2E", "#2D1052", "#FF6B35"]}
				locations={[0, 0.6, 1]}
				start={{ x: 0.5, y: 0 }}
				end={{ x: 0.5, y: 1 }}
				style={StyleSheet.absoluteFill}
			/>
			<Animated.Text style={[styles.introGreeting, { opacity: fadeTitle }]}>
				Good morning{firstName ? `, ${firstName}` : ""}
			</Animated.Text>
			<Animated.Text style={[styles.introSub, { opacity: fadeSub }]}>
				Welcome to your awakening, Day {dayCount}
			</Animated.Text>
			<Animated.Text style={[styles.introTap, { opacity: fadeTap }]}>
				tap to continue
			</Animated.Text>
		</TouchableOpacity>
	);
}

// ═══════════════════════════════════════════════════════
// STEP 1: GUIDED BREATH (4-7-8 pattern)
// ═══════════════════════════════════════════════════════
type BreathPhase = "inhale" | "hold" | "exhale" | "done";
const BREATH_PHASES: { phase: BreathPhase; duration: number; label: string }[] = [
	{ phase: "inhale", duration: 4000, label: "Breathe in..." },
	{ phase: "hold", duration: 7000, label: "Hold..." },
	{ phase: "exhale", duration: 8000, label: "Exhale slowly..." },
];

function BreathStep({ onNext }: { onNext: () => void }) {
	const [phaseIdx, setPhaseIdx] = useState(0);
	const [phase, setPhase] = useState<BreathPhase>("inhale");
	const circleScale = useRef(new Animated.Value(1)).current;
	const fadeLabel = useRef(new Animated.Value(1)).current;
	const glowAnim = useRef(new Animated.Value(0.3)).current;
	const [countdown, setCountdown] = useState(4);

	useEffect(() => {
		if (phase === "done") {
			haptic(ImpactFeedbackStyle.Heavy);
			const timer = setTimeout(onNext, 800);
			return () => clearTimeout(timer);
		}

		const current = BREATH_PHASES[phaseIdx];
		if (!current) return;

		// Haptic at phase start
		haptic(phaseIdx === 0 ? ImpactFeedbackStyle.Light : phaseIdx === 1 ? ImpactFeedbackStyle.Medium : ImpactFeedbackStyle.Heavy);

		// Countdown
		const seconds = Math.ceil(current.duration / 1000);
		setCountdown(seconds);
		const countInterval = setInterval(() => {
			setCountdown((c) => Math.max(0, c - 1));
		}, 1000);

		// Circle animation
		const targetScale = phaseIdx === 0 ? 1.5 : phaseIdx === 1 ? 1.5 : 1;
		Animated.timing(circleScale, {
			toValue: targetScale,
			duration: current.duration,
			easing: Easing.inOut(Easing.ease),
			useNativeDriver: true,
		}).start();

		// Glow animation
		Animated.timing(glowAnim, {
			toValue: phaseIdx === 1 ? 0.8 : phaseIdx === 0 ? 0.6 : 0.3,
			duration: current.duration,
			useNativeDriver: true,
		}).start();

		// Advance to next phase
		const timer = setTimeout(() => {
			const nextIdx = phaseIdx + 1;
			if (nextIdx >= BREATH_PHASES.length) {
				setPhase("done");
			} else {
				setPhaseIdx(nextIdx);
				setPhase(BREATH_PHASES[nextIdx].phase);
				// Flash label
				Animated.sequence([
					Animated.timing(fadeLabel, { toValue: 0, duration: 150, useNativeDriver: true }),
					Animated.timing(fadeLabel, { toValue: 1, duration: 300, useNativeDriver: true }),
				]).start();
			}
		}, current.duration);

		return () => {
			clearTimeout(timer);
			clearInterval(countInterval);
		};
	}, [phaseIdx, phase, circleScale, fadeLabel, glowAnim, onNext]);

	const currentLabel = phase === "done" ? "Beautiful. You're present." : BREATH_PHASES[phaseIdx]?.label ?? "";

	return (
		<View style={styles.stepContainer}>
			<LinearGradient
				colors={["#0A0A2E", "#1A0A3E", "#0A0A2E"]}
				style={StyleSheet.absoluteFill}
			/>

			{/* Glow behind circle */}
			<Animated.View style={[styles.breathGlow, { opacity: glowAnim, transform: [{ scale: circleScale }] }]}>
				<LinearGradient
					colors={[`${PURPLE}40`, `${PURPLE}00`]}
					style={[StyleSheet.absoluteFill, { borderRadius: 200 }]}
				/>
			</Animated.View>

			{/* Breathing circle */}
			<Animated.View style={[styles.breathCircle, { transform: [{ scale: circleScale }] }]}>
				<LinearGradient
					colors={[PURPLE, `${PURPLE}88`]}
					style={[StyleSheet.absoluteFill, { borderRadius: 80 }]}
				/>
				<Text style={styles.breathCountdown}>{countdown}</Text>
			</Animated.View>

			{/* Phase label */}
			<Animated.Text style={[styles.breathLabel, { opacity: fadeLabel }]}>
				{currentLabel}
			</Animated.Text>

			{/* Skip */}
			<TouchableOpacity onPress={onNext} style={styles.skipBreath}>
				<Text style={styles.skipBreathText}>Skip</Text>
			</TouchableOpacity>
		</View>
	);
}

// ═══════════════════════════════════════════════════════
// STEP 2: SLEEP SCORE
// ═══════════════════════════════════════════════════════
const SLEEP_OPTIONS = [
	{ emoji: "😴", label: "Terrible", value: 1 },
	{ emoji: "😩", label: "Poor", value: 2 },
	{ emoji: "😐", label: "Okay", value: 3 },
	{ emoji: "😊", label: "Good", value: 4 },
	{ emoji: "✨", label: "Amazing", value: 5 },
];

function SleepStep({ onNext, onSelect }: { onNext: () => void; onSelect: (v: number) => void }) {
	const fadeIn = useRef(new Animated.Value(0)).current;
	const [selected, setSelected] = useState<number | null>(null);
	const scales = useRef(SLEEP_OPTIONS.map(() => new Animated.Value(1))).current;

	useEffect(() => {
		Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
	}, [fadeIn]);

	const handleSelect = (value: number, idx: number) => {
		haptic(ImpactFeedbackStyle.Light);
		setSelected(value);
		onSelect(value);

		// Scale up selected
		Animated.spring(scales[idx], { toValue: 1.25, useNativeDriver: true, damping: 10 }).start();
		// Scale down others
		scales.forEach((s, i) => {
			if (i !== idx) Animated.spring(s, { toValue: 0.85, useNativeDriver: true, damping: 10 }).start();
		});

		setTimeout(() => onNext(), 600);
	};

	return (
		<View style={styles.stepContainer}>
			<LinearGradient colors={["#0A0A2E", "#1A1038"]} style={StyleSheet.absoluteFill} />
			<Animated.View style={[styles.stepContent, { opacity: fadeIn }]}>
				<Text style={styles.stepQuestion}>How did you sleep?</Text>
				<Text style={styles.stepHint}>Last night's rest quality</Text>
				<View style={styles.emojiRow}>
					{SLEEP_OPTIONS.map((opt, idx) => (
						<TouchableOpacity
							key={opt.value}
							onPress={() => handleSelect(opt.value, idx)}
							activeOpacity={0.8}
						>
							<Animated.View style={[
								styles.emojiBtn,
								selected === opt.value && styles.emojiBtnSelected,
								{ transform: [{ scale: scales[idx] }] },
							]}>
								<Text style={styles.emojiBtnEmoji}>{opt.emoji}</Text>
								<Text style={[styles.emojiBtnLabel, selected === opt.value && { color: TEXT }]}>
									{opt.label}
								</Text>
							</Animated.View>
						</TouchableOpacity>
					))}
				</View>
			</Animated.View>
		</View>
	);
}

// ═══════════════════════════════════════════════════════
// STEP 3: ENERGY LEVEL (1-10)
// ═══════════════════════════════════════════════════════
function EnergyStep({ onNext, onSelect }: { onNext: () => void; onSelect: (v: number) => void }) {
	const fadeIn = useRef(new Animated.Value(0)).current;
	const [selected, setSelected] = useState<number | null>(null);

	useEffect(() => {
		Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
	}, [fadeIn]);

	const handleSelect = (value: number) => {
		haptic(ImpactFeedbackStyle.Light);
		setSelected(value);
		onSelect(value);
		setTimeout(() => onNext(), 500);
	};

	// Color interpolation: blue (1) → gold (10)
	const getBarColor = (level: number): string => {
		const t = (level - 1) / 9;
		// Blue → Purple → Gold
		if (t < 0.5) {
			const s = t * 2;
			return `rgb(${Math.round(59 + s * 98)}, ${Math.round(130 - s * 52)}, ${Math.round(246 - s * 25)})`;
		}
		const s = (t - 0.5) * 2;
		return `rgb(${Math.round(157 + s * 98)}, ${Math.round(78 + s * 136)}, ${Math.round(221 - s * 211)})`;
	};

	return (
		<View style={styles.stepContainer}>
			<LinearGradient colors={["#0A0A2E", "#1A1038"]} style={StyleSheet.absoluteFill} />
			<Animated.View style={[styles.stepContent, { opacity: fadeIn }]}>
				<Text style={styles.stepQuestion}>What's your energy?</Text>
				<Text style={styles.stepHint}>Rate your morning energy level</Text>

				{selected !== null && (
					<Text style={[styles.energyBigNum, { color: getBarColor(selected) }]}>
						{selected}
					</Text>
				)}

				<View style={styles.energyGrid}>
					{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
						const isSelected = selected === n;
						const barColor = getBarColor(n);
						return (
							<TouchableOpacity
								key={n}
								onPress={() => handleSelect(n)}
								activeOpacity={0.7}
								style={styles.energyBarWrap}
							>
								<View
									style={[
										styles.energyBar,
										{ height: 20 + n * 8, backgroundColor: isSelected ? barColor : `${barColor}30` },
										isSelected && { borderWidth: 2, borderColor: barColor },
									]}
								/>
								<Text style={[styles.energyBarLabel, isSelected && { color: TEXT, fontWeight: "800" }]}>
									{n}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>

				<View style={styles.energyLabels}>
					<Text style={styles.energyLabelText}>Low</Text>
					<Text style={styles.energyLabelText}>High</Text>
				</View>
			</Animated.View>
		</View>
	);
}

// ═══════════════════════════════════════════════════════
// STEP 4: INTENTION
// ═══════════════════════════════════════════════════════
const INTENTIONS = [
	{ icon: "🎯", label: "Focus", value: "focus" },
	{ icon: "💪", label: "Strength", value: "strength" },
	{ icon: "🌊", label: "Calm", value: "calm" },
	{ icon: "✨", label: "Growth", value: "growth" },
];

function IntentionStep({ onNext, onSelect }: { onNext: () => void; onSelect: (v: string) => void }) {
	const fadeIn = useRef(new Animated.Value(0)).current;
	const [selected, setSelected] = useState<string | null>(null);
	const [showCustom, setShowCustom] = useState(false);
	const [customText, setCustomText] = useState("");

	useEffect(() => {
		Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
	}, [fadeIn]);

	const handleSelect = (value: string) => {
		haptic(ImpactFeedbackStyle.Medium);
		setSelected(value);
		onSelect(value);
		setTimeout(() => onNext(), 500);
	};

	const handleCustomSubmit = () => {
		if (customText.trim()) {
			handleSelect(customText.trim());
		}
	};

	return (
		<View style={styles.stepContainer}>
			<LinearGradient colors={["#0A0A2E", "#1A1038"]} style={StyleSheet.absoluteFill} />
			<Animated.View style={[styles.stepContent, { opacity: fadeIn }]}>
				<Text style={styles.stepQuestion}>Set your intention</Text>
				<Text style={styles.stepHint}>What energy do you want today?</Text>

				<View style={styles.intentionGrid}>
					{INTENTIONS.map((opt) => {
						const isSelected = selected === opt.value;
						return (
							<TouchableOpacity
								key={opt.value}
								onPress={() => handleSelect(opt.value)}
								activeOpacity={0.8}
								style={[styles.intentionChip, isSelected && styles.intentionChipSelected]}
							>
								<Text style={styles.intentionEmoji}>{opt.icon}</Text>
								<Text style={[styles.intentionLabel, isSelected && { color: TEXT }]}>
									{opt.label}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>

				{!showCustom ? (
					<TouchableOpacity onPress={() => setShowCustom(true)} style={styles.customBtn}>
						<Text style={styles.customBtnText}>Type your own</Text>
					</TouchableOpacity>
				) : (
					<View style={styles.customInputWrap}>
						<TextInput
							autoFocus
							value={customText}
							onChangeText={setCustomText}
							onSubmitEditing={handleCustomSubmit}
							placeholder="My intention is..."
							placeholderTextColor={TEXT_DIM}
							style={styles.customInput}
							returnKeyType="done"
							maxLength={60}
						/>
						<TouchableOpacity
							onPress={handleCustomSubmit}
							disabled={!customText.trim()}
							style={[styles.customSubmitBtn, customText.trim() ? styles.customSubmitActive : null]}
						>
							<Ionicons name="arrow-forward" size={20} color={customText.trim() ? BG : TEXT_DIM} />
						</TouchableOpacity>
					</View>
				)}
			</Animated.View>
		</View>
	);
}

// ═══════════════════════════════════════════════════════
// STEP 5: GENERATING QUESTS
// ═══════════════════════════════════════════════════════
function GeneratingStep({
	onQuestsReady,
	userId,
	ritualData,
}: {
	onQuestsReady: (quests: Quest[]) => void;
	userId: string;
	ritualData: RitualData;
}) {
	const spinAnim = useRef(new Animated.Value(0)).current;
	const pulseAnim = useRef(new Animated.Value(0.6)).current;
	const dotsAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		// Spin
		Animated.loop(
			Animated.timing(spinAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
		).start();
		// Pulse
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
				Animated.timing(pulseAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
			])
		).start();
		// Dots
		Animated.loop(
			Animated.timing(dotsAnim, { toValue: 3, duration: 1500, useNativeDriver: false })
		).start();
	}, [spinAnim, pulseAnim, dotsAnim]);

	useEffect(() => {
		const generate = async () => {
			const startTime = Date.now();

			const questsData = await questGenerator.getTodayQuests(userId, {
				sleepScore: ritualData.sleepScore,
				energyScore: ritualData.energyScore,
				intention: ritualData.intention,
			});

			// Ensure minimum 3s display
			const elapsed = Date.now() - startTime;
			const remaining = Math.max(0, 3000 - elapsed);

			setTimeout(() => {
				onQuestsReady(questsData.quests);
			}, remaining);
		};

		generate();
	}, [userId, ritualData, onQuestsReady]);

	const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

	return (
		<View style={styles.stepContainer}>
			<LinearGradient colors={["#0A0A2E", "#1A0A3E", "#0A0A2E"]} style={StyleSheet.absoluteFill} />

			<Animated.View style={[styles.genRing, { transform: [{ rotate: spin }] }]}>
				<LinearGradient
					colors={[PURPLE, GREEN, PURPLE]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.genRingGrad}
				/>
			</Animated.View>

			<Animated.Text style={[styles.genText, { opacity: pulseAnim }]}>
				Crafting your perfect day...
			</Animated.Text>

			<Text style={styles.genSubText}>
				Using your sleep, energy, and intention
			</Text>
		</View>
	);
}

// ═══════════════════════════════════════════════════════
// STEP 6: QUEST REVEAL
// ═══════════════════════════════════════════════════════
function QuestRevealStep({ quests, onFinish }: { quests: Quest[]; onFinish: () => void }) {
	const cardAnims = useRef(quests.map(() => new Animated.Value(0))).current;
	const btnFade = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		// Stagger card reveals
		const animations = cardAnims.map((anim, i) =>
			Animated.spring(anim, {
				toValue: 1,
				delay: i * 400,
				useNativeDriver: true,
				damping: 12,
				stiffness: 100,
			})
		);
		Animated.stagger(400, animations).start(() => {
			Animated.timing(btnFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
		});
	}, [cardAnims, btnFade]);

	const getDifficultyColor = (d: string) => {
		if (d === "easy") return GREEN;
		if (d === "medium") return GOLD;
		return "#FF6B6B";
	};

	return (
		<View style={styles.stepContainer}>
			<LinearGradient colors={["#0A0A2E", "#1A1038"]} style={StyleSheet.absoluteFill} />

			<Text style={styles.revealTitle}>Your Quests</Text>
			<Text style={styles.revealSub}>Personalized for today's awakening</Text>

			<View style={styles.revealCards}>
				{quests.map((quest, i) => {
					const translateY = cardAnims[i].interpolate({
						inputRange: [0, 1],
						outputRange: [60, 0],
					});
					return (
						<Animated.View
							key={quest.id}
							style={[
								styles.revealCard,
								{ opacity: cardAnims[i], transform: [{ translateY }] },
							]}
						>
							<View style={[styles.revealCardIcon, { backgroundColor: `${getDifficultyColor(quest.difficulty)}15` }]}>
								<Ionicons
									name={(quest.icon || "star-outline") as any}
									size={22}
									color={getDifficultyColor(quest.difficulty)}
								/>
							</View>
							<View style={styles.revealCardContent}>
								<Text style={styles.revealCardLabel}>{quest.label}</Text>
								<Text style={styles.revealCardDesc} numberOfLines={1}>{quest.description}</Text>
							</View>
							<View style={[styles.revealXpBadge, { backgroundColor: `${getDifficultyColor(quest.difficulty)}20` }]}>
								<Text style={[styles.revealXpText, { color: getDifficultyColor(quest.difficulty) }]}>
									+{quest.xp_reward}
								</Text>
							</View>
						</Animated.View>
					);
				})}
			</View>

			<Animated.View style={[styles.revealBtnWrap, { opacity: btnFade }]}>
				<Text style={styles.revealMotivation}>Let's awaken together</Text>
				<TouchableOpacity activeOpacity={0.85} onPress={onFinish}>
					<LinearGradient
						colors={[PURPLE, GREEN]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
						style={styles.revealBtn}
					>
						<Text style={styles.revealBtnText}>Begin your day</Text>
						<Ionicons name="arrow-forward" size={20} color="#FFF" />
					</LinearGradient>
				</TouchableOpacity>
			</Animated.View>
		</View>
	);
}

// ═══════════════════════════════════════════════════════
// MAIN RITUAL SCREEN
// ═══════════════════════════════════════════════════════
export default function AwakeningRitualScreen() {
	const { firstName, userId } = useOnboardingStore();
	const { saveCheckIn } = useDashboardStore();
	const streakDays = useDashboardStore((s) => s.streak);

	const [step, setStep] = useState<RitualStep>(0);
	const [ritualData, setRitualData] = useState<RitualData>({
		sleepScore: 3,
		energyScore: 5,
		intention: "focus",
		breathCompleted: true,
	});
	const [quests, setQuests] = useState<Quest[]>([]);

	// Crossfade animation
	const crossfade = useRef(new Animated.Value(1)).current;

	const transitionTo = useCallback(
		(nextStep: RitualStep) => {
			Animated.timing(crossfade, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true,
			}).start(() => {
				setStep(nextStep);
				Animated.timing(crossfade, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}).start();
			});
		},
		[crossfade]
	);

	const handleSkip = () => {
		router.back();
	};

	const handleFinish = async () => {
		haptic(ImpactFeedbackStyle.Heavy);

		if (userId) {
			try {
				// 1. Save ritual to Supabase
				await supabase.from("awakening_rituals").insert({
					user_id: userId,
					sleep_score: ritualData.sleepScore,
					energy_score: ritualData.energyScore,
					intention: ritualData.intention,
					breath_completed: ritualData.breathCompleted,
					quests_generated: quests,
				});

				// 2. Save check-in to dashboard store (maps to existing system)
				const energyMapped = Math.min(5, Math.max(1, Math.ceil(ritualData.energyScore / 2)));
				saveCheckIn({
					sleep: ritualData.sleepScore,
					energy: energyMapped,
					stress: 3,
					digestion: 3,
				});

				// 3. Award XP for ritual completion
				await levelsService.addXp(userId, 100, "awakening_ritual", {
					sleep: ritualData.sleepScore,
					energy: ritualData.energyScore,
					intention: ritualData.intention,
				});

				// 4. Record streak activity
				await streakService.recordActivity(userId);

				// 5. Check achievements
				achievementsService
					.checkAchievements(userId, "checkin")
					.catch(() => {});

				// 6. Track analytics
				mixpanelService.track("ritual_completed", {
					sleep_score: ritualData.sleepScore,
					energy_score: ritualData.energyScore,
					intention: ritualData.intention,
					breath_completed: ritualData.breathCompleted,
				});
			} catch (err) {
				console.warn("[Ritual] Save failed:", err);
			}
		}

		router.back();
	};

	const dayCount = Math.max(streakDays, 1);

	return (
		<SafeAreaView style={styles.safeArea}>
			{/* Skip button - always visible */}
			{step < 5 && (
				<TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
					<Text style={styles.skipBtnText}>Skip ritual</Text>
				</TouchableOpacity>
			)}

			{/* Step indicator */}
			{step > 0 && step < 6 && (
				<View style={styles.stepIndicator}>
					{[1, 2, 3, 4].map((s) => (
						<View
							key={s}
							style={[
								styles.stepDot,
								step >= s && styles.stepDotActive,
								step === s && styles.stepDotCurrent,
							]}
						/>
					))}
				</View>
			)}

			{/* Animated step content */}
			<Animated.View style={[styles.stepAnimWrap, { opacity: crossfade }]}>
				{step === 0 && (
					<IntroStep
						onNext={() => transitionTo(1)}
						firstName={firstName || ""}
						dayCount={dayCount}
					/>
				)}
				{step === 1 && (
					<BreathStep onNext={() => transitionTo(2)} />
				)}
				{step === 2 && (
					<SleepStep
						onNext={() => transitionTo(3)}
						onSelect={(v) => setRitualData((d) => ({ ...d, sleepScore: v }))}
					/>
				)}
				{step === 3 && (
					<EnergyStep
						onNext={() => transitionTo(4)}
						onSelect={(v) => setRitualData((d) => ({ ...d, energyScore: v }))}
					/>
				)}
				{step === 4 && (
					<IntentionStep
						onNext={() => transitionTo(5)}
						onSelect={(v) => setRitualData((d) => ({ ...d, intention: v }))}
					/>
				)}
				{step === 5 && userId && (
					<GeneratingStep
						onQuestsReady={(q) => {
							setQuests(q);
							transitionTo(6);
						}}
						userId={userId}
						ritualData={ritualData}
					/>
				)}
				{step === 6 && (
					<QuestRevealStep quests={quests} onFinish={handleFinish} />
				)}
			</Animated.View>
		</SafeAreaView>
	);
}

// ═══════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════
const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: BG },

	// ── Skip & navigation ──
	skipBtn: {
		position: "absolute",
		top: 60,
		right: 20,
		zIndex: 100,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.08)",
	},
	skipBtnText: { color: TEXT_DIM, fontSize: 13, fontWeight: "600" },

	stepIndicator: {
		position: "absolute",
		top: 64,
		left: 0,
		right: 0,
		zIndex: 90,
		flexDirection: "row",
		justifyContent: "center",
		gap: 8,
	},
	stepDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "rgba(255,255,255,0.15)",
	},
	stepDotActive: { backgroundColor: `${PURPLE}60` },
	stepDotCurrent: { backgroundColor: PURPLE, width: 24 },

	stepAnimWrap: { flex: 1 },

	// ── Shared step container ──
	stepContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
	},
	stepContent: {
		width: "100%",
		alignItems: "center",
	},
	stepQuestion: {
		fontSize: 28,
		fontWeight: "900",
		color: TEXT,
		textAlign: "center",
		marginBottom: 8,
		letterSpacing: -0.5,
	},
	stepHint: {
		fontSize: 15,
		color: TEXT_DIM,
		textAlign: "center",
		marginBottom: 40,
	},

	// ── Intro ──
	introGreeting: {
		fontSize: 32,
		fontWeight: "900",
		color: TEXT,
		textAlign: "center",
		letterSpacing: -0.5,
	},
	introSub: {
		fontSize: 17,
		color: "rgba(255,255,255,0.7)",
		textAlign: "center",
		marginTop: 12,
	},
	introTap: {
		fontSize: 13,
		color: "rgba(255,255,255,0.35)",
		textAlign: "center",
		marginTop: 40,
		letterSpacing: 1,
	},

	// ── Breath ──
	breathGlow: {
		position: "absolute",
		width: 240,
		height: 240,
		borderRadius: 120,
	},
	breathCircle: {
		width: 160,
		height: 160,
		borderRadius: 80,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	breathCountdown: {
		fontSize: 48,
		fontWeight: "900",
		color: TEXT,
		fontVariant: ["tabular-nums"],
	},
	breathLabel: {
		fontSize: 20,
		fontWeight: "700",
		color: TEXT,
		textAlign: "center",
		marginTop: 40,
	},
	skipBreath: {
		position: "absolute",
		bottom: 60,
		paddingHorizontal: 20,
		paddingVertical: 10,
	},
	skipBreathText: { color: TEXT_DIM, fontSize: 14, fontWeight: "600" },

	// ── Sleep ──
	emojiRow: {
		flexDirection: "row",
		gap: 12,
		justifyContent: "center",
	},
	emojiBtn: {
		width: 64,
		height: 84,
		borderRadius: 20,
		backgroundColor: SURFACE,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "transparent",
	},
	emojiBtnSelected: {
		borderColor: PURPLE,
		backgroundColor: `${PURPLE}20`,
	},
	emojiBtnEmoji: { fontSize: 28, marginBottom: 4 },
	emojiBtnLabel: { fontSize: 10, fontWeight: "700", color: TEXT_DIM },

	// ── Energy ──
	energyBigNum: {
		fontSize: 72,
		fontWeight: "900",
		marginBottom: 24,
		fontVariant: ["tabular-nums"],
	},
	energyGrid: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 6,
		marginBottom: 12,
	},
	energyBarWrap: {
		alignItems: "center",
		gap: 6,
	},
	energyBar: {
		width: (SW - 120) / 10,
		borderRadius: 8,
		minHeight: 28,
	},
	energyBarLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: TEXT_DIM,
	},
	energyLabels: {
		flexDirection: "row",
		justifyContent: "space-between",
		width: "100%",
		paddingHorizontal: 4,
	},
	energyLabelText: {
		fontSize: 12,
		color: TEXT_DIM,
		fontWeight: "600",
	},

	// ── Intention ──
	intentionGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		justifyContent: "center",
		marginBottom: 24,
	},
	intentionChip: {
		width: (SW - 88) / 2,
		paddingVertical: 20,
		borderRadius: 20,
		backgroundColor: SURFACE,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "transparent",
	},
	intentionChipSelected: {
		borderColor: PURPLE,
		backgroundColor: `${PURPLE}20`,
	},
	intentionEmoji: { fontSize: 32, marginBottom: 8 },
	intentionLabel: { fontSize: 15, fontWeight: "700", color: TEXT_DIM },
	customBtn: {
		paddingHorizontal: 20,
		paddingVertical: 10,
	},
	customBtnText: { color: PURPLE, fontSize: 14, fontWeight: "700" },
	customInputWrap: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		backgroundColor: SURFACE,
		borderRadius: 16,
		paddingHorizontal: 16,
		gap: 8,
	},
	customInput: {
		flex: 1,
		height: 52,
		color: TEXT,
		fontSize: 16,
		fontWeight: "600",
	},
	customSubmitBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: SURFACE,
		alignItems: "center",
		justifyContent: "center",
	},
	customSubmitActive: {
		backgroundColor: GREEN,
	},

	// ── Generating ──
	genRing: {
		width: 120,
		height: 120,
		borderRadius: 60,
		marginBottom: 32,
		overflow: "hidden",
	},
	genRingGrad: {
		width: 120,
		height: 120,
		borderRadius: 60,
		borderWidth: 3,
		borderColor: "transparent",
	},
	genText: {
		fontSize: 22,
		fontWeight: "800",
		color: TEXT,
		textAlign: "center",
	},
	genSubText: {
		fontSize: 14,
		color: TEXT_DIM,
		textAlign: "center",
		marginTop: 8,
	},

	// ── Quest Reveal ──
	revealTitle: {
		fontSize: 28,
		fontWeight: "900",
		color: TEXT,
		textAlign: "center",
		marginTop: 80,
		letterSpacing: -0.5,
	},
	revealSub: {
		fontSize: 15,
		color: TEXT_DIM,
		textAlign: "center",
		marginTop: 8,
		marginBottom: 32,
	},
	revealCards: {
		width: "100%",
		paddingHorizontal: 24,
		gap: 12,
	},
	revealCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.06)",
		gap: 12,
	},
	revealCardIcon: {
		width: 44,
		height: 44,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	revealCardContent: { flex: 1 },
	revealCardLabel: { fontSize: 15, fontWeight: "700", color: TEXT },
	revealCardDesc: { fontSize: 12, color: TEXT_DIM, marginTop: 2 },
	revealXpBadge: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 10,
	},
	revealXpText: { fontSize: 13, fontWeight: "800" },

	revealBtnWrap: {
		position: "absolute",
		bottom: 40,
		left: 24,
		right: 24,
		alignItems: "center",
	},
	revealMotivation: {
		fontSize: 15,
		color: TEXT_DIM,
		marginBottom: 16,
		fontStyle: "italic",
	},
	revealBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		height: 56,
		borderRadius: 28,
		paddingHorizontal: 32,
		gap: 10,
		width: SW - 48,
	},
	revealBtnText: {
		fontSize: 17,
		fontWeight: "800",
		color: "#FFF",
	},
});
