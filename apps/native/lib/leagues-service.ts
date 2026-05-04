/**
 * Leagues Service
 *
 * Weekly competitive leagues (Bronze -> Legendary) with 30-user groups.
 * Promotion for top performers, relegation for bottom.
 * XP resets every Monday 00:00 UTC.
 */

import { supabase } from "./supabase";
import { mixpanelService } from "./mixpanel-service";

// -- League definitions (static -- no DB table needed) --------
export type LeagueName =
	| "bronze"
	| "silver"
	| "gold"
	| "sapphire"
	| "ruby"
	| "diamond"
	| "legendary";

export interface LeagueDef {
	name: LeagueName;
	label: string;
	color: string;
	gradient: [string, string];
	icon: string;
	promotionTop: number;
	relegationBottom: number;
}

const LEAGUES: LeagueDef[] = [
	{ name: "bronze", label: "Bronze", color: "#CD7F32", gradient: ["#CD7F32", "#8B5A2B"], icon: "shield", promotionTop: 5, relegationBottom: 0 },
	{ name: "silver", label: "Silver", color: "#C0C0C0", gradient: ["#C0C0C0", "#808080"], icon: "shield", promotionTop: 5, relegationBottom: 3 },
	{ name: "gold", label: "Gold", color: "#FFD60A", gradient: ["#FFD60A", "#F5A623"], icon: "award", promotionTop: 5, relegationBottom: 5 },
	{ name: "sapphire", label: "Sapphire", color: "#0F52BA", gradient: ["#0F52BA", "#1E3A8A"], icon: "gem", promotionTop: 5, relegationBottom: 5 },
	{ name: "ruby", label: "Ruby", color: "#E0115F", gradient: ["#E0115F", "#9B1B30"], icon: "flame", promotionTop: 3, relegationBottom: 5 },
	{ name: "diamond", label: "Diamond", color: "#B9F2FF", gradient: ["#B9F2FF", "#7DD3FC"], icon: "diamond", promotionTop: 3, relegationBottom: 5 },
	{ name: "legendary", label: "Legendary", color: "#9D4EDD", gradient: ["#9D4EDD", "#7B2FF7"], icon: "crown", promotionTop: 0, relegationBottom: 5 },
];

const LEAGUE_MAP = new Map(LEAGUES.map((l) => [l.name, l]));
const GROUP_SIZE = 30;

export function getLeagueDef(name: LeagueName): LeagueDef {
	return LEAGUE_MAP.get(name) ?? LEAGUES[0];
}

export function getLeagueIndex(name: LeagueName): number {
	return LEAGUES.findIndex((l) => l.name === name);
}

export function getAllLeagues(): LeagueDef[] {
	return LEAGUES;
}

// -- Types ----------------------------------------------------
export interface LeagueInfo {
	currentLeague: LeagueDef;
	weekXp: number;
	rank: number | null;
	groupSize: number;
	weekStart: string;
	weekEndsAt: Date;
	inPromotionZone: boolean;
	inRelegationZone: boolean;
}

export interface LeaderboardEntry {
	userId: string;
	weekXp: number;
	rank: number;
	isCurrentUser: boolean;
	inPromotionZone: boolean;
	inRelegationZone: boolean;
}

export interface LeagueWeekResult {
	leagueName: LeagueName;
	rank: number;
	promoted: boolean;
	relegated: boolean;
	weekXp: number;
}

// -- Service --------------------------------------------------
class LeaguesService {
	private static instance: LeaguesService;

	static getInstance(): LeaguesService {
		if (!LeaguesService.instance) {
			LeaguesService.instance = new LeaguesService();
		}
		return LeaguesService.instance;
	}

	// -- Helpers ------------------------------------------------

