import { Ionicons } from "@expo/vector-icons";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
	Dimensions,
	Platform,
	ScrollView,
	Share,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useGamificationStore } from "@/stores/gamification-store";
import { levelsService } from "@/lib/levels-service";

const { width: SW } = Dimensions.get("window");
const CARD_W = SW - 48;
const CARD_H = CARD_W * 1.4;

interface VibeOption {
	emoji: string;
	label: string;
	gradient: [string, string];
	vibe: string;
	description: string;
}

const MOODS: VibeOption[] = [
	{
		emoji: "🔥",
		label: "On Fire",
		gradient: ["#FF6B35", "#FF4444"],
		vibe: "Unstoppable Energy",
		description: "You're radiating main character energy today. Nothing can slow you down.",
	},
	{
		emoji: "✨",
		label: "Glowing",
		gradient: ["#8B5CF6", "#EC4899"],
		vibe: "Creative Flow",
		description: "Ideas are flowing and you're in your creative element. Chase that spark.",
	},
	{
		emoji: "🌊",
		label: "Calm",
		gradient: ["#06B6D4", "#3B82F6"],
		vibe: "Inner Peace",
		description: "You're centered and grounded. The world is moving, but you're still.",
	},
	{
		emoji: "💪",
		label: "Strong",
		gradient: ["#10B981", "#059669"],
		vibe: "Power Mode",
		description: "Feeling resilient and ready for anything. Your discipline is showing.",
	},
	{
		emoji: "😴",
		label: "Low Energy",
		gradient: ["#6366F1", "#4338CA"],
		vibe: "Recharge Mode",
		description: "It's okay to take it slow. Rest is productive too. Tomorrow you rise.",
	},
	{
		emoji: "😤",
		label: "Stressed",
		gradient: ["#EF4444", "#DC2626"],
		vibe: "Under Pressure",
		description: "Feeling the heat, but you're tougher than your toughest day. Breathe deep.",
	},
];

