import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type ActivityLevel = 1 | 2 | 3 | 4 | 5;
export type UnitPreference = "metric" | "imperial";
export type IntentType = "zone" | "overall";
export type BodyZone =
	| "head"
	| "chest"
	| "stomach"
	| "energy"
	| "joints"
	| "inflammation"
	| null;

export interface OnboardingState {
	// Navigation
	currentStep: number;
	totalSteps: number;

	// Phase 1: Core Profile
	gender?: Gender;
	birthDate?: string;
	heightCm?: number;
	weightKg?: number;
	unitPreference: UnitPreference;
	activityLevel?: ActivityLevel;

	// Phase 2: Lifestyle Signals
	sleepQuality?: number;
	stressLevel?: "low" | "moderate" | "high";
	smokingFrequency?: "never" | "occasionally" | "regularly";
	alcoholFrequency?: "never" | "occasionally" | "weekly" | "often";
	healthConditions?: string;

	// Phase 3: Body Diagram Intent
	bodyZoneSelected?: BodyZone;
	intentType?: IntentType;

	// Phase 3A: Zone-Specific Smart Questions
	zoneSymptomIntensity?: number;
	zoneDuration?: "days" | "weeks" | "months" | "longterm";
	zoneFrequency?: "constantly" | "often" | "sometimes" | "rarely";
	zoneTriggers?: string[];
	zoneImpact?: number;

	// Phase 3B: Overall Health Smart Questions
	overallPriority?: "energy" | "sleep" | "digestion" | "stress" | "weight";
	overallBlocker?: "consistency" | "stress" | "time" | "nutrition" | "other";
	currentEnergyLevel?: number;
	currentDigestionComfort?: number;
	motivationLevel?: number;

	// Phase 4: Results & Payment
	healthScore?: number;
	resultsShown?: string; // ISO timestamp

	// Phase 5: Payment & Account
	subscriptionStatus?: "active" | "pending" | "failed" | "cancelled";
	discountWheelShown?: boolean; // Flag to show only once
	paymentAttempted?: boolean;

	// Phase 6: Post-Payment
	userId?: string;
	authMethod?: "google" | "email";
	notificationsEnabled: boolean;
	referralCode?: string;

	// Completion
	onboardingComplete?: boolean;
	dietType?: "classic" | "keto" | "paleo" | "vegan" | "carnivore";
	goals: string[];
	obstacles: string[];
	symptoms: string[];
	// Digestion and food answers
	digestionSensitivity?: "sensitive" | "normal" | "strong";
	processedFoodsFrequency?: "rarely" | "sometimes" | "often";
	cravings: string[];
	primaryGoal?: string;

	// Methods
	setAnswer: <K extends keyof OnboardingState>(
		key: K,
		value: OnboardingState[K]
	) => void;
	nextStep: () => void;
	prevStep: () => void;
	reset: () => void;
	computeHealthScore: () => number;
}

export const useOnboardingStore = create<OnboardingState>()(
	persist(
		(set, get) => ({
			currentStep: 0,
			totalSteps: 24,
			unitPreference: "imperial",
			notificationsEnabled: true,
			discountWheelShown: false,
			paymentAttempted: false,
			onboardingComplete: false,
			goals: [],
			obstacles: [],
			symptoms: [],
			cravings: [],

			setAnswer: (key, value) => set((state) => ({ ...state, [key]: value })),

			nextStep: () =>
				set((state) => ({
					currentStep: Math.min(state.currentStep + 1, state.totalSteps),
				})),

			prevStep: () =>
				set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

			reset: () =>
				set({
					currentStep: 0,
					totalSteps: 24,
					gender: undefined,
					birthDate: undefined,
					heightCm: undefined,
					weightKg: undefined,
					unitPreference: "imperial",
					activityLevel: undefined,
					sleepQuality: undefined,
					stressLevel: undefined,
					smokingFrequency: undefined,
					alcoholFrequency: undefined,
					bodyZoneSelected: null,
					intentType: undefined,
					zoneSymptomIntensity: undefined,
					zoneDuration: undefined,
					zoneFrequency: undefined,
					zoneTriggers: [],
					zoneImpact: undefined,
					overallPriority: undefined,
					overallBlocker: undefined,
					currentEnergyLevel: undefined,
					currentDigestionComfort: undefined,
					motivationLevel: undefined,
					healthScore: undefined,
					resultsShown: undefined,
					subscriptionStatus: undefined,
					discountWheelShown: false,
					paymentAttempted: false,
					userId: undefined,
					authMethod: undefined,
					notificationsEnabled: true,
					referralCode: undefined,
					onboardingComplete: false,
					dietType: undefined,
					goals: [],
					obstacles: [],
					symptoms: [],
					cravings: [],
					digestionSensitivity: undefined,
					processedFoodsFrequency: undefined,
					primaryGoal: undefined,
				}),

			computeHealthScore: () => {
				const state = get();
				let score = 50; // Baseline

				// Adjustments grouped by concern
				score += computeLifestyleScore(state);
				score += computeActivityScore(state);

				if (state.intentType === "zone") {
					score += computeZoneScore(state);
				} else if (state.intentType === "overall") {
					score += computeOverallScore(state);
				}

				return Math.max(30, Math.min(95, score)); // Clamp 30–95
			},
		}),
		{
			name: "onboarding-storage",
			storage: createJSONStorage(() => AsyncStorage),
		}
	)
);

// Helper functions for score calculation to keep complexity low
function computeLifestyleScore(state: OnboardingState): number {
	let adjustment = 0;

	if (state.sleepQuality && state.sleepQuality >= 4) {
		adjustment += 5;
	}
	if (state.sleepQuality && state.sleepQuality <= 2) {
		adjustment -= 5;
	}

	if (state.stressLevel === "low") {
		adjustment += 5;
	}
	if (state.stressLevel === "high") {
		adjustment -= 5;
	}

	if (state.smokingFrequency === "never") {
		adjustment += 5;
	}
	if (state.smokingFrequency === "regularly") {
		adjustment -= 8;
	}

	if (
		state.alcoholFrequency === "never" ||
		state.alcoholFrequency === "occasionally"
	) {
		adjustment += 3;
	}
	if (state.alcoholFrequency === "often") {
		adjustment -= 5;
	}

	return adjustment;
}

function computeActivityScore(state: OnboardingState): number {
	if (state.activityLevel && state.activityLevel >= 3) {
		return 5;
	}
	return 0;
}

function computeZoneScore(state: OnboardingState): number {
	let adjustment = -(state.zoneSymptomIntensity || 0);
	if (state.zoneFrequency === "constantly") {
		adjustment -= 3;
	}
	return adjustment;
}

function computeOverallScore(state: OnboardingState): number {
	let adjustment = 0;
	if (state.currentEnergyLevel && state.currentEnergyLevel <= 2) {
		adjustment -= 5;
	}
	if (state.currentDigestionComfort && state.currentDigestionComfort <= 2) {
		adjustment -= 5;
	}
	if (state.motivationLevel && state.motivationLevel >= 4) {
		adjustment += 5;
	}
	return adjustment;
}
