/**
 * Today Summary (Rule-based Focus)
 *
 * Purpose: Surface ONE focus for the day.
 */

import type { CheckInData } from "./ezScore";

export type TodayFocus =
	| "Recover energy today"
	| "Reduce strain today"
	| "Maintain balance today";

/**
 * Determines today's focus based on check-in data and EZ Score.
 *
 * Rules:
 * - Low sleep + low energy -> "Recover energy today"
 * - High pain -> "Reduce strain today"
 * - Stable/Good -> "Maintain balance today"
 */
export function getTodayFocus(data: CheckInData): TodayFocus {
	// High pain (4 or 5)
	if (data.pain >= 4) {
		return "Reduce strain today";
	}

	// Low sleep (1 or 2) and low energy (1 or 2)
	if (data.sleepQuality <= 2 && data.energy <= 2) {
		return "Recover energy today";
	}

	// Default
	return "Maintain balance today";
}