export default function VibeCardScreen() {
	const { firstName } = useOnboardingStore();
	const { streak } = useDashboardStore();
	const [selected, setSelected] = useState<VibeOption | null>(null);
	const [showCard, setShowCard] = useState(false);

	const selectMood = async (mood: VibeOption) => {
		if (Platform.OS === "ios") {
			try { await impactAsync(ImpactFeedbackStyle.Medium); } catch {}
		}
		setSelected(mood);
	};

	const generateCard = async () => {
		if (!selected) return;
		if (Platform.OS === "ios") {
			try { await impactAsync(ImpactFeedbackStyle.Heavy); } catch {}
		}
		setShowCard(true);
	};

	const shareCard = async () => {
		if (!selected) return;
		try {
			await Share.share({
				message: `${selected.emoji} My vibe today: ${selected.vibe}\n\n"${selected.description}"\n\n🔥 ${streak}-day streak on EZCare\n\nTrack your daily vibes → ezcare.app`,
			});
			// Track share for gamification
			const gamStore = useGamificationStore.getState();
			gamStore.incrementStat("totalVibesShared");
			gamStore.addXp(30);
			gamStore.addCoins(5);
			gamStore.updateChallengeProgress("dc_vibe", 1);

			// Award Supabase XP for mood log
			const uid = useOnboardingStore.getState().userId;
			if (uid) {
				levelsService.addXp(uid, 15, "mood_log", { mood: selected.vibe }).catch(() => {});
			}
		} catch {}
	};

	const today = new Date();
	const dateStr = today.toLocaleDateString("en-US", {
		weekday: "long",
		month: "short",
		day: "numeric",
	});

	if (showCard && selected) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.cardContainer}>
					{/* Back */}
					<TouchableOpacity onPress={() => setShowCard(false)} style={styles.backBtn}>
						<Ionicons color="#FFFFFF" name="chevron-back" size={24} />
					</TouchableOpacity>

					{/* The Card */}
					<View style={styles.vibeCard}>
						<LinearGradient
							colors={selected.gradient}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={styles.vibeCardGradient}
						>
							{/* Top badge */}
							<View style={styles.cardBadge}>
								<Text style={styles.cardBadgeText}>DAILY VIBE CHECK</Text>
							</View>

							{/* Date */}
							<Text style={styles.cardDate}>{dateStr}</Text>

							{/* Big emoji */}
							<Text style={styles.cardEmoji}>{selected.emoji}</Text>

							{/* Vibe name */}
							<Text style={styles.cardVibe}>{selected.vibe}</Text>

							{/* Description */}
							<Text style={styles.cardDesc}>{selected.description}</Text>

							{/* Stats row */}
							<View style={styles.cardStats}>
								<View style={styles.cardStat}>
									<Text style={styles.cardStatNum}>🔥 {streak}</Text>
									<Text style={styles.cardStatLabel}>day streak</Text>
								</View>
								<View style={styles.cardStatDivider} />
								<View style={styles.cardStat}>
									<Text style={styles.cardStatNum}>{selected.emoji} {selected.label}</Text>
									<Text style={styles.cardStatLabel}>today's mood</Text>
								</View>
							</View>

							{/* Name */}
							<Text style={styles.cardName}>{firstName || "EZCare User"}</Text>

							{/* Branding */}
							<View style={styles.cardBranding}>
								<Text style={styles.cardBrandText}>EZCare</Text>
							</View>
						</LinearGradient>
					</View>

					{/* Share buttons */}
					<View style={styles.shareRow}>
						<TouchableOpacity onPress={shareCard} style={styles.shareBtn}>
							<LinearGradient colors={["#28B898", "#3EC9B5"]} style={StyleSheet.absoluteFill} />
							<Ionicons color="#0B0E17" name="share-outline" size={20} />
							<Text style={styles.shareBtnText}>Share Your Vibe</Text>
						</TouchableOpacity>
					</View>

					<TouchableOpacity onPress={() => { setShowCard(false); setSelected(null); }} style={styles.resetBtn}>
						<Text style={styles.resetBtnText}>Check in again</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
						<Ionicons color="#FFFFFF" name="chevron-back" size={24} />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Vibe Check</Text>
					<View style={{ width: 40 }} />
				</View>

				<Text style={styles.subtitle}>{dateStr}</Text>
				<Text style={styles.question}>How are you feeling right now?</Text>

				{/* Mood grid */}
				<View style={styles.moodGrid}>
					{MOODS.map((mood) => {
						const isSelected = selected?.label === mood.label;
						return (
							<TouchableOpacity
								key={mood.label}
								onPress={() => selectMood(mood)}
								activeOpacity={0.85}
								style={[styles.moodCard, isSelected && styles.moodCardSelected]}
							>
								<LinearGradient
									colors={isSelected ? mood.gradient : ["#1A2138", "#1A2138"]}
									style={styles.moodCardGrad}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 1 }}
								>
									<Text style={styles.moodEmoji}>{mood.emoji}</Text>
									<Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
										{mood.label}
									</Text>
								</LinearGradient>
							</TouchableOpacity>
						);
					})}
				</View>

				{/* Selected preview */}
				{selected && (
					<View style={styles.previewCard}>
						<Text style={styles.previewVibe}>{selected.vibe}</Text>
						<Text style={styles.previewDesc}>{selected.description}</Text>
					</View>
				)}

				{/* Generate button */}
				<TouchableOpacity
					onPress={generateCard}
					disabled={!selected}
					activeOpacity={0.9}
					style={[styles.generateBtn, !selected && styles.generateBtnDisabled]}
				>
					<LinearGradient
						colors={selected ? selected.gradient : ["#333", "#333"]}
						style={StyleSheet.absoluteFill}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
					/>
					<Ionicons color={selected ? "#FFFFFF" : "#666"} name="sparkles" size={20} />
					<Text style={[styles.generateBtnText, !selected && { color: "#666" }]}>
						Generate My Vibe Card
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#0B0E17" },
	content: { padding: 24, paddingBottom: 40 },
	header: {
		flexDirection: "row", alignItems: "center", justifyContent: "space-between",
		marginBottom: 8,
	},
	backBtn: {
		width: 40, height: 40, borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.06)",
		alignItems: "center", justifyContent: "center",
	},
	headerTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
	subtitle: { color: "#94A3B8", fontSize: 14, fontWeight: "500", textAlign: "center", marginBottom: 8 },
	question: {
		color: "#FFFFFF", fontSize: 28, fontWeight: "900", textAlign: "center",
		marginBottom: 32, letterSpacing: -0.5,
	},
	// Mood grid
	moodGrid: {
		flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24,
		justifyContent: "center",
	},
	moodCard: {
		width: (SW - 72) / 3, borderRadius: 20, overflow: "hidden",
		borderWidth: 2, borderColor: "transparent",
	},
	moodCardSelected: { borderColor: "#FFFFFF" },
	moodCardGrad: {
		alignItems: "center", justifyContent: "center",
		paddingVertical: 20, paddingHorizontal: 8,
	},
	moodEmoji: { fontSize: 36, marginBottom: 8 },
	moodLabel: { color: "#94A3B8", fontSize: 13, fontWeight: "700" },
	moodLabelSelected: { color: "#FFFFFF" },
	// Preview
	previewCard: {
		backgroundColor: "#1A2138", borderRadius: 20, padding: 20,
		marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
	},
	previewVibe: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", marginBottom: 8 },
	previewDesc: { color: "#94A3B8", fontSize: 15, lineHeight: 22 },
	// Generate
	generateBtn: {
		height: 56, borderRadius: 28, flexDirection: "row",
		alignItems: "center", justifyContent: "center", gap: 10,
		overflow: "hidden",
	},
	generateBtnDisabled: { opacity: 0.4 },
	generateBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
	// Card view
	cardContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
	vibeCard: {
		width: CARD_W, borderRadius: 28, overflow: "hidden",
		shadowColor: "#000", shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.5, shadowRadius: 24, elevation: 12,
	},
	vibeCardGradient: {
		padding: 28, alignItems: "center", minHeight: CARD_H,
		justifyContent: "center",
	},
	cardBadge: {
		backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999,
		paddingHorizontal: 16, paddingVertical: 6, marginBottom: 16,
	},
	cardBadgeText: {
		color: "#FFFFFF", fontSize: 11, fontWeight: "800",
		letterSpacing: 2, textTransform: "uppercase",
	},
	cardDate: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "600", marginBottom: 24 },
	cardEmoji: { fontSize: 72, marginBottom: 16 },
	cardVibe: {
		color: "#FFFFFF", fontSize: 32, fontWeight: "900",
		textAlign: "center", marginBottom: 12, letterSpacing: -0.5,
	},
	cardDesc: {
		color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 24,
		textAlign: "center", marginBottom: 28, paddingHorizontal: 8,
	},
	cardStats: {
		flexDirection: "row", alignItems: "center", gap: 16,
		backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 16,
		paddingVertical: 12, paddingHorizontal: 20, marginBottom: 20,
	},
	cardStat: { alignItems: "center" },
	cardStatNum: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
	cardStatLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "500", marginTop: 2 },
	cardStatDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)" },
	cardName: {
		color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: "700", marginBottom: 16,
	},
	cardBranding: {
		backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12,
		paddingHorizontal: 14, paddingVertical: 6,
	},
	cardBrandText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", letterSpacing: 1 },
	// Share
	shareRow: { marginTop: 28, width: "100%" },
	shareBtn: {
		height: 56, borderRadius: 28, flexDirection: "row",
		alignItems: "center", justifyContent: "center", gap: 10,
		overflow: "hidden",
	},
	shareBtnText: { color: "#0B0E17", fontSize: 16, fontWeight: "800" },
	resetBtn: { marginTop: 16, padding: 12 },
	resetBtnText: { color: "#94A3B8", fontSize: 14, fontWeight: "600" },
});
