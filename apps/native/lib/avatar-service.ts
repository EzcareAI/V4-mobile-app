/**
 * Avatar Evolution Service
 *
 * Manages the user's avatar visual state across 10 stages.
 * Tied to Awakening Levels — higher level = more evolved avatar.
 * Persisted in Supabase `avatar_evolution` table.
 */

import { supabase } from "./supabase";
import { mixpanelService } from "./mixpanel-service";

// -- Avatar stage definitions (10 stages) ---------------------

export type AvatarPose = "curled" | "sitting" | "standing" | "expansive" | "transcendent";

export interface AvatarStageConfig {
	stage: number;
	minLevel: number;
	maxLevel: number;
	label: string;
	pose: AvatarPose;
	glowIntensity: number;     // 0-1
	auraVisible: boolean;
	particleDensity: number;   // 0-1
	description: string;
	// Visual properties for rendering
	baseScale: number;
	auraRadius: number;
	particleLayers: number;
	crownVisible: boolean;
}

const AVATAR_STAGES: AvatarStageConfig[] = [
	{
		stage: 1, minLevel: 1, maxLevel: 3,
		label: "Dormant", pose: "curled",
		glowIntensity: 0.05, auraVisible: false, particleDensity: 0.0,
		description: "A faint spark, waiting to be awakened.",
		baseScale: 0.7, auraRadius: 0, particleLayers: 0, crownVisible: false,
	},
	{
		stage: 2, minLevel: 4, maxLevel: 6,
		label: "Stirring", pose: "curled",
		glowIntensity: 0.15, auraVisible: false, particleDensity: 0.0,
		description: "The light begins to flicker. Something stirs within.",
		baseScale: 0.75, auraRadius: 0, particleLayers: 0, crownVisible: false,
	},
	{
		stage: 3, minLevel: 7, maxLevel: 10,
		label: "Emerging", pose: "sitting",
		glowIntensity: 0.3, auraVisible: true, particleDensity: 0.1,
		description: "Rising from rest. A soft aura takes shape.",
		baseScale: 0.8, auraRadius: 40, particleLayers: 0, crownVisible: false,
	},
	{
		stage: 4, minLevel: 11, maxLevel: 14,
		label: "Forming", pose: "standing",
		glowIntensity: 0.4, auraVisible: true, particleDensity: 0.15,
		description: "Standing tall. Your unique color signature emerges.",
		baseScale: 0.85, auraRadius: 55, particleLayers: 1, crownVisible: false,
	},
	{
		stage: 5, minLevel: 15, maxLevel: 18,
		label: "Charged", pose: "standing",
		glowIntensity: 0.55, auraVisible: true, particleDensity: 0.3,
		description: "Energy particles orbit around you. Power builds.",
		baseScale: 0.9, auraRadius: 70, particleLayers: 1, crownVisible: false,
	},
	{
		stage: 6, minLevel: 19, maxLevel: 22,
		label: "Radiant", pose: "expansive",
		glowIntensity: 0.7, auraVisible: true, particleDensity: 0.45,
		description: "Brilliant glow. Your presence commands attention.",
		baseScale: 0.95, auraRadius: 85, particleLayers: 2, crownVisible: false,
	},
	{
		stage: 7, minLevel: 23, maxLevel: 26,
		label: "Blazing", pose: "expansive",
		glowIntensity: 0.8, auraVisible: true, particleDensity: 0.6,
		description: "Multiple energy layers pulse outward. An energy field forms.",
		baseScale: 1.0, auraRadius: 100, particleLayers: 2, crownVisible: false,
	},
	{
		stage: 8, minLevel: 27, maxLevel: 30,
		label: "Transcendent", pose: "transcendent",
		glowIntensity: 0.9, auraVisible: true, particleDensity: 0.75,
		description: "Radiant energy flows endlessly. You've transcended the ordinary.",
		baseScale: 1.0, auraRadius: 115, particleLayers: 3, crownVisible: false,
	},
	{
		stage: 9, minLevel: 31, maxLevel: 40,
		label: "Crowned", pose: "transcendent",
		glowIntensity: 0.95, auraVisible: true, particleDensity: 0.85,
		description: "A crown of light forms. The aura extends beyond your form.",
		baseScale: 1.05, auraRadius: 130, particleLayers: 3, crownVisible: true,
	},
	{
		stage: 10, minLevel: 41, maxLevel: 50,
		label: "Sovereign", pose: "transcendent",
		glowIntensity: 1.0, auraVisible: true, particleDensity: 1.0,
		description: "The final form. A unique signature that is yours alone.",
		baseScale: 1.1, auraRadius: 150, particleLayers: 4, crownVisible: true,
	},
];

export function getStageForLevel(level: number): AvatarStageConfig {
	for (const stage of AVATAR_STAGES) {
		if (level >= stage.minLevel && level <= stage.maxLevel) return stage;
	}
	return AVATAR_STAGES[AVATAR_STAGES.length - 1];
}

export function getAllStages(): AvatarStageConfig[] {
	return AVATAR_STAGES;
}

// -- User avatar state ----------------------------------------

