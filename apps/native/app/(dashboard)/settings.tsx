import { Ionicons } from "@expo/vector-icons";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { useEffect, useState } from "react";
import {
	Alert,
	Clipboard,
	Platform,
	ScrollView,
	Share,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/stores/onboarding-store";

// ── Design tokens ──────────────────────────────────
const BG = "#F4F6F8";
const CARD = "#FFFFFF";
const TEAL = "#3EC9B5";
const DARK = "#1A1A2E";
const GREY = "#94A3B8";

export default function SettingsScreen() {
	const {
		firstName,
		email,
		notificationsEnabled,
		setAnswer,
		getOrGenerateReferralCode,
	} = useOnboardingStore();

	const [referralCode, setReferralCode] = useState("");
	const [copied, setCopied] = useState(false);
	const [referralCount] = useState(0);

	useEffect(() => {
		setReferralCode(getOrGenerateReferralCode());
	}, [getOrGenerateReferralCode]);

	const handleCopy = async () => {
		Clipboard.setString(referralCode);
		if (Platform.OS === "ios") {
			try { await impactAsync(ImpactFeedbackStyle.Light); } catch {}
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2500);
	};

	const handleShare = async () => {
		try {
			await Share.share({
				message: `🌿 I'm using EZCare AI to track my health naturally. Join me and use my referral code: ${referralCode}\n\nDownload the app today!`,
			});
		} catch {}
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.title}>Settings ⚙️</Text>
					<Text style={styles.sub}>Manage your account and preferences</Text>
				</View>

				{/* ── REFER & EARN ── */}
				<Text style={styles.sectionLabel}>REFER & EARN</Text>
				<View style={styles.card}>
					<View style={styles.row}>
						<Text style={{ fontSize: 20 }}>🎁</Text>
						<Text style={styles.cardTitle}>Your Referral Code</Text>
					</View>
					<View style={styles.codeBox}>
						<Text style={styles.codeText}>{referralCode || "Loading..."}</Text>
					</View>
					<View style={styles.countRow}>
						<Ionicons name="people-outline" size={14} color={GREY} />
						<Text style={styles.countText}>{referralCount} people have joined using your code</Text>
					</View>
					<View style={styles.actionRow}>
						<TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
							<Ionicons name="share-social-outline" size={15} color="#FFFFFF" />
							<Text style={styles.shareBtnText}>Share</Text>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.copyBtn, copied && styles.copyBtnActive]} onPress={handleCopy}>
							<Ionicons name={copied ? "checkmark" : "copy-outline"} size={15} color={copied ? "#FFFFFF" : TEAL} />
							<Text style={[styles.copyBtnText, copied && styles.copyBtnTextActive]}>
								{copied ? "Copied!" : "Copy Code"}
							</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* ── ACCOUNT ── */}
				<Text style={styles.sectionLabel}>ACCOUNT</Text>
				<View style={styles.card}>
					<TouchableOpacity style={styles.listRow}>
						<Ionicons name="person-circle-outline" size={22} color={TEAL} />
						<Text style={styles.listText}>Personal Information</Text>
						<Ionicons name="chevron-forward" size={18} color={GREY} />
					</TouchableOpacity>
				</View>

				{/* ── SUBSCRIPTION ── */}
				<Text style={styles.sectionLabel}>SUBSCRIPTION & BILLING</Text>
				<View style={styles.card}>
					<TouchableOpacity style={styles.listRow}>
						<Ionicons name="card-outline" size={22} color={TEAL} />
						<Text style={styles.listText}>Manage Subscription</Text>
						<Ionicons name="chevron-forward" size={18} color={GREY} />
					</TouchableOpacity>
					<View style={styles.divider} />
					<TouchableOpacity style={styles.listRow}>
						<Ionicons name="receipt-outline" size={22} color={TEAL} />
						<Text style={styles.listText}>Billing & Usage</Text>
						<Ionicons name="chevron-forward" size={18} color={GREY} />
					</TouchableOpacity>
				</View>

				{/* ── NOTIFICATIONS ── */}
				<Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
				<View style={styles.card}>
					<View style={styles.listRow}>
						<Ionicons name="notifications-outline" size={22} color={TEAL} />
						<View style={{ flex: 1 }}>
							<Text style={styles.listText}>Push Notifications</Text>
							<Text style={styles.listSub}>Daily reminders and health tips</Text>
						</View>
						<Switch
							value={notificationsEnabled ?? true}
							onValueChange={(v) => setAnswer("notificationsEnabled", v)}
							trackColor={{ false: "#E2E8F0", true: TEAL }}
							thumbColor="#FFFFFF"
						/>
					</View>
					<View style={styles.divider} />
					<View style={{ paddingTop: 4 }}>
						<View style={styles.listRow}>
							<Ionicons name="time-outline" size={22} color={TEAL} />
							<Text style={[styles.listText, { flex: 1 }]}>Daily Health Check-In Time</Text>
						</View>
						<TouchableOpacity style={styles.timeRow}>
							<Ionicons name="sunny-outline" size={16} color="#F97316" />
							<Text style={styles.timeLabel}>Morning</Text>
							<Text style={styles.timeValue}>8:00 AM</Text>
							<Ionicons name="chevron-forward" size={16} color={GREY} />
						</TouchableOpacity>
						<TouchableOpacity style={styles.timeRow}>
							<Ionicons name="moon-outline" size={16} color="#6366F1" />
							<Text style={styles.timeLabel}>Evening</Text>
							<Text style={styles.timeValue}>8:00 PM</Text>
							<Ionicons name="chevron-forward" size={16} color={GREY} />
						</TouchableOpacity>
					</View>
				</View>

				{/* ── ABOUT ── */}
				<Text style={styles.sectionLabel}>ABOUT EZCARE AI</Text>
				<View style={styles.card}>
					{[
						{ icon: "information-circle-outline" as const, label: "About the App" },
						{ icon: "shield-checkmark-outline" as const, label: "Privacy Policy" },
						{ icon: "document-text-outline" as const, label: "Terms of Service" },
						{ icon: "library-outline" as const, label: "Medical Sources" },
					].map((item, i, arr) => (
						<View key={item.label}>
							<TouchableOpacity style={styles.listRow}>
								<Ionicons name={item.icon} size={22} color={TEAL} />
								<Text style={styles.listText}>{item.label}</Text>
								<Ionicons name="chevron-forward" size={18} color={GREY} />
							</TouchableOpacity>
							{i < arr.length - 1 && <View style={styles.divider} />}
						</View>
					))}
				</View>

				{/* ── HELP ── */}
				<Text style={styles.sectionLabel}>HELP & SUPPORT</Text>
				<View style={styles.card}>
					<TouchableOpacity style={styles.listRow}>
						<Ionicons name="help-circle-outline" size={22} color={TEAL} />
						<Text style={styles.listText}>Contact Support</Text>
						<Ionicons name="chevron-forward" size={18} color={GREY} />
					</TouchableOpacity>
				</View>

				{/* ── Danger zone ── */}
				<TouchableOpacity
					style={styles.dangerBtn}
					onPress={() => Alert.alert("Delete Account", "Are you sure? This action is irreversible.", [
						{ text: "Cancel", style: "cancel" },
						{ text: "Delete", style: "destructive" },
					])}
				>
					<Ionicons name="trash-outline" size={18} color="#EF4444" />
					<Text style={styles.dangerText}>Delete Account</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.dangerBtn}>
					<Ionicons name="log-out-outline" size={18} color="#EF4444" />
					<Text style={styles.dangerText}>Sign Out</Text>
				</TouchableOpacity>

				<Text style={styles.version}>EZCare AI · v1.0.0</Text>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: BG },
	scroll: { flex: 1 },
	header: { paddingHorizontal: 24, paddingTop: 20, marginBottom: 20 },
	title: { fontSize: 26, fontWeight: "800", color: DARK },
	sub: { fontSize: 14, color: GREY, marginTop: 2 },
	sectionLabel: { fontSize: 11, fontWeight: "700", color: GREY, letterSpacing: 1, textTransform: "uppercase", paddingHorizontal: 24, marginBottom: 8, marginTop: 4 },
	card: { marginHorizontal: 20, marginBottom: 16, backgroundColor: CARD, borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
	cardTitle: { fontSize: 15, fontWeight: "700", color: DARK, marginLeft: 8 },
	row: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
	codeBox: { borderWidth: 2, borderColor: TEAL, borderStyle: "dashed", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginBottom: 10, backgroundColor: "rgba(62,201,181,0.05)" },
	codeText: { color: TEAL, fontSize: 22, fontWeight: "900", letterSpacing: 3 },
	countRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 14 },
	countText: { color: GREY, fontSize: 13 },
	actionRow: { flexDirection: "row", gap: 10 },
	shareBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: TEAL, paddingVertical: 11, borderRadius: 12 },
	shareBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
	copyBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: TEAL, paddingVertical: 11, borderRadius: 12 },
	copyBtnActive: { backgroundColor: TEAL },
	copyBtnText: { color: TEAL, fontSize: 14, fontWeight: "700" },
	copyBtnTextActive: { color: "#FFFFFF" },
	listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4, minHeight: 44 },
	listText: { flex: 1, fontSize: 15, fontWeight: "600", color: DARK },
	listSub: { fontSize: 12, color: GREY, marginTop: 1 },
	divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 8 },
	timeRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, marginTop: 8 },
	timeLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: DARK },
	timeValue: { fontSize: 14, fontWeight: "700", color: TEAL, marginRight: 4 },
	dangerBtn: { marginHorizontal: 20, marginBottom: 12, backgroundColor: CARD, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
	dangerText: { color: "#EF4444", fontSize: 15, fontWeight: "700" },
	version: { textAlign: "center", color: "#CBD5E1", fontSize: 12, paddingBottom: 32, paddingTop: 8 },
});
