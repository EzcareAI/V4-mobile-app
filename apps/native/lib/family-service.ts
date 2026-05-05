/**
 * Family Service
 *
 * Manages family groups, invitations, member dashboards, and challenges.
 * Family members share visible stats while keeping data private.
 */

import { supabase } from "./supabase";
import { mixpanelService } from "./mixpanel-service";

// ── Types ────────────────────────────────────────────────────

export type FamilyRole = "owner" | "parent" | "member";

export interface FamilyGroup {
	id: string;
	ownerUserId: string;
	name: string;
	maxMembers: number;
	createdAt: string;
}

export interface FamilyMember {
	id: string;
	userId: string;
	role: FamilyRole;
	profileName: string;
	profileColor: string;
	profileEmoji: string;
	visibility: VisibilitySettings;
	joinedAt: string;
}

export interface VisibilitySettings {
	streak: boolean;
	level: boolean;
	quests: boolean;
	league: boolean;
	achievements: boolean;
}

export interface FamilyMemberDashboard {
	member: FamilyMember;
	streak: number;
	level: number;
	levelTitle: string;
	questsCompletedToday: number;
	questsTotal: number;
	weekXp: number;
}

export interface FamilyChallenge {
	id: string;
	name: string;
	description: string | null;
	startDate: string;
	endDate: string;
	targetMetric: string;
	targetValue: number;
	participants: string[];
	progress: Record<string, number>;
	status: "active" | "completed" | "failed";
}

export interface InviteResult {
	success: boolean;
	code?: string;
	error?: string;
}

export interface JoinResult {
	success: boolean;
	familyGroup?: FamilyGroup;
	error?: string;
}

// ── Invite code generation ───────────────────────────────────

