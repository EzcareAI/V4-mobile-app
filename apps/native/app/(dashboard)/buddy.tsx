import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
	Animated,
	Dimensions,
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
import { useCompanionStore } from "@/stores/companion-store";
import { useGamificationStore } from "@/stores/gamification-store";

const { width: SW } = Dimensions.get("window");
const TEAL = "#3EC9B5";
const DARK = "#0B0E17";
const GREY = "#94A3B8";

// ── Dynamic greeting based on time of day ──
function getGreeting(name?: string): { emoji: string; text: string; sub: string } {
	const hour = new Date().getHours();
	const n = name || "there";
	if (hour < 6) return { emoji: "🌙", text: `Night owl, ${n}!`, sub: "Remember to rest. Your body repairs while you sleep." };
	if (hour < 12) return { emoji: "☀️", text: `Good morning, ${n}!`, sub: "A fresh start. Let's make today count." };
	if (hour < 17) return { emoji: "🌤️", text: `Hey ${n}!`, sub: "Afternoon check — how's your energy holding up?" };
	if (hour < 21) return { emoji: "🌅", text: `Evening, ${n}!`, sub: "Wind down time. Reflect on your wins today." };
	return { emoji: "🌙", text: `Good night, ${n}!`, sub: "Time to recharge. Tomorrow is a new opportunity." };
}

// ── Dynamic tips based on check-in data ──
function getDailyTips(lastValues: { sleep: number; energy: number; stress: number; digestion: number } | null, streak: number): { icon: string; text: string; color: string }[] {
	const tips: { icon: string; text: string; color: string }[] = [];

	if (!lastValues) {
		tips.push({ icon: "📝", text: "Complete your first check-in so I can start learning about you!", color: "#8B5CF6" });
		tips.push({ icon: "📸", text: "Try scanning a meal — I'll break down the nutrition for you.", color: "#F59E0B" });
		tips.push({ icon: "💬", text: "Chat with me anytime. I'm here to help you build better habits.", color: TEAL });
		return tips;
	}

	if (lastValues.sleep <= 2) tips.push({ icon: "😴", text: "Your sleep was rough. Try a screen-free hour before bed tonight.", color: "#6366F1" });
	else if (lastValues.sleep >= 4) tips.push({ icon: "🌟", text: "Great sleep! Quality rest is your superpower. Keep it up.", color: "#10B981" });

	if (lastValues.energy <= 2) tips.push({ icon: "⚡", text: "Low energy today? A 10-min walk + water can shift your state fast.", color: "#F59E0B" });
	else if (lastValues.energy >= 4) tips.push({ icon: "🔋", text: "Energy is high! Channel it into something meaningful today.", color: "#10B981" });

	if (lastValues.stress >= 4) tips.push({ icon: "🧘", text: "Stress is elevated. Try 3 deep breaths: in for 4, hold for 7, out for 8.", color: "#EF4444" });
	else if (lastValues.stress <= 2) tips.push({ icon: "😌", text: "You're calm and centered. Perfect state for creative thinking.", color: "#10B981" });

	if (lastValues.digestion <= 2) tips.push({ icon: "🥦", text: "Digestion needs attention. Add more fiber and drink warm water.", color: "#F97316" });
	else if (lastValues.digestion >= 4) tips.push({ icon: "✅", text: "Digestion is strong! Your gut health habits are paying off.", color: "#10B981" });

	if (streak >= 7) tips.push({ icon: "🔥", text: `${streak}-day streak! You're in the top 10% of consistent users.`, color: "#FF6B35" });
	else if (streak >= 3) tips.push({ icon: "📈", text: `${streak} days and climbing. Consistency beats intensity every time.`, color: TEAL });

	// Always add a motivational one
	const motivational = [
		{ icon: "💪", text: "Small daily improvements = massive results over time.", color: "#8B5CF6" },
		{ icon: "🎯", text: "You don't have to be perfect. Just show up consistently.", color: TEAL },
		{ icon: "🧠", text: "The best investment you can make is in your daily habits.", color: "#3B82F6" },
		{ icon: "✨", text: "Every check-in teaches me more about you. Keep going!", color: "#EC4899" },
	];
	tips.push(motivational[Math.floor(Math.random() * motivational.length)]);

	return tips.slice(0, 4);
}

