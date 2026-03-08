/**
 * App-wide theme tokens — SINGLE SOURCE OF TRUTH.
 * Matches the "Get Started" button gradient on the landing screen.
 * Change values here to retheme the entire app.
 */
export const THEME = {
	/** Primary accent — matches the Get Started button (#3EC9B5 teal) */
	accent: "#3EC9B5",
	/** Lighter accent for gradient start — matches the Get Started button */
	accentLight: "#3BAFDA",
	/** Very light tint for selected item backgrounds */
	accentBg: "#EAFAF8",
	/** Border tint for selected items */
	accentBorder: "#A7F3EA",
	/** LinearGradient pair — same as Get Started button [light → dark] */
	accentGradient: ["#3BAFDA", "#3EC9B5"] as const,
	/** Shadow/glow color */
	accentShadow: "#3EC9B5",
	/** Text on accent backgrounds */
	accentForeground: "#FFFFFF",
	/** Disabled state color */
	accentDisabled: "#94A3B8",
} as const;
