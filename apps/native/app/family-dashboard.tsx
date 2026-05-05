/**
 * Family Dashboard
 *
 * Shows family members, stats, active invite, and challenges.
 * Accessible from home screen Family card.
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	RefreshControl,
	ScrollView,
	Share,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import {
	familyService,
	type FamilyGroup,
	type FamilyMemberDashboard,
	type FamilyChallenge,
} from "@/lib/family-service";

// Design tokens
const BG = "#0A0A0F";
const SURFACE = "#1A1A24";
const SURFACE_LIGHT = "#242430";
const PURPLE = "#9D4EDD";
const GREEN = "#06FFA5";
const GOLD = "#FFD60A";
const TEXT_COLOR = "#F5F5F7";
const TEXT_DIM = "#8E8E93";
const BORDER = "rgba(255,255,255,0.06)";

export default function FamilyDashboardScreen() {
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [family, setFamily] = useState<FamilyGroup | null>(null);
	const [members, setMembers] = useState<FamilyMemberDashboard[]>([]);
	const [challenges, setChallenges] = useState<FamilyChallenge[]>([]);
	const [inviteCode, setInviteCode] = useState<string | null>(null);
	const [userId, setUserId] = useState<string>("");

	const loadData = useCallback(async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;
		setUserId(user.id);

		const fam = await familyService.getMyFamily(user.id);
		setFamily(fam);

		if (fam) {
			const [dash, chals, invite] = await Promise.all([
				familyService.getFamilyDashboard(fam.id),
				familyService.getChallenges(fam.id),
				familyService.getActiveInvite(fam.id),
			]);
			setMembers(dash);
			setChallenges(chals.filter((c) => c.status === "active"));
			setInviteCode(invite);
		}
	}, []);

	useEffect(() => {
		loadData().finally(() => setLoading(false));
	}, [loadData]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
	}, [loadData]);

	const handleCreateInvite = async () => {
		const result = await familyService.createInvite(userId);
		if (result.success && result.code) {
			setInviteCode(result.code);
		} else {
			Alert.alert("Error", result.error ?? "Failed to create invite.");
		}
	};

	const handleShareInvite = async () => {
		if (!inviteCode) return;
		await Share.share({
			message: `Join my family on EZCare! Use invite code: ${inviteCode}`,
		});
	};

	const handleRemoveMember = (targetUserId: string, name: string) => {
		if (!family) return;
		Alert.alert(
			"Remove Member",
			`Remove ${name} from ${family.name}?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Remove",
					style: "destructive",
					onPress: async () => {
						await familyService.removeMember(family.id, targetUserId);
						onRefresh();
					},
				},
			]
		);
	};

	const isOwner = family?.ownerUserId === userId;

	if (loading) {
		return (
			<SafeAreaView edges={["top"]} style={styles.safe}>
				<View style={styles.center}>
					<ActivityIndicator color={PURPLE} size="large" />
				</View>
			</SafeAreaView>
		);
	}

	// No family — show create/join options
	if (!family) {
		return (
			<SafeAreaView edges={["top"]} style={styles.safe}>
				<ScrollView contentContainerStyle={styles.content}>
					<View style={styles.header}>
						<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
							<Ionicons color="#FFFFFF" name="chevron-back" size={24} />
						</TouchableOpacity>
						<Text style={styles.headerTitle}>Family</Text>
						<View style={{ width: 40 }} />
					</View>

					<View style={styles.emptyState}>
						<Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
						<Text style={styles.emptyTitle}>No Family Yet</Text>
						<Text style={styles.emptyDesc}>
							Create a family group to track progress together, or join one with an invite code.
						</Text>

						<TouchableOpacity
							style={styles.primaryBtn}
							onPress={() => router.push("/create-family")}
						>
							<LinearGradient
								colors={[PURPLE, "#7B2FF7"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								style={styles.btnGrad}
							>
								<Ionicons name="people" size={20} color="#FFF" />
								<Text style={styles.btnText}>Create Family</Text>
							</LinearGradient>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.secondaryBtn}
							onPress={() => router.push("/join-family")}
						>
							<Text style={styles.secondaryBtnText}>Join with Invite Code</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />
				}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
						<Ionicons color="#FFFFFF" name="chevron-back" size={24} />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>{family.name}</Text>
					<TouchableOpacity onPress={() => router.push("/family-settings")}>
						<Ionicons name="settings-outline" size={22} color={TEXT_DIM} />
					</TouchableOpacity>
				</View>

				{/* Member count */}
				<Text style={styles.memberCount}>
					{members.length} / {family.maxMembers} members
				</Text>

				{/* Members */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Members</Text>
					{members.map((item) => (
						<MemberCard
							key={item.member.id}
							data={item}
							isOwner={isOwner}
							isSelf={item.member.userId === userId}
							onRemove={() =>
								handleRemoveMember(item.member.userId, item.member.profileName)
							}
						/>
					))}
				</View>

				{/* Invite section */}
				{isOwner && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Invite</Text>
						{inviteCode ? (
							<View style={styles.inviteCard}>
								<Text style={styles.inviteLabel}>Active Code</Text>
								<Text style={styles.inviteCode}>{inviteCode}</Text>
								<TouchableOpacity style={styles.shareBtn} onPress={handleShareInvite}>
									<Ionicons name="share-outline" size={18} color={PURPLE} />
									<Text style={styles.shareBtnText}>Share</Text>
								</TouchableOpacity>
							</View>
						) : (
							<TouchableOpacity style={styles.createInviteBtn} onPress={handleCreateInvite}>
								<Ionicons name="add-circle-outline" size={20} color={GREEN} />
								<Text style={styles.createInviteBtnText}>Generate Invite Code</Text>
							</TouchableOpacity>
						)}
					</View>
				)}

				{/* Challenges */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Challenges</Text>
						<TouchableOpacity onPress={() => router.push("/create-challenge")}>
							<Ionicons name="add-circle-outline" size={22} color={GREEN} />
						</TouchableOpacity>
					</View>

					{challenges.length === 0 ? (
						<View style={styles.emptyCard}>
							<Text style={styles.emptyCardText}>No active challenges</Text>
							<Text style={styles.emptyCardSub}>
								Start a challenge to motivate your family!
							</Text>
						</View>
					) : (
						challenges.map((challenge) => (
							<ChallengeCard
								key={challenge.id}
								challenge={challenge}
								members={members}
							/>
						))
					)}
				</View>

				<View style={{ height: 40 }} />
			</ScrollView>
		</SafeAreaView>
	);
}

