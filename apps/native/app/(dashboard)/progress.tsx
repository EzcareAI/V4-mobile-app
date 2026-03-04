import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polyline, Circle, Line, Text as SvgText } from "react-native-svg";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useOnboardingStore } from "@/stores/onboarding-store";

// ── Design tokens ──────────────────────────────────
const BG = "#F4F6F8";
const CARD = "#FFFFFF";
const TEAL = "#3EC9B5";
const DARK = "#1A1A2E";
const GREY = "#94A3B8";

const { width: SCREEN_W } = Dimensions.get("window");
const CHART_W = SCREEN_W - 80;
const CHART_H = 140;

type TimeRange = "Day" | "Week" | "12 Months";

// ── Mock chart data keyed by range ──────────────────
const CHART_DATA: Record<TimeRange, { label: string; value: number }[]> = {
	Day: [
		{ label: "Mon", value: 0 }, { label: "Tue", value: 0 },
		{ label: "Wed", value: 0 }, { label: "Thu", value: 5 },
		{ label: "Fri", value: 0 }, { label: "Sat", value: 0 }, { label: "Sun", value: 0 },
	],
	Week: [
		{ label: "Week 1", value: 0 }, { label: "Week 2", value: 2 },
		{ label: "Week 3", value: 6.2 }, { label: "Week 4", value: 4.7 },
	],
	"12 Months": [
		{ label: "Apr", value: 0 }, { label: "May", value: 0 }, { label: "Jun", value: 0 },
		{ label: "Jul", value: 0 }, { label: "Aug", value: 0 }, { label: "Sep", value: 0 },
		{ label: "Oct", value: 0 }, { label: "Nov", value: 0 }, { label: "Dec", value: 0 },
		{ label: "Jan", value: 0 }, { label: "Feb", value: 0 }, { label: "Mar", value: 5.9 },
	],
};

// ── Symptom entries (derived from last check-in) ────
const SYMPTOMS = [
	{ key: "sleep", label: "Sleep Quality", desc: "Moderate sleep quality", icon: "🌙", daysTracked: 3 },
	{ key: "energy", label: "Energy Levels", desc: "Moderate energy levels", icon: "⚡", daysTracked: 3 },
	{ key: "digestion", label: "Digestive Health", desc: "Some digestive issues", icon: "🍏", daysTracked: 3 },
	{ key: "stress", label: "Stress Management", desc: "Moderate stress", icon: "💗", daysTracked: 3 },
];

type TrendType = "Worsening" | "Improving";
function getTrend(key: string, lastMetrics: Record<string, number> | null): TrendType {
	if (!lastMetrics) return "Worsening";
	const val = lastMetrics[key] ?? 3;
	if (key === "stress") return val <= 2 ? "Improving" : "Worsening";
	return val >= 4 ? "Improving" : "Worsening";
}

// ── Mini line chart ─────────────────────────────────
function LineChart({ data }: { data: { label: string; value: number }[] }) {
	const n = data.length;
	const spacing = CHART_W / (n - 1);
	const maxVal = 10;
	const pts = data.map((d, i) => ({
		x: i * spacing,
		y: CHART_H - (d.value / maxVal) * CHART_H,
	}));
	const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");

	return (
		<Svg width={CHART_W} height={CHART_H + 24}>
			{/* Y axis guide lines */}
			{[0, 2, 4, 6, 8, 10].map((val) => (
				<Line
					key={val}
					x1={0} y1={CHART_H - (val / 10) * CHART_H}
					x2={CHART_W} y2={CHART_H - (val / 10) * CHART_H}
					stroke="rgba(0,0,0,0.05)" strokeWidth={1}
				/>
			))}
			{/* Y axis labels */}
			{[0, 2, 4, 6, 8, 10].map((val) => (
				<SvgText key={`y${val}`} x={-2} y={CHART_H - (val / 10) * CHART_H + 4} fontSize={9} fill={GREY} textAnchor="end">{val}</SvgText>
			))}
			{/* line */}
			<Polyline points={polyline} fill="none" stroke={TEAL} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
			{/* area fill – simplified */}
			{pts.map((p, i) => (
				<Circle key={i} cx={p.x} cy={p.y} r={4} fill={TEAL} />
			))}
			{/* X axis labels */}
			{data.map((d, i) => (
				<SvgText key={`x${i}`} x={i * spacing} y={CHART_H + 18} fontSize={8} fill={GREY} textAnchor="middle">{d.label}</SvgText>
			))}
		</Svg>
	);
}

