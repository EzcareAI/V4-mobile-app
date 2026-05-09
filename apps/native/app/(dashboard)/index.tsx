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
import { levelsService, type LevelInfo } from "@/lib/levels-service";
import { streakService, type StreakInfo } from "@/lib/streak-service";
import { questGenerator, type DailyQuestsData, type Quest } from "@/lib/quest-generator";
import { insightsEngine, type Insight } from "@/lib/insights-engine";
import { leaguesService, type LeagueInfo } from "@/lib/leagues-service";
import { achievementsService } from "@/lib/achievements-service";
import { supabase } from "@/lib/supabase";
import { familyService, type FamilyGroup } from "@/lib/family-service";

// ── Light Wellness Design Tokens ────────────────────
const BG = "#F0F7FA";
const SURFACE = "#FFFFFF";
const SURFACE_LIGHT = "#E8F4F8";
const PURPLE = "#5B9BD5";
const GREEN = "#34C759";
const GOLD = "#FF9500";
const TEXT = "#1C1C1E";
const TEXT_DIM = "#8E8E93";
const BORDER = "rgba(0,0,0,0.06)";

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
	{ key: "sleep", label: "Sleep Quality", icon: "moon", color: "#7C5CFC", lowLabel: "Poor", highLabel: "Excellent" },
	{ key: "energy", label: "Energy Level", icon: "flash", color: "#FF9500", lowLabel: "Low", highLabel: "High" },
	{ key: "stress", label: "Stress Level", icon: "heart", color: "#FF6B8A", lowLabel: "Calm", highLabel: "Stressed" },
	{ key: "digestion", label: "Digestion", icon: "leaf", color: "#34C759", lowLabel: "Poor", highLabel: "Great" },
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
				<Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(0,0,0,0.08)" strokeWidth={strokeWidth} fill="transparent" />
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
					colors={[`${PURPLE}30`, `${PURPLE}00`]}
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
function AwakeningLevelCard({ levelInfo }: { levelInfo: LevelInfo | null }) {
	const level = levelInfo?.currentLevel ?? 1;
	const title = levelInfo?.levelTitle ?? "Sleeper";
	const currentXp = levelInfo?.currentXp ?? 0;
	const xpForNext = levelInfo?.xpForNext ?? 100;
	const progressPct = levelInfo?.progressPct ?? 0;

	return (
		<View style={styles.levelCard}>
			<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
				<Text style={styles.levelTitle}>Awakening Level {level}</Text>
				<Text style={{ color: PURPLE, fontSize: 12, fontWeight: "700" }}>{title}</Text>
			</View>
			<View style={styles.levelBarBg}>
				<LinearGradient
					colors={[PURPLE, GREEN]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={[styles.levelBarFill, { width: `${Math.min(progressPct * 100, 100)}%` as any }]}
				/>
			</View>
			<Text style={styles.levelXpText}>
				{currentXp} / {xpForNext} XP to next level
			</Text>
		</View>
	);
}

// ── Streak Display ───────────────────────────────────
function StreakDisplay({ streakInfo }: { streakInfo: StreakInfo | null }) {
	const currentStreak = streakInfo?.currentStreak ?? 0;
	const freezes = streakInfo?.freezesAvailable ?? 0;
	const isActive = currentStreak > 0;

	return (
		<View style={[styles.streakCard, isActive && { borderColor: `${GOLD}30` }]}>
			<View style={styles.streakRow}>
				<View style={styles.streakMain}>
					<Text style={[styles.streakNumber, isActive && { color: GOLD }]}>{currentStreak}</Text>
					<View>
						<Text style={styles.streakLabel}>day streak</Text>
						<Text style={styles.streakFreezes}>{freezes} freeze{freezes !== 1 ? "s" : ""} available</Text>
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

// ── Daily Quests (real AI-generated) ─────────────────
function DailyQuestsCard({
	quests,
	completedIds,
	onComplete,
}: {
	quests: Quest[];
	completedIds: string[];
	onComplete: (questId: string) => void;
}) {
	const router = useRouter();
	const completedCount = completedIds.length;

	const handleQuestTap = (quest: Quest) => {
		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
		}
		if (completedIds.includes(quest.id)) return;

		// Navigate to relevant screen or mark as self-report
		if (quest.category === "nutrition") {
			router.push("/scan/meal-scanner");
		} else if (quest.category === "reflection") {
			router.push("/chat");
		} else {
			// Self-report: mark complete on tap
			onComplete(quest.id);
		}
	};

	return (
		<View style={styles.questCard}>
			<View style={styles.questHeader}>
				<Text style={styles.questTitle}>Today's Quests</Text>
				<View style={styles.questCountBadge}>
					<Text style={styles.questCountText}>{completedCount}/{quests.length}</Text>
				</View>
			</View>
			{quests.map((quest, i) => {
				const done = completedIds.includes(quest.id);
				return (
					<TouchableOpacity
						key={quest.id}
						activeOpacity={0.7}
						onPress={() => handleQuestTap(quest)}
						style={[styles.questRow, i < quests.length - 1 && { borderBottomWidth: 1, borderBottomColor: BORDER }]}
					>
						<View style={[styles.questCheck, done && styles.questCheckDone]}>
							{done && <Ionicons name="checkmark" size={14} color={BG} />}
						</View>
						<Ionicons name={(quest.icon || "star-outline") as any} size={18} color={done ? TEXT_DIM : GREEN} style={{ marginRight: 10 }} />
						<Text style={[styles.questLabel, done && styles.questLabelDone]}>{quest.label}</Text>
						<View style={[styles.questXpBadge, done && { backgroundColor: `${TEXT_DIM}20` }]}>
							<Text style={[styles.questXpText, done && { color: TEXT_DIM }]}>+{quest.xp_reward}</Text>
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
	const { firstName, userId } = useOnboardingStore();
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
	const gamLevel = useGamificationStore((s) => Math.floor(s.totalXp / 500) + 1);
	const foodGoals = useFoodDiaryStore((s) => s.goals);
	const dayLogs = useFoodDiaryStore((s) => s.dayLogs);
	const todayStr = new Date().toISOString().split("T")[0];
	const todayLog = dayLogs.find((d) => d.date === todayStr) || { date: todayStr, meals: [] as any[] };
	const todayTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: todayLog.meals.length };
	for (const meal of todayLog.meals) {
		todayTotals.calories += meal.totalCalories;
		todayTotals.protein += meal.protein;
		todayTotals.carbs += meal.carbs;
		todayTotals.fat += meal.fat;
	}
	const goals = foodGoals;
	const calRemaining = Math.max(0, goals.calories - todayTotals.calories);

	const [values, setValues] = useState({ sleep: 3, energy: 3, stress: 3, digestion: 3 });
	const [saved, setSaved] = useState(false);
	const [nextMs, setNextMs] = useState(getNextCheckInMs());
	const router = useRouter();

	// ── Real Supabase-backed state ──
	const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
	const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
	const [questsData, setQuestsData] = useState<DailyQuestsData | null>(null);
	const [xpToast, setXpToast] = useState<{ amount: number; visible: boolean }>({ amount: 0, visible: false });
	const [ritualDoneToday, setRitualDoneToday] = useState(false);
	const [leagueInfo, setLeagueInfo] = useState<LeagueInfo | null>(null);
	const [insightCard, setInsightCard] = useState<Insight | null>(null);
	const [showInsight, setShowInsight] = useState(false);
	const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
	const [familyMemberCount, setFamilyMemberCount] = useState(0);

	// ── Fetch real data from Supabase on mount ──
	useEffect(() => {
		if (!userId) return;

		const loadData = async () => {
			try {
				const today = new Date().toISOString().split("T")[0];
				const [level, streakData, quests, ritualCheck, league] = await Promise.all([
					levelsService.getLevelInfo(userId),
					streakService.getStreakInfo(userId),
					questGenerator.getTodayQuests(userId),
					supabase.from("awakening_rituals").select("id").eq("user_id", userId).eq("date", today).single(),
					leaguesService.getLeagueInfo(userId).catch(() => null),
				]);
				setLevelInfo(level);
				setStreakInfo(streakData);
				setQuestsData(quests);
				setRitualDoneToday(!!ritualCheck.data);
				if (league) setLeagueInfo(league);

				// Load family info
				familyService.getMyFamily(userId).then(async (fam) => {
					setFamilyGroup(fam);
					if (fam) {
						const members = await familyService.getFamilyMembers(fam.id);
						setFamilyMemberCount(members.length);
					}
				}).catch(() => {});
			} catch (err) {
				console.warn("[Home] Failed to load data:", err);
			}
		};
		loadData();
	}, [userId]);

	// ── Show XP toast ──
	const showXpGain = (amount: number) => {
		setXpToast({ amount, visible: true });
		setTimeout(() => setXpToast({ amount: 0, visible: false }), 2000);
	};

	// ── Refresh level info after XP change ──
	const refreshLevel = async () => {
		if (!userId) return;
		const info = await levelsService.getLevelInfo(userId);
		setLevelInfo(info);
	};

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

	const handleSave = async () => {
		if (!allFilled || saved) return;
		saveCheckIn(values);
		setSaved(true);
		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Medium).catch(() => {});
		}

		// Award XP for daily check-in
		if (userId) {
			try {
				const result = await levelsService.addXp(userId, 50, "daily_check_in", { values });
				showXpGain(50);
				setLevelInfo(result.levelInfo);

				// Update streak
				const streakResult = await streakService.recordActivity(userId);
				setStreakInfo(streakResult.streakInfo);

				// Award streak milestone XP if applicable
				if (streakResult.milestoneXp > 0) {
					const milestoneResult = await levelsService.addXp(
						userId,
						streakResult.milestoneXp,
						"streak_milestone",
						{ days: streakResult.milestoneReached }
					);
					setLevelInfo(milestoneResult.levelInfo);
				}

				// Check streak achievements
				achievementsService
					.checkAchievements(userId, "streak_update", { streak: streakResult.streakInfo.currentStreak })
					.catch(() => {});
			} catch (err) {
				console.warn("[Home] XP award failed:", err);
			}
		}
	};

	// ── Handle quest completion ──
	const handleQuestComplete = async (questId: string) => {
		if (!userId || !questsData) return;

		try {
			const result = await questGenerator.completeQuest(userId, questId);
			setQuestsData((prev) => prev ? { ...prev, completedQuestIds: result.completedQuestIds, bonusCompleted: result.bonusCompleted } : prev);

			// Award XP
			if (result.xpAwarded > 0) {
				const xpResult = await levelsService.addXp(userId, result.xpAwarded, "quest_completion", { quest_id: questId });
				showXpGain(result.xpAwarded);
				setLevelInfo(xpResult.levelInfo);

				// Update streak on quest completion
				const streakResult = await streakService.recordActivity(userId);
				setStreakInfo(streakResult.streakInfo);
			}

			// Bonus for completing all 3
			if (result.allCompleted) {
				const bonusResult = await levelsService.addXp(userId, 500, "daily_hero_bonus");
				setTimeout(() => showXpGain(500), 1000);
				setLevelInfo(bonusResult.levelInfo);

				// Check daily_all_quests achievement
				achievementsService.checkAchievements(userId, "daily_all_quests").catch(() => {});
			}

			// Check quest achievements
			achievementsService.checkAchievements(userId, "quest_complete").catch(() => {});

			// Generate AI insight (non-blocking)
			const quest = questsData?.quests.find((q) => q.id === questId);
			if (quest) {
				insightsEngine
					.generateInsight(userId, {
						questLabel: quest.label,
						questCategory: quest.category,
						questDifficulty: quest.difficulty,
						userLevel: levelInfo?.currentLevel ?? 1,
						streakDays: streakInfo?.currentStreak ?? 0,
						weeklyXp: leagueInfo?.weekXp ?? 0,
					})
					.then((insight) => {
						if (insight) {
							setInsightCard(insight);
							setShowInsight(true);
							setTimeout(() => setShowInsight(false), 6000);
						}
					})
					.catch(() => {});
			}

			if (Platform.OS === "ios") {
				impactAsync(ImpactFeedbackStyle.Medium).catch(() => {});
			}
		} catch (err) {
			console.warn("[Home] Quest completion failed:", err);
		}
	};

	// Use real level or fallback to local gamification store
	const displayLevel = levelInfo?.currentLevel ?? gamLevel;
	const dayCount = Math.max(streakInfo?.currentStreak ?? streak, 1);

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

					{/* ── XP Toast ── */}
					{xpToast.visible && (
						<View style={styles.xpToast}>
							<Text style={styles.xpToastText}>+{xpToast.amount} XP</Text>
						</View>
					)}

					{/* ── Avatar Evolution ── */}
					<AvatarEvolution level={displayLevel} />

					{/* ── Awakening Level ── */}
					<AwakeningLevelCard levelInfo={levelInfo} />

					{/* ── Streak Display ── */}
					<StreakDisplay streakInfo={streakInfo} />

					{/* ── Today's Quests ── */}
					{questsData && questsData.quests.length > 0 ? (
						<DailyQuestsCard
							quests={questsData.quests}
							completedIds={questsData.completedQuestIds}
							onComplete={handleQuestComplete}
						/>
					) : (
						<DailyQuestsCard
							quests={SPRINT1_QUESTS.map((q, i) => ({
								id: q.id,
								difficulty: (["easy", "medium", "hard"] as const)[i],
								category: "mindfulness" as const,
								icon: q.icon,
								label: q.label,
								description: "",
								xp_reward: q.xp,
								measurable_goal: { type: "self_report" as const, value: 1 },
							}))}
							completedIds={[]}
							onComplete={handleQuestComplete}
						/>
					)}

					{/* ── League Position ── */}
					{leagueInfo ? (
					<View style={[styles.leagueCard, { borderColor: `${leagueInfo.currentLeague.color}30` }]}>
						<View style={styles.leagueHeader}>
							<View style={styles.leagueLeft}>
								<Text style={{ fontSize: 24 }}>🏆</Text>
								<View>
									<Text style={[styles.leagueName, { color: leagueInfo.currentLeague.color }]}>
										{leagueInfo.currentLeague.label} League
									</Text>
									<Text style={styles.leagueRank}>
										#{leagueInfo.rank ?? "?"} of {leagueInfo.groupSize}
									</Text>
								</View>
							</View>
							<View style={styles.leagueResetBadge}>
								<Text style={styles.leagueResetText}>
									{leaguesService.getTimeUntilReset()}
								</Text>
							</View>
						</View>
						<View style={styles.leagueZones}>
							<View style={styles.leagueZone}>
								<Ionicons name="arrow-up" size={12} color={GREEN} />
								<Text style={[styles.leagueZoneText, { color: GREEN }]}>
									{leagueInfo.inPromotionZone ? "Promotion zone!" : `Top ${leagueInfo.currentLeague.promotionTop} advance`}
								</Text>
							</View>
							{leagueInfo.currentLeague.relegationBottom > 0 && (
								<View style={styles.leagueZone}>
									<Ionicons name="arrow-down" size={12} color="#FF6B6B" />
									<Text style={[styles.leagueZoneText, { color: "#FF6B6B" }]}>
										{leagueInfo.inRelegationZone ? "Relegation zone" : `Bottom ${leagueInfo.currentLeague.relegationBottom} demote`}
									</Text>
								</View>
							)}
						</View>
					</View>
				) : (
					<LeagueCard totalXp={levelInfo?.totalXpEarned ?? 0} />
				)}

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
					{/* Insight Card (slides up after quest completion) */}
					{showInsight && insightCard && (
						<TouchableOpacity
							activeOpacity={0.9}
							onPress={() => setShowInsight(false)}
							style={styles.insightCard}
						>
							<LinearGradient
								colors={[`${PURPLE}15`, `${GREEN}08`]}
								style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							/>
							<View style={styles.insightHeader}>
								<Ionicons name="sparkles" size={16} color={PURPLE} />
								<Text style={styles.insightHeaderText}>EZBuddy noticed</Text>
							</View>
							<Text style={styles.insightText}>{insightCard.insight}</Text>
							{insightCard.patternDetected && (
								<View style={styles.insightPattern}>
									<Ionicons name="trending-up" size={12} color={GREEN} />
									<Text style={styles.insightPatternText}>{insightCard.patternDetected}</Text>
								</View>
							)}
						</TouchableOpacity>
					)}

					{/* Awakening Ritual Banner */}
					{!ritualDoneToday && canSave && !saved && (
						<TouchableOpacity
							activeOpacity={0.85}
							onPress={() => router.push("/awakening-ritual")}
							style={styles.ritualBanner}
						>
							<LinearGradient
								colors={["#1A0A2E", "#2D1052", "#FF6B3520"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
							/>
							<View style={styles.ritualBannerContent}>
								<View style={styles.ritualBannerLeft}>
									<Text style={styles.ritualBannerEmoji}>🌅</Text>
									<View>
										<Text style={styles.ritualBannerTitle}>Start Your Awakening</Text>
										<Text style={styles.ritualBannerSub}>60-second guided ritual +100 XP</Text>
									</View>
								</View>
								<View style={styles.ritualBannerArrow}>
									<Ionicons name="arrow-forward" size={18} color={PURPLE} />
								</View>
							</View>
						</TouchableOpacity>
					)}

					{ritualDoneToday && (
						<View style={styles.ritualCompleteBadge}>
							<Ionicons name="checkmark-circle" size={16} color={GREEN} />
							<Text style={styles.ritualCompleteText}>Awakening ritual complete</Text>
							<Text style={styles.ritualCompleteXp}>+100 XP</Text>
						</View>
					)}

					{/* Daily Check-In (shows only if ritual not done) */}
					{canSave && !saved && !ritualDoneToday ? (
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
								<Text style={styles.buddyXpText}>Lv {displayLevel}</Text>
							</View>
						</View>
					</TouchableOpacity>

					{/* ── Family Card ── */}
					<TouchableOpacity
						activeOpacity={0.85}
						onPress={() => router.push("/family-dashboard")}
						style={styles.familyCard}
					>
						<LinearGradient
							colors={[`${PURPLE}20`, `${GREEN}10`]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
						/>
						<View style={styles.familyCardContent}>
							<Text style={{ fontSize: 28 }}>👨‍👩‍👧‍👦</Text>
							<View style={{ flex: 1 }}>
								<Text style={styles.familyCardTitle}>
									{familyGroup ? familyGroup.name : "Family Mode"}
								</Text>
								<Text style={styles.familyCardSub}>
									{familyGroup
										? `${familyMemberCount} member${familyMemberCount !== 1 ? "s" : ""}`
										: "Track progress together"}
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={18} color={TEXT_DIM} />
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

	// ── XP Toast ──
	xpToast: {
		position: "absolute",
		top: 60,
		alignSelf: "center",
		backgroundColor: `${GREEN}20`,
		borderWidth: 1,
		borderColor: `${GREEN}40`,
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 20,
		zIndex: 100,
	},
	xpToastText: {
		color: GREEN,
		fontSize: 16,
		fontWeight: "900",
		fontVariant: ["tabular-nums"],
	},

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
	saveBtnTextActive: { color: "#FFFFFF" },

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
	// ── Family Card ──
	familyCard: {
		marginHorizontal: 20, marginBottom: 16, borderRadius: 16,
		borderWidth: 1, borderColor: BORDER, overflow: "hidden",
	},
	familyCardContent: {
		flexDirection: "row", alignItems: "center", padding: 16, gap: 12,
	},
	familyCardTitle: { fontSize: 16, fontWeight: "700", color: TEXT },
	familyCardSub: { fontSize: 13, color: TEXT_DIM, marginTop: 2 },

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

	// ── Ritual Banner ──
	ritualBanner: {
		marginHorizontal: 20,
		marginBottom: 16,
		borderRadius: 16,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: `${PURPLE}30`,
	},
	ritualBannerContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 16,
	},
	ritualBannerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	ritualBannerEmoji: { fontSize: 32 },
	ritualBannerTitle: { fontSize: 16, fontWeight: "800", color: TEXT },
	ritualBannerSub: { fontSize: 13, color: TEXT_DIM, marginTop: 2 },
	ritualBannerArrow: {
		width: 36, height: 36, borderRadius: 18,
		backgroundColor: `${PURPLE}20`,
		alignItems: "center", justifyContent: "center",
	},

	// ── Ritual Complete ──
	ritualCompleteBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginHorizontal: 20,
		marginBottom: 16,
		padding: 12,
		borderRadius: 12,
		backgroundColor: `${GREEN}08`,
		borderWidth: 1,
		borderColor: `${GREEN}20`,
		overflow: "hidden",
	},
	ritualCompleteText: { color: GREEN, fontSize: 13, fontWeight: "700", flex: 1 },
	ritualCompleteXp: { color: GREEN, fontSize: 12, fontWeight: "800" },

	// ── Insight Card ──
	insightCard: {
		marginHorizontal: 20,
		marginBottom: 16,
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: `${PURPLE}20`,
		overflow: "hidden",
	},
	insightHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: 8,
	},
	insightHeaderText: { fontSize: 13, fontWeight: "800", color: PURPLE },
	insightText: { fontSize: 14, fontWeight: "500", color: TEXT, lineHeight: 21 },
	insightPattern: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 10,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: BORDER,
	},
	insightPatternText: { fontSize: 12, color: GREEN, fontWeight: "600" },
});