// ── Member Card ──────────────────────────────────────

function MemberCard({
	data,
	isOwner,
	isSelf,
	onRemove,
}: {
	data: FamilyMemberDashboard;
	isOwner: boolean;
	isSelf: boolean;
	onRemove: () => void;
}) {
	const { member, streak, level, levelTitle, questsCompletedToday, questsTotal } = data;

	return (
		<View style={styles.memberCard}>
			<View style={styles.memberTop}>
				<View style={[styles.memberAvatar, { backgroundColor: member.profileColor + "30" }]}>
					<Text style={styles.memberEmoji}>{member.profileEmoji}</Text>
				</View>
				<View style={styles.memberInfo}>
					<View style={styles.memberNameRow}>
						<Text style={styles.memberName}>
							{member.profileName}
							{isSelf ? " (You)" : ""}
						</Text>
						{member.role === "owner" && (
							<View style={styles.roleBadge}>
								<Text style={styles.roleBadgeText}>Owner</Text>
							</View>
						)}
					</View>
					<Text style={styles.memberSub}>
						{levelTitle !== "Hidden" ? `Lv.${level} ${levelTitle}` : "Level hidden"}
					</Text>
				</View>
				{isOwner && !isSelf && (
					<TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
						<Ionicons name="close-circle" size={20} color="#FF6B6B" />
					</TouchableOpacity>
				)}
			</View>

			<View style={styles.memberStats}>
				{streak >= 0 && (
					<View style={styles.stat}>
						<Text style={styles.statValue}>{streak}</Text>
						<Text style={styles.statLabel}>Streak</Text>
					</View>
				)}
				{level >= 0 && (
					<View style={styles.stat}>
						<Text style={styles.statValue}>{level}</Text>
						<Text style={styles.statLabel}>Level</Text>
					</View>
				)}
				{questsCompletedToday >= 0 && (
					<View style={styles.stat}>
						<Text style={styles.statValue}>
							{questsCompletedToday}/{questsTotal}
						</Text>
						<Text style={styles.statLabel}>Quests</Text>
					</View>
				)}
			</View>
		</View>
	);
}

// ── Challenge Card ───────────────────────────────────

