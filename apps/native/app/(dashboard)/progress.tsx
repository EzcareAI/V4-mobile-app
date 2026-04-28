import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	Dimensions,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { useDashboardStore } from "@/stores/dashboard-store";

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

// ── Dynamic text mappers ────────────────────────────
function getMetricText(key: string, val: number): string {
	if (val === 0) {
		return "No data yet";
	}
	switch (key) {
		case "sleep":
			if (val <= 2) {
				return "Poor sleep quality";
			}
			if (val === 3) {
				return "Moderate sleep quality";
			}
			return "Excellent sleep";
		case "energy":
			if (val <= 2) {
				return "Low energy levels";
			}
			if (val === 3) {
				return "Moderate energy levels";
			}
			return "High energy levels";
		case "digestion":
			if (val <= 2) {
				return "Room for improvement";
			}
			if (val === 3) {
				return "Some room for improvement";
			}
			return "Great digestion";
		case "stress":
			if (val <= 2) {
				return "Feeling very calm"; // Stress is inverse
			}
			if (val === 3) {
				return "Moderate stress";
			}
			return "High stress levels";
		default:
			return "Moderate";
	}
}

type TrendType = "Needs Attention" | "Improving" | "Stable";
function getTrend(key: string, val: number | undefined): TrendType {
	if (!val || val === 0) {
		return "Stable";
	}
	if (key === "stress") {
		if (val <= 2) {
			return "Improving";
		}
		if (val >= 4) {
			return "Needs Attention";
		}
		return "Stable";
	}
	if (val >= 4) {
		return "Improving";
	}
	if (val <= 2) {
		return "Needs Attention";
	}
	return "Stable";
}

