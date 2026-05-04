import { Ionicons } from "@expo/vector-icons";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
	useEffect,
	useRef,
	useState,
} from "react";
import {
	Animated,
	PanResponder,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useFoodDiaryStore } from "@/stores/food-diary-store";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useGamificationStore } from "@/stores/gamification-store";

// ── Dark Premium Design Tokens ──────────────────────
const BG = "#0A0A0F";
const SURFACE = "#1A1A24";
const SURFACE_LIGHT = "#242430";
const PURPLE = "#9D4EDD";
const GREEN = "#06FFA5";
const GOLD = "#FFD60A";
const TEXT = "#F5F5F7";
const TEXT_DIM = "#8E8E93";
const BORDER = "rgba(255,255,255,0.06)";

// ── Metric slider config ────────────────────────────
type MetricKey = "sleep" | "energy" | "stress" | "digestion";
const METRICS: {
	key: MetricKey;
	label: string;
	icon: string;
	color: string;
	lowLabel: string;
	highLabel: string;
}[] = [
	{ key: "sleep", label: "Sleep Quality", icon: "moon", color: "#9D4EDD", lowLabel: "Poor", highLabel: "Excellent" },
	{ key: "energy", label: "Energy Level", icon: "flash", color: "#FFD60A", lowLabel: "Low", highLabel: "High" },
	{ key: "stress", label: "Stress Level", icon: "heart", color: "#FF6B8A", lowLabel: "Calm", highLabel: "Stressed" },
	{ key: "digestion", label: "Digestion", icon: "leaf", color: "#06FFA5", lowLabel: "Poor", highLabel: "Great" },
];

const SCORE_LABELS: Record<MetricKey, string[]> = {
	sleep: ["Terrible", "Poor", "Fair", "Good", "Excellent"],
	energy: ["Drained", "Low", "Moderate", "Good", "High"],
	stress: ["Very Calm", "Calm", "Mild", "Stressed", "Very Stressed"],
	digestion: ["Very Poor", "Poor", "Fair", "Good", "Great"],
};

// ── Quest definitions (hardcoded Sprint 1 — AI-generated Sprint 2) ──
const SPRINT1_QUESTS = [
	{ id: "q_checkin", label: "Complete morning check-in", icon: "sunny-outline" as const, xp: 50 },
	{ id: "q_scan", label: "Scan a meal", icon: "camera-outline" as const, xp: 75 },
	{ id: "q_chat", label: "Chat with EZBuddy", icon: "chatbubble-outline" as const, xp: 40 },
];

// ── League definitions ──
const LEAGUES = [
	{ name: "Bronze", color: "#CD7F32", minXp: 0 },
	{ name: "Silver", color: "#C0C0C0", minXp: 500 },
	{ name: "Gold", color: "#FFD700", minXp: 2000 },
	{ name: "Sapphire", color: "#0F52BA", minXp: 5000 },
	{ name: "Diamond", color: "#B9F2FF", minXp: 10000 },
];

function getLeague(xp: number) {
	let league = LEAGUES[0];
	for (const l of LEAGUES) {
		if (xp >= l.minXp) league = l;
	}
	return league;
}

// ── Smooth Slider (dark themed) ──────────────────────
function MetricSlider({
	value,
	color,
	onChange,
	metricKey,
}: {
	value: number;
	color: string;
	onChange: (v: number) => void;
	metricKey: MetricKey;
}) {
	const sliderWidth = useRef(0);
	const animPct = useRef(
		new Animated.Value(value > 0 ? ((value - 1) / 4) * 100 : 50)
	).current;

	const isDragging = useRef(false);
	const startPct = useRef(0);
	const currentValue = useRef(value);
	currentValue.current = value;

	useEffect(() => {
		if (isDragging.current) return;
		const target = value > 0 ? ((value - 1) / 4) * 100 : 50;
		Animated.spring(animPct, {
			toValue: target,
			damping: 20,
			stiffness: 200,
			useNativeDriver: false,
		}).start();
	}, [value, animPct]);

	const pan = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderGrant: (e) => {
				isDragging.current = true;
				const x = e.nativeEvent.locationX;
				const currentWidth = sliderWidth.current || 1;
				const pct = Math.min(100, Math.max(0, (x / currentWidth) * 100));
				startPct.current = pct;
				Animated.timing(animPct, { toValue: pct, duration: 100, useNativeDriver: false }).start();
				const clamped = Math.min(5, Math.max(1, Math.round((pct / 100) * 4 + 1)));
				if (clamped !== currentValue.current) onChange(clamped);
			},
			onPanResponderMove: (_, gs) => {
				const currentWidth = sliderWidth.current || 1;
				const deltaPct = (gs.dx / currentWidth) * 100;
				const newPct = Math.min(100, Math.max(0, startPct.current + deltaPct));
				animPct.setValue(newPct);
				const clamped = Math.min(5, Math.max(1, Math.round((newPct / 100) * 4 + 1)));
				if (clamped !== currentValue.current) onChange(clamped);
			},
			onPanResponderRelease: (_, gs) => {
				isDragging.current = false;
				const currentWidth = sliderWidth.current || 1;
				const deltaPct = (gs.dx / currentWidth) * 100;
				const finalPct = Math.min(100, Math.max(0, startPct.current + deltaPct));
				const clamped = Math.min(5, Math.max(1, Math.round((finalPct / 100) * 4 + 1)));
				onChange(clamped);
				Animated.spring(animPct, {
					toValue: ((clamped - 1) / 4) * 100,
					damping: 20,
					stiffness: 250,
					useNativeDriver: false,
				}).start();
			},
		})
	).current;

	const fillWidth = animPct.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"], extrapolate: "clamp" });
	const thumbLeft = animPct.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"], extrapolate: "clamp" });
	const scoreLabel = value > 0 ? SCORE_LABELS[metricKey][value - 1] : null;

	return (
		<View>
			<View
				onLayout={(e) => { sliderWidth.current = e.nativeEvent.layout.width; }}
				style={styles.sliderTrack}
				{...pan.panHandlers}
			>
				<Animated.View style={[styles.sliderFill, { backgroundColor: color, width: fillWidth }]} />
				{value > 0 && (
					<Animated.View style={[styles.sliderThumb, { borderColor: color, left: thumbLeft }]} />
				)}
			</View>
			<View style={styles.tickRow}>
				{[1, 2, 3, 4, 5].map((n) => (
					<TouchableOpacity
						key={n}
						onPress={() => onChange(n)}
						style={[styles.tick, value === n && { backgroundColor: color }]}
					>
						<Text style={[styles.tickText, value === n && { color: BG, fontWeight: "800" }]}>
							{n}
						</Text>
					</TouchableOpacity>
				))}
			</View>
			{scoreLabel && (
				<Text style={[styles.scoreCaption, { color }]}>
					{value} / 5 — {scoreLabel}
				</Text>
			)}
		</View>
	);
}

