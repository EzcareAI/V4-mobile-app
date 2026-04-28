import { Ionicons } from "@expo/vector-icons";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
	useCallback,
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
import { useDashboardStore } from "@/stores/dashboard-store";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useGamificationStore } from "@/stores/gamification-store";

// ── Design tokens ──────────────────────────────────
const BG = "#F4F6F8";
const CARD = "#FFFFFF";
const TEAL = "#3EC9B5";
const DARK = "#1A1A2E";
const GREY = "#94A3B8";
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
	{
		key: "sleep",
		label: "Sleep Quality",
		icon: "🌙",
		color: "#9B8BF4",
		lowLabel: "Poor",
		highLabel: "Excellent",
	},
	{
		key: "energy",
		label: "Energy Level",
		icon: "⚡",
		color: "#F5A623",
		lowLabel: "Low",
		highLabel: "High",
	},
	{
		key: "stress",
		label: "Stress Level",
		icon: "💗",
		color: "#FF6B8A",
		lowLabel: "Calm",
		highLabel: "Stressed",
	},
	{
		key: "digestion",
		label: "Digestion",
		icon: "🌿",
		color: "#9B8BF4",
		lowLabel: "Poor",
		highLabel: "Great",
	},
];
// Maps a 1–5 score to a short descriptive label per metric
const SCORE_LABELS: Record<MetricKey, string[]> = {
	sleep: ["Terrible", "Poor", "Fair", "Good", "Excellent"],
	energy: ["Drained", "Low", "Moderate", "Good", "High"],
	stress: ["Very Calm", "Calm", "Mild", "Stressed", "Very Stressed"],
	digestion: ["Very Poor", "Poor", "Fair", "Good", "Great"],
};

