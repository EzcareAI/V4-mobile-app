import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { ChevronRight, Zap } from "lucide-react-native";
import { useState } from "react";
import {
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { ConfettiBurst } from "@/components/home/confetti-burst";
import { useDashboardStore } from "@/stores/dashboard-store";

export function MicroMissions() {
	const { missions, completeMission, getLevel, getXpInCurrentLevel } =
		useDashboardStore();

	const level = getLevel();
	const xpInLevel = getXpInCurrentLevel();
	const xpForLevel = 500;
	const progressPct = Math.min(1, xpInLevel / xpForLevel);

	// Local state to trigger confetti animation uniquely per card
	const [activeConfettiId, setActiveConfettiId] = useState<string | null>(null);

	const handleMission = async (id: string) => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {
				/* ignore */
			}
		}

		// Trigger burst instantly
		setActiveConfettiId(id);
		completeMission(id);

		// Hide burst after animation timeframe
		setTimeout(() => {
			setActiveConfettiId(null);
		}, 1000);
	};

	return (
		<View style={styles.container}>
			{/* Section Header */}
			<View style={styles.sectionHeader}>
				<View style={styles.sectionHeaderText}>
					<Text style={styles.sectionTitle}>Micro Missions</Text>
					<Text style={styles.levelText}>
						Level {level} · {xpInLevel} / {xpForLevel} XP
					</Text>
				</View>
				{/* Level Progress Bar */}
				<View style={styles.progressTrack}>
					<View
						style={[styles.progressFill, { width: `${progressPct * 100}%` }]}
					/>
				</View>
			</View>

			{/* Mission Cards */}
			{missions.map((mission) => (
				<TouchableOpacity
					activeOpacity={mission.completed ? 1 : 0.75}
					key={mission.id}
					onPress={() => !mission.completed && handleMission(mission.id)}
					style={[styles.card, mission.completed && styles.cardCompleted]}
				>
					{/* Icon */}
					<View
						style={[
							styles.iconWrapper,
							mission.completed && styles.iconWrapperDone,
						]}
					>
						{/* Reanimated Confetti overlay locked directly atop the icon */}
						<ConfettiBurst
							count={12}
							isActive={activeConfettiId === mission.id}
						/>

						{mission.completed ? (
							<Text style={styles.checkMark}>✓</Text>
						) : (
							<Text style={styles.missionEmoji}>{mission.icon}</Text>
						)}
					</View>

					{/* Text */}
					<View style={styles.cardContent}>
						<Text
							style={[
								styles.missionTitle,
								mission.completed && styles.missionTitleDone,
							]}
						>
							{mission.title}
						</Text>
						<View style={styles.xpRow}>
							<Zap
								color={mission.completed ? "#94A3B8" : "#3EC9B5"}
								size={11}
							/>
							<Text
								style={[styles.xpText, mission.completed && styles.xpTextDone]}
							>
								+{mission.xp} XP
							</Text>
						</View>
					</View>

					{/* Chevron */}
					{!mission.completed && (
						<View style={styles.chevronWrapper}>
							<ChevronRight color="#94A3B8" size={16} />
						</View>
					)}
				</TouchableOpacity>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 24,
		marginBottom: 120, // Space for floating orb + bottom nav
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "space-between",
		marginBottom: 20,
		flexWrap: "wrap",
		gap: 12,
	},
	sectionHeaderText: {
		flex: 1,
	},
	sectionTitle: {
		color: "#1E293B",
		fontSize: 17,
		fontWeight: "800",
	},
	levelText: {
		color: "#94A3B8",
		fontSize: 13,
		marginTop: 4,
	},
	progressTrack: {
		width: 80,
		height: 6,
		flexShrink: 0,
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 999,
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		backgroundColor: "#3EC9B5",
		borderRadius: 999,
	},
	card: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.05)",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.04,
		shadowRadius: 8,
		elevation: 2,
	},
	cardCompleted: {
		opacity: 0.55,
	},
	iconWrapper: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "rgba(255,255,255,0.06)",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 14,
	},
	iconWrapperDone: {
		backgroundColor: "rgba(62,201,181,0.15)",
	},
	missionEmoji: {
		fontSize: 22,
	},
	checkMark: {
		color: "#3EC9B5",
		fontSize: 18,
		fontWeight: "900",
	},
	cardContent: {
		flex: 1,
	},
	missionTitle: {
		color: "#1E293B",
		fontSize: 15,
		fontWeight: "700",
		marginBottom: 4,
	},
	missionTitleDone: {
		textDecorationLine: "line-through",
		color: "#94A3B8",
	},
	xpRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	xpText: {
		color: "#3EC9B5",
		fontSize: 12,
		fontWeight: "700",
	},
	xpTextDone: {
		color: "#94A3B8",
	},
	chevronWrapper: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "rgba(255,255,255,0.05)",
		alignItems: "center",
		justifyContent: "center",
	},
});
