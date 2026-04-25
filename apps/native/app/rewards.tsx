import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect } from "react";
import {
	Dimensions,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	useGamificationStore,
	DAILY_CHALLENGES,
	WEEKLY_CHALLENGES,
} from "@/stores/gamification-store";
import { useDashboardStore } from "@/stores/dashboard-store";

const { width: SW } = Dimensions.get("window");
const BG = "#0B0E17";

export default function RewardsScreen() {
	const {
		coins,
		totalXp,
		unlockedBadges,
		dailyChallenges,
		weeklyChallenges,
		getLevel,
		getXpProgress,
		getXpForNextLevel,
		getAllBadges,
		claimChallenge,
		resetDailyChallenges,
		resetWeeklyChallenges,
		checkBadges,
	} = useGamificationStore();
	const { streak } = useDashboardStore();

	useEffect(() => {
		resetDailyChallenges();
		resetWeeklyChallenges();
		checkBadges(streak);
	}, []);

	const level = getLevel();
	const xpProgress = getXpProgress();
	const xpForNext = getXpForNextLevel();
	const allBadges = getAllBadges();

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
						<Ionicons color="#FFFFFF" name="chevron-back" size={24} />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Rewards</Text>
					<View style={styles.coinBadge}>
						<Text style={styles.coinText}>🪙 {coins}</Text>
					</View>
				</View>

				{/* Level Card */}
				<View style={styles.levelCard}>
					<LinearGradient
						colors={["#28B898", "#3EC9B5"]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={styles.levelGrad}
					>
						<View style={styles.levelTop}>
							<View style={styles.levelCircle}>
								<Text style={styles.levelNum}>{level}</Text>
							</View>
							<View style={styles.levelInfo}>
								<Text style={styles.levelLabel}>Level {level}</Text>
								<Text style={styles.xpText}>{totalXp} XP total</Text>
							</View>
							<View style={styles.streakBadge}>
								<Text style={styles.streakText}>🔥 {streak}</Text>
							</View>
						</View>

						{/* XP Progress Bar */}
						<View style={styles.xpBarBg}>
							<View style={[styles.xpBarFill, { width: `${Math.min(xpProgress * 100, 100)}%` }]} />
						</View>
						<Text style={styles.xpBarLabel}>
							{Math.round(xpProgress * 500)} / {500} XP to Level {level + 1}
						</Text>
					</LinearGradient>
				</View>

				{/* Daily Challenges */}
				<Text style={styles.sectionTitle}>Daily Challenges</Text>
				{DAILY_CHALLENGES.map((challenge) => {
					const cp = dailyChallenges.find((c) => c.challengeId === challenge.id);
					if (!cp) return null;
					return (
						<View key={challenge.id} style={styles.challengeCard}>
							<View style={styles.challengeLeft}>
								<Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
								<View style={styles.challengeInfo}>
									<Text style={styles.challengeName}>{challenge.title}</Text>
									<Text style={styles.challengeDesc}>{challenge.description}</Text>
									<View style={styles.challengeProgressBg}>
										<View
											style={[
												styles.challengeProgressFill,
												{
													width: `${Math.min((cp.progress / challenge.target) * 100, 100)}%`,
													backgroundColor: cp.completed ? "#3EC9B5" : "#4A5568",
												},
											]}
										/>
									</View>
								</View>
							</View>
							{cp.completed && !cp.claimed ? (
								<TouchableOpacity
									onPress={() => claimChallenge(challenge.id)}
									style={styles.claimBtn}
								>
									<Text style={styles.claimBtnText}>Claim</Text>
								</TouchableOpacity>
							) : cp.claimed ? (
								<View style={styles.claimedBadge}>
									<Ionicons color="#3EC9B5" name="checkmark-circle" size={20} />
								</View>
							) : (
								<View style={styles.rewardPreview}>
									<Text style={styles.rewardText}>+{challenge.xpReward} XP</Text>
									<Text style={styles.rewardCoins}>🪙 {challenge.coinReward}</Text>
								</View>
							)}
						</View>
					);
				})}

				{/* Weekly Challenges */}
				<Text style={styles.sectionTitle}>Weekly Challenges</Text>
				{WEEKLY_CHALLENGES.map((challenge) => {
					const cp = weeklyChallenges.find((c) => c.challengeId === challenge.id);
					if (!cp) return null;
					return (
						<View key={challenge.id} style={[styles.challengeCard, styles.weeklyCard]}>
							<View style={styles.challengeLeft}>
								<Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
								<View style={styles.challengeInfo}>
									<Text style={styles.challengeName}>{challenge.title}</Text>
									<Text style={styles.challengeDesc}>{challenge.description}</Text>
									<View style={styles.challengeProgressBg}>
										<View
											style={[
												styles.challengeProgressFill,
												{
													width: `${Math.min((cp.progress / challenge.target) * 100, 100)}%`,
													backgroundColor: cp.completed ? "#FFD700" : "#4A5568",
												},
											]}
										/>
									</View>
									<Text style={styles.progressLabel}>
										{cp.progress}/{challenge.target}
									</Text>
								</View>
							</View>
							{cp.completed && !cp.claimed ? (
								<TouchableOpacity
									onPress={() => claimChallenge(challenge.id)}
									style={[styles.claimBtn, { backgroundColor: "#FFD700" }]}
								>
									<Text style={[styles.claimBtnText, { color: "#0B0E17" }]}>Claim</Text>
								</TouchableOpacity>
							) : cp.claimed ? (
								<View style={styles.claimedBadge}>
									<Ionicons color="#FFD700" name="checkmark-circle" size={20} />
								</View>
							) : (
								<View style={styles.rewardPreview}>
									<Text style={styles.rewardText}>+{challenge.xpReward} XP</Text>
									<Text style={styles.rewardCoins}>🪙 {challenge.coinReward}</Text>
								</View>
							)}
						</View>
					);
				})}

				{/* Badges */}
				<Text style={styles.sectionTitle}>Badges</Text>
				<View style={styles.badgeGrid}>
					{allBadges.map((badge) => {
						const isUnlocked = unlockedBadges.includes(badge.id);
						return (
							<View
								key={badge.id}
								style={[styles.badgeCard, !isUnlocked && styles.badgeLocked]}
							>
								<Text style={[styles.badgeEmoji, !isUnlocked && { opacity: 0.3 }]}>
									{badge.emoji}
								</Text>
								<Text style={[styles.badgeTitle, !isUnlocked && { color: "#4A5568" }]}>
									{badge.title}
								</Text>
								<Text style={styles.badgeDesc}>{badge.description}</Text>
								{isUnlocked && (
									<View style={styles.unlockedTag}>
										<Text style={styles.unlockedTagText}>UNLOCKED</Text>
									</View>
								)}
							</View>
						);
					})}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: BG },
	content: { padding: 24, paddingBottom: 40 },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 24,
	},
	backBtn: {
		width: 40, height: 40, borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.06)",
		alignItems: "center", justifyContent: "center",
	},
	headerTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
	coinBadge: {
		backgroundColor: "rgba(255,215,0,0.15)",
		paddingHorizontal: 14, paddingVertical: 6,
		borderRadius: 16,
	},
	coinText: { color: "#FFD700", fontSize: 14, fontWeight: "800" },

	// Level card
	levelCard: { borderRadius: 24, overflow: "hidden", marginBottom: 28 },
	levelGrad: { padding: 24 },
	levelTop: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
	levelCircle: {
		width: 56, height: 56, borderRadius: 28,
		backgroundColor: "rgba(255,255,255,0.2)",
		alignItems: "center", justifyContent: "center",
	},
	levelNum: { color: "#FFFFFF", fontSize: 24, fontWeight: "900" },
	levelInfo: { flex: 1, marginLeft: 16 },
	levelLabel: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
	xpText: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600", marginTop: 2 },
	streakBadge: {
		backgroundColor: "rgba(255,255,255,0.2)",
		paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
	},
	streakText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
	xpBarBg: {
		height: 8, backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 4, overflow: "hidden",
	},
	xpBarFill: { height: "100%", backgroundColor: "#FFFFFF", borderRadius: 4 },
	xpBarLabel: {
		color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600",
		marginTop: 8, textAlign: "center",
	},

	// Section
	sectionTitle: {
		color: "#FFFFFF", fontSize: 18, fontWeight: "800",
		marginBottom: 16,
	},

	// Challenge cards
	challengeCard: {
		backgroundColor: "#1A2138",
		borderRadius: 16, padding: 16,
		flexDirection: "row", alignItems: "center",
		marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
	},
	weeklyCard: { borderColor: "rgba(255,215,0,0.15)" },
	challengeLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
	challengeEmoji: { fontSize: 28 },
	challengeInfo: { flex: 1 },
	challengeName: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
	challengeDesc: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
	challengeProgressBg: {
		height: 4, backgroundColor: "rgba(255,255,255,0.1)",
		borderRadius: 2, marginTop: 8, overflow: "hidden",
	},
	challengeProgressFill: { height: "100%", borderRadius: 2 },
	progressLabel: { color: "#94A3B8", fontSize: 10, fontWeight: "600", marginTop: 4 },
	claimBtn: {
		backgroundColor: "#3EC9B5", borderRadius: 12,
		paddingHorizontal: 16, paddingVertical: 8,
	},
	claimBtnText: { color: "#0B0E17", fontSize: 13, fontWeight: "800" },
	claimedBadge: { padding: 8 },
	rewardPreview: { alignItems: "flex-end" },
	rewardText: { color: "#3EC9B5", fontSize: 12, fontWeight: "700" },
	rewardCoins: { color: "#FFD700", fontSize: 11, fontWeight: "600", marginTop: 2 },

	// Badges
	badgeGrid: {
		flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24,
	},
	badgeCard: {
		width: (SW - 72) / 3,
		backgroundColor: "#1A2138", borderRadius: 16, padding: 14,
		alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
	},
	badgeLocked: { opacity: 0.5 },
	badgeEmoji: { fontSize: 32, marginBottom: 8 },
	badgeTitle: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", textAlign: "center" },
	badgeDesc: { color: "#94A3B8", fontSize: 9, textAlign: "center", marginTop: 2 },
	unlockedTag: {
		backgroundColor: "rgba(62,201,181,0.2)", borderRadius: 6,
		paddingHorizontal: 8, paddingVertical: 2, marginTop: 6,
	},
	unlockedTagText: { color: "#3EC9B5", fontSize: 8, fontWeight: "800", letterSpacing: 1 },
});