	/** Monday 00:00 UTC of the current week */
	private getCurrentWeekStart(): string {
		const now = new Date();
		const day = now.getUTCDay(); // 0=Sun, 1=Mon
		const diff = day === 0 ? 6 : day - 1;
		const monday = new Date(
			Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff)
		);
		return monday.toISOString().split("T")[0];
	}

	/** Next Sunday 23:59 UTC */
	private getWeekEnd(): Date {
		const weekStart = this.getCurrentWeekStart();
		const d = new Date(weekStart + "T00:00:00Z");
		d.setUTCDate(d.getUTCDate() + 6);
		d.setUTCHours(23, 59, 59, 999);
		return d;
	}

	// -- Ensure rows --------------------------------------------

	private async ensureUserLeague(userId: string): Promise<LeagueName> {
		const { data } = await supabase
			.from("user_leagues")
			.select("current_league")
			.eq("user_id", userId)
			.single();

		if (data) return data.current_league as LeagueName;

		await supabase
			.from("user_leagues")
			.insert({ user_id: userId, current_league: "bronze" });
		return "bronze";
	}

	/**
	 * Ensure the user has a league_week_entries row for the current week.
	 * If not, create one and assign to a group.
	 */
	private async ensureWeekEntry(
		userId: string
	): Promise<{ groupId: string; weekStart: string }> {
		const weekStart = this.getCurrentWeekStart();

		const { data: existing } = await supabase
			.from("league_week_entries")
			.select("group_id, week_start")
			.eq("user_id", userId)
			.eq("week_start", weekStart)
			.single();

		if (existing) return { groupId: existing.group_id, weekStart };

		const league = await this.ensureUserLeague(userId);
		const groupId = await this.findOrCreateGroup(league, weekStart);

		await supabase.from("league_week_entries").insert({
			user_id: userId,
			group_id: groupId,
			week_start: weekStart,
			league_name: league,
			week_xp: 0,
		});

		mixpanelService.track("league_week_joined", {
			league,
			group_id: groupId,
			week_start: weekStart,
		});

		return { groupId, weekStart };
	}

	/**
	 * Find an existing group with fewer than GROUP_SIZE members,
	 * or create a new one.
	 */
	private async findOrCreateGroup(
		league: LeagueName,
		weekStart: string
	): Promise<string> {
		const { data: groups } = await supabase
			.from("league_week_entries")
			.select("group_id")
			.eq("league_name", league)
			.eq("week_start", weekStart)
			.eq("finalized", false);

		if (groups && groups.length > 0) {
			const counts = new Map<string, number>();
			for (const g of groups) {
				counts.set(g.group_id, (counts.get(g.group_id) ?? 0) + 1);
			}
			for (const [gid, count] of counts) {
				if (count < GROUP_SIZE) return gid;
			}
		}

		// No open group -- generate new group_id
		// Use a simple UUID approach (crypto.randomUUID may not be available on Hermes)
		const { data: uuidRow } = await supabase.rpc("gen_random_uuid");
		if (uuidRow) return uuidRow as string;

		// Fallback: manual UUID-like string
		const s4 = () =>
			Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
		return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
	}

	// -- Public API ---------------------------------------------

	/**
	 * Get user's current league info for the dashboard.
	 */
	async getLeagueInfo(userId: string): Promise<LeagueInfo> {
		const { groupId, weekStart } = await this.ensureWeekEntry(userId);
		const league = await this.ensureUserLeague(userId);
		const leagueDef = getLeagueDef(league);

		const { data: entry } = await supabase
			.from("league_week_entries")
			.select("week_xp")
			.eq("user_id", userId)
			.eq("week_start", weekStart)
			.single();

		const weekXp = entry?.week_xp ?? 0;

		const { data: groupMembers } = await supabase
			.from("league_week_entries")
			.select("user_id, week_xp")
			.eq("group_id", groupId)
			.eq("week_start", weekStart)
			.order("week_xp", { ascending: false });

		const members = groupMembers ?? [];
		const rank = members.findIndex((m) => m.user_id === userId) + 1;
		const groupSize = members.length;

		return {
			currentLeague: leagueDef,
			weekXp,
			rank: rank || null,
			groupSize,
			weekStart,
			weekEndsAt: this.getWeekEnd(),
			inPromotionZone:
				leagueDef.promotionTop > 0 && rank > 0 && rank <= leagueDef.promotionTop,
			inRelegationZone:
				leagueDef.relegationBottom > 0 &&
				rank > 0 &&
				rank > groupSize - leagueDef.relegationBottom,
		};
	}

	/**
	 * Get the full leaderboard for the user's group.
	 */
	async getLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
		const { groupId, weekStart } = await this.ensureWeekEntry(userId);
		const league = await this.ensureUserLeague(userId);
		const leagueDef = getLeagueDef(league);

		const { data } = await supabase
			.from("league_week_entries")
			.select("user_id, week_xp, promoted, relegated")
			.eq("group_id", groupId)
			.eq("week_start", weekStart)
			.order("week_xp", { ascending: false });

		if (!data) return [];

		const total = data.length;
		return data.map((entry, idx) => ({
			userId: entry.user_id,
			weekXp: entry.week_xp,
			rank: idx + 1,
			isCurrentUser: entry.user_id === userId,
			inPromotionZone:
				leagueDef.promotionTop > 0 && idx + 1 <= leagueDef.promotionTop,
			inRelegationZone:
				leagueDef.relegationBottom > 0 &&
				idx + 1 > total - leagueDef.relegationBottom,
		}));
	}

	/**
	 * Add XP to the user's weekly league tally.
	 * Called from levelsService.addXp() whenever XP is awarded.
	 */
	async addWeeklyXp(userId: string, amount: number): Promise<void> {
		const weekStart = this.getCurrentWeekStart();

		await this.ensureWeekEntry(userId);

		const { data: current } = await supabase
			.from("league_week_entries")
			.select("week_xp")
			.eq("user_id", userId)
			.eq("week_start", weekStart)
			.single();

		if (current) {
			await supabase
				.from("league_week_entries")
				.update({ week_xp: current.week_xp + amount })
				.eq("user_id", userId)
				.eq("week_start", weekStart);
		}
	}

	/**
	 * Get last week's results (for post-week celebration).
	 */
	async getLastWeekResult(userId: string): Promise<LeagueWeekResult | null> {
		const currentWeekStart = this.getCurrentWeekStart();
		const lastWeekStart = new Date(currentWeekStart + "T00:00:00Z");
		lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);
		const lastWeekStr = lastWeekStart.toISOString().split("T")[0];

		const { data } = await supabase
			.from("league_week_entries")
			.select("league_name, final_rank, promoted, relegated, week_xp")
			.eq("user_id", userId)
			.eq("week_start", lastWeekStr)
			.eq("finalized", true)
			.single();

		if (!data) return null;

		return {
			leagueName: data.league_name as LeagueName,
			rank: data.final_rank,
			promoted: data.promoted,
			relegated: data.relegated,
			weekXp: data.week_xp,
		};
	}

	/**
	 * Countdown string for UI.
	 */
	getTimeUntilReset(): string {
		const end = this.getWeekEnd();
		const now = new Date();
		const diff = end.getTime() - now.getTime();
		if (diff <= 0) return "Finalizing...";

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor(
			(diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
		);

		if (days > 0) return `${days}d ${hours}h left`;
		if (hours > 0) return `${hours}h left`;
		return "< 1h left";
	}
}

export const leaguesService = LeaguesService.getInstance();
