import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type ActivityLevel = 1 | 2 | 3 | 4 | 5;
export type UnitPreference = "metric" | "imperial";

export interface OnboardingState {
	currentStep: number;
	totalSteps: number;
	gender?: Gender;
	birthDate?: string;
	heightCm?: number;
	weightKg?: number;
	unitPreference: UnitPreference;
	activityLevel?: ActivityLevel;
	sleepQuality?: number;
	stressLevel?: "low" | "moderate" | "high";
	symptoms: string[];
	goals: string[];
	primaryGoal?: string;
	obstacles: string[];
	dietType?: string;
	digestionSensitivity?: "sensitive" | "normal" | "strong";
	processedFoodsFrequency?: "rarely" | "sometimes" | "often";
	cravings: string[];
	notificationsEnabled: boolean;
	referralCode?: string;

	setAnswer: <K extends keyof OnboardingState>(
		key: K,
		value: OnboardingState[K]
	) => void;
	nextStep: () => void;
	prevStep: () => void;
	reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
	persist(
		(set) => ({
			currentStep: 0,
			totalSteps: 20,
			unitPreference: "metric",
			symptoms: [],
			goals: [],
			obstacles: [],
			cravings: [],
			notificationsEnabled: false,

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
					gender: undefined,
					birthDate: undefined,
					heightCm: undefined,
					weightKg: undefined,
					unitPreference: "metric",
					activityLevel: undefined,
					sleepQuality: undefined,
					stressLevel: undefined,
					symptoms: [],
					goals: [],
					primaryGoal: undefined,
					obstacles: [],
					dietType: undefined,
					digestionSensitivity: undefined,
					processedFoodsFrequency: undefined,
					cravings: [],
					notificationsEnabled: false,
					referralCode: undefined,
				}),
		}),
		{
			name: "onboarding-storage",
			storage: createJSONStorage(() => AsyncStorage),
		}
	)
);