// ── Buddy mood expression ──
function getBuddyMood(lastValues: { sleep: number; energy: number; stress: number; digestion: number } | null): { face: string; status: string; color: string } {
	if (!lastValues) return { face: "🤖", status: "Waiting to learn about you...", color: GREY };

	const avg = (lastValues.sleep + lastValues.energy + (6 - lastValues.stress) + lastValues.digestion) / 4;
	if (avg >= 4) return { face: "😊", status: "I'm feeling great about your progress!", color: "#10B981" };
	if (avg >= 3) return { face: "🙂", status: "Things are going well. Let's keep building.", color: TEAL };
	if (avg >= 2) return { face: "😐", status: "Some areas need attention. I have tips for you.", color: "#F59E0B" };
	return { face: "😟", status: "Let's focus on getting you back on track today.", color: "#EF4444" };
}

export default function BuddyScreen() {
	const router = useRouter();
	const { firstName } = useOnboardingStore();
	const { streak, lastCheckInValues, checkInHistory } = useDashboardStore();
	const { knownFacts, conversationCount, preferredTopics } = useCompanionStore();
	const { totalXp, getLevel, coins, totalMealsScanned, unlockedBadges, getXpProgress } = useGamificationStore();
	const [pulseAnim] = useState(new Animated.Value(1));

	// Pulse animation for the buddy avatar
	useEffect(() => {
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
				Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
			])
		);
		loop.start();
		return () => loop.stop();
	}, [pulseAnim]);

	const greeting = useMemo(() => getGreeting(firstName), [firstName]);
	const tips = useMemo(() => getDailyTips(lastCheckInValues, streak), [lastCheckInValues, streak]);
	const buddyMood = useMemo(() => getBuddyMood(lastCheckInValues), [lastCheckInValues]);

	// Body energy bar: composite score from last check-in
	const energyScore = useMemo(() => {
		if (!lastCheckInValues) return 0;
		const avg = (lastCheckInValues.sleep + lastCheckInValues.energy + (6 - lastCheckInValues.stress) + lastCheckInValues.digestion) / 4;
		return Math.round((avg / 5) * 100);
	}, [lastCheckInValues]);

	const level = getLevel();
	const xpProgress = getXpProgress();

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				{/* ── Buddy Avatar + Greeting ── */}
				<View style={styles.buddyHeader}>
					<Animated.View style={[styles.avatarOuter, { transform: [{ scale: pulseAnim }] }]}>
						<LinearGradient
							colors={[TEAL, "#28B898"]}
							style={styles.avatarGrad}
						>
							<Text style={styles.avatarEmoji}>{buddyMood.face}</Text>
						</LinearGradient>
					</Animated.View>
					<View style={styles.statusPill}>
						<View style={[styles.statusDot, { backgroundColor: buddyMood.color }]} />
						<Text style={[styles.statusText, { color: buddyMood.color }]}>{buddyMood.status}</Text>
					</View>
					<Text style={styles.greetEmoji}>{greeting.emoji}</Text>
					<Text style={styles.greetText}>{greeting.text}</Text>
					<Text style={styles.greetSub}>{greeting.sub}</Text>
				</View>

				{/* ── Body Energy Bar ── */}
				<View style={styles.energyCard}>
					<LinearGradient
						colors={["#1A2138", "#0F1629"]}
						style={styles.energyGrad}
					>
						<View style={styles.energyTop}>
							<Text style={styles.energyTitle}>Body Vitality Score</Text>
							<Text style={styles.energyValue}>{energyScore}%</Text>
						</View>
						<View style={styles.energyBarBg}>
							<LinearGradient
								colors={energyScore >= 70 ? ["#10B981", "#3EC9B5"] : energyScore >= 40 ? ["#F59E0B", "#FBBF24"] : ["#EF4444", "#F87171"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								style={[styles.energyBarFill, { width: `${Math.max(energyScore, 3)}%` }]}
							/>
						</View>
						<View style={styles.energyMetrics}>
							{[
								{ icon: "🌙", label: "Sleep", value: lastCheckInValues?.sleep || 0, max: 5 },
								{ icon: "⚡", label: "Energy", value: lastCheckInValues?.energy || 0, max: 5 },
								{ icon: "😌", label: "Calm", value: lastCheckInValues ? 6 - lastCheckInValues.stress : 0, max: 5 },
								{ icon: "🌿", label: "Gut", value: lastCheckInValues?.digestion || 0, max: 5 },
							].map((m) => (
								<View key={m.label} style={styles.energyMetric}>
									<Text style={styles.energyMetricIcon}>{m.icon}</Text>
									<View style={styles.miniBarBg}>
										<View style={[styles.miniBarFill, { width: `${(m.value / m.max) * 100}%` }]} />
									</View>
									<Text style={styles.energyMetricLabel}>{m.label}</Text>
								</View>
							))}
						</View>
						{!lastCheckInValues && (
							<TouchableOpacity onPress={() => router.push("/(dashboard)")} style={styles.noDataBtn}>
								<Ionicons color={TEAL} name="add-circle-outline" size={16} />
								<Text style={styles.noDataBtnText}>Do your first check-in to unlock this</Text>
							</TouchableOpacity>
						)}
					</LinearGradient>
				</View>

				{/* ── EZBuddy's Daily Tips ── */}
				<Text style={styles.sectionTitle}>EZBuddy's Tips For You</Text>
				{tips.map((tip, i) => (
					<View key={i} style={styles.tipCard}>
						<View style={[styles.tipIconWrap, { backgroundColor: `${tip.color}18` }]}>
							<Text style={styles.tipIcon}>{tip.icon}</Text>
						</View>
						<Text style={styles.tipText}>{tip.text}</Text>
					</View>
				))}

				{/* ── Quick Actions ── */}
				<Text style={styles.sectionTitle}>Talk to EZBuddy</Text>
				<View style={styles.quickRow}>
					<TouchableOpacity
						activeOpacity={0.85}
						onPress={() => router.push("/chat")}
						style={styles.quickCard}
					>
						<LinearGradient colors={[TEAL, "#28B898"]} style={styles.quickGrad}>
							<Ionicons color="#FFF" name="chatbubble-ellipses" size={24} />
							<Text style={styles.quickLabel}>Chat</Text>
						</LinearGradient>
					</TouchableOpacity>
					<TouchableOpacity
						activeOpacity={0.85}
						onPress={() => router.push("/scan/meal-scanner")}
						style={styles.quickCard}
					>
						<LinearGradient colors={["#FF6B35", "#FF4444"]} style={styles.quickGrad}>
							<Ionicons color="#FFF" name="scan" size={24} />
							<Text style={styles.quickLabel}>Scan Meal</Text>
						</LinearGradient>
					</TouchableOpacity>
					<TouchableOpacity
						activeOpacity={0.85}
						onPress={() => router.push("/vibe-card")}
						style={styles.quickCard}
					>
						<LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.quickGrad}>
							<Ionicons color="#FFF" name="sparkles" size={24} />
							<Text style={styles.quickLabel}>Vibe Check</Text>
						</LinearGradient>
					</TouchableOpacity>
				</View>

				{/* ── What EZBuddy Knows About You ── */}
				<Text style={styles.sectionTitle}>What I Know About You</Text>
				<View style={styles.knowledgeCard}>
					{knownFacts.length > 0 ? (
						<>
							{knownFacts.slice(-8).map((fact, i) => (
								<View key={i} style={styles.factRow}>
									<View style={styles.factDot} />
									<Text style={styles.factText}>{fact}</Text>
								</View>
							))}
							{knownFacts.length > 8 && (
								<Text style={styles.moreFactsText}>+{knownFacts.length - 8} more things I remember</Text>
							)}
						</>
					) : (
						<View style={styles.emptyKnowledge}>
							<Text style={styles.emptyEmoji}>🧠</Text>
							<Text style={styles.emptyTitle}>I'm still learning about you!</Text>
							<Text style={styles.emptySub}>Chat with me and I'll remember your preferences, habits, and goals to give you better advice over time.</Text>
							<TouchableOpacity onPress={() => router.push("/chat")} style={styles.startChatBtn}>
								<Text style={styles.startChatBtnText}>Start a Conversation</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>

				{/* ── Your Stats ── */}
				<Text style={styles.sectionTitle}>Your Journey</Text>
				<View style={styles.statsGrid}>
					<View style={styles.statCard}>
						<Text style={styles.statEmoji}>🔥</Text>
						<Text style={styles.statValue}>{streak}</Text>
						<Text style={styles.statLabel}>Day Streak</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statEmoji}>⭐</Text>
						<Text style={styles.statValue}>Lv {level}</Text>
						<Text style={styles.statLabel}>{totalXp} XP</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statEmoji}>🪙</Text>
						<Text style={styles.statValue}>{coins}</Text>
						<Text style={styles.statLabel}>Coins</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statEmoji}>💬</Text>
						<Text style={styles.statValue}>{conversationCount}</Text>
						<Text style={styles.statLabel}>Chats</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statEmoji}>📸</Text>
						<Text style={styles.statValue}>{totalMealsScanned}</Text>
						<Text style={styles.statLabel}>Meals Scanned</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statEmoji}>🏅</Text>
						<Text style={styles.statValue}>{unlockedBadges.length}</Text>
						<Text style={styles.statLabel}>Badges</Text>
					</View>
				</View>

				{/* ── XP Progress ── */}
				<TouchableOpacity
					activeOpacity={0.85}
					onPress={() => router.push("/rewards")}
					style={styles.xpCard}
				>
					<View style={styles.xpTop}>
						<Text style={styles.xpTitle}>Level {level} Progress</Text>
						<Text style={styles.xpPercent}>{Math.round(xpProgress * 100)}%</Text>
					</View>
					<View style={styles.xpBarBg}>
						<LinearGradient
							colors={["#FFD700", "#FF8C00"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={[styles.xpBarFill, { width: `${Math.max(xpProgress * 100, 2)}%` }]}
						/>
					</View>
					<View style={styles.xpBottom}>
						<Text style={styles.xpSub}>{Math.round(xpProgress * 500)}/500 XP to next level</Text>
						<Ionicons color={GREY} name="chevron-forward" size={16} />
					</View>
				</TouchableOpacity>

				{/* Footer */}
				<View style={styles.footer}>
					<Text style={styles.footerText}>EZBuddy learns from every interaction.</Text>
					<Text style={styles.footerText}>The more you use the app, the smarter I get.</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#F4F6F8" },
	content: { paddingBottom: 40 },

	// Buddy header
	buddyHeader: { alignItems: "center", paddingTop: 20, paddingBottom: 8, paddingHorizontal: 24 },
	avatarOuter: { marginBottom: 12 },
	avatarGrad: {
		width: 88, height: 88, borderRadius: 44,
		alignItems: "center", justifyContent: "center",
		shadowColor: TEAL, shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
	},
	avatarEmoji: { fontSize: 44 },
	statusPill: {
		flexDirection: "row", alignItems: "center", gap: 6,
		backgroundColor: "#FFFFFF",
		paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
		marginBottom: 16, shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
	},
	statusDot: { width: 8, height: 8, borderRadius: 4 },
	statusText: { fontSize: 12, fontWeight: "600" },
	greetEmoji: { fontSize: 32, marginBottom: 4 },
	greetText: { fontSize: 24, fontWeight: "900", color: "#1A1A2E", textAlign: "center" },
	greetSub: { fontSize: 14, color: GREY, textAlign: "center", marginTop: 4, lineHeight: 20, paddingHorizontal: 20 },

	// Energy card
	energyCard: { marginHorizontal: 20, marginTop: 20, borderRadius: 24, overflow: "hidden" },
	energyGrad: { padding: 20 },
	energyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
	energyTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
	energyValue: { color: TEAL, fontSize: 28, fontWeight: "900" },
	energyBarBg: {
		height: 12, backgroundColor: "rgba(255,255,255,0.1)",
		borderRadius: 6, overflow: "hidden", marginBottom: 16,
	},
	energyBarFill: { height: "100%", borderRadius: 6 },
	energyMetrics: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
	energyMetric: { flex: 1, alignItems: "center" },
	energyMetricIcon: { fontSize: 20, marginBottom: 6 },
	miniBarBg: { width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", marginBottom: 4 },
	miniBarFill: { height: "100%", backgroundColor: TEAL, borderRadius: 2 },
	energyMetricLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "600" },
	noDataBtn: {
		flexDirection: "row", alignItems: "center", gap: 6,
		justifyContent: "center", marginTop: 16,
		backgroundColor: "rgba(62,201,181,0.1)",
		borderRadius: 12, paddingVertical: 10,
	},
	noDataBtnText: { color: TEAL, fontSize: 13, fontWeight: "600" },

	// Section
	sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1A1A2E", paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },

	// Tips
	tipCard: {
		flexDirection: "row", alignItems: "flex-start", gap: 12,
		marginHorizontal: 20, marginBottom: 10,
		backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16,
		shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
	},
	tipIconWrap: {
		width: 40, height: 40, borderRadius: 12,
		alignItems: "center", justifyContent: "center",
	},
	tipIcon: { fontSize: 20 },
	tipText: { flex: 1, color: "#1A1A2E", fontSize: 14, fontWeight: "500", lineHeight: 20 },

	// Quick actions
	quickRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10 },
	quickCard: { flex: 1, borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
	quickGrad: { paddingVertical: 18, alignItems: "center", gap: 8 },
	quickLabel: { color: "#FFF", fontSize: 12, fontWeight: "800" },

	// Knowledge card
	knowledgeCard: {
		marginHorizontal: 20, backgroundColor: "#FFFFFF",
		borderRadius: 20, padding: 20,
		shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
	},
	factRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
	factDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL, marginTop: 5 },
	factText: { flex: 1, color: "#1A1A2E", fontSize: 14, lineHeight: 20 },
	moreFactsText: { color: GREY, fontSize: 12, fontWeight: "600", textAlign: "center", marginTop: 8 },
	emptyKnowledge: { alignItems: "center", paddingVertical: 12 },
	emptyEmoji: { fontSize: 40, marginBottom: 12 },
	emptyTitle: { fontSize: 16, fontWeight: "800", color: "#1A1A2E", marginBottom: 4 },
	emptySub: { fontSize: 13, color: GREY, textAlign: "center", lineHeight: 18, marginBottom: 16 },
	startChatBtn: { backgroundColor: TEAL, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
	startChatBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },

	// Stats grid
	statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 10 },
	statCard: {
		width: (SW - 60) / 3, backgroundColor: "#FFFFFF",
		borderRadius: 16, padding: 14, alignItems: "center",
		shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
	},
	statEmoji: { fontSize: 24, marginBottom: 6 },
	statValue: { fontSize: 18, fontWeight: "900", color: "#1A1A2E" },
	statLabel: { fontSize: 10, fontWeight: "600", color: GREY, marginTop: 2 },

	// XP Card
	xpCard: {
		marginHorizontal: 20, marginTop: 24,
		backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20,
		shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
	},
	xpTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
	xpTitle: { fontSize: 16, fontWeight: "800", color: "#1A1A2E" },
	xpPercent: { fontSize: 16, fontWeight: "900", color: "#FF8C00" },
	xpBarBg: { height: 8, backgroundColor: "#F0F0F0", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
	xpBarFill: { height: "100%", borderRadius: 4 },
	xpBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	xpSub: { color: GREY, fontSize: 12, fontWeight: "600" },

	// Footer
	footer: { alignItems: "center", marginTop: 32, paddingBottom: 20 },
	footerText: { color: GREY, fontSize: 12, lineHeight: 18 },
});
