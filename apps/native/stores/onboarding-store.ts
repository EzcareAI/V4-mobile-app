import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { supabase } from "@/lib/supabase";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type ActivityLevel = 1 | 2 | 3 | 4 | 5;
export type UnitPreference = "metric" | "imperial";
export type IntentType = "zone" | "overall";

export interface OnboardingState {
	// Navigation
	currentStep: number;
	totalSteps: number;
	firstName?: string;
	onboardingRecordId?: string; // Backend sync ID

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
	lifestyleConditions: string[];

	// Phase 3: Body Diagram Intent
	bodyZoneSelected: string[];
	intentType?: IntentType;

	// Phase 3A: Zone-Specific Smart Questions
	zoneConcernIntensity?: number;
	zoneDuration?: "days" | "weeks" | "months" | "longterm";
	zoneFrequency?: "constantly" | "often" | "sometimes" | "rarely";
	zoneTriggers?: string[];
	zoneImpact?: number;

	// Phase 3B: Overall Lifestyle Smart Questions
	overallPriority?: "energy" | "sleep" | "digestion" | "stress" | "weight";
	overallBlocker?: "consistency" | "stress" | "time" | "nutrition" | "other";
	currentEnergyLevel?: number;
	currentDigestionComfort?: number;
	motivationLevel?: number;

	// Phase 4: Results & Payment
	lifestyleScore?: number;
	resultsShown?: string; // ISO timestamp
	scanMode?: "onboarding" | "home"; // Which entry point triggered the scan

	// Phase 5: Payment & Account
	subscriptionStatus?: "active" | "pending" | "failed" | "cancelled";
	subscriptionTier?: "free" | "pro" | "family";
	discountWheelShown?: boolean; // Flag to show only once
	paymentAttempted?: boolean;
	isPro: boolean;

	// Misc
	notificationsEnabled?: boolean;
	morningCheckInTime?: string; // e.g. "08:00 AM"
	eveningCheckInTime?: string; // e.g. "08:00 PM"
	pushToken?: string;
	appliedDiscount?: number; // Discount amount from the wheel spin

	// Phase 6: Post-Payment
	userId?: string;
	email?: string;
	authMethod?: "google" | "email" | "apple";
	referralCode?: string;

	// In-onboarding rating prompt
	ratingPromptShown?: boolean;
	appRating?: number; // 1-5 stars the user gave

	// Share-to-unlock promo (pre-paywall growth gate)
	shareInviteCount?: number; // How many times the user tapped Share
	shareUnlockComplete?: boolean; // Hit the 3-share threshold
	promoTrialDays?: number; // Bonus trial days earned by sharing

	// Completion
	onboardingComplete?: boolean;
	myReferralCode?: string; // Auto-generated unique code for this user
	dietType?: "classic" | "keto" | "paleo" | "vegan" | "carnivore";
	goals: string[];
	obstacles: string[];
	concerns: string[];
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
	setPro: (status: boolean) => void;
	nextStep: () => void;
	prevStep: () => void;
	reset: () => void;
	computeAwarenessScore: () => number;
	syncToSupabase: () => Promise<void>;
	getOrGenerateReferralCode: () => string;
}