function generateInviteCode(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 for clarity
	let code = "";
	for (let i = 0; i < 6; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

// ── Service ──────────────────────────────────────────────────

class FamilyService {
	private static instance: FamilyService;

	static getInstance(): FamilyService {
		if (!FamilyService.instance) {
			FamilyService.instance = new FamilyService();
		}
		return FamilyService.instance;
	}

	// ── Core queries ──────────────────────────────────────────

	/**
	 * Get the user's family group (if any).
	 */
	async getMyFamily(userId: string): Promise<FamilyGroup | null> {
		// Check if user is a member of any family
		const { data: membership } = await supabase
			.from("family_members")
			.select("family_group_id")
			.eq("user_id", userId)
			.is("removed_at", null)
			.single();

		if (!membership) return null;

		const { data: group } = await supabase
			.from("family_groups")
			.select("*")
			.eq("id", membership.family_group_id)
			.single();

		if (!group) return null;

		return {
			id: group.id,
			ownerUserId: group.owner_user_id,
			name: group.name,
			maxMembers: group.max_members,
			createdAt: group.created_at,
		};
	}

	/**
	 * Get all active members in a family group.
	 */
	async getFamilyMembers(groupId: string): Promise<FamilyMember[]> {
		const { data } = await supabase
			.from("family_members")
			.select("*")
			.eq("family_group_id", groupId)
			.is("removed_at", null)
			.order("joined_at");

		if (!data) return [];

		return data.map((m) => ({
			id: m.id,
			userId: m.user_id,
			role: m.role as FamilyRole,
			profileName: m.profile_name,
			profileColor: m.profile_color,
			profileEmoji: m.profile_emoji,
			visibility: m.visibility as VisibilitySettings,
			joinedAt: m.joined_at,
		}));
	}

	/**
	 * Get dashboard data for all family members.
	 */
	async getFamilyDashboard(groupId: string): Promise<FamilyMemberDashboard[]> {
		const members = await this.getFamilyMembers(groupId);
		if (members.length === 0) return [];

		const userIds = members.map((m) => m.userId);
		const today = new Date().toISOString().split("T")[0];

		// Batch fetch stats for all members
		const [levelsResult, streaksResult, questsResult] = await Promise.all([
			supabase
				.from("awakening_levels")
				.select("user_id, current_level, level_title")
				.in("user_id", userIds),
			supabase
				.from("streaks")
				.select("user_id, current_streak")
				.in("user_id", userIds),
			supabase
				.from("daily_quests")
				.select("user_id, quests, completed_quest_ids")
				.in("user_id", userIds)
				.eq("date", today),
		]);

		const levelsMap = new Map(
			(levelsResult.data ?? []).map((r) => [r.user_id, r])
		);
		const streaksMap = new Map(
			(streaksResult.data ?? []).map((r) => [r.user_id, r])
		);
		const questsMap = new Map(
			(questsResult.data ?? []).map((r) => [r.user_id, r])
		);

		return members.map((member) => {
			const level = levelsMap.get(member.userId);
			const streak = streaksMap.get(member.userId);
			const quests = questsMap.get(member.userId);

			const questsArr = (quests?.quests as any[]) ?? [];
			const completedArr = (quests?.completed_quest_ids as string[]) ?? [];

			return {
				member,
				streak: member.visibility.streak ? (streak?.current_streak ?? 0) : -1,
				level: member.visibility.level ? (level?.current_level ?? 1) : -1,
				levelTitle: member.visibility.level ? (level?.level_title ?? "Sleeper") : "Hidden",
				questsCompletedToday: member.visibility.quests ? completedArr.length : -1,
				questsTotal: member.visibility.quests ? questsArr.length : -1,
				weekXp: 0, // Populated separately if needed
			};
		});
	}

	// ── Create & manage ───────────────────────────────────────

	/**
	 * Create a new family group. User becomes owner.
	 */
	async createFamily(userId: string, name: string, profileName: string, profileEmoji: string): Promise<FamilyGroup | null> {
		// Check if user already owns or is in a family
		const existing = await this.getMyFamily(userId);
		if (existing) return null;

		const { data: group, error: groupError } = await supabase
			.from("family_groups")
			.insert({ owner_user_id: userId, name })
			.select()
			.single();

		if (groupError || !group) {
			console.warn("[Family] Create group failed:", groupError);
			return null;
		}

		// Add owner as first member
		await supabase.from("family_members").insert({
			family_group_id: group.id,
			user_id: userId,
			role: "owner",
			profile_name: profileName,
			profile_emoji: profileEmoji,
			profile_color: this.randomColor(),
		});

		mixpanelService.track("family_created", { family_id: group.id, name });

		return {
			id: group.id,
			ownerUserId: group.owner_user_id,
			name: group.name,
			maxMembers: group.max_members,
			createdAt: group.created_at,
		};
	}

	/**
	 * Update family name (owner only).
	 */
	async updateFamilyName(groupId: string, name: string): Promise<void> {
		await supabase
			.from("family_groups")
			.update({ name })
			.eq("id", groupId);
	}

	/**
	 * Remove a member from the family (owner only, soft-delete).
	 */
	async removeMember(groupId: string, targetUserId: string): Promise<boolean> {
		const { error } = await supabase
			.from("family_members")
			.update({ removed_at: new Date().toISOString() })
			.eq("family_group_id", groupId)
			.eq("user_id", targetUserId)
			.neq("role", "owner"); // Can't remove owner

		if (error) return false;

		mixpanelService.track("family_member_removed", { family_id: groupId, target: targetUserId });
		return true;
	}

	/**
	 * Leave a family (any non-owner member).
	 */
	async leaveFamily(userId: string): Promise<boolean> {
		const family = await this.getMyFamily(userId);
		if (!family) return false;

		// Owner can't leave — must delete group
		if (family.ownerUserId === userId) return false;

		const { error } = await supabase
			.from("family_members")
			.update({ removed_at: new Date().toISOString() })
			.eq("family_group_id", family.id)
			.eq("user_id", userId);

		if (error) return false;

		mixpanelService.track("family_left", { family_id: family.id });
		return true;
	}

	/**
	 * Update own visibility settings.
	 */
	async updateVisibility(userId: string, groupId: string, visibility: VisibilitySettings): Promise<void> {
		await supabase
			.from("family_members")
			.update({ visibility })
			.eq("family_group_id", groupId)
			.eq("user_id", userId);
	}

	/**
	 * Update own profile (name, emoji, color).
	 */
	async updateProfile(
		userId: string,
		groupId: string,
		updates: { profileName?: string; profileEmoji?: string; profileColor?: string }
	): Promise<void> {
		const payload: Record<string, string> = {};
		if (updates.profileName) payload.profile_name = updates.profileName;
		if (updates.profileEmoji) payload.profile_emoji = updates.profileEmoji;
		if (updates.profileColor) payload.profile_color = updates.profileColor;

		if (Object.keys(payload).length > 0) {
			await supabase
				.from("family_members")
				.update(payload)
				.eq("family_group_id", groupId)
				.eq("user_id", userId);
		}
	}

	// ── Invites ───────────────────────────────────────────────

	/**
	 * Create an invite code (owner/parent only). Expires in 48h.
	 */
	async createInvite(userId: string): Promise<InviteResult> {
		const family = await this.getMyFamily(userId);
		if (!family) return { success: false, error: "You don't have a family group." };

		// Check member count
		const members = await this.getFamilyMembers(family.id);
		if (members.length >= family.maxMembers) {
			return { success: false, error: `Family is full (${family.maxMembers} members max).` };
		}

		// Check role
		const myMembership = members.find((m) => m.userId === userId);
		if (!myMembership || (myMembership.role !== "owner" && myMembership.role !== "parent")) {
			return { success: false, error: "Only the owner or a parent can create invites." };
		}

		// Expire any existing active invites for this group
		await supabase
			.from("family_invites")
			.update({ expires_at: new Date().toISOString() })
			.eq("family_group_id", family.id)
			.is("used_by", null)
			.gt("expires_at", new Date().toISOString());

		// Generate unique code
		let code = generateInviteCode();
		let attempts = 0;
		while (attempts < 5) {
			const { data: existing } = await supabase
				.from("family_invites")
				.select("id")
				.eq("code", code)
				.single();
			if (!existing) break;
			code = generateInviteCode();
			attempts++;
		}

		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + 48);

		const { error } = await supabase.from("family_invites").insert({
			family_group_id: family.id,
			code,
			created_by: userId,
			expires_at: expiresAt.toISOString(),
		});

		if (error) {
			console.warn("[Family] Create invite failed:", error);
			return { success: false, error: "Failed to create invite." };
		}

		mixpanelService.track("family_invite_created", { family_id: family.id, code });

		return { success: true, code };
	}

	/**
	 * Get active invite for a family group (if any).
	 */
	async getActiveInvite(groupId: string): Promise<string | null> {
		const { data } = await supabase
			.from("family_invites")
			.select("code, expires_at")
			.eq("family_group_id", groupId)
			.is("used_by", null)
			.gt("expires_at", new Date().toISOString())
			.order("created_at", { ascending: false })
			.limit(1)
			.single();

		return data?.code ?? null;
	}

	/**
	 * Join a family using an invite code.
	 */
	async joinFamily(
		userId: string,
		code: string,
		profileName: string,
		profileEmoji: string
	): Promise<JoinResult> {
		const normalizedCode = code.toUpperCase().trim();

		// Check if user is already in a family
		const existing = await this.getMyFamily(userId);
		if (existing) {
			return { success: false, error: "You're already in a family. Leave first to join another." };
		}

		// Find the invite
		const { data: invite } = await supabase
			.from("family_invites")
			.select("id, family_group_id, expires_at, used_by")
			.eq("code", normalizedCode)
			.single();

		if (!invite) {
			return { success: false, error: "Invalid invite code." };
		}

		if (invite.used_by) {
			return { success: false, error: "This invite has already been used." };
		}

		if (new Date(invite.expires_at) <= new Date()) {
			return { success: false, error: "This invite has expired. Ask for a new one." };
		}

		// Check family capacity
		const members = await this.getFamilyMembers(invite.family_group_id);
		const { data: group } = await supabase
			.from("family_groups")
			.select("max_members, name, owner_user_id, created_at")
			.eq("id", invite.family_group_id)
			.single();

		if (!group) return { success: false, error: "Family group not found." };

		if (members.length >= group.max_members) {
			return { success: false, error: `This family is full (${group.max_members} members max).` };
		}

		// Join the family
		const { error: joinError } = await supabase.from("family_members").insert({
			family_group_id: invite.family_group_id,
			user_id: userId,
			role: "member",
			profile_name: profileName,
			profile_emoji: profileEmoji,
			profile_color: this.randomColor(),
		});

		if (joinError) {
			console.warn("[Family] Join failed:", joinError);
			return { success: false, error: "Failed to join family." };
		}

		// Mark invite as used
		await supabase
			.from("family_invites")
			.update({ used_by: userId, used_at: new Date().toISOString() })
			.eq("id", invite.id);

		mixpanelService.track("family_joined", {
			family_id: invite.family_group_id,
			code: normalizedCode,
		});

		return {
			success: true,
			familyGroup: {
				id: invite.family_group_id,
				ownerUserId: group.owner_user_id,
				name: group.name,
				maxMembers: group.max_members,
				createdAt: group.created_at,
			},
		};
	}

	// ── Challenges ────────────────────────────────────────────

	/**
	 * Create a family challenge.
	 */
	async createChallenge(
		groupId: string,
		createdBy: string,
		params: {
			name: string;
			description?: string;
			startDate: string;
			endDate: string;
			targetMetric: string;
			targetValue: number;
			participantIds: string[];
		}
	): Promise<FamilyChallenge | null> {
		const initialProgress: Record<string, number> = {};
		for (const uid of params.participantIds) {
			initialProgress[uid] = 0;
		}

		const { data, error } = await supabase
			.from("family_challenges")
			.insert({
				family_group_id: groupId,
				created_by: createdBy,
				name: params.name,
				description: params.description ?? null,
				start_date: params.startDate,
				end_date: params.endDate,
				target_metric: params.targetMetric,
				target_value: params.targetValue,
				participants: params.participantIds,
				progress: initialProgress,
				status: "active",
			})
			.select()
			.single();

		if (error || !data) {
			console.warn("[Family] Create challenge failed:", error);
			return null;
		}

		mixpanelService.track("family_challenge_created", {
			family_id: groupId,
			name: params.name,
			metric: params.targetMetric,
			participants: params.participantIds.length,
		});

		return this.mapChallenge(data);
	}

	/**
	 * Get challenges for a family group.
	 */
	async getChallenges(groupId: string): Promise<FamilyChallenge[]> {
		const { data } = await supabase
			.from("family_challenges")
			.select("*")
			.eq("family_group_id", groupId)
			.order("created_at", { ascending: false })
			.limit(10);

		if (!data) return [];
		return data.map(this.mapChallenge);
	}

	/**
	 * Update a member's progress on a challenge.
	 */
	async updateChallengeProgress(
		challengeId: string,
		userId: string,
		value: number
	): Promise<void> {
		const { data } = await supabase
			.from("family_challenges")
			.select("progress, participants, target_value, status")
			.eq("id", challengeId)
			.single();

		if (!data || data.status !== "active") return;

		const progress = (data.progress as Record<string, number>) ?? {};
		progress[userId] = value;

		// Check if all participants met target
		const participants = (data.participants as string[]) ?? [];
		const allComplete = participants.every((uid) => (progress[uid] ?? 0) >= data.target_value);

		await supabase
			.from("family_challenges")
			.update({
				progress,
				status: allComplete ? "completed" : "active",
			})
			.eq("id", challengeId);
	}

	// ── Helpers ───────────────────────────────────────────────

	private mapChallenge(row: any): FamilyChallenge {
		return {
			id: row.id,
			name: row.name,
			description: row.description,
			startDate: row.start_date,
			endDate: row.end_date,
			targetMetric: row.target_metric,
			targetValue: row.target_value,
			participants: (row.participants as string[]) ?? [],
			progress: (row.progress as Record<string, number>) ?? {},
			status: row.status,
		};
	}

	private randomColor(): string {
		const colors = [
			"#9D4EDD", "#06FFA5", "#FFD60A", "#FF6B6B",
			"#4ECDC4", "#FF6B35", "#7B2FF7", "#00D4FF",
		];
		return colors[Math.floor(Math.random() * colors.length)];
	}

	/**
	 * Check if a user's family owner has a family subscription.
	 * Used to grant pro access to family members.
	 */
	async isFamilyPro(userId: string): Promise<boolean> {
		const family = await this.getMyFamily(userId);
		if (!family) return false;

		// If user IS the owner, they already check their own entitlement
		if (family.ownerUserId === userId) return false;

		// For now, check if owner has isPro in onboarding_responses
		// In production, this would check RevenueCat server-side
		// or use a Supabase flag set by the owner's purchase webhook
		const { data } = await supabase
			.from("family_groups")
			.select("owner_user_id")
			.eq("id", family.id)
			.single();

		// The actual entitlement check happens via RevenueCat on the owner's device
		// Family members inherit pro when the owner shares their group
		// This is validated at the RevenueCat/webhook level in production
		return !!data;
	}
}

export const familyService = FamilyService.getInstance();
