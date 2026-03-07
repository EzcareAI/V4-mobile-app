import { Ionicons } from "@expo/vector-icons";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
	PanResponder,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body3DSelector } from "@/components/onboarding/common/body-3d-selector";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useOnboardingStore } from "@/stores/onboarding-store";

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

// ── Simple Slider ───────────────────────────────────
function MetricSlider({
	value,
	color,
	onChange,
}: {
	value: number;
	color: string;
	onChange: (v: number) => void;
}) {
	const sliderWidth = useRef(0);

	const pan = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderGrant: (e) => {
				const x = e.nativeEvent.locationX;
				const raw = Math.round((x / sliderWidth.current) * 4 + 1);
				onChange(Math.min(5, Math.max(1, raw)));
			},
			onPanResponderMove: (e) => {
				const x = e.nativeEvent.locationX;
				const raw = Math.round((x / sliderWidth.current) * 4 + 1);
				onChange(Math.min(5, Math.max(1, raw)));
			},
		})
	).current;

	const pct = value > 0 ? ((value - 1) / 4) * 100 : 0;

	return (
		<View
			onLayout={(e) => {
				sliderWidth.current = e.nativeEvent.layout.width;
			}}
			style={styles.sliderTrack}
			{...pan.panHandlers}
		>
			<View
				style={[
					styles.sliderFill,
					{ width: `${pct}%` as `${number}%`, backgroundColor: color },
				]}
			/>
			{value > 0 && (
				<View
					style={[
						styles.sliderThumb,
						{ left: `${pct}%` as `${number}%`, borderColor: color },
					]}
				/>
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
	const { firstName, gender, computeHealthScore, healthScore } =
		useOnboardingStore();
	const {
		canCheckIn,
		saveCheckIn,
		getNextCheckInMs,
		streak,
		resetDailyMissions,
		missions,
		completeMission,
	} = useDashboardStore();

	const [values, setValues] = useState({
		sleep: 0,
		energy: 0,
		stress: 0,
		digestion: 0,
	});
	const [saved, setSaved] = useState(false);
	const [nextMs, setNextMs] = useState(getNextCheckInMs());

	// Resets daily missions + live countdown
	useEffect(() => {
		resetDailyMissions();
		const interval = setInterval(() => setNextMs(getNextCheckInMs()), 30_000);
		return () => clearInterval(interval);
	}, [resetDailyMissions, getNextCheckInMs]);

	const canSave = canCheckIn();
	const score = healthScore ?? computeHealthScore();
	const allFilled = Object.values(values).every((v) => v > 0);

	const handleMetric = (key: MetricKey, val: number) => {
		setValues((prev) => ({ ...prev, [key]: val }));
	};

	const handleSave = () => {
		if (!allFilled) {
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
				{/* ── Header ── */}
				<View style={styles.header}>
					<View>
						<Text style={styles.welcome}>Welcome back! 👋</Text>
						{firstName ? (
							<Text style={styles.welcomeSub}>
								{firstName}'s healing journey
							</Text>
						) : (
							<Text style={styles.welcomeSub}>
								Let's check in on your healing journey
							</Text>
						)}
					</View>
					<TouchableOpacity style={styles.bellBtn}>
						<Ionicons color={TEAL} name="notifications-outline" size={22} />
					</TouchableOpacity>
				</View>

				{/* ── Health Score & Body Map Card ── */}
				<View style={styles.card}>
					<View style={styles.scoreRow}>
						<Text style={styles.scoreTitle}>Health Score</Text>
						<View style={styles.scoreBadge}>
							<Text style={styles.scoreText}>{score}/100</Text>
						</View>
					</View>
					<Text style={styles.scoreDesc}>
						Interact with your body map to log symptoms or explore targeted
						healing insights.
					</Text>

					<View style={styles.bodyWrapper}>
						<Body3DSelector
							gender={(gender as "male" | "female") || "male"}
							onZoneSelect={(zoneId: string) => {
								console.log("Selected Zone on Dashboard:", zoneId);
								// Could route to a detail screen, show a modal, or log a symptom
								if (Platform.OS === "ios") {
									impactAsync(ImpactFeedbackStyle.Light).catch(() => {
										/* ignore */
									});
								}
							}}
						/>
					</View>
				</View>

				{/* ── Daily Check-In Card ── */}
				{canSave || saved ? (
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
									<Text style={[styles.metricValue, { color: m.color }]}>
										{values[m.key] > 0 ? values[m.key] : "—"}
									</Text>
								</View>
								<MetricSlider
									color={m.color}
									onChange={(v) => handleMetric(m.key, v)}
									value={values[m.key]}
								/>
								<View style={styles.metricScale}>
									<Text style={styles.scaleLabel}>{m.lowLabel}</Text>
									<Text style={styles.scaleLabel}>{m.highLabel}</Text>
								</View>
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
							Daily Health Check-In – Next One
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
								completeMission(mission.id);
								if (Platform.OS === "ios") {
									impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
								}
							}}
							style={[
								styles.actionCard,
								{ backgroundColor: palette.bg, borderColor: palette.border },
							]}
						>
							<View
								style={[
									styles.actionIconWrap,
									{ backgroundColor: "rgba(255,255,255,0.7)" },
								]}
							>
								<Text style={styles.actionIcon}>{mission.icon}</Text>
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
								<Text style={styles.actionSub}>+{mission.xp} XP</Text>
							</View>
							{mission.completed && (
								<Ionicons color={TEAL} name="checkmark-circle" size={22} />
							)}
						</TouchableOpacity>
					);
				})}

				{/* ── EZBuddy Chat ── */}
				<TouchableOpacity
					activeOpacity={0.9}
					onPress={() => router.push("/chat")}
					style={styles.chatCard}
				>
					<View style={styles.chatRow}>
						<View style={styles.chatAvatarWrap}>
							<Text style={styles.chatAvatarText}>🤖</Text>
						</View>
						<View style={styles.chatTextBlock}>
							<Text style={styles.chatTitle}>Chat With EZBuddy</Text>
							<Text style={styles.chatSub}>Your AI healing companion</Text>
						</View>
					</View>
					<Text style={styles.chatDesc}>
						Ask anything about natural healing, nutrition, supplements, or
						lifestyle changes.
					</Text>
					<View style={styles.chatStartBtn}>
						<Ionicons
							color={TEAL}
							name="chatbubble-ellipses-outline"
							size={16}
						/>
						<Text style={styles.chatStartText}>Start Conversation</Text>
					</View>
				</TouchableOpacity>

				{/* Scan Body CTA */}
				<TouchableOpacity
					activeOpacity={0.9}
					onPress={() => router.push("/scan/body-scan")}
					style={styles.scanCard}
				>
					<Ionicons color={TEAL} name="scan-outline" size={22} />
					<Text style={styles.scanText}>Scan My Body with AR</Text>
					<Ionicons color={TEAL} name="chevron-forward" size={18} />
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: BG },
	scroll: { flex: 1 },
	content: { paddingBottom: 32 },

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

	// Health Score & Body
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
	metricValue: { fontSize: 18, fontWeight: "900" },
	sliderTrack: {
		height: 10,
		backgroundColor: "#F0F0F0",
		borderRadius: 5,
		position: "relative",
		justifyContent: "center",
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

	// Section
	sectionTitle: {
		fontSize: 20,
		fontWeight: "800",
		color: DARK,
		paddingHorizontal: 24,
		marginBottom: 12,
	},

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

	// EZBuddy chat card
	chatCard: {
		marginHorizontal: 20,
		marginTop: 12,
		marginBottom: 16,
		backgroundColor: TEAL,
		borderRadius: 20,
		padding: 20,
	},
	chatRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		marginBottom: 12,
	},
	chatAvatarWrap: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "rgba(255,255,255,0.2)",
		alignItems: "center",
		justifyContent: "center",
	},
	chatAvatarText: { fontSize: 28 },
	chatTextBlock: { flex: 1 },
	chatTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
	chatSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
	chatDesc: {
		fontSize: 14,
		color: "rgba(255,255,255,0.9)",
		lineHeight: 20,
		marginBottom: 16,
	},
	chatStartBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		paddingVertical: 12,
	},
	chatStartText: { fontSize: 15, fontWeight: "700", color: TEAL },

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
});