function ChallengeCard({
	challenge,
	members,
}: {
	challenge: FamilyChallenge;
	members: FamilyMemberDashboard[];
}) {
	const daysLeft = Math.max(
		0,
		Math.ceil(
			(new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
		)
	);

	return (
		<View style={styles.challengeCard}>
			<View style={styles.challengeHeader}>
				<Text style={styles.challengeName}>{challenge.name}</Text>
				<Text style={styles.challengeDays}>
					{daysLeft}d left
				</Text>
			</View>
			{challenge.description && (
				<Text style={styles.challengeDesc}>{challenge.description}</Text>
			)}

			<View style={styles.challengeProgress}>
				{challenge.participants.map((uid) => {
					const member = members.find((m) => m.member.userId === uid);
					const progress = challenge.progress[uid] ?? 0;
					const pct = Math.min(progress / challenge.targetValue, 1);

					return (
						<View key={uid} style={styles.challengeRow}>
							<Text style={styles.challengeParticipant}>
								{member?.member.profileEmoji ?? "?"}{" "}
								{member?.member.profileName ?? "Unknown"}
							</Text>
							<View style={styles.challengeBar}>
								<View
									style={[
										styles.challengeBarFill,
										{ width: `${pct * 100}%` },
									]}
								/>
							</View>
							<Text style={styles.challengeValue}>
								{progress}/{challenge.targetValue}
							</Text>
						</View>
					);
				})}
			</View>
		</View>
	);
}

// ── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: BG },
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
	content: { paddingHorizontal: 20, paddingBottom: 40 },

	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: 8,
		paddingBottom: 16,
	},
	backBtn: { width: 40, height: 40, justifyContent: "center" },
	headerTitle: { fontSize: 20, fontWeight: "700", color: TEXT_COLOR },

	memberCount: { fontSize: 14, color: TEXT_DIM, marginBottom: 16, textAlign: "center" },

	section: { marginBottom: 24 },
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	sectionTitle: { fontSize: 17, fontWeight: "700", color: TEXT_COLOR, marginBottom: 12 },

	// Member card
	memberCard: {
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 16,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: BORDER,
	},
	memberTop: { flexDirection: "row", alignItems: "center" },
	memberAvatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
	},
	memberEmoji: { fontSize: 22 },
	memberInfo: { flex: 1, marginLeft: 12 },
	memberNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	memberName: { fontSize: 16, fontWeight: "600", color: TEXT_COLOR },
	memberSub: { fontSize: 13, color: TEXT_DIM, marginTop: 2 },
	roleBadge: {
		backgroundColor: PURPLE + "30",
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 8,
	},
	roleBadgeText: { fontSize: 11, color: PURPLE, fontWeight: "600" },
	removeBtn: { padding: 4 },

	memberStats: {
		flexDirection: "row",
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: BORDER,
		gap: 24,
	},
	stat: { alignItems: "center" },
	statValue: { fontSize: 18, fontWeight: "700", color: GREEN },
	statLabel: { fontSize: 11, color: TEXT_DIM, marginTop: 2 },

	// Invite
	inviteCard: {
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 20,
		alignItems: "center",
		borderWidth: 1,
		borderColor: BORDER,
	},
	inviteLabel: { fontSize: 13, color: TEXT_DIM, marginBottom: 8 },
	inviteCode: {
		fontSize: 32,
		fontWeight: "800",
		color: GOLD,
		letterSpacing: 6,
		marginBottom: 16,
	},
	shareBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 12,
		backgroundColor: PURPLE + "20",
	},
	shareBtnText: { fontSize: 14, fontWeight: "600", color: PURPLE },

	createInviteBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: BORDER,
		justifyContent: "center",
	},
	createInviteBtnText: { fontSize: 15, fontWeight: "600", color: GREEN },

	// Challenge card
	challengeCard: {
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 16,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: BORDER,
	},
	challengeHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	challengeName: { fontSize: 16, fontWeight: "600", color: TEXT_COLOR, flex: 1 },
	challengeDays: { fontSize: 13, color: GOLD, fontWeight: "600" },
	challengeDesc: { fontSize: 13, color: TEXT_DIM, marginBottom: 12 },

	challengeProgress: { gap: 8 },
	challengeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	challengeParticipant: { fontSize: 13, color: TEXT_COLOR, width: 100 },
	challengeBar: {
		flex: 1,
		height: 8,
		backgroundColor: SURFACE_LIGHT,
		borderRadius: 4,
		overflow: "hidden",
	},
	challengeBarFill: {
		height: "100%",
		backgroundColor: GREEN,
		borderRadius: 4,
	},
	challengeValue: { fontSize: 12, color: TEXT_DIM, width: 50, textAlign: "right" },

	// Empty states
	emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: 20 },
	emptyEmoji: { fontSize: 64, marginBottom: 16 },
	emptyTitle: { fontSize: 22, fontWeight: "700", color: TEXT_COLOR, marginBottom: 8 },
	emptyDesc: { fontSize: 15, color: TEXT_DIM, textAlign: "center", lineHeight: 22, marginBottom: 32 },

	primaryBtn: { width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 12 },
	btnGrad: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 16,
	},
	btnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },

	secondaryBtn: {
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: BORDER,
		width: "100%",
		alignItems: "center",
	},
	secondaryBtnText: { fontSize: 15, fontWeight: "600", color: TEXT_COLOR },

	emptyCard: {
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 20,
		alignItems: "center",
		borderWidth: 1,
		borderColor: BORDER,
	},
	emptyCardText: { fontSize: 15, fontWeight: "600", color: TEXT_DIM },
	emptyCardSub: { fontSize: 13, color: TEXT_DIM, marginTop: 4 },
});
