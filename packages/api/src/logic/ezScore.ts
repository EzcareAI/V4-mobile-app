/**
 * EZ Score Engine (Core Logic)
 * 
 * Rules:
 * - Deterministic, Fast, Explainable.
 * - Range: 0-100.
 * - Weighted average of check-in values.
 * - Penalize high pain more than low energy.
 * - Smooth score changes: Max +/- 15 points per day.
 * - Missing data -> fallback to last score.
 */

export interface CheckInData {
    energy: number; // 1-5
    mood: number; // 1-5
    pain: number; // 1-5
    digestion: number; // 1-5
    sleepQuality: number; // 1-5
}

/**
 * Calculates raw EZ Score based on weighted metrics.
 * 
 * Weights:
 * - Pain: 40% (Inverted: 1=100%, 5=0%)
 * - Energy: 15%
 * - Mood: 15%
 * - Digestion: 15%
 * - Sleep Quality: 15%
 * 
 * Logic: Pain is penalized more heavily as per PRD.
 */
export function calculateRawScore(data: CheckInData): number {
    // Map 1-5 to 0-1 range
    const normalize = (val: number) => (val - 1) / 4;

    // Pain is inverted (1 is good, 5 is bad)
    const painScore = 1 - normalize(data.pain);
    const energyScore = normalize(data.energy);
    const moodScore = normalize(data.mood);
    const digestionScore = normalize(data.digestion);
    const sleepScore = normalize(data.sleepQuality);

    const weightedScore =
        (painScore * 0.40) +
        (energyScore * 0.15) +
        (moodScore * 0.15) +
        (digestionScore * 0.15) +
        (sleepScore * 0.15);

    return Math.round(weightedScore * 100);
}

/**
 * Clamps the score between 0 and 100.
 */
export function clampScore(score: number): number {
    return Math.max(0, Math.min(100, score));
}

/**
 * Smooths the delta between today's raw score and the previous score.
 * Max change is +/- 15 points.
 */
export function smoothDelta(currentRaw: number, previousScore: number): number {
    const delta = currentRaw - previousScore;
    const cappedDelta = Math.max(-15, Math.min(15, delta));
    return clampScore(previousScore + cappedDelta);
}

/**
 * Main entry point for score calculation.
 */
export function calculateEZScore(data: CheckInData, previousScore?: number): number {
    const raw = calculateRawScore(data);

    if (previousScore === undefined) {
        return clampScore(raw);
    }

    return smoothDelta(raw, previousScore);
}