// ── Mini line chart ─────────────────────────────────
function LineChart({ data }: { data: { label: string; value: number }[] }) {
	const [activeIdx, setActiveIdx] = useState<number | null>(null);

	// Prevent out-of-bounds crashes when switching tabs (e.g. 7 days -> 4 weeks)
	useEffect(() => {
		setActiveIdx(null);
	}, []);

	const n = data.length;
	// Add side padding to keep labels and circles from clipping
	const sidePad = 24;
	const innerW = CHART_W - sidePad * 2;
	const spacing = n > 1 ? innerW / (n - 1) : innerW;
	const maxVal = 10;

	const pts = data.map((d, i) => ({
		x: sidePad + i * spacing,
		y: CHART_H - (d.value / maxVal) * CHART_H,
		val: d.value,
		lbl: d.label,
	}));

	// Calculate smooth bezier path
	let smoothPath = "";
	if (pts.length > 0) {
		smoothPath = `M ${pts[0].x},${pts[0].y} `;
		for (let i = 0; i < pts.length - 1; i++) {
			const p0 = pts[i];
			const p1 = pts[i + 1];
			// Smooth interpolation using horizontal bezier handles
			const cp1x = (p0.x + p1.x) / 2;
			const cp1y = p0.y;
			const cp2x = (p0.x + p1.x) / 2;
			const cp2y = p1.y;
			smoothPath += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y} `;
		}
	}

	return (
		<View style={{ position: "relative" }}>
			<Svg height={CHART_H + 28} width={CHART_W}>
				{/* Y axis guide lines */}
				{[0, 2, 4, 6, 8, 10].map((val) => (
					<Line
						key={val}
						stroke="rgba(0,0,0,0.05)"
						strokeWidth={1}
						x1={sidePad}
						x2={CHART_W - sidePad}
						y1={CHART_H - (val / 10) * CHART_H}
						y2={CHART_H - (val / 10) * CHART_H}
					/>
				))}
				{/* Y axis labels */}
				{[0, 2, 4, 6, 8, 10].map((val) => (
					<SvgText
						fill={GREY}
						fontSize={9}
						key={`y${val}`}
						textAnchor="end"
						x={sidePad - 6}
						y={CHART_H - (val / 10) * CHART_H + 4}
					>
						{val}
					</SvgText>
				))}
				{/* line */}
				<Path
					d={smoothPath}
					fill="none"
					stroke={TEAL}
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={3}
				/>
				{/* interactive connection area - invisible wider circles to make tapping easier */}
				{pts.map((p, i) => (
					<Circle
						cx={p.x}
						cy={p.y}
						fill="transparent"
						key={`t-${i}`}
						onPress={() => setActiveIdx(i === activeIdx ? null : i)}
						r={20}
					/>
				))}
				{/* data dots */}
				{pts.map((p, i) => {
					const isActive = activeIdx === i;
					return (
						<Circle
							cx={p.x}
							cy={p.y}
							fill={isActive ? "#FFFFFF" : TEAL}
							key={`pt-${i}`}
							r={isActive ? 6 : 4}
							stroke={TEAL}
							strokeWidth={isActive ? 2 : 0}
						/>
					);
				})}
				{/* X axis labels */}
				{pts.map((p, i) => (
					<SvgText
						fill={activeIdx === i ? DARK : GREY}
						fontSize={8}
						fontWeight={activeIdx === i ? "bold" : "normal"}
						key={`x-${p.lbl}`}
						textAnchor="middle"
						x={p.x}
						y={CHART_H + 18}
					>
						{data[i].label}
					</SvgText>
				))}
			</Svg>

			{/* Tooltip Overlay */}
			{activeIdx !== null && pts[activeIdx] && (
				<View
					style={{
						position: "absolute",
						left: pts[activeIdx].x - 30,
						top: pts[activeIdx].y - 36,
						backgroundColor: DARK,
						paddingHorizontal: 8,
						paddingVertical: 4,
						borderRadius: 6,
						alignItems: "center",
						justifyContent: "center",
						// Prevent tooltip from overflowing left or right edges
						transform: [
							{
								translateX:
									pts[activeIdx].x < 40
										? 15
										: pts[activeIdx].x > CHART_W - 40
											? -15
											: 0,
							},
						],
					}}
				>
					<Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>
						{Math.round(pts[activeIdx].val * 10)}
					</Text>
					{/* small triangle tail */}
					<View
						style={{
							position: "absolute",
							bottom: -4,
							width: 0,
							height: 0,
							borderLeftWidth: 4,
							borderRightWidth: 4,
							borderTopWidth: 4,
							borderLeftColor: "transparent",
							borderRightColor: "transparent",
							borderTopColor: DARK,
						}}
					/>
				</View>
			)}
		</View>
	);
}

export default function ProgressScreen() {
	const { streak, lastCheckInValues, checkInHistory } = useDashboardStore();
	const router = useRouter();
	const [range, setRange] = useState<TimeRange>("Day");
	const [showReport, setShowReport] = useState(false);

	// Use streak-based levels instead of numerical health score
	let streakLevel: "high" | "mid" | "low" = "low";
	if (streak >= 14) {
		streakLevel = "high";
	} else if (streak >= 5) {
		streakLevel = "mid";
	}

	// ── Dynamic Chart Aggregation ──
	// ── Dynamic Chart Aggregation Helpers ──
	const getDayData = () => {
		const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		const res = Array.from({ length: 7 }).map((_, i) => {
			const d = new Date();
			d.setDate(d.getDate() - (6 - i));
			return {
				label: days[d.getDay()],
				value: 0,
				dateStr: d.toISOString().split("T")[0],
			};
		});
		for (const rec of checkInHistory) {
			const dStr = rec.date.split("T")[0];
			const match = res.find((r) => r.dateStr === dStr);
			if (match) {
				const m = rec.metrics;
				const normalizedStress = 6 - (m.stress || 3);
				const avg =
					((m.sleep || 3) +
						(m.energy || 3) +
						(m.digestion || 3) +
						normalizedStress) /
					4;
				match.value = avg * 2;
			}
		}
		return res.map((r) => ({ label: r.label, value: r.value })).reverse();
	};

	const getWeekData = () => {
		const res = Array.from({ length: 4 }).map((_, i) => ({
			label: `W${4 - i}`,
			value: 0,
			count: 0,
		}));
		const now = Date.now();
		for (const rec of checkInHistory) {
			const diffDays =
				(now - new Date(rec.date).getTime()) / (1000 * 3600 * 24);
			if (diffDays <= 28) {
				const weekIdx = 3 - Math.floor(diffDays / 7);
				if (weekIdx >= 0 && weekIdx < 4) {
					const m = rec.metrics;
					const normalizedStress = 6 - (m.stress || 3);
					const avg =
						((m.sleep || 3) +
							(m.energy || 3) +
							(m.digestion || 3) +
							normalizedStress) /
						4;
					res[weekIdx].value += avg * 2;
					res[weekIdx].count += 1;
				}
			}
		}
		return res
			.map((r) => ({
				label: r.label,
				value: r.count > 0 ? r.value / r.count : 0,
			}))
			.reverse();
	};

	const getMonthData = () => {
		const months = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];
		const mIdx = new Date().getMonth();
		const res = Array.from({ length: 12 })
			.map((_, i) => {
				const idx = (mIdx - i + 12) % 12;
				return { label: months[idx], value: 0, count: 0, monthNum: idx };
			})
			.reverse();

		for (const rec of checkInHistory) {
			const d = new Date(rec.date);
			const monthIdx = d.getMonth();
			const match = res.find((r) => r.monthNum === monthIdx);
			if (match) {
				const m = rec.metrics;
				const normalizedStress = 6 - (m.stress || 3);
				const avg =
					((m.sleep || 3) +
						(m.energy || 3) +
						(m.digestion || 3) +
						normalizedStress) /
					4;
				match.value += avg * 2;
				match.count += 1;
			}
		}
		return res.map((r) => ({
			label: r.label,
			value: r.count > 0 ? r.value / r.count : 0,
		}));
	};

	const buildChartData = () => {
		if (range === "Day") {
			return getDayData();
		}
		if (range === "Week") {
			return getWeekData();
		}
		return getMonthData();
	};

	const chartData = buildChartData();

	// ── Dynamic Lifestyle Metrics ──
	const mkMetric = (key: string, label: string, icon: string) => {
		const val = lastCheckInValues?.[key as keyof typeof lastCheckInValues] || 0;
		return {
			key,
			label,
			icon,
			desc: getMetricText(key, val),
			trend: getTrend(key, val),
			isImproving: getTrend(key, val) === "Improving",
			daysTracked: streak,
		};
	};

	const activeMetrics = [
		mkMetric("sleep", "Sleep Quality", "🌙"),
		mkMetric("energy", "Energy Levels", "⚡"),
		mkMetric("digestion", "Post-Meal Comfort", "🍏"),
		mkMetric("stress", "Stress Management", "💗"),
	];

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				style={styles.scroll}
			>
				{/* Header */}
				<View style={styles.header}>
					<View>
						<Text style={styles.title}>Your Progress 📈</Text>
						<Text style={styles.sub}>Track your daily habits</Text>
					</View>
					<TouchableOpacity
						activeOpacity={0.8}
						onPress={() => setShowReport(true)}
						style={styles.headerIcon}
					>
						<Ionicons color="#FFFFFF" name="trending-up-outline" size={22} />
					</TouchableOpacity>
				</View>

				{/* Streak card */}
				<View style={styles.scoreCard}>
					<View style={styles.scoreCardTop}>
						<View>
							<Text style={styles.scoreLabel}>Your Daily Streak</Text>
							<Text style={styles.scoreUpdated}>Keep it going!</Text>
						</View>
						<View style={styles.scoreIconBadge}>
							<Ionicons color="#FFFFFF" name="flame-outline" size={20} />
						</View>
					</View>

					<View style={styles.scoreRow}>
						<Text style={styles.scoreBig}>{streak}</Text>
						<Text style={styles.scoreOutOf}> days</Text>
					</View>

					{/* 7-Day Streak Flames */}
					<View style={styles.streakRow}>
						<Text style={styles.weeklyStreakTitle}>
							Weekly Streak: {streak} Days
						</Text>
						<View style={styles.flamesContainer}>
							{Array.from({ length: 7 }).map((_, i) => {
								const litCount =
									streak > 0 && streak % 7 === 0 ? 7 : streak % 7;
								const isLit = i < litCount;
								return (
									<Ionicons
										color={isLit ? "#FF6D00" : "#CBD5E1"}
										key={`flame-top-${i}`}
										name={isLit ? "flame" : "flame-outline"}
										size={22}
										style={{ marginHorizontal: 2 }}
									/>
								);
							})}
						</View>
					</View>
				</View>

				{/* Check-in Journal */}
				<View style={[styles.card, { borderColor: TEAL, borderWidth: 1 }]}>
					<Text style={styles.cardTitle}>Check-in Journal</Text>
					{activeMetrics.map((s) => (
						<View
							key={s.key}
							style={[
								styles.metricRow,
								{ backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" },
							]}
						>
							<View
								style={[styles.metricIcon, { backgroundColor: "#FFFFFF" }]}
							>
								<Text style={{ fontSize: 20 }}>{s.icon}</Text>
							</View>
							<View style={styles.metricContent}>
								<Text style={styles.metricTitle}>{s.label}</Text>
								<Text style={styles.metricDesc}>{s.desc}</Text>
								<Text style={styles.metricDays}>
									{s.daysTracked} days tracked
								</Text>
							</View>
						</View>
					))}
					<Text style={styles.metricFooter}>
						Based on your last 30 days of daily check-ins.
					</Text>
				</View>

				{/* Streak card */}
				<View style={[styles.card, { backgroundColor: "#FFF8F0" }]}>
					<View style={styles.streakHeader}>
						<View
							style={[styles.streakIconWrap, { backgroundColor: "#FFFFFF" }]}
						>
							<Text style={{ fontSize: 28 }}>🔥</Text>
						</View>
						<View>
							<Text style={styles.streakTitle}>Daily Check-in Streak</Text>
							<Text style={styles.streakSub}>Keep it up!</Text>
						</View>
					</View>
					<Text style={styles.streakCount}>{streak}</Text>
					<Text style={styles.streakLbl}>Days in a row</Text>
					<Text style={styles.streakLongest}>
						Your longest streak: {streak} days
					</Text>
					<View style={styles.streakFlames}>
						{Array.from({ length: 7 }).map((_, i) => {
							const litCount = streak > 0 && streak % 7 === 0 ? 7 : streak % 7;
							const isLit = i < litCount;
							return (
								<Ionicons
									color={isLit ? "#FF6D00" : "#E2E8F0"}
									key={`flame-bottom-${i}`}
									name={isLit ? "flame" : "flame-outline"}
									size={24}
									style={{ marginHorizontal: 2 }}
								/>
							);
						})}
					</View>
				</View>
			</ScrollView>

			{/* AI Trend Report Modal */}
			<Modal
				animationType="slide"
				onRequestClose={() => setShowReport(false)}
				transparent={true}
				visible={showReport}
			>
				<View style={styles.modalBg}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>AI Awareness Summary ✨</Text>
							<TouchableOpacity
								hitSlop={10}
								onPress={() => setShowReport(false)}
							>
								<Ionicons color={DARK} name="close" size={24} />
							</TouchableOpacity>
						</View>

						<View style={styles.modalBody}>
							<View
								style={[
									styles.modalBadge,
									{
										backgroundColor:
											streakLevel === "high"
												? "#DCFCE7"
												: streakLevel === "mid"
													? "#FEF3C7"
													: "#FEE2E2",
									},
								]}
							>
								<Text style={{ fontSize: 48, marginBottom: 8 }}>
									{streakLevel === "high" ? "🏆" : streakLevel === "mid" ? "🌱" : "⚠️"}
								</Text>
								<Text
									style={[
										styles.modalStatusText,
										{
											color:
												streakLevel === "high"
													? "#166534"
													: streakLevel === "mid"
														? "#92400E"
														: "#991B1B",
										},
									]}
								>
									{streakLevel === "high"
										? "Thriving"
										: streakLevel === "mid"
											? "Building Habits"
											: "Getting Started"}
								</Text>
							</View>

							<Text style={styles.modalDesc}>
								{streakLevel === "high"
									? "Your daily check-in habits are going strong! Your consistency is paying off. Keep your routines steady to maintain this momentum."
									: streakLevel === "mid"
										? "You're building a solid routine. Keep logging your daily check-ins to strengthen your habits."
										: "Start logging daily check-ins to build consistency. Small steps lead to big changes!"}
							</Text>

							<View style={styles.modalStatsRow}>
								<View style={styles.modalStatBox}>
									<Text style={styles.modalStatNum}>{streak}</Text>
									<Text style={styles.modalStatLbl}>Days Logged</Text>
								</View>
								<View style={styles.modalStatBox}>
									<Text style={styles.modalStatNum}>{checkInHistory.length}</Text>
									<Text style={styles.modalStatLbl}>Total Check-ins</Text>
								</View>
							</View>

							<TouchableOpacity
								activeOpacity={0.9}
								onPress={() => setShowReport(false)}
								style={styles.modalBtn}
							>
								<Text style={styles.modalBtnText}>Got It, Thanks!</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
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
	title: { fontSize: 24, fontWeight: "800", color: DARK },
	sub: { fontSize: 14, color: GREY, marginTop: 2 },
	headerIcon: {
		width: 44,
		height: 44,
		borderRadius: 16,
		backgroundColor: TEAL,
		alignItems: "center",
		justifyContent: "center",
	},

	// Lifestyle Score card
	scoreCard: {
		marginHorizontal: 20,
		marginBottom: 20,
		backgroundColor: TEAL,
		borderRadius: 20,
		padding: 20,
		overflow: "hidden",
	},
	scoreCardTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 12,
	},
	scoreLabel: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
	scoreUpdated: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
	scoreIconBadge: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.2)",
		alignItems: "center",
		justifyContent: "center",
	},
	scoreRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10 },
	scoreBig: {
		fontSize: Math.min(Dimensions.get("window").width * 0.14, 64),
		fontWeight: "900",
		color: "#FFFFFF",
		lineHeight: Math.min(Dimensions.get("window").width * 0.16, 70),
	},
	scoreOutOf: {
		fontSize: 22,
		fontWeight: "700",
		color: "rgba(255,255,255,0.7)",
		marginBottom: 10,
		marginLeft: 4,
	},
	scoreBar: {
		height: 8,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 4,
		marginBottom: 10,
	},
	scoreBarFill: { height: "100%", backgroundColor: "#FFFFFF", borderRadius: 4 },
	scoreTagline: {
		fontSize: 14,
		color: "rgba(255,255,255,0.85)",
		marginBottom: 16,
	},
	streakRow: {
		backgroundColor: "rgba(255,255,255,0.15)",
		borderRadius: 16,
		padding: 16,
		marginBottom: 20,
		alignItems: "center",
	},
	weeklyStreakTitle: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "700",
		marginBottom: 10,
	},
	flamesContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: "rgba(255,255,255,0.2)",
	},
	stat: { flex: 1, alignItems: "center" },
	statVal: { fontSize: 20, fontWeight: "900", color: "#FFFFFF" },
	statLbl: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },
	statDivider: {
		width: 1,
		height: 32,
		backgroundColor: "rgba(255,255,255,0.2)",
	},

	// White cards
	card: {
		marginHorizontal: 20,
		marginBottom: 20,
		backgroundColor: CARD,
		borderRadius: 20,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 10,
		elevation: 3,
	},
	cardTitle: { fontSize: 17, fontWeight: "800", color: DARK, marginBottom: 14 },

	// Range picker
	rangePicker: { flexDirection: "row", gap: 8, marginBottom: 4 },
	rangeBtn: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: "#F0F0F0",
	},
	rangeBtnActive: { backgroundColor: TEAL },
	rangeBtnText: { fontSize: 13, fontWeight: "600", color: GREY },
	rangeBtnTextActive: { color: "#FFFFFF" },

	// Metric rows
	metricRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		borderRadius: 14,
		padding: 12,
		marginBottom: 10,
		borderWidth: 1,
	},
	metricIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	metricContent: { flex: 1 },
	metricTitle: { fontSize: 14, fontWeight: "700", color: DARK },
	metricDesc: { fontSize: 12, color: GREY, marginTop: 1 },
	metricDays: { fontSize: 11, color: GREY, marginTop: 2 },
	trendBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
	trendText: { fontSize: 12, fontWeight: "700" },
	metricFooter: {
		textAlign: "center",
		fontSize: 12,
		color: GREY,
		marginTop: 6,
	},

	// Streak
	streakHeader: {
		flexDirection: "row",
		gap: 12,
		alignItems: "center",
		marginBottom: 16,
	},
	streakIconWrap: {
		width: 56,
		height: 56,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	streakTitle: { fontSize: 17, fontWeight: "800", color: DARK },
	streakSub: { fontSize: 13, color: GREY },
	streakCount: {
		textAlign: "center",
		fontSize: Math.min(Dimensions.get("window").width * 0.14, 64),
		fontWeight: "900",
		color: "#F97316",
	},
	streakLbl: {
		textAlign: "center",
		fontSize: 16,
		fontWeight: "700",
		color: DARK,
		marginTop: 4,
	},
	streakLongest: {
		textAlign: "center",
		fontSize: 13,
		color: GREY,
		marginTop: 4,
		marginBottom: 16,
	},
	streakFlames: { flexDirection: "row", justifyContent: "center", gap: 4 },

	// Modals
	modalBg: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "flex-end",
	},
	modalContent: {
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
		padding: 24,
		paddingBottom: 40,
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 24,
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: "800",
		color: DARK,
	},
	modalBody: {
		alignItems: "center",
	},
	modalBadge: {
		alignItems: "center",
		justifyContent: "center",
		width: 160,
		height: 160,
		borderRadius: 80,
		marginBottom: 24,
	},
	modalStatusText: {
		fontSize: 18,
		fontWeight: "800",
	},
	modalDesc: {
		fontSize: 15,
		lineHeight: 24,
		color: GREY,
		textAlign: "center",
		marginBottom: 24,
		paddingHorizontal: 8,
	},
	modalStatsRow: {
		flexDirection: "row",
		gap: 16,
		marginBottom: 32,
		width: "100%",
	},
	modalStatBox: {
		flex: 1,
		backgroundColor: "#F8FAFC",
		borderRadius: 16,
		padding: 16,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#F1F5F9",
	},
	modalStatNum: {
		fontSize: 24,
		fontWeight: "800",
		color: TEAL,
		marginBottom: 4,
	},
	modalStatLbl: {
		fontSize: 12,
		color: GREY,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	modalBtn: {
		backgroundColor: TEAL,
		width: "100%",
		paddingVertical: 18,
		borderRadius: 16,
		alignItems: "center",
	},
	modalBtnText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "700",
	},
});
