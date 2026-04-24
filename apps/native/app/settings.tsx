import { Ionicons } from "@expo/vector-icons";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function SettingsScreen() {
	const router = useRouter();
	const {
		firstName,
		email,
		notificationsEnabled,
		setAnswer,
		getOrGenerateReferralCode,
		reset,
	} = useOnboardingStore();

	const [referralCode, setReferralCode] = useState<string>("");
	const [copied, setCopied] = useState(false);
	const [referralCount] = useState(0); // Will be wired to Supabase later

	// Get or generate the unique code once on mount
	useEffect(() => {
		const code = getOrGenerateReferralCode();
		setReferralCode(code);
	}, [getOrGenerateReferralCode]);

	const handleCopy = async () => {
		if (!referralCode) {
			return;
		}
		Clipboard.setString(referralCode);
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Light);
			} catch (_) {
				// haptic fail ignored
			}
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2500);
	};

	const handleShare = async () => {
		if (!referralCode) {
			return;
		}
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch (_) {
				// haptic fail ignored
			}
		}
		try {
			await Share.share({
				message: `🌿 I'm using EZCare AI to build better daily habits. Join me and use my referral code: ${referralCode}\n\nDownload the app today!`,
			});
		} catch (e) {
			console.error("Share error:", e);
		}
	};

	const handleToggleNotifications = (val: boolean) => {
		setAnswer("notificationsEnabled", val);
	};

	const handleDeleteAccount = () => {
		if (Platform.OS === "android" || Platform.OS === "ios") {
			const { Alert } = require("react-native");
			Alert.alert(
				"Delete Account",
				"Are you sure you want to permanently delete your account? This action cannot be undone.",
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Delete",
						style: "destructive",
						onPress: async () => {
							try {
								const {
									data: { user },
								} = await supabase.auth.getUser();
								if (user?.id) {
									// Delete from auth (this typically requires a service role or user-initiated delete via Supabase Management)
									// For Phase 1, we call a custom edge function or just sign out and clear local state
									// But let's try calling the user delete if possible.
									await supabase.auth.signOut();
								}
								// Clear store
								reset();
								router.replace("/(onboarding)");
							} catch (error) {
								console.error("Delete account error:", error);
							}
						},
					},
				]
			);
		}
	};

	return (
		<SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
			<ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.headerTitle}>Settings ⚙️</Text>
					<Text style={styles.headerSub}>
						Manage your account and preferences
					</Text>
				</View>

				{/* ─── REFER & EARN ─── */}
				<View style={styles.sectionLabel}>
					<Text style={styles.sectionText}>REFER & EARN</Text>
				</View>

				<View style={styles.card}>
					<View style={styles.referHeader}>
						<View style={styles.referIcon}>
							<Text style={styles.referIconText}>🎁</Text>
						</View>
						<Text style={styles.referTitle}>Your Referral Code</Text>
					</View>

					{/* The Code Box */}
					<View style={styles.codeBox}>
						<Text style={styles.codeText}>
							{referralCode || "Generating..."}
						</Text>
					</View>

					{/* Count */}
					<View style={styles.countRow}>
						<Ionicons color="#94A3B8" name="people-outline" size={16} />
						<Text style={styles.countText}>
							{referralCount === 0
								? "0 people have joined using your code"
								: `${referralCount} ${referralCount === 1 ? "person has" : "people have"} joined using your code`}
						</Text>
					</View>

					{/* Action Buttons */}
					<View style={styles.actionRow}>
						<TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
							<Ionicons color="#0B0E17" name="share-social-outline" size={16} />
							<Text style={styles.shareBtnText}>Share</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={handleCopy}
							style={[styles.copyBtn, copied && styles.copyBtnActive]}
						>
							<Ionicons
								color={copied ? "#0B0E17" : "#3EC9B5"}
								name={copied ? "checkmark" : "copy-outline"}
								size={16}
							/>
							<Text
								style={[styles.copyBtnText, copied && styles.copyBtnTextActive]}
							>
								{copied ? "Copied!" : "Copy Code"}
							</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* ─── ACCOUNT ─── */}
				<View style={styles.sectionLabel}>
					<Text style={styles.sectionText}>ACCOUNT</Text>
				</View>

				<View style={styles.card}>
					<TouchableOpacity
						activeOpacity={0.7}
						onPress={() => router.push("/settings/personal-info")}
						style={styles.row}
					>
						<View style={styles.rowIcon}>
							<Ionicons
								color="#3EC9B5"
								name="person-circle-outline"
								size={20}
							/>
						</View>
						<View style={styles.rowContent}>
							<Text style={styles.rowTitle}>Personal Information</Text>
							{firstName || email ? (
								<Text style={styles.rowSub}>{firstName ?? email}</Text>
							) : null}
						</View>
						<Ionicons color="#94A3B8" name="chevron-forward" size={18} />
					</TouchableOpacity>
				</View>

				{/* ─── SUBSCRIPTION & BILLING ─── */}
				<View style={styles.sectionLabel}>
					<Text style={styles.sectionText}>SUBSCRIPTION & BILLING</Text>
				</View>

				<View style={styles.card}>
					<TouchableOpacity
						activeOpacity={0.7}
						onPress={() => router.push("/settings/subscription")}
						style={styles.row}
					>
						<View style={styles.rowIcon}>
							<Ionicons color="#3EC9B5" name="card-outline" size={20} />
						</View>
						<View style={styles.rowContent}>
							<Text style={styles.rowTitle}>Manage Subscription</Text>
						</View>
						<Ionicons color="#94A3B8" name="chevron-forward" size={18} />
					</TouchableOpacity>

					<View style={styles.divider} />

					<TouchableOpacity
						activeOpacity={0.7}
						onPress={() => router.push("/settings/billing")}
						style={styles.row}
					>
						<View style={styles.rowIcon}>
							<Ionicons color="#3EC9B5" name="receipt-outline" size={20} />
						</View>
						<View style={styles.rowContent}>
							<Text style={styles.rowTitle}>Billing & Usage</Text>
						</View>
						<Ionicons color="#94A3B8" name="chevron-forward" size={18} />
					</TouchableOpacity>
				</View>

				{/* ─── NOTIFICATIONS ─── */}
				<View style={styles.sectionLabel}>
					<Text style={styles.sectionText}>NOTIFICATIONS</Text>
				</View>

				<View style={styles.card}>
					<View style={styles.row}>
						<View style={styles.rowIcon}>
							<Ionicons
								color="#3EC9B5"
								name="notifications-outline"
								size={20}
							/>
						</View>
						<View style={styles.rowContent}>
							<Text style={styles.rowTitle}>Push Notifications</Text>
						</View>
						<Switch
							onValueChange={handleToggleNotifications}
							thumbColor="#FFFFFF"
							trackColor={{ false: "rgba(255,255,255,0.1)", true: "#3EC9B5" }}
							value={notificationsEnabled ?? true}
						/>
					</View>
				</View>

				{/* ─── LEGAL / ABOUT ─── */}
				<View style={styles.sectionLabel}>
					<Text style={styles.sectionText}>LEGAL</Text>
				</View>

				<View style={styles.card}>
					<TouchableOpacity
						activeOpacity={0.7}
						onPress={() => router.push("/privacy-policy")}
						style={styles.row}
					>
						<View style={styles.rowIcon}>
							<Ionicons
								color="#3EC9B5"
								name="shield-checkmark-outline"
								size={20}
							/>
						</View>
						<View style={styles.rowContent}>
							<Text style={styles.rowTitle}>Privacy Policy</Text>
						</View>
						<Ionicons color="#94A3B8" name="chevron-forward" size={18} />
					</TouchableOpacity>

					<View style={styles.divider} />

					<TouchableOpacity
						activeOpacity={0.7}
						onPress={() => router.push("/terms-of-service")}
						style={styles.row}
					>
						<View style={styles.rowIcon}>
							<Ionicons
								color="#3EC9B5"
								name="document-text-outline"
								size={20}
							/>
						</View>
						<View style={styles.rowContent}>
							<Text style={styles.rowTitle}>Terms of Service</Text>
						</View>
						<Ionicons color="#94A3B8" name="chevron-forward" size={18} />
					</TouchableOpacity>

					<View style={styles.divider} />

					<TouchableOpacity
						activeOpacity={0.7}
						onPress={() => router.push("/settings/about")}
						style={styles.row}
					>
						<View style={styles.rowIcon}>
							<Ionicons
								color="#3EC9B5"
								name="information-circle-outline"
								size={20}
							/>
						</View>
						<View style={styles.rowContent}>
							<Text style={styles.rowTitle}>About EZCare AI</Text>
						</View>
						<Ionicons color="#94A3B8" name="chevron-forward" size={18} />
					</TouchableOpacity>

					<View style={styles.divider} />

					<TouchableOpacity
						activeOpacity={0.7}
						onPress={() => router.push("/settings/learning-sources")}
						style={styles.row}
					>
						<View style={styles.rowIcon}>
							<Ionicons color="#3EC9B5" name="library-outline" size={20} />
						</View>
						<View style={styles.rowContent}>
							<Text style={styles.rowTitle}>Learning Sources</Text>
						</View>
						<Ionicons color="#94A3B8" name="chevron-forward" size={18} />
					</TouchableOpacity>
				</View>

				{/* ─── DANGER ZONE ─── */}
				<View style={styles.sectionLabel}>
					<Text style={styles.sectionText}>DANGER ZONE</Text>
				</View>

				<View style={styles.card}>
					<TouchableOpacity
						activeOpacity={0.7}
						onPress={handleDeleteAccount}
						style={styles.row}
					>
						<View
							style={[
								styles.rowIcon,
								{ backgroundColor: "rgba(255, 79, 110, 0.1)" },
							]}
						>
							<Ionicons color="#FF4F6E" name="trash-outline" size={20} />
						</View>
						<View style={styles.rowContent}>
							<Text style={[styles.rowTitle, { color: "#FF4F6E" }]}>
								Delete Account
							</Text>
						</View>
					</TouchableOpacity>
				</View>

				{/* Version footer */}
				<Text style={styles.version}>EZCare AI · v1.0.0</Text>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: "#0B0E17",
	},
	scroll: {
		flex: 1,
	},
	header: {
		paddingHorizontal: 24,
		paddingTop: 20,
		marginBottom: 28,
	},
	headerTitle: {
		color: "#FFFFFF",
		fontSize: 28,
		fontWeight: "800",
		marginBottom: 4,
	},
	headerSub: {
		color: "#94A3B8",
		fontSize: 14,
	},
	sectionLabel: {
		paddingHorizontal: 24,
		marginBottom: 10,
		marginTop: 4,
	},
	sectionText: {
		color: "#64748B",
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
	},
	card: {
		marginHorizontal: 20,
		marginBottom: 20,
		backgroundColor: "#1A2138",
		borderRadius: 20,
		padding: 20,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",
	},
	referHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 16,
	},
	referIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(62,201,181,0.15)",
		alignItems: "center",
		justifyContent: "center",
	},
	referIconText: {
		fontSize: 18,
	},
	referTitle: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "700",
	},
	codeBox: {
		borderWidth: 2,
		borderColor: "#3EC9B5",
		borderStyle: "dashed",
		borderRadius: 14,
		paddingVertical: 14,
		paddingHorizontal: 20,
		alignItems: "center",
		marginBottom: 12,
		backgroundColor: "rgba(62,201,181,0.05)",
	},
	codeText: {
		color: "#3EC9B5",
		fontSize: 22,
		fontWeight: "900",
		letterSpacing: 3,
	},
	countRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: 16,
	},
	countText: {
		color: "#94A3B8",
		fontSize: 13,
	},
	actionRow: {
		flexDirection: "row",
		gap: 10,
	},
	shareBtn: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		backgroundColor: "#3EC9B5",
		paddingVertical: 12,
		borderRadius: 14,
	},
	shareBtnText: {
		color: "#0B0E17",
		fontSize: 14,
		fontWeight: "700",
	},
	copyBtn: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		backgroundColor: "rgba(62,201,181,0.1)",
		paddingVertical: 12,
		borderRadius: 14,
		borderWidth: 1.5,
		borderColor: "#3EC9B5",
	},
	copyBtnActive: {
		backgroundColor: "#3EC9B5",
	},
	copyBtnText: {
		color: "#3EC9B5",
		fontSize: 14,
		fontWeight: "700",
	},
	copyBtnTextActive: {
		color: "#0B0E17",
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		minHeight: 44,
	},
	rowIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(62,201,181,0.1)",
		alignItems: "center",
		justifyContent: "center",
	},
	rowContent: {
		flex: 1,
	},
	rowTitle: {
		color: "#FFFFFF",
		fontSize: 15,
		fontWeight: "600",
	},
	rowSub: {
		color: "#64748B",
		fontSize: 12,
		marginTop: 2,
	},
	divider: {
		height: 1,
		backgroundColor: "rgba(255,255,255,0.05)",
		marginVertical: 12,
	},
	version: {
		color: "#334155",
		fontSize: 12,
		textAlign: "center",
		paddingBottom: 32,
		paddingTop: 8,
	},
});