export default function ProgressScreen() {
	const { healthScore, computeHealthScore } = useOnboardingStore();
	const { streak, totalXp, lastCheckInValues } = useDashboardStore();
	const [range, setRange] = useState<TimeRange>("Day");

	const score = healthScore ?? computeHealthScore();
	const scoreLabel =
		score < 4 ? "Let's build on your foundation!" :
		score < 7 ? "Good foundation. Let's optimize further!" :
		"Great progress! Keep it up!";

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
				{/* Header */}
				<View style={styles.header}>
					<View>
						<Text style={styles.title}>Your Progress 📈</Text>
						<Text style={styles.sub}>Track your healing journey</Text>
					</View>
					<View style={styles.headerIcon}>
						<Ionicons name="trending-up-outline" size={22} color="#FFFFFF" />
					</View>
				</View>

				{/* Healing Score card */}
				<View style={styles.scoreCard}>
					<View style={styles.scoreCardTop}>
						<View>
							<Text style={styles.scoreLabel}>Your Healing Score</Text>
							<Text style={styles.scoreUpdated}>Updated today</Text>
						</View>
						<View style={styles.scoreIconBadge}>
							<Ionicons name="pulse-outline" size={20} color="#FFFFFF" />
						</View>
					</View>

					<View style={styles.scoreRow}>
						<Text style={styles.scoreBig}>{score.toFixed(1)}</Text>
						<Text style={styles.scoreOutOf}>/10</Text>
					</View>

					{/* Progress bar */}
					<View style={styles.scoreBar}>
						<View style={[styles.scoreBarFill, { width: `${(score / 10) * 100}%` as any }]} />
					</View>

					<Text style={styles.scoreTagline}>— {scoreLabel}</Text>

					{/* Stats row */}
					<View style={styles.statsRow}>
						<View style={styles.stat}>
							<Text style={styles.statVal}>{streak}</Text>
							<Text style={styles.statLbl}>Days Tracked</Text>
						</View>
						<View style={styles.statDivider} />
						<View style={styles.stat}>
							<Text style={styles.statVal}>{score.toFixed(1)}</Text>
							<Text style={styles.statLbl}>Avg Score</Text>
						</View>
						<View style={styles.statDivider} />
						<View style={styles.stat}>
							<Text style={styles.statVal}>{score.toFixed(1)}</Text>
							<Text style={styles.statLbl}>Best Score</Text>
						</View>
					</View>
				</View>

				{/* Chart card */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Healing Score Over Time</Text>
					{/* Range picker */}
					<View style={styles.rangePicker}>
						{(["Day", "Week", "12 Months"] as TimeRange[]).map((r) => (
							<TouchableOpacity
								key={r}
								style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
								onPress={() => setRange(r)}
							>
								<Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>{r}</Text>
							</TouchableOpacity>
						))}
					</View>
					<View style={{ paddingLeft: 20, marginTop: 8 }}>
						<LineChart data={CHART_DATA[range]} />
					</View>
				</View>

				{/* Symptom Tracker */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Symptom Tracker</Text>
					{SYMPTOMS.map((s) => {
						const trend = getTrend(s.key, lastCheckInValues);
						const isImproving = trend === "Improving";
						return (
							<View key={s.key} style={[styles.symptomRow, { backgroundColor: isImproving ? "#F0FFF4" : "#FFF5F5", borderColor: isImproving ? "#86EFAC" : "#FECACA" }]}>
								<View style={[styles.symptomIcon, { backgroundColor: "#FFFFFF" }]}>
									<Text style={{ fontSize: 20 }}>{s.icon}</Text>
								</View>
								<View style={styles.symptomContent}>
									<Text style={styles.symptomTitle}>{s.label}</Text>
									<Text style={styles.symptomDesc}>{s.desc}</Text>
									<Text style={styles.symptomDays}>{s.daysTracked} days tracked</Text>
								</View>
								<View style={styles.trendBadge}>
									<Ionicons name={isImproving ? "arrow-up" : "arrow-down"} size={12} color={isImproving ? "#22C55E" : "#EF4444"} />
									<Text style={[styles.trendText, { color: isImproving ? "#22C55E" : "#EF4444" }]}>{trend}</Text>
								</View>
							</View>
						);
					})}
					<Text style={styles.symptomFooter}>Based on your last 30 days of check-ins</Text>
				</View>

				{/* Streak card */}
				<View style={[styles.card, { backgroundColor: "#FFF8F0" }]}>
					<View style={styles.streakHeader}>
						<View style={[styles.streakIconWrap, { backgroundColor: "#FFFFFF" }]}>
							<Text style={{ fontSize: 28 }}>🔥</Text>
						</View>
						<View>
							<Text style={styles.streakTitle}>Daily Check-in Streak</Text>
							<Text style={styles.streakSub}>Keep it up!</Text>
						</View>
					</View>
					<Text style={styles.streakCount}>{streak}</Text>
					<Text style={styles.streakLbl}>Days in a row</Text>
					<Text style={styles.streakLongest}>Your longest streak: {streak} days</Text>
					<View style={styles.streakFlames}>
						{Array.from({ length: 7 }).map((_, i) => (
							<Text key={i} style={{ fontSize: 24 }}>🔥</Text>
						))}
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: BG },
	scroll: { flex: 1 },
	content: { paddingBottom: 32 },

	// Header
	header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 16, marginBottom: 20 },
	title: { fontSize: 24, fontWeight: "800", color: DARK },
	sub: { fontSize: 14, color: GREY, marginTop: 2 },
	headerIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: TEAL, alignItems: "center", justifyContent: "center" },

	// Healing Score card
	scoreCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: TEAL, borderRadius: 20, padding: 20, overflow: "hidden" },
	scoreCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
	scoreLabel: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
	scoreUpdated: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
	scoreIconBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
	scoreRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10 },
	scoreBig: { fontSize: 64, fontWeight: "900", color: "#FFFFFF", lineHeight: 70 },
	scoreOutOf: { fontSize: 22, fontWeight: "700", color: "rgba(255,255,255,0.7)", marginBottom: 10, marginLeft: 4 },
	scoreBar: { height: 8, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4, marginBottom: 10 },
	scoreBarFill: { height: "100%", backgroundColor: "#FFFFFF", borderRadius: 4 },
	scoreTagline: { fontSize: 14, color: "rgba(255,255,255,0.85)", marginBottom: 16 },
	statsRow: { flexDirection: "row", alignItems: "center", paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
	stat: { flex: 1, alignItems: "center" },
	statVal: { fontSize: 20, fontWeight: "900", color: "#FFFFFF" },
	statLbl: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },
	statDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },

	// White cards
	card: { marginHorizontal: 20, marginBottom: 20, backgroundColor: CARD, borderRadius: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
	cardTitle: { fontSize: 17, fontWeight: "800", color: DARK, marginBottom: 14 },

	// Range picker
	rangePicker: { flexDirection: "row", gap: 8, marginBottom: 4 },
	rangeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: "#F0F0F0" },
	rangeBtnActive: { backgroundColor: TEAL },
	rangeBtnText: { fontSize: 13, fontWeight: "600", color: GREY },
	rangeBtnTextActive: { color: "#FFFFFF" },

	// Symptom rows
	symptomRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1 },
	symptomIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
	symptomContent: { flex: 1 },
	symptomTitle: { fontSize: 14, fontWeight: "700", color: DARK },
	symptomDesc: { fontSize: 12, color: GREY, marginTop: 1 },
	symptomDays: { fontSize: 11, color: GREY, marginTop: 2 },
	trendBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
	trendText: { fontSize: 12, fontWeight: "700" },
	symptomFooter: { textAlign: "center", fontSize: 12, color: GREY, marginTop: 6 },

	// Streak
	streakHeader: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 16 },
	streakIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
	streakTitle: { fontSize: 17, fontWeight: "800", color: DARK },
	streakSub: { fontSize: 13, color: GREY },
	streakCount: { textAlign: "center", fontSize: 64, fontWeight: "900", color: "#F97316" },
	streakLbl: { textAlign: "center", fontSize: 16, fontWeight: "700", color: DARK, marginTop: 4 },
	streakLongest: { textAlign: "center", fontSize: 13, color: GREY, marginTop: 4, marginBottom: 16 },
	streakFlames: { flexDirection: "row", justifyContent: "center", gap: 4 },
});
