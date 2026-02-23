/**
 * App-wide theme tokens.
 * Single source of truth — change values here to retheme the entire app.
 * All screens and shared components reference these constants.
 */
export const THEME = {
	/** Primary accent — blue-600 */
	accent: "#2563EB",
	/** Lighter accent for hover/gradient — blue-500 */
	accentLight: "#3B82F6",
	/** Very light tint for selected item backgrounds — blue-50 */
	accentBg: "#EFF6FF",
	/** Border tint for selected items — blue-200 */
	accentBorder: "#BFDBFE",
	/** LinearGradient pair [light → dark] */
	accentGradient: ["#3B82F6", "#2563EB"] as const,
	/** Shadow/glow color */
	accentShadow: "#2563EB",
	/** Text on accent backgrounds */
	accentForeground: "#FFFFFF",
} as const;
