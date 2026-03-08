/**
 * Central disclaimer for EZCare AI
 * Ensures consistent non-diagnostic language across the app.
 */
export const GLOBAL_DISCLAIMER =
	"EZCare AI provides educational insights and health information only. This is not a medical diagnosis, prescription, or clinical advice. Always consult a healthcare professional for medical concerns. If you are experiencing a medical emergency, call emergency services immediately.";

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
	"Remember: You are an educational AI assistant, not a doctor. Use non-diagnostic language. Do not use words like 'diagnose', 'prescribe', or 'treatment'. Use 'educational insights', 'suggested areas to explore', and 'potential contributors'. Always include a recommendation to consult a medical professional.";