// ── Mini Macro Ring (dark version) ────────────────────
function MiniRing({ current, goal, color, size = 52, unit = "g" }: { current: number; goal: number; color: string; size?: number; unit?: string }) {
	const strokeWidth = 5;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const progress = Math.min(current / Math.max(goal, 1), 1);
	const strokeDashoffset = circumference * (1 - progress);

	return (
		<View style={{ width: size, height: size }}>
			<Svg width={size} height={size}>
				<Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} fill="transparent" />
				<Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="transparent"
					strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeDashoffset}
					strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`} />
			</Svg>
			<View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
				<Text style={{ fontSize: unit ? 11 : 13, fontWeight: "800", color: TEXT }}>{current}{unit}</Text>
			</View>
		</View>
	);
}

// ── Avatar Evolution ─────────────────────────────────
function AvatarEvolution({ level }: { level: number }) {
	const pulseAnim = useRef(new Animated.Value(1)).current;
	const particleAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
				Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
			])
		).start();
		Animated.loop(
			Animated.timing(particleAnim, { toValue: 1, duration: 4000, useNativeDriver: true })
		).start();
	}, [pulseAnim, particleAnim]);

	// Evolution stage: dim (<5), glowing (5-14), radiant (15+)
	const stage = level >= 15 ? 2 : level >= 5 ? 1 : 0;
	const glowOpacity = [0.3, 0.6, 1][stage];
	const coreSize = [60, 70, 80][stage];
	const auraSize = coreSize + 60;

	return (
		<View style={styles.avatarContainer}>
			{/* Glow aura */}
			<Animated.View style={[styles.avatarAura, {
				width: auraSize, height: auraSize, borderRadius: auraSize / 2,
				opacity: glowOpacity,
				transform: [{ scale: pulseAnim }],
			}]}>
				<LinearGradient
					colors={[`${PURPLE}40`, `${PURPLE}00`]}
					style={StyleSheet.absoluteFill}
					start={{ x: 0.5, y: 0.5 }}
					end={{ x: 0, y: 0 }}
				/>
			</Animated.View>

			{/* Floating particles */}
			{[0, 1, 2, 3, 4, 5].map((i) => {
				const angle = (i / 6) * Math.PI * 2;
				const dist = auraSize / 2 - 5;
				const particleX = Math.cos(angle) * dist;
				const particleY = Math.sin(angle) * dist;
				const rotate = particleAnim.interpolate({
					inputRange: [0, 1],
					outputRange: [`${i * 60}deg`, `${i * 60 + 360}deg`],
				});
				return (
					<Animated.View
						key={i}
						style={[styles.particle, {
							opacity: glowOpacity * 0.7,
							transform: [
								{ rotate },
								{ translateX: dist },
							],
						}]}
					/>
				);
			})}

			{/* Core diamond shape */}
			<Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
				<LinearGradient
					colors={stage === 2 ? [PURPLE, GREEN] : stage === 1 ? [PURPLE, `${PURPLE}88`] : [`${PURPLE}66`, `${PURPLE}33`]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={[styles.avatarCore, { width: coreSize, height: coreSize, borderRadius: coreSize / 4 }]}
				>
					<Text style={{ fontSize: coreSize * 0.4 }}>
						{stage === 2 ? "✦" : stage === 1 ? "◆" : "◇"}
					</Text>
				</LinearGradient>
			</Animated.View>

			{/* Stage label */}
			<Text style={styles.avatarStageLabel}>
				{stage === 2 ? "Radiant" : stage === 1 ? "Glowing" : "Awakening"}
			</Text>
		</View>
	);
}

// ── Awakening Level Bar ──────────────────────────────
function AwakeningLevel({ level, xpProgress, totalXp }: { level: number; xpProgress: number; totalXp: number }) {
	const XP_PER_LEVEL = 500;
	const currentLevelXp = totalXp - (level - 1) * XP_PER_LEVEL;
	const xpNeeded = XP_PER_LEVEL;

	return (
		<View style={styles.levelCard}>
			<Text style={styles.levelTitle}>Awakening Level {level}</Text>
			<View style={styles.levelBarBg}>
				<LinearGradient
					colors={[PURPLE, GREEN]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={[styles.levelBarFill, { width: `${Math.min(xpProgress * 100, 100)}%` as any }]}
				/>
			</View>
			<Text style={styles.levelXpText}>
				{currentLevelXp} / {xpNeeded} XP to next level
			</Text>
		</View>
	);
}

// ── Streak Display ───────────────────────────────────
function StreakDisplay({ streak }: { streak: number }) {
	const isActive = streak > 0;

	return (
		<View style={[styles.streakCard, isActive && { borderColor: `${GOLD}30` }]}>
			<View style={styles.streakRow}>
				<View style={styles.streakMain}>
					<Text style={[styles.streakNumber, isActive && { color: GOLD }]}>{streak}</Text>
					<View>
						<Text style={styles.streakLabel}>day streak</Text>
						<Text style={styles.streakFreezes}>0 freezes available</Text>
					</View>
				</View>
				{isActive && (
					<View style={styles.streakFireWrap}>
						<Text style={{ fontSize: 32 }}>🔥</Text>
					</View>
				)}
			</View>
		</View>
	);
}

// ── Daily Quests ─────────────────────────────────────
function DailyQuests({
	checkInDone,
	mealScanned,
	chatUsed,
}: {
	checkInDone: boolean;
	mealScanned: boolean;
	chatUsed: boolean;
}) {
	const router = useRouter();
	const questStates = [checkInDone, mealScanned, chatUsed];
	const completedCount = questStates.filter(Boolean).length;

	const handleQuestTap = (questId: string) => {
		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
		}
		if (questId === "q_scan") router.push("/scan/meal-scanner");
		else if (questId === "q_chat") router.push("/chat");
	};

	return (
		<View style={styles.questCard}>
			<View style={styles.questHeader}>
				<Text style={styles.questTitle}>Today's Quests</Text>
				<View style={styles.questCountBadge}>
					<Text style={styles.questCountText}>{completedCount}/{SPRINT1_QUESTS.length}</Text>
				</View>
			</View>
			{SPRINT1_QUESTS.map((quest, i) => {
				const done = questStates[i];
				return (
					<TouchableOpacity
						key={quest.id}
						activeOpacity={0.7}
						onPress={() => !done && handleQuestTap(quest.id)}
						style={[styles.questRow, i < SPRINT1_QUESTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: BORDER }]}
					>
						<View style={[styles.questCheck, done && styles.questCheckDone]}>
							{done && <Ionicons name="checkmark" size={14} color={BG} />}
						</View>
						<Ionicons name={quest.icon} size={18} color={done ? TEXT_DIM : GREEN} style={{ marginRight: 10 }} />
						<Text style={[styles.questLabel, done && styles.questLabelDone]}>{quest.label}</Text>
						<View style={[styles.questXpBadge, done && { backgroundColor: `${TEXT_DIM}20` }]}>
							<Text style={[styles.questXpText, done && { color: TEXT_DIM }]}>+{quest.xp}</Text>
						</View>
					</TouchableOpacity>
				);
			})}
		</View>
	);
}

// ── League Card ──────────────────────────────────────
function LeagueCard({ totalXp }: { totalXp: number }) {
	const league = getLeague(totalXp);
	// Mock rank for Sprint 1
	const rank = Math.max(1, Math.min(30, 30 - Math.floor(totalXp / 100)));
	const now = new Date();
	const dayOfWeek = now.getDay();
	const daysUntilReset = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;

	return (
		<View style={[styles.leagueCard, { borderColor: `${league.color}30` }]}>
			<View style={styles.leagueHeader}>
				<View style={styles.leagueLeft}>
					<Text style={{ fontSize: 24 }}>🏆</Text>
					<View>
						<Text style={[styles.leagueName, { color: league.color }]}>{league.name} League</Text>
						<Text style={styles.leagueRank}>#{rank} of 30</Text>
					</View>
				</View>
				<View style={styles.leagueResetBadge}>
					<Text style={styles.leagueResetText}>{daysUntilReset}d left</Text>
				</View>
			</View>
			<View style={styles.leagueZones}>
				<View style={styles.leagueZone}>
					<Ionicons name="arrow-up" size={12} color={GREEN} />
					<Text style={[styles.leagueZoneText, { color: GREEN }]}>Top 5 advance</Text>
				</View>
				<View style={styles.leagueZone}>
					<Ionicons name="arrow-down" size={12} color="#FF6B6B" />
					<Text style={[styles.leagueZoneText, { color: "#FF6B6B" }]}>Bottom 5 demote</Text>
				</View>
			</View>
		</View>
	);
}

// ── Countdown helper ─────────────────────────────────
function formatCountdown(ms: number): string {
	if (ms <= 0) return "now";
	const h = Math.floor(ms / 3_600_000);
	const m = Math.floor((ms % 3_600_000) / 60_000);
	return `${h}h ${m}m`;
}

// ═══════════════════════════════════════════════════════
// ── HOME SCREEN ───────────────────────────────────────
// ═══════════════════════════════════════════════════════
export default function HomeScreen() {
	const { firstName } = useOnboardingStore();
	const {
		canCheckIn,
		saveCheckIn,
		getNextCheckInMs,
		streak,
		resetDailyMissions,
		missions,
		toggleMission,
	} = useDashboardStore();

	const lastCheckInValues = useDashboardStore((s) => s.lastCheckInValues);
	const gamLevel = useGamificationStore((s) => s.getLevel());
	const gamXpProgress = useGamificationStore((s) => s.getXpProgress());
	const gamTotalXp = useGamificationStore((s) => s.totalXp);
	const todayTotals = useFoodDiaryStore((s) => s.getTodayTotals());
	const goals = useFoodDiaryStore((s) => s.goals);
	const todayLog = useFoodDiaryStore((s) => s.getTodayLog());
	const calRemaining = Math.max(0, goals.calories - todayTotals.calories);

	const [values, setValues] = useState({ sleep: 3, energy: 3, stress: 3, digestion: 3 });
	const [saved, setSaved] = useState(false);
	const [nextMs, setNextMs] = useState(getNextCheckInMs());
	const router = useRouter();

	useEffect(() => {
		resetDailyMissions();
		const interval = setInterval(() => setNextMs(getNextCheckInMs()), 30_000);
		return () => clearInterval(interval);
	}, [resetDailyMissions, getNextCheckInMs]);

	const canSave = canCheckIn();
	const isPro = useOnboardingStore((state) => state.isPro);
	const allFilled = Object.values(values).every((v) => v > 0);

	const handleMetric = (key: MetricKey, val: number) => {
		setValues((prev) => ({ ...prev, [key]: val }));
	};

	const handleSave = () => {
		if (!allFilled || saved) return;
		saveCheckIn(values);
		setSaved(true);
		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Medium).catch(() => {});
		}
	};

	// Calculate day count from first check-in (approximate with streak for Sprint 1)
	const dayCount = Math.max(streak, 1);

	// Quest completion states (Sprint 1: derive from existing data)
	const checkInDone = !canSave || saved;
	const mealScanned = todayTotals.mealCount > 0;
	const chatUsed = false; // TODO Sprint 2: track chat usage

	// FAB bounce animation
	const fabBounce = useRef(new Animated.Value(0)).current;
	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(fabBounce, { toValue: -6, duration: 1500, useNativeDriver: true }),
				Animated.timing(fabBounce, { toValue: 0, duration: 1500, useNativeDriver: true }),
			])
		).start();
	}, [fabBounce]);

	return (
		<View style={styles.root}>
			<SafeAreaView edges={["top"]} style={styles.safe}>
				<ScrollView
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
					style={styles.scroll}
				>
					{/* ── Top Bar with Glow ── */}
					<View style={styles.topBarWrap}>
						<LinearGradient
							colors={[`${PURPLE}15`, `${GREEN}08`, "transparent"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={StyleSheet.absoluteFill}
						/>
						<View style={styles.topBar}>
							<View style={{ flex: 1 }}>
								<Text style={styles.greeting}>
									{new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Hey" : "Good evening"}{firstName ? `, ${firstName}` : ""}
								</Text>
								<Text style={styles.greetingSub}>
									Day {dayCount} of your awakening
								</Text>
							</View>
							<TouchableOpacity
								onPress={() => router.push("/settings/subscription")}
								style={styles.proBtn}
							>
								{isPro ? (
									<LinearGradient colors={[GOLD, "#FFA500"]} start={{ x: 0, y: 0 }} style={styles.proBadge}>
										<Ionicons color={BG} name="star" size={12} />
										<Text style={styles.proText}>PRO</Text>
									</LinearGradient>
								) : (
									<View style={styles.upgradeBadge}>
										<Ionicons color={GREEN} name="sparkles" size={14} />
										<Text style={styles.upgradeText}>UPGRADE</Text>
									</View>
								)}
							</TouchableOpacity>
						</View>
					</View>

					{/* ── Avatar Evolution ── */}
					<AvatarEvolution level={gamLevel} />

					{/* ── Awakening Level ── */}
					<AwakeningLevel level={gamLevel} xpProgress={gamXpProgress} totalXp={gamTotalXp} />

					{/* ── Streak Display ── */}
					<StreakDisplay streak={streak} />

					{/* ── Today's Quests ── */}
					<DailyQuests checkInDone={checkInDone} mealScanned={mealScanned} chatUsed={chatUsed} />

					{/* ── League Position ── */}
					<LeagueCard totalXp={gamTotalXp} />

					{/* ── Nutrition Card ── */}
					<View style={styles.nutritionCard}>
						<View style={styles.nutritionHeader}>
							<View>
								<Text style={styles.cardTitle}>Today's Nutrition</Text>
								<Text style={styles.cardSub}>
									{todayTotals.mealCount === 0
										? "No meals logged yet"
										: `${todayTotals.mealCount} meal${todayTotals.mealCount > 1 ? "s" : ""} logged`}
								</Text>
							</View>
							<MiniRing current={todayTotals.calories} goal={goals.calories} color={GREEN} size={64} unit="" />
						</View>

						<View style={styles.nutritionStats}>
							<View style={styles.nutritionStat}>
								<Text style={styles.nutritionStatValue}>{todayTotals.calories}</Text>
								<Text style={styles.nutritionStatLabel}>Eaten</Text>
							</View>
							<View style={[styles.nutritionStat, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: BORDER }]}>
								<Text style={[styles.nutritionStatValue, { color: GREEN }]}>{calRemaining}</Text>
								<Text style={styles.nutritionStatLabel}>Remaining</Text>
							</View>
							<View style={styles.nutritionStat}>
								<Text style={styles.nutritionStatValue}>{goals.calories}</Text>
								<Text style={styles.nutritionStatLabel}>Goal</Text>
							</View>
						</View>

						<View style={styles.macroRow}>
							<View style={styles.macroItem}>
								<MiniRing current={todayTotals.protein} goal={goals.protein} color="#FF6B6B" />
								<Text style={styles.macroLabel}>Protein</Text>
							</View>
							<View style={styles.macroItem}>
								<MiniRing current={todayTotals.carbs} goal={goals.carbs} color="#4ECDC4" />
								<Text style={styles.macroLabel}>Carbs</Text>
							</View>
							<View style={styles.macroItem}>
								<MiniRing current={todayTotals.fat} goal={goals.fat} color={GOLD} />
								<Text style={styles.macroLabel}>Fat</Text>
							</View>
						</View>

						{todayLog.meals.length > 0 && (
							<View style={styles.recentMeals}>
								<Text style={styles.recentMealsTitle}>Recent Meals</Text>
								{todayLog.meals.slice(-3).reverse().map((meal) => (
									<View key={meal.id} style={styles.recentMealRow}>
										<Text style={styles.recentMealName} numberOfLines={1}>{meal.mealName}</Text>
										<Text style={styles.recentMealCal}>{meal.totalCalories} cal</Text>
									</View>
								))}
							</View>
						)}
					</View>

					{/* ── Daily Check-In ── */}
					{canSave && !saved ? (
						<View style={styles.card}>
							<View style={styles.cardRow}>
								<View style={styles.cardIconWrap}>
									<Ionicons name="sunny" size={20} color={GOLD} />
								</View>
								<Text style={styles.cardTitle}>Daily Check-In</Text>
							</View>
							<Text style={styles.cardHint}>
								How did you sleep and how do you feel today?
							</Text>

							{METRICS.map((m) => (
								<View key={m.key} style={styles.metricBlock}>
									<View style={styles.metricHeader}>
										<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
											<Ionicons name={m.icon as any} size={16} color={m.color} />
											<Text style={styles.metricLabel}>{m.label}</Text>
										</View>
										{values[m.key] === 0 && (
											<Text style={styles.metricHint}>Tap 1-5</Text>
										)}
									</View>
									<MetricSlider
										color={m.color}
										metricKey={m.key}
										onChange={(v) => handleMetric(m.key, v)}
										value={values[m.key]}
									/>
								</View>
							))}

							<TouchableOpacity
								activeOpacity={0.85}
								disabled={!allFilled}
								onPress={handleSave}
								style={[styles.saveBtn, allFilled && styles.saveBtnActive]}
							>
								<Text style={[styles.saveBtnText, allFilled && styles.saveBtnTextActive]}>
									Save Check-In
								</Text>
							</TouchableOpacity>
						</View>
					) : (
						<View style={styles.card}>
							<View style={styles.completedBadge}>
								<Ionicons color={GREEN} name="checkmark-circle" size={18} />
								<Text style={styles.completedBadgeText}>Check-In Completed</Text>
							</View>
							<View style={styles.countdownBox}>
								<Text style={styles.countdownLabel}>Next check-in in</Text>
								<Text style={styles.countdownValue}>{formatCountdown(nextMs)}</Text>
							</View>
						</View>
					)}

					{/* ── EZBuddy Card ── */}
					<TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/(dashboard)/buddy")} style={styles.buddyCard}>
						<View style={styles.buddyRow}>
							<View style={styles.buddyAvatarWrap}>
								<LinearGradient colors={[PURPLE, GREEN]} style={styles.buddyAvatar}>
									<Text style={{ fontSize: 28 }}>
										{(() => {
											if (!lastCheckInValues) return "🤖";
											const avg = (lastCheckInValues.sleep + lastCheckInValues.energy + (6 - lastCheckInValues.stress) + lastCheckInValues.digestion) / 4;
											if (avg >= 4) return "😊";
											if (avg >= 3) return "🙂";
											return "🤔";
										})()}
									</Text>
								</LinearGradient>
								<View style={styles.buddyOnline} />
							</View>
							<View style={styles.buddySpeech}>
								<Text style={styles.buddySpeechText}>
									{(() => {
										const hour = new Date().getHours();
										if (!lastCheckInValues) return "Hey! Do your first check-in and I'll start giving you personalized tips.";
										if (hour < 12 && lastCheckInValues.sleep <= 2) return "Rough sleep? Try avoiding screens 1 hour before bed tonight.";
										if (hour < 12 && lastCheckInValues.sleep >= 4) return "You slept great! That's your foundation for an amazing day.";
										if (lastCheckInValues.energy <= 2) return "Energy low? A quick 10-min walk + glass of water works wonders.";
										if (lastCheckInValues.stress >= 4) return "I notice you're stressed. Take 3 deep breaths right now.";
										if (streak >= 7) return `${streak} days strong! Consistency is your superpower!`;
										return "Looking good today! Keep checking in so I can track your patterns.";
									})()}
								</Text>
							</View>
						</View>
						<View style={styles.buddyActions}>
							<TouchableOpacity onPress={() => router.push("/chat")} style={styles.buddyActionBtn}>
								<Ionicons color={GREEN} name="chatbubble-ellipses-outline" size={14} />
								<Text style={styles.buddyActionText}>Chat</Text>
							</TouchableOpacity>
							<TouchableOpacity onPress={() => router.push("/(dashboard)/buddy")} style={styles.buddyActionBtn}>
								<Ionicons color={GREEN} name="person-outline" size={14} />
								<Text style={styles.buddyActionText}>Profile</Text>
							</TouchableOpacity>
							<View style={styles.buddyXpPill}>
								<Text style={styles.buddyXpText}>Lv {gamLevel}</Text>
							</View>
						</View>
					</TouchableOpacity>

					{/* ── Explore ── */}
					<Text style={styles.sectionTitle}>Explore</Text>
					<View style={styles.featureRow}>
						<TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/scan/meal-scanner")} style={styles.featureCard}>
							<LinearGradient colors={[PURPLE, "#7B2FBE"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featureGrad}>
								<Ionicons name="camera" size={28} color="#FFF" />
								<Text style={styles.featureLabel}>AI Meal{"\n"}Scanner</Text>
							</LinearGradient>
						</TouchableOpacity>
						<TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/vibe-card")} style={styles.featureCard}>
							<LinearGradient colors={["#8B5CF6", "#EC4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featureGrad}>
								<Ionicons name="sparkles" size={28} color="#FFF" />
								<Text style={styles.featureLabel}>Vibe{"\n"}Card</Text>
							</LinearGradient>
						</TouchableOpacity>
						<TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/rewards")} style={styles.featureCard}>
							<LinearGradient colors={[GOLD, "#FF8C00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featureGrad}>
								<Ionicons name="trophy" size={28} color="#FFF" />
								<Text style={styles.featureLabel}>Rewards{"\n"}& XP</Text>
							</LinearGradient>
						</TouchableOpacity>
					</View>

					{/* ── Lifestyle Disclaimer ── */}
					<View style={styles.disclaimerBanner}>
						<Ionicons color={GOLD} name="information-circle" size={16} />
						<Text style={styles.disclaimerBannerText}>
							EZCare is an educational lifestyle awareness tool only. Not a substitute for professional advice.
						</Text>
					</View>

					{/* Bottom spacer for FAB */}
					<View style={{ height: 80 }} />
				</ScrollView>
			</SafeAreaView>

			{/* ── Floating Action Button ── */}
			<Animated.View style={[styles.fabWrap, { transform: [{ translateY: fabBounce }] }]}>
				<TouchableOpacity
					activeOpacity={0.85}
					onPress={() => {
						if (Platform.OS === "ios") impactAsync(ImpactFeedbackStyle.Medium).catch(() => {});
						router.push("/scan/meal-scanner");
					}}
				>
					<LinearGradient
						colors={[PURPLE, GREEN]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={styles.fab}
					>
						<Ionicons name="camera" size={26} color="#FFF" />
					</LinearGradient>
				</TouchableOpacity>
			</Animated.View>
		</View>
	);
}

// ═══════════════════════════════════════════════════════
// ── STYLES ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════
const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: BG },
	safe: { flex: 1 },
	scroll: { flex: 1 },
	content: { paddingBottom: 32 },

	// ── Top Bar ──
	topBarWrap: { paddingBottom: 8, overflow: "hidden" },
	topBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 24,
		paddingTop: 12,
	},
	greeting: { fontSize: 24, fontWeight: "800", color: TEXT },
	greetingSub: { fontSize: 14, color: TEXT_DIM, marginTop: 2 },
	proBtn: { height: 32, justifyContent: "center", alignItems: "center" },
	proBadge: {
		flexDirection: "row", alignItems: "center",
		paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4,
	},
	proText: { color: BG, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
	upgradeBadge: {
		flexDirection: "row", alignItems: "center",
		paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
		backgroundColor: `${GREEN}15`, gap: 4,
	},
	upgradeText: { color: GREEN, fontSize: 10, fontWeight: "800" },

	// ── Avatar ──
	avatarContainer: {
		alignItems: "center",
		justifyContent: "center",
		height: 180,
		marginBottom: 8,
	},
	avatarAura: {
		position: "absolute",
		overflow: "hidden",
	},
	particle: {
		position: "absolute",
		width: 4,
		height: 4,
		borderRadius: 2,
		backgroundColor: PURPLE,
		top: "50%",
		left: "50%",
		marginLeft: -2,
		marginTop: -2,
	},
	avatarCore: {
		alignItems: "center",
		justifyContent: "center",
		transform: [{ rotate: "45deg" }],
	},
	avatarStageLabel: {
		marginTop: 12,
		fontSize: 13,
		fontWeight: "700",
		color: TEXT_DIM,
		letterSpacing: 2,
		textTransform: "uppercase",
	},

	// ── Awakening Level ──
	levelCard: {
		marginHorizontal: 20,
		marginBottom: 16,
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: BORDER,
	},
	levelTitle: { fontSize: 16, fontWeight: "800", color: TEXT, marginBottom: 12 },
	levelBarBg: {
		height: 8,
		backgroundColor: SURFACE_LIGHT,
		borderRadius: 4,
		overflow: "hidden",
		marginBottom: 8,
	},
	levelBarFill: {
		height: "100%",
		borderRadius: 4,
	},
	levelXpText: { fontSize: 13, color: TEXT_DIM, fontVariant: ["tabular-nums"] },

	// ── Streak ──
	streakCard: {
		marginHorizontal: 20,
		marginBottom: 16,
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: BORDER,
	},
	streakRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	streakMain: { flexDirection: "row", alignItems: "center", gap: 12 },
	streakNumber: { fontSize: 40, fontWeight: "900", color: TEXT, fontVariant: ["tabular-nums"] },
	streakLabel: { fontSize: 16, fontWeight: "700", color: TEXT },
	streakFreezes: { fontSize: 12, color: TEXT_DIM, marginTop: 2 },
	streakFireWrap: {
		width: 56, height: 56, borderRadius: 28,
		backgroundColor: `${GOLD}15`,
		alignItems: "center", justifyContent: "center",
	},

	// ── Quests ──
	questCard: {
		marginHorizontal: 20,
		marginBottom: 16,
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: BORDER,
	},
	questHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
	questTitle: { fontSize: 16, fontWeight: "800", color: TEXT },
	questCountBadge: {
		backgroundColor: `${GREEN}15`,
		paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
	},
	questCountText: { fontSize: 12, fontWeight: "800", color: GREEN, fontVariant: ["tabular-nums"] },
	questRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
	},
	questCheck: {
		width: 24, height: 24, borderRadius: 12,
		borderWidth: 2, borderColor: SURFACE_LIGHT,
		alignItems: "center", justifyContent: "center",
		marginRight: 10,
	},
	questCheckDone: {
		backgroundColor: GREEN,
		borderColor: GREEN,
	},
	questLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: TEXT },
	questLabelDone: { color: TEXT_DIM, textDecorationLine: "line-through" },
	questXpBadge: {
		backgroundColor: `${PURPLE}20`,
		paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
	},
	questXpText: { fontSize: 11, fontWeight: "800", color: PURPLE },

	// ── League ──
	leagueCard: {
		marginHorizontal: 20,
		marginBottom: 16,
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: BORDER,
	},
	leagueHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
	leagueLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
	leagueName: { fontSize: 16, fontWeight: "800" },
	leagueRank: { fontSize: 13, color: TEXT_DIM, fontVariant: ["tabular-nums"] },
	leagueResetBadge: {
		backgroundColor: SURFACE_LIGHT,
		paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
	},
	leagueResetText: { fontSize: 11, fontWeight: "700", color: TEXT_DIM },
	leagueZones: { flexDirection: "row", gap: 16 },
	leagueZone: { flexDirection: "row", alignItems: "center", gap: 4 },
	leagueZoneText: { fontSize: 12, fontWeight: "600" },

	// ── Nutrition Card ──
	nutritionCard: {
		marginHorizontal: 20,
		marginBottom: 16,
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: BORDER,
	},
	nutritionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	nutritionStats: {
		flexDirection: "row",
		backgroundColor: SURFACE_LIGHT,
		borderRadius: 14,
		paddingVertical: 12,
		marginBottom: 16,
	},
	nutritionStat: { flex: 1, alignItems: "center" },
	nutritionStatValue: { fontSize: 20, fontWeight: "800", color: TEXT, fontVariant: ["tabular-nums"] },
	nutritionStatLabel: { fontSize: 11, color: TEXT_DIM, marginTop: 2, fontWeight: "600" },
	macroRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
	macroItem: { alignItems: "center", gap: 6 },
	macroLabel: { fontSize: 12, fontWeight: "700", color: TEXT_DIM },
	recentMeals: {
		borderTopWidth: 1,
		borderTopColor: BORDER,
		paddingTop: 12,
	},
	recentMealsTitle: { fontSize: 13, fontWeight: "700", color: TEXT, marginBottom: 8 },
	recentMealRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 6,
	},
	recentMealName: { fontSize: 14, color: TEXT, fontWeight: "500", flex: 1, marginRight: 8 },
	recentMealCal: { fontSize: 14, fontWeight: "700", color: GREEN },

	// ── Card Base ──
	card: {
		marginHorizontal: 20,
		marginBottom: 16,
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 20,
		borderWidth: 1,
		borderColor: BORDER,
	},
	cardRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
	cardIconWrap: {
		width: 40, height: 40, borderRadius: 12,
		backgroundColor: `${GOLD}15`,
		alignItems: "center", justifyContent: "center",
	},
	cardTitle: { fontSize: 17, fontWeight: "800", color: TEXT, flex: 1 },
	cardSub: { fontSize: 13, color: TEXT_DIM, marginTop: 2 },
	cardHint: { color: TEXT_DIM, fontSize: 13, marginBottom: 20, lineHeight: 18 },

	// ── Check-In ──
	metricBlock: { marginBottom: 20 },
	metricHeader: {
		flexDirection: "row", justifyContent: "space-between",
		alignItems: "center", marginBottom: 10,
	},
	metricLabel: { fontSize: 15, fontWeight: "600", color: TEXT },
	metricHint: { fontSize: 12, color: TEXT_DIM, fontStyle: "italic" },
	sliderTrack: {
		height: 10,
		backgroundColor: SURFACE_LIGHT,
		borderRadius: 5,
		position: "relative",
		justifyContent: "center",
		marginBottom: 2,
	},
	sliderFill: {
		position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 5,
	},
	sliderThumb: {
		position: "absolute", width: 24, height: 24, borderRadius: 12,
		backgroundColor: SURFACE, borderWidth: 3, marginLeft: -12, top: -7,
		shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
	},
	tickRow: {
		flexDirection: "row", justifyContent: "space-between",
		marginTop: 8, marginBottom: 4,
	},
	tick: {
		width: 34, height: 34, borderRadius: 17,
		alignItems: "center", justifyContent: "center",
		backgroundColor: SURFACE_LIGHT,
	},
	tickText: { fontSize: 14, fontWeight: "600", color: TEXT_DIM },
	scoreCaption: { fontSize: 12, fontWeight: "700", marginTop: 2, marginBottom: 4 },
	saveBtn: {
		marginTop: 8, paddingVertical: 16, borderRadius: 14,
		backgroundColor: SURFACE_LIGHT, alignItems: "center",
	},
	saveBtnActive: { backgroundColor: GREEN },
	saveBtnText: { fontSize: 16, fontWeight: "700", color: TEXT_DIM },
	saveBtnTextActive: { color: BG },

	// ── Completed Check-In ──
	completedBadge: {
		flexDirection: "row", alignItems: "center", gap: 6,
		backgroundColor: `${GREEN}15`, borderRadius: 999,
		paddingHorizontal: 12, paddingVertical: 6, alignSelf: "center",
		marginBottom: 12,
	},
	completedBadgeText: { color: GREEN, fontSize: 13, fontWeight: "700" },
	countdownBox: {
		borderWidth: 1, borderColor: `${PURPLE}40`, borderRadius: 14,
		paddingVertical: 16, alignItems: "center",
	},
	countdownLabel: { color: TEXT_DIM, fontSize: 13 },
	countdownValue: { color: PURPLE, fontSize: 32, fontWeight: "900", marginTop: 4, fontVariant: ["tabular-nums"] },

	// ── EZBuddy ──
	buddyCard: {
		marginHorizontal: 20,
		marginBottom: 16,
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: `${PURPLE}20`,
	},
	buddyRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
	buddyAvatarWrap: { position: "relative" },
	buddyAvatar: {
		width: 48, height: 48, borderRadius: 24,
		alignItems: "center", justifyContent: "center",
	},
	buddyOnline: {
		position: "absolute", bottom: 0, right: 0,
		width: 14, height: 14, borderRadius: 7,
		backgroundColor: GREEN, borderWidth: 2.5, borderColor: SURFACE,
	},
	buddySpeech: {
		flex: 1, backgroundColor: SURFACE_LIGHT,
		borderRadius: 14, borderTopLeftRadius: 4, padding: 12,
	},
	buddySpeechText: { color: TEXT, fontSize: 13, fontWeight: "500", lineHeight: 19 },
	buddyActions: { flexDirection: "row", gap: 8, alignItems: "center" },
	buddyActionBtn: {
		flexDirection: "row", alignItems: "center", gap: 4,
		backgroundColor: `${GREEN}10`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
	},
	buddyActionText: { color: GREEN, fontSize: 12, fontWeight: "700" },
	buddyXpPill: {
		marginLeft: "auto",
		backgroundColor: `${GOLD}15`,
		paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
	},
	buddyXpText: { color: GOLD, fontSize: 11, fontWeight: "800" },

	// ── Sections ──
	sectionTitle: {
		fontSize: 18, fontWeight: "800", color: TEXT,
		marginBottom: 12, paddingHorizontal: 20,
	},

	// ── Feature Hub ──
	featureRow: {
		flexDirection: "row", paddingHorizontal: 20, gap: 12, marginBottom: 20,
	},
	featureCard: {
		flex: 1, borderRadius: 16, overflow: "hidden",
		shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
	},
	featureGrad: {
		paddingVertical: 20, paddingHorizontal: 12,
		alignItems: "center", justifyContent: "center", minHeight: 100, gap: 8,
	},
	featureLabel: {
		color: "#FFFFFF", fontSize: 12, fontWeight: "800",
		textAlign: "center", lineHeight: 16,
	},

	// ── Disclaimer ──
	disclaimerBanner: {
		flexDirection: "row", alignItems: "center",
		backgroundColor: `${GOLD}08`, marginHorizontal: 20, marginBottom: 16,
		padding: 12, borderRadius: 12, borderWidth: 1, borderColor: `${GOLD}20`, gap: 8,
	},
	disclaimerBannerText: {
		flex: 1, fontSize: 11, color: TEXT_DIM, lineHeight: 16, fontWeight: "500",
	},

	// ── FAB ──
	fabWrap: {
		position: "absolute",
		bottom: 24,
		right: 24,
		shadowColor: PURPLE,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 12,
		elevation: 8,
	},
	fab: {
		width: 60, height: 60, borderRadius: 30,
		alignItems: "center", justifyContent: "center",
	},
});