export interface AvatarState {
	stage: AvatarStageConfig;
	colorSignature: string;
	glowIntensity: number;
	auraVisible: boolean;
	particleDensity: number;
	pose: AvatarPose;
}

export interface AvatarEvolutionResult {
	oldStage: number;
	newStage: number;
	evolved: boolean;
	avatarState: AvatarState;
}

// -- Color signature generation --------------------------------

/** Generate a unique color based on userId (deterministic) */
function generateColorSignature(userId: string): string {
	let hash = 0;
	for (let i = 0; i < userId.length; i++) {
		const char = userId.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}

	// Map to a pleasing hue range (avoid muddy colors)
	const hue = Math.abs(hash % 360);
	const saturation = 70 + Math.abs((hash >> 8) % 20); // 70-90%
	const lightness = 55 + Math.abs((hash >> 16) % 15);  // 55-70%

	return hslToHex(hue, saturation, lightness);
}

function hslToHex(h: number, s: number, l: number): string {
	s /= 100;
	l /= 100;
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, "0");
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

// -- Service --------------------------------------------------

class AvatarService {
	private static instance: AvatarService;

	static getInstance(): AvatarService {
		if (!AvatarService.instance) {
			AvatarService.instance = new AvatarService();
		}
		return AvatarService.instance;
	}

	private async ensureRow(userId: string): Promise<void> {
		const { data } = await supabase
			.from("avatar_evolution")
			.select("id")
			.eq("user_id", userId)
			.single();

		if (!data) {
			const color = generateColorSignature(userId);
			await supabase.from("avatar_evolution").insert({
				user_id: userId,
				current_stage: 1,
				glow_intensity: 0.05,
				color_signature: color,
				aura_visible: false,
				particle_density: 0.0,
				pose: "curled",
			});
		}
	}

	/**
	 * Get the user's current avatar visual config.
	 */
	async getAvatarState(userId: string): Promise<AvatarState> {
		await this.ensureRow(userId);

		const { data } = await supabase
			.from("avatar_evolution")
			.select("current_stage, glow_intensity, color_signature, aura_visible, particle_density, pose")
			.eq("user_id", userId)
			.single();

		if (!data) {
			const stage = AVATAR_STAGES[0];
			return {
				stage,
				colorSignature: generateColorSignature(userId),
				glowIntensity: stage.glowIntensity,
				auraVisible: stage.auraVisible,
				particleDensity: stage.particleDensity,
				pose: stage.pose,
			};
		}

		const stageConfig = AVATAR_STAGES.find((s) => s.stage === data.current_stage) ?? AVATAR_STAGES[0];

		return {
			stage: stageConfig,
			colorSignature: data.color_signature,
			glowIntensity: data.glow_intensity,
			auraVisible: data.aura_visible,
			particleDensity: data.particle_density,
			pose: data.pose as AvatarPose,
		};
	}

	/**
	 * Called when a user levels up. Checks if avatar should evolve.
	 * Returns evolution result with old/new stage info.
	 */
	async onLevelUp(userId: string, newLevel: number): Promise<AvatarEvolutionResult> {
		await this.ensureRow(userId);

		const { data: current } = await supabase
			.from("avatar_evolution")
			.select("current_stage, color_signature")
			.eq("user_id", userId)
			.single();

		const oldStage = current?.current_stage ?? 1;
		const newStageConfig = getStageForLevel(newLevel);
		const evolved = newStageConfig.stage > oldStage;

		if (evolved) {
			const colorSig = current?.color_signature ?? generateColorSignature(userId);

			await supabase
				.from("avatar_evolution")
				.update({
					current_stage: newStageConfig.stage,
					glow_intensity: newStageConfig.glowIntensity,
					aura_visible: newStageConfig.auraVisible,
					particle_density: newStageConfig.particleDensity,
					pose: newStageConfig.pose,
				})
				.eq("user_id", userId);

			mixpanelService.track("avatar_evolved", {
				old_stage: oldStage,
				new_stage: newStageConfig.stage,
				new_label: newStageConfig.label,
				level: newLevel,
			});

			return {
				oldStage,
				newStage: newStageConfig.stage,
				evolved: true,
				avatarState: {
					stage: newStageConfig,
					colorSignature: colorSig,
					glowIntensity: newStageConfig.glowIntensity,
					auraVisible: newStageConfig.auraVisible,
					particleDensity: newStageConfig.particleDensity,
					pose: newStageConfig.pose,
				},
			};
		}

		// No evolution — return current state
		const avatarState = await this.getAvatarState(userId);
		return {
			oldStage,
			newStage: oldStage,
			evolved: false,
			avatarState,
		};
	}

	/**
	 * Get the user's color signature (unique per user).
	 */
	async getColorSignature(userId: string): Promise<string> {
		await this.ensureRow(userId);

		const { data } = await supabase
			.from("avatar_evolution")
			.select("color_signature")
			.eq("user_id", userId)
			.single();

		return data?.color_signature ?? generateColorSignature(userId);
	}
}

export const avatarService = AvatarService.getInstance();
