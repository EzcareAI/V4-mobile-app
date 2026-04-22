/**
 * Central disclaimer for EZCare AI
 * Ensures consistent non-diagnostic language across the app.
 */
export const GLOBAL_DISCLAIMER =
	"EZCare AI provides general wellness and lifestyle information for educational purposes only. This is not a substitute for professional advice. Always consult a qualified professional for health concerns.";

/**
 * Helper to ensure a disclaimer is non-empty and consistent
 */
export function getDisclaimer(customText?: string): string {
	if (!customText) {
		return GLOBAL_DISCLAIMER;
	}

	// If custom text doesn't already contain the core disclaimer or mention medical advice,
	// we append the global one to be safe.
	if (
		!(
			customText.includes("not a substitute") ||
		customText.includes("not a medical") ||
			customText.includes("consult a healthcare")
		)
	) {
		return `${customText} ${GLOBAL_DISCLAIMER}`;
	}

	return customText;
}

/**
 * Ensures AI responses follow the educational tone
 */
export const SAFETY_PROMPT_INJECTION =
	"Remember: You are a general wellness and lifestyle AI assistant. Use non-clinical language only. Do not use words like 'diagnose', 'prescribe', 'treatment', 'condition', or 'symptom'. Use 'lifestyle tips', 'comfort suggestions', 'sensations', and 'wellness factors'. Frame everything as general lifestyle guidance.";