// ── Smooth Slider (uses core Animated — no Reanimated native module) ──────────
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
	// Use core Animated.Value — bundled with RN, no native module crash risk
	const animPct = useRef(
		new Animated.Value(value > 0 ? ((value - 1) / 4) * 100 : 50)
	).current;

	useEffect(() => {
		const target = value > 0 ? ((value - 1) / 4) * 100 : 50;
		Animated.spring(animPct, {
			toValue: target,
			damping: 20,
			stiffness: 200,
			useNativeDriver: false,
		}).start();
	}, [value, animPct]);

	const isDragging = useRef(false);
	const startPct = useRef(0);
	const currentValue = useRef(value);
	currentValue.current = value;

	useEffect(() => {
		if (isDragging.current) {
			return;
		}
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
				// On tap, determine percentage based on tap location relative to the track
				const x = e.nativeEvent.locationX;
				const currentWidth = sliderWidth.current || 1;
				const pct = Math.min(100, Math.max(0, (x / currentWidth) * 100));

				startPct.current = pct;

				Animated.timing(animPct, {
					toValue: pct,
					duration: 100,
					useNativeDriver: false,
				}).start();

				const clamped = Math.min(
					5,
					Math.max(1, Math.round((pct / 100) * 4 + 1))
				);
				if (clamped !== currentValue.current) {
					onChange(clamped);
				}
			},
			onPanResponderMove: (_, gestureState) => {
				const currentWidth = sliderWidth.current || 1;
				const deltaPct = (gestureState.dx / currentWidth) * 100;
				const newPct = Math.min(100, Math.max(0, startPct.current + deltaPct));

				animPct.setValue(newPct);

				// Update the numeric tick/score dynamically without strictly snapping the bar
				const clamped = Math.min(
					5,
					Math.max(1, Math.round((newPct / 100) * 4 + 1))
				);
				if (clamped !== currentValue.current) {
					onChange(clamped);
				}
			},
			onPanResponderRelease: (_, gestureState) => {
				isDragging.current = false;
				const currentWidth = sliderWidth.current || 1;
				const deltaPct = (gestureState.dx / currentWidth) * 100;
				const finalPct = Math.min(
					100,
					Math.max(0, startPct.current + deltaPct)
				);

				const clamped = Math.min(
					5,
					Math.max(1, Math.round((finalPct / 100) * 4 + 1))
				);
				onChange(clamped);

				// Snap to the exact integer tick
				Animated.spring(animPct, {
					toValue: ((clamped - 1) / 4) * 100,
					damping: 20,
					stiffness: 250,
					useNativeDriver: false,
				}).start();
			},
		})
	).current;

	// Derive percent string for fill/thumb from animated value
	const fillWidth = animPct.interpolate({
		inputRange: [0, 100],
		outputRange: ["0%", "100%"],
		extrapolate: "clamp",
	});
	const thumbLeft = animPct.interpolate({
		inputRange: [0, 100],
		outputRange: ["0%", "100%"],
		extrapolate: "clamp",
	});
	const scoreLabel = value > 0 ? SCORE_LABELS[metricKey][value - 1] : null;

	return (
		<View>
			{/* Slider track */}
			<View
				onLayout={(e) => {
					sliderWidth.current = e.nativeEvent.layout.width;
				}}
				style={styles.sliderTrack}
				{...pan.panHandlers}
			>
				<Animated.View
					style={[
						styles.sliderFill,
						{ backgroundColor: color, width: fillWidth },
					]}
				/>
				{value > 0 && (
					<Animated.View
						style={[
							styles.sliderThumb,
							{ borderColor: color, left: thumbLeft },
						]}
					/>
				)}
			</View>

			{/* Numbered tick markers */}
			<View style={styles.tickRow}>
				{[1, 2, 3, 4, 5].map((n) => (
					<TouchableOpacity
						key={n}
						onPress={() => onChange(n)}
						style={[styles.tick, value === n && { backgroundColor: color }]}
					>
						<Text
							style={[
								styles.tickText,
								value === n && { color: "#fff", fontWeight: "800" },
							]}
						>
							{n}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			{/* Score label */}
			{scoreLabel && (
				<Text style={[styles.scoreCaption, { color }]}>
					{value} / 5 — {scoreLabel}
				</Text>
			)}
		</View>
	);
}

// ── Daily Action Card ────────────────────────────────
const PASTEL_COLORS = [
	{ bg: "#EDE8FF", border: "#C4B5FD" },
	{ bg: "#E8F4FF", border: "#93C5FD" },
	{ bg: "#E8FFF6", border: "#6EE7B7" },
];

function formatCountdown(ms: number): string {
	if (ms <= 0) {
		return "now";
	}
	const h = Math.floor(ms / 3_600_000);
	const m = Math.floor((ms % 3_600_000) / 60_000);
	return `${h}h ${m}m`;
}

export default function HomeScreen() {
	const { firstName } =
		useOnboardingStore();
	const {
		canCheckIn,
		saveCheckIn,
		getNextCheckInMs,
		streak,
		resetDailyMissions,
		missions,
		toggleMission,
	} = useDashboardStore();

	const [values, setValues] = useState({
		sleep: 3,
		energy: 3,
		stress: 3,
		digestion: 3,
	});
	const [saved, setSaved] = useState(false);
	const [nextMs, setNextMs] = useState(getNextCheckInMs());
	const router = useRouter();

	// Resets daily missions + live countdown
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
		// Guard against double-tap: once saved locally, stop re-submitting.
		if (!allFilled || saved) {
			return;
		}
		saveCheckIn(values);
		setSaved(true);
		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Medium).catch(() => {
				/* ignore */
			});
		}
	};

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				style={styles.scroll}
			>
				{/* ── Header with EZBuddy ── */}
				<View style={styles.header}>
					<View style={{ flex: 1 }}>
						<Text style={styles.welcome}>
							{new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Hey" : "Good evening"}{firstName ? `, ${firstName}` : ""}! 👋
						</Text>
						<Text style={styles.welcomeSub}>
							{streak > 0 ? `🔥 ${streak}-day streak — keep it going!` : "Let's start building your streak today"}
						</Text>
					</View>
					<TouchableOpacity
						onPress={() => router.push("/settings/subscription")}
						style={styles.proBtn}
					>
						{isPro ? (
							<LinearGradient
								colors={["#FFD700", "#FFA500"]}
								start={{ x: 0, y: 0 }}
								style={styles.proBadge}
							>
								<Ionicons color="#FFF" name="star" size={14} />
								<Text style={styles.proText}>PRO</Text>
							</LinearGradient>
						) : (
							<View style={styles.upgradeBadge}>
								<Ionicons color={TEAL} name="sparkles" size={14} />
								<Text style={styles.upgradeText}>UPGRADE</Text>
							</View>
						)}
					</TouchableOpacity>
				</View>

				{/* ── EZBuddy Companion Card (Duolingo-style) ── */}
				<TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/(dashboard)/buddy")} style={styles.buddyCard}>
					<View style={styles.buddyRow}>
						<View style={styles.buddyAvatarWrap}>
							<LinearGradient colors={[TEAL, "#28B898"]} style={styles.buddyAvatar}>
								<Text style={{ fontSize: 28 }}>
									{(() => {
										const lv = useDashboardStore.getState().lastCheckInValues;
										if (!lv) return "🤖";
										const avg = (lv.sleep + lv.energy + (6 - lv.stress) + lv.digestion) / 4;
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
									const lv = useDashboardStore.getState().lastCheckInValues;
									const hour = new Date().getHours();
									if (!lv) return "Hey! Do your first check-in and I'll start giving you personalized tips. 💪";
									if (hour < 12 && lv.sleep <= 2) return "Rough sleep? Try avoiding screens 1 hour before bed tonight. I believe in you! 💜";
									if (hour < 12 && lv.sleep >= 4) return "You slept great! That's your foundation for an amazing day. Let's build on it! ⚡";
									if (lv.energy <= 2) return "Energy low? A quick 10-min walk + glass of water works wonders. Try it! 🚶";
									if (lv.stress >= 4) return "I notice you're stressed. Take 3 deep breaths right now — I'll wait. 🧘";
									if (streak >= 7) return `${streak} days strong! You're crushing it. Consistency is your superpower! 🔥`;
									return "Looking good today! Keep checking in so I can track your patterns. 📊";
								})()}
							</Text>
							<View style={styles.buddySpeechArrow} />
						</View>
					</View>
					<View style={styles.buddyActions}>
						<TouchableOpacity onPress={() => router.push("/chat")} style={styles.buddyActionBtn}>
							<Ionicons color={TEAL} name="chatbubble-ellipses-outline" size={14} />
							<Text style={styles.buddyActionText}>Chat</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => router.push("/(dashboard)/buddy")} style={styles.buddyActionBtn}>
							<Ionicons color={TEAL} name="person-outline" size={14} />
							<Text style={styles.buddyActionText}>Profile</Text>
						</TouchableOpacity>
						<View style={styles.buddyXpPill}>
							<Text style={styles.buddyXpText}>⭐ Lv {useGamificationStore.getState().getLevel()}</Text>
						</View>
					</View>
				</TouchableOpacity>

				{/* ── Lifestyle Disclaimer ── */}
				<View style={styles.disclaimerBanner}>
					<Ionicons color="#D97706" name="information-circle" size={18} />
					<Text style={styles.disclaimerBannerText}>
						EZCare is an educational lifestyle awareness tool only. It is not a substitute for professional advice. Always consult a qualified professional for any concerns.
					</Text>
				</View>

				{/* ── Daily Check-In Card ── */}
				{canSave && !saved ? (
					// Active check-in
					<View style={styles.card}>
						<View style={styles.cardRow}>
							<View style={styles.cardIconWrap}>
								<Text style={{ fontSize: 20 }}>✅</Text>
							</View>
							<Text style={styles.cardTitle}>Daily Check-In (Morning)</Text>
						</View>
						<Text style={styles.cardHint}>
							Good morning! How did you sleep and how do you feel?
						</Text>

						{METRICS.map((m) => (
							<View key={m.key} style={styles.metricBlock}>
								<View style={styles.metricHeader}>
									<Text style={styles.metricLabel}>
										{m.icon} {m.label}
									</Text>
									{values[m.key] === 0 && (
										<Text style={styles.metricHint}>Tap 1–5</Text>
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
							<Text
								style={[
									styles.saveBtnText,
									allFilled && styles.saveBtnTextActive,
								]}
							>
								Save Today's Check-In
							</Text>
						</TouchableOpacity>
					</View>
				) : (
					// Completed state
					<View style={styles.card}>
						<View style={styles.completedBadge}>
							<Ionicons color="#3CB371" name="checkmark-circle" size={18} />
							<Text style={styles.completedBadgeText}>
								Morning Check-In Completed ✓
							</Text>
						</View>
						<Ionicons
							color={TEAL}
							name="time-outline"
							size={44}
							style={{ alignSelf: "center", marginTop: 16 }}
						/>
						<Text style={styles.completedTitle}>
							Daily Check-In – Next One
						</Text>
						<Text style={styles.completedEvening}>Evening Check-In</Text>
						<View style={styles.countdownBox}>
							<Text style={styles.countdownLabel}>Next One In</Text>
							<Text style={styles.countdownValue}>
								{formatCountdown(nextMs)}
							</Text>
						</View>
					</View>
				)}

				{/* ── Daily Actions ── */}
				<Text style={styles.sectionTitle}>Your Daily Actions</Text>
				{missions.map((mission, i) => {
					const palette = PASTEL_COLORS[i % PASTEL_COLORS.length];
					return (
						<TouchableOpacity
							activeOpacity={0.8}
							key={mission.id}
							onPress={() => {
								toggleMission(mission.id);
								if (Platform.OS === "ios") {
									impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
								}
							}}
							style={[
								styles.actionCard,
								{ backgroundColor: palette.bg, borderColor: palette.border },
								mission.completed && { opacity: 0.85 },
							]}
						>
							<View
								style={[
									styles.actionIconWrap,
									{
										backgroundColor: mission.completed
											? TEAL
											: "rgba(255,255,255,0.7)",
									},
								]}
							>
								{mission.completed ? (
									<Ionicons color="#FFF" name="checkmark" size={20} />
								) : (
									<Text style={styles.actionIcon}>{mission.icon}</Text>
								)}
							</View>
							<View style={styles.actionContent}>
								<Text
									style={[
										styles.actionTitle,
										mission.completed && styles.actionTitleDone,
									]}
								>
									{mission.title}
								</Text>
								<Text style={styles.actionSub}>
									Daily habit — tap to log
								</Text>
							</View>
							<Text style={{ fontSize: 11, color: GREY }}>
								{mission.completed ? "Tap to undo" : "Tap to log"}
							</Text>
						</TouchableOpacity>
					);
				})}

				{/* ── Feature Hub ── */}
				<Text style={styles.sectionTitle}>Explore</Text>
				<View style={styles.featureRow}>
					<TouchableOpacity
						activeOpacity={0.85}
						onPress={() => router.push("/scan/meal-scanner")}
						style={styles.featureCard}
					>
						<LinearGradient
							colors={["#FF6B35", "#FF4444"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={styles.featureGrad}
						>
							<Text style={styles.featureEmoji}>📸</Text>
							<Text style={styles.featureLabel}>AI Meal{"\n"}Scanner</Text>
						</LinearGradient>
					</TouchableOpacity>
					<TouchableOpacity
						activeOpacity={0.85}
						onPress={() => router.push("/vibe-card")}
						style={styles.featureCard}
					>
						<LinearGradient
							colors={["#8B5CF6", "#EC4899"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={styles.featureGrad}
						>
							<Text style={styles.featureEmoji}>✨</Text>
							<Text style={styles.featureLabel}>Vibe{"\n"}Card</Text>
						</LinearGradient>
					</TouchableOpacity>
					<TouchableOpacity
						activeOpacity={0.85}
						onPress={() => router.push("/rewards")}
						style={styles.featureCard}
					>
						<LinearGradient
							colors={["#FFD700", "#FF8C00"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={styles.featureGrad}
						>
							<Text style={styles.featureEmoji}>🏆</Text>
							<Text style={styles.featureLabel}>Rewards{"\n"}& XP</Text>
						</LinearGradient>
					</TouchableOpacity>
				</View>

				{/* ── Daily Insight (contextual) ── */}
				<View style={styles.insightCard}>
					<Ionicons color="#8B5CF6" name="bulb-outline" size={18} />
					<Text style={styles.insightText}>
						{streak >= 7
							? "Users with 7+ day streaks feel more aware of their daily patterns over time."
							: streak >= 3
								? "You're building momentum! 3 days in a row activates habit formation."
								: "Start your daily check-in streak — small steps lead to big awareness."}
					</Text>
				</View>
				</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: BG },
	scroll: { flex: 1 },
	content: { paddingBottom: 32 },

	// Disclaimer
	disclaimerBanner: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFBEB",
		marginHorizontal: 20,
		marginBottom: 16,
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#FDE68A",
		gap: 8,
	},
	disclaimerBannerText: {
		flex: 1,
		fontSize: 11,
		color: "#92400E",
		lineHeight: 16,
		fontWeight: "500",
	},

	// Header
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 24,
		paddingTop: 16,
		marginBottom: 20,
	},
	welcome: { fontSize: 24, fontWeight: "800", color: DARK },
	welcomeSub: { fontSize: 14, color: GREY, marginTop: 2 },
	bellBtn: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "rgba(62,201,181,0.12)",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
	},
	proBtn: {
		height: 32,
		justifyContent: "center",
		alignItems: "center",
	},
	proBadge: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		gap: 4,
	},
	proText: {
		color: "#FFF",
		fontSize: 10,
		fontWeight: "900",
		letterSpacing: 0.5,
	},
	upgradeBadge: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 16,
		backgroundColor: "rgba(62, 201, 181, 0.1)",
		gap: 4,
	},
	upgradeText: {
		color: TEAL,
		fontSize: 10,
		fontWeight: "800",
	},

	// Card base
	card: {
		marginHorizontal: 20,
		marginBottom: 24,
		backgroundColor: CARD,
		borderRadius: 20,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 10,
		elevation: 3,
	},

	// Lifestyle Score & Body
	sectionTitle: {
		fontSize: 20,
		fontWeight: "800",
		color: DARK,
		marginBottom: 16,
		paddingHorizontal: 20,
	},
	historyCard: {
		backgroundColor: CARD,
		padding: 16,
		borderRadius: 16,
		width: 160,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 2,
	},
	historyIconWrap: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: "rgba(62,201,181,0.1)",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
		overflow: "hidden",
	},
	historyImage: {
		width: "100%",
		height: "100%",
	},
	historyZones: {
		fontSize: 14,
		fontWeight: "700",
		color: DARK,
		marginBottom: 4,
	},
	historyDate: {
		fontSize: 11,
		color: GREY,
		marginBottom: 8,
	},
	historyTopCause: {
		fontSize: 12,
		color: TEAL,
		fontWeight: "600",
	},

	scoreRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 6,
	},
	scoreTitle: { fontSize: 18, fontWeight: "800", color: DARK },
	scoreBadge: {
		backgroundColor: "rgba(62,201,181,0.15)",
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: 12,
	},
	scoreText: { color: TEAL, fontWeight: "800", fontSize: 14 },
	scoreDesc: { color: GREY, fontSize: 13, lineHeight: 18, marginBottom: 16 },
	bodyWrapper: {
		height: 380,
		width: "100%",
		borderRadius: 16,
		overflow: "hidden",
		backgroundColor: "white",
		borderWidth: 1,
		borderColor: BORDER,
	},

	// Completed check-in
	completedBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#DCFCE7",
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 6,
		alignSelf: "center",
	},
	completedBadgeText: { color: "#3CB371", fontSize: 13, fontWeight: "700" },
	completedTitle: {
		textAlign: "center",
		fontSize: 18,
		fontWeight: "800",
		color: DARK,
		marginTop: 12,
	},
	completedEvening: {
		textAlign: "center",
		color: TEAL,
		fontWeight: "600",
		marginTop: 4,
		marginBottom: 16,
	},
	countdownBox: {
		borderWidth: 1.5,
		borderColor: TEAL,
		borderRadius: 14,
		paddingVertical: 12,
		alignItems: "center",
	},
	countdownLabel: { color: GREY, fontSize: 13 },
	countdownValue: {
		color: TEAL,
		fontSize: 32,
		fontWeight: "900",
		marginTop: 4,
	},

	// Check-in form
	cardRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 8,
	},
	cardIconWrap: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: "rgba(62,201,181,0.1)",
		alignItems: "center",
		justifyContent: "center",
	},
	cardTitle: { fontSize: 17, fontWeight: "800", color: DARK, flex: 1 },
	cardHint: { color: GREY, fontSize: 13, marginBottom: 20, lineHeight: 18 },
	metricBlock: { marginBottom: 20 },
	metricHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},
	metricLabel: { fontSize: 15, fontWeight: "600", color: DARK },
	metricHint: { fontSize: 12, color: GREY, fontStyle: "italic" },
	metricValue: { fontSize: 18, fontWeight: "900" },
	sliderTrack: {
		height: 10,
		backgroundColor: "#F0F0F0",
		borderRadius: 5,
		position: "relative",
		justifyContent: "center",
		marginBottom: 2,
	},
	// Numbered tick row
	tickRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 8,
		marginBottom: 4,
	},
	tick: {
		width: 34,
		height: 34,
		borderRadius: 17,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F0F0F0",
	},
	tickText: {
		fontSize: 14,
		fontWeight: "600",
		color: GREY,
	},
	scoreCaption: {
		fontSize: 12,
		fontWeight: "700",
		marginTop: 2,
		marginBottom: 4,
	},
	sliderFill: {
		position: "absolute",
		left: 0,
		top: 0,
		bottom: 0,
		borderRadius: 5,
	},
	sliderThumb: {
		position: "absolute",
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: "#FFFFFF",
		borderWidth: 3,
		marginLeft: -12,
		top: -7,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 4,
	},
	metricScale: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 6,
	},
	scaleLabel: { fontSize: 11, color: GREY },
	saveBtn: {
		marginTop: 8,
		paddingVertical: 16,
		borderRadius: 14,
		backgroundColor: "#E2E8F0",
		alignItems: "center",
	},
	saveBtnActive: { backgroundColor: TEAL },
	saveBtnText: { fontSize: 16, fontWeight: "700", color: GREY },
	saveBtnTextActive: { color: "#FFFFFF" },

	// Action cards
	actionCard: {
		marginHorizontal: 20,
		marginBottom: 10,
		borderRadius: 16,
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		borderWidth: 1.5,
	},
	actionIconWrap: {
		width: 52,
		height: 52,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	actionIcon: { fontSize: 26 },
	actionContent: { flex: 1 },
	actionTitle: { fontSize: 16, fontWeight: "700", color: DARK },
	actionTitleDone: { textDecorationLine: "line-through", opacity: 0.5 },
	actionSub: { fontSize: 12, color: GREY, marginTop: 3 },

	// EZBuddy companion card
	buddyCard: {
		marginHorizontal: 20,
		marginBottom: 16,
		backgroundColor: CARD,
		borderRadius: 20,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 4,
		borderWidth: 1.5,
		borderColor: "rgba(62,201,181,0.15)",
	},
	buddyRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
	buddyAvatarWrap: { position: "relative" },
	buddyAvatar: {
		width: 52, height: 52, borderRadius: 26,
		alignItems: "center", justifyContent: "center",
	},
	buddyOnline: {
		position: "absolute", bottom: 0, right: 0,
		width: 14, height: 14, borderRadius: 7,
		backgroundColor: "#10B981", borderWidth: 2.5, borderColor: CARD,
	},
	buddySpeech: {
		flex: 1, backgroundColor: "#F0FDF9",
		borderRadius: 16, borderTopLeftRadius: 4,
		padding: 12, position: "relative",
	},
	buddySpeechText: { color: DARK, fontSize: 13, fontWeight: "500", lineHeight: 19 },
	buddySpeechArrow: {
		position: "absolute", left: -6, top: 14,
		width: 0, height: 0,
		borderTopWidth: 6, borderBottomWidth: 6, borderRightWidth: 8,
		borderTopColor: "transparent", borderBottomColor: "transparent",
		borderRightColor: "#F0FDF9",
	},
	buddyActions: { flexDirection: "row", gap: 8, alignItems: "center" },
	buddyActionBtn: {
		flexDirection: "row", alignItems: "center", gap: 4,
		backgroundColor: "rgba(62,201,181,0.08)",
		paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
	},
	buddyActionText: { color: TEAL, fontSize: 12, fontWeight: "700" },
	buddyXpPill: {
		marginLeft: "auto",
		backgroundColor: "rgba(255,215,0,0.12)",
		paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
	},
	buddyXpText: { color: "#FF8C00", fontSize: 11, fontWeight: "800" },

	// Insight card
	insightCard: {
		marginHorizontal: 20,
		marginBottom: 16,
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 10,
		backgroundColor: "rgba(139,92,246,0.06)",
		borderRadius: 14,
		padding: 14,
		borderWidth: 1,
		borderColor: "rgba(139,92,246,0.12)",
	},
	insightText: { flex: 1, color: "#6D28D9", fontSize: 13, fontWeight: "500", lineHeight: 18 },

	// Analyze Button
	analyzeBtn: {
		backgroundColor: TEAL,
		borderRadius: 100,
		paddingVertical: 14,
		paddingHorizontal: 24,
		marginTop: 20,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		shadowColor: TEAL,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
	},
	analyzeBtnText: {
		color: "#FFF",
		fontSize: 16,
		fontWeight: "700",
	},

	// Scan CTA
	scanCard: {
		marginHorizontal: 20,
		marginBottom: 8,
		backgroundColor: "rgba(62,201,181,0.08)",
		borderRadius: 16,
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		borderWidth: 1.5,
		borderColor: "rgba(62,201,181,0.3)",
	},
	scanText: { flex: 1, fontSize: 15, fontWeight: "700", color: TEAL },

	// Feature hub
	featureRow: {
		flexDirection: "row",
		paddingHorizontal: 20,
		gap: 12,
		marginBottom: 24,
	},
	featureCard: {
		flex: 1,
		borderRadius: 20,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
	},
	featureGrad: {
		paddingVertical: 20,
		paddingHorizontal: 12,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 110,
	},
	featureEmoji: { fontSize: 32, marginBottom: 8 },
	featureLabel: {
		color: "#FFFFFF",
		fontSize: 13,
		fontWeight: "800",
		textAlign: "center",
		lineHeight: 17,
	},
});