export const useOnboardingStore = create<OnboardingState>()(
	persist(
		(set, get) => ({
			currentStep: 0,
			totalSteps: 25,
			unitPreference: "imperial",
			notificationsEnabled: true,
			morningCheckInTime: "8:00 AM",
			eveningCheckInTime: "8:00 PM",
			discountWheelShown: false,
			paymentAttempted: false,
			onboardingComplete: false,
			goals: [],
			obstacles: [],
			concerns: [],
			cravings: [],
			lifestyleConditions: [],
			bodyZoneSelected: [],
			isPro: false,

			setAnswer: (key, value) => {
				set((state) => ({ ...state, [key]: value }));
			},

			setPro: (status) => set({ isPro: status }),

			nextStep: () => {
				set((state) => ({
					currentStep: Math.min(state.currentStep + 1, state.totalSteps),
				}));
				// Fire-and-forget sync to backend on every step progression to capture funnel drop-offs
				get().syncToSupabase();
			},

			prevStep: () =>
				set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

			reset: () =>
				set({
					currentStep: 0,
					totalSteps: 25,
					scanMode: "onboarding",
					firstName: undefined,
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
					bodyZoneSelected: [],
					intentType: undefined,
					zoneConcernIntensity: undefined,
					zoneDuration: undefined,
					zoneFrequency: undefined,
					zoneTriggers: [],
					zoneImpact: undefined,
					overallPriority: undefined,
					overallBlocker: undefined,
					currentEnergyLevel: undefined,
					currentDigestionComfort: undefined,
					motivationLevel: undefined,
					lifestyleScore: undefined,
					resultsShown: undefined,
					subscriptionStatus: undefined,
					discountWheelShown: false,
					paymentAttempted: false,
					appliedDiscount: undefined,
					userId: undefined,
					authMethod: undefined,
					notificationsEnabled: true,
					referralCode: undefined,
					onboardingComplete: false,
					dietType: undefined,
					goals: [],
					obstacles: [],
					concerns: [],
					cravings: [],
					lifestyleConditions: [],
					digestionSensitivity: undefined,
					processedFoodsFrequency: undefined,
					primaryGoal: undefined,
					onboardingRecordId: undefined,
				}),

			syncToSupabase: async () => {
				const state = get();
				if (state.currentStep < 1) return;

				// Skip sync until user has authenticated (step 21+) — RLS blocks anonymous writes
				if (!state.userId) return;

				const payload = {
					first_name: state.firstName,
					gender: state.gender,
					birthday: state.birthDate,
					height_cm: state.heightCm,
					weight_kg: state.weightKg,
					activity_level: state.activityLevel,
					sleep_rating: state.sleepQuality,
					stress_level: state.stressLevel,
					smoking_status: state.smokingFrequency,
					alcohol_status: state.alcoholFrequency,
					lifestyle_goals: state.goals,
					primary_goal: state.primaryGoal,
					lifestyle_conditions: state.lifestyleConditions,
					body_parts_selected: state.bodyZoneSelected,
					branch: state.intentType,
					paywall_plan_selected: state.subscriptionStatus,
					last_completed_step: state.currentStep,
					user_id: state.userId,
					referral_code: state.myReferralCode,
					referred_by_code: state.referralCode,
					updated_at: new Date().toISOString(),
				};

				try {
					if (state.onboardingRecordId) {
						const { data, error } = await supabase
							.from("onboarding_profiles")
							.update(payload)
							.eq("id", state.onboardingRecordId)
							.select()
							.single();

						if (error) {
							console.warn("[onboarding-sync] update failed:", error.message);
						} else if (data?.referral_code && !state.myReferralCode) {
							set({ myReferralCode: data.referral_code });
						}
					} else {
						const { data, error } = await supabase
							.from("onboarding_profiles")
							.insert([payload])
							.select()
							.single();

						if (error) {
							console.warn("[onboarding-sync] insert failed:", error.message);
						} else if (data?.id) {
							set({
								onboardingRecordId: data.id,
								myReferralCode: data.referral_code || undefined,
							});
						}
					}
				} catch {
					// Silently ignore — sync is best-effort and must not break the flow
				}
			},

			getOrGenerateReferralCode: () => {
				const state = get();
				if (state.myReferralCode) {
					return state.myReferralCode;
				}

				const newCode = Array.from({ length: 7 }, () =>
					"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(
						Math.floor(Math.random() * 36)
					)
				).join("");

				set({ myReferralCode: newCode });
				get().syncToSupabase();
				return newCode;
			},

			computeAwarenessScore: () => {
				const state = get();
				let score = 50; // Baseline

				// Adjustments grouped by concern
				score += computeLifestyleFactors(state);
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

// Hook to check if zustand has finished hydrating from AsyncStorage
export const useOnboardingHydrated = () => {
	const [hydrated, setHydrated] = useState(false);
	useEffect(() => {
		const unsub = useOnboardingStore.persist.onFinishHydration(() => {
			setHydrated(true);
		});
		// If already hydrated (e.g. sync storage or fast restore)
		if (useOnboardingStore.persist.hasHydrated()) {
			setHydrated(true);
		}
		return unsub;
	}, []);
	return hydrated;
};

// Helper functions for score calculation to keep complexity low
function computeLifestyleFactors(state: OnboardingState): number {
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
	let adjustment = -(state.zoneConcernIntensity || 0);
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
