import type { OnboardingState } from "@/stores/onboarding-store";

/**
 * Maps the native app's onboarding state to the tRPC profile.completeOnboarding input schema.
 * This ensures data collected during onboarding is correctly persisted to Supabase.
 */
export const mapOnboardingToProfile = (state: OnboardingState) => {
	// 1. Map Age Range from Birth Date
	const ageRange = calculateAgeRange(state.birthDate);

	// 2. Map Stress Level (Store: low|moderate|high -> API: 1-5)
	const stressLevelMap = {
		low: 2,
		moderate: 3,
		high: 5,
	};
	const mappedStressLevel = state.stressLevel
		? stressLevelMap[state.stressLevel]
		: 3;

	// 3. Map Health Goals (Store: energy|sleep|digestion|stress|weight -> API: energy|sleep|digestion|stress|longevity)
	const goalMap: Record<string, string> = {
		energy: "energy",
		sleep: "sleep",
		digestion: "digestion",
		stress: "stress",
		weight: "longevity", // Mapping weight to longevity as a catch-all if not exactly matched
	};

	// 4. Map Symptoms
	// Combine any specific triggers or issues into the symptom enum
	const mappedSymptoms: string[] = [];
	if (state.currentEnergyLevel && state.currentEnergyLevel <= 2) {
		mappedSymptoms.push("fatigue");
	}
	if (state.currentDigestionComfort && state.currentDigestionComfort <= 2) {
		mappedSymptoms.push("digestive");
	}
	if (state.stressLevel === "high") {
		mappedSymptoms.push("anxiety");
	}

	return {
		ageRange,
		gender: state.gender || "other",
		heightCm: state.heightCm || 170, // Default fallback
		weightKg: state.weightKg || 70, // Default fallback
		activityLevel: state.activityLevel || 3,
		sleepQuality: state.sleepQuality || 3,
		stressLevel: mappedStressLevel,
		dietType: "classic" as const, // Default for now
		primaryGoal:
			(state.overallPriority && goalMap[state.overallPriority]) || "energy",
		secondaryGoal: "longevity" as const,
		symptoms: mappedSymptoms.length > 0 ? mappedSymptoms : ["fatigue"], // Ensure non-empty if required
		motivationLevel: state.motivationLevel || 3,
		willingDailyActions: true,
		notificationsEnabled: state.notificationsEnabled,
		disclaimerAccepted: true as const,
	};
};

/**
 * Helper to calculate age range from birth date string
 */
function calculateAgeRange(
	birthDate?: string
): "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65+" {
	if (!birthDate) {
		return "25-34"; // Default fallback
	}

	try {
		const birth = new Date(birthDate);
		const now = new Date();
		let age = now.getFullYear() - birth.getFullYear();
		const monthDiff = now.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
			age--;
		}

		if (age < 25) {
			return "18-24";
		}
		if (age < 35) {
			return "25-34";
		}
		if (age < 45) {
			return "35-44";
		}
		if (age < 55) {
			return "45-54";
		}
		if (age < 65) {
			return "55-64";
		}
		return "65+";
	} catch {
		return "25-34";
	}
}
