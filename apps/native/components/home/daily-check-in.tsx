import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { CheckCircle2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { type CheckInMetrics, useDashboardStore } from "@/stores/dashboard-store";

const METRICS: { key: keyof CheckInMetrics; label: string }[] = [
	{ key: "sleep", label: "Sleep" },
	{ key: "energy", label: "Energy" },
	{ key: "stress", label: "Stress" },
	{ key: "digestion", label: "Digest" },
];

function formatCountdown(ms: number): string {
	if (ms <= 0) return "now";
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	return `${hours}h ${minutes}m`;
}

export function DailyCheckIn() {
	const { canCheckIn, saveCheckIn, getNextCheckInMs } = useDashboardStore();
	const [values, setValues] = useState<CheckInMetrics>({
		sleep: 0,
		energy: 0,
		stress: 0,
		digestion: 0,
	});
	const [saved, setSaved] = useState(false);
	const [nextMs, setNextMs] = useState(getNextCheckInMs());

	// Update the countdown ticker every 30 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			setNextMs(getNextCheckInMs());
		}, 30000);
		return () => clearInterval(interval);
	}, [getNextCheckInMs]);

	const allFilled = Object.values(values).every((v) => v > 0);
	const available = canCheckIn();

	const handleBubble = async (
		key: keyof CheckInMetrics,
		val: number
	) => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Light);
			} catch {
				/* ignore */
			}
		}
		setValues((prev) => ({ ...prev, [key]: val }));
	};

	const handleSave = async () => {
		if (!allFilled) return;
		saveCheckIn(values);
		setSaved(true);
	};

	// Already checked in — show completion card
	if (!available || saved) {
		return (
			<View style={styles.completedCard}>
				<View style={styles.completedIcon}>
					<CheckCircle2 size={22} color="#3EC9B5" />
				</View>
				<View>
					<Text style={styles.completedTitle}>Morning complete ✔</Text>
					<Text style={styles.completedSub}>
						Next check-in in {formatCountdown(nextMs)}
					</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<Text style={styles.cardTitle}>Daily Check-in</Text>
				<Text style={styles.cardHint}>Tap 1 – 5</Text>
			</View>

			{METRICS.map(({ key, label }) => (
				<View key={key} style={styles.metricRow}>
					<Text style={styles.metricLabel}>{label}</Text>
					<View style={styles.bubbleRow}>
						{[1, 2, 3, 4, 5].map((val) => {
							const isSelected = values[key] === val;
							return (
								<TouchableOpacity
									key={val}
									onPress={() => handleBubble(key, val)}
									style={[styles.bubble, isSelected && styles.bubbleActive]}
									hitSlop={4}
								>
									<Text
										style={[
											styles.bubbleText,
											isSelected && styles.bubbleTextActive,
										]}
									>
										{val}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				</View>
			))}

			<TouchableOpacity
				onPress={handleSave}
				disabled={!allFilled}
				style={[styles.saveBtn, allFilled && styles.saveBtnActive]}
				activeOpacity={0.85}
			>
				<Text style={[styles.saveBtnText, allFilled && styles.saveBtnTextActive]}>
					Save Check-in
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		marginHorizontal: 24,
		marginBottom: 32,
		backgroundColor: "#1A2138",
		borderRadius: 28,
		padding: 24,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	cardTitle: {
		color: "#FFFFFF",
		fontSize: 17,
		fontWeight: "800",
	},
	cardHint: {
		color: "#94A3B8",
		fontSize: 12,
	},
	metricRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	metricLabel: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "600",
		width: 56,
	},
	bubbleRow: {
		flexDirection: "row",
		gap: 8,
	},
	bubble: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.05)",
		alignItems: "center",
		justifyContent: "center",
	},
	bubbleActive: {
		backgroundColor: "#3EC9B5",
	},
	bubbleText: {
		color: "#94A3B8",
		fontSize: 14,
		fontWeight: "700",
	},
	bubbleTextActive: {
		color: "#0B0E17",
	},
	saveBtn: {
		marginTop: 8,
		height: 48,
		borderRadius: 16,
		backgroundColor: "rgba(255,255,255,0.06)",
		alignItems: "center",
		justifyContent: "center",
	},
	saveBtnActive: {
		backgroundColor: "#3EC9B5",
	},
	saveBtnText: {
		color: "#94A3B8",
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 0.5,
	},
	saveBtnTextActive: {
		color: "#0B0E17",
	},
	// Completed state
	completedCard: {
		marginHorizontal: 24,
		marginBottom: 32,
		backgroundColor: "#1A2138",
		borderRadius: 24,
		padding: 20,
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",
	},
	completedIcon: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "rgba(62,201,181,0.15)",
		alignItems: "center",
		justifyContent: "center",
	},
	completedTitle: {
		color: "#FFFFFF",
		fontSize: 15,
		fontWeight: "700",
	},
	completedSub: {
		color: "#94A3B8",
		fontSize: 13,
		marginTop: 2,
	},
});
