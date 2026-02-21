import type { DailyInsightInput } from "../ai/schemas";

export interface HealthPattern {
	trend: "improving" | "stable" | "worsening";
	observation: string;
}

/**
 * Lightweight pattern detector for health memory.
 * Compares last 3-7 days to detect trends.
 */
export function detectHealthPatterns(input: DailyInsightInput): string {
	if (input.recentCheckIns.length < 3) {
		return "Insufficient data for trend detection.";
	}

	const patterns: string[] = [];

	// 1. EZ Score Trend
	if (input.ezScoreYesterday !== null) {
		const scoreDiff = input.ezScoreToday - input.ezScoreYesterday;
		if (scoreDiff > 5) {
			patterns.push("EZ Score is trending up significantly.");
		} else if (scoreDiff < -5) {
			patterns.push("EZ Score took a dip recently.");
		}
	}

	// 2. Check-in Metric Trends (Energy, Sleep, Pain)
	const recent = input.recentCheckIns;

	// Simple avg comparison (first half vs second half of recent data)
	const midIndex = Math.floor(recent.length / 2);
	const firstHalf = recent.slice(0, midIndex);
	const secondHalf = recent.slice(midIndex);

	const getAvg = (arr: typeof firstHalf, key: keyof (typeof firstHalf)[0]) =>
		arr.reduce((acc, curr) => acc + (curr[key] as number), 0) / arr.length;

	// Energy Trend
	const energyDelta =
		getAvg(secondHalf, "energy") - getAvg(firstHalf, "energy");
	if (energyDelta > 0.5) {
		patterns.push("Energy levels are improving.");
	} else if (energyDelta < -0.5) {
		patterns.push("Energy levels have been declining.");
	}

	// Sleep Quality Trend
	const sleepDelta =
		getAvg(secondHalf, "sleepQuality") - getAvg(firstHalf, "sleepQuality");
	if (sleepDelta > 0.5) {
		patterns.push("Sleep quality is getting better.");
	} else if (sleepDelta < -0.5) {
		patterns.push("Sleep quality has been unstable recently.");
	}

	// Pain Trend (Inverse: higher is worse in some contexts, but let's assume 1=low pain, 5=high pain based on schema comment)
	// Wait, schema says "1-5 scale" for metrics. Usually 5 is "good" for mood/energy.
	// For pain, 1 is usually "no pain" and 5 is "severe pain".
	const painDelta = getAvg(secondHalf, "pain") - getAvg(firstHalf, "pain");
	if (painDelta > 0.5) {
		patterns.push("Reported pain levels are increasing.");
	} else if (painDelta < -0.5) {
		patterns.push("Pain levels are trending down.");
	}

	return patterns.length > 0
		? patterns.join(" ")
		: "Health patterns are stable.";
}
