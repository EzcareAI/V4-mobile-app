import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Check, Leaf } from "lucide-react-native";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useOnboardingStore } from "@/stores/onboarding-store";

const logoSource = require("@/assets/images/EZCare_Logo.jpg");

export default function OnboardingIndex() {
	const router = useRouter();
	const reset = useOnboardingStore((state) => state.reset);

	const handleStart = () => {
		try {
			// Fire and forget haptics
			impactAsync(ImpactFeedbackStyle.Medium).catch(() => {
				/* ignore haptic fail */
			});
		} catch {
			// Silent fail for haptics to ensure navigation proceeds
		}

		// Reset state before navigating
		reset();

		// Navigate to the first step using the absolute path
		router.replace("/1");
	};

	return (
		<LinearGradient
			colors={["#e8faf6", "#ddf0f9", "#ffffff"]}
			end={{ x: 0.5, y: 1 }}
			start={{ x: 0.5, y: 0 }}
			style={styles.gradient}
		>
			<SafeAreaView style={styles.safeArea}>
				{/* Logo Section */}
				<View style={styles.logoSection}>
					<View style={styles.logoCard}>
						<Image
							resizeMode="contain"
							source={logoSource}
							style={styles.logoImage}
						/>
					</View>
				</View>

				{/* Branding */}
				<View style={styles.brandSection}>
					<Text style={styles.headline}>Welcome to</Text>
					<LinearGradient
						colors={["#3BAFDA", "#3EC9B5"]}
						end={{ x: 1, y: 0 }}
						start={{ x: 0, y: 0 }}
						style={styles.gradientTextWrapper}
					>
						<Text style={styles.gradientText}>EZCare AI</Text>
					</LinearGradient>
					<Text style={styles.subheadline}>
						Your Natural Healing Companion.
					</Text>
				</View>

				{/* Footer */}
				<View style={styles.footer}>
					{/* Get Started Button */}
					<TouchableOpacity
						activeOpacity={0.88}
						onPress={handleStart}
						style={styles.ctaButton}
					>
						<LinearGradient
							colors={["#3BAFDA", "#3EC9B5"]}
							end={{ x: 1, y: 0 }}
							start={{ x: 0, y: 0 }}
							style={StyleSheet.absoluteFill}
						/>
						<Text style={styles.ctaText}>Get Started</Text>
					</TouchableOpacity>

					{/* Sign In Link */}
					<View style={styles.signInRow}>
						<Text style={styles.signInNote}>Already have an account? </Text>
						<Link asChild href="/(auth)/sign-in">
							<Text style={styles.signInLink}>Sign in</Text>
						</Link>
					</View>

					{/* Trust Indicators */}
					<View style={styles.trustRow}>
						<View style={styles.trustItem}>
							<View style={styles.trustIcon}>
								<Check color="#3EC9B5" size={13} />
							</View>
							<Text style={styles.trustLabel}>Clinically Trusted</Text>
						</View>

						<View style={styles.trustDot} />

						<View style={styles.trustItem}>
							<View style={styles.trustIcon}>
								<Leaf color="#3EC9B5" size={13} />
							</View>
							<Text style={styles.trustLabel}>100% Natural</Text>
						</View>
					</View>
				</View>
			</SafeAreaView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	gradient: {
		flex: 1,
	},
	safeArea: {
		flex: 1,
		paddingHorizontal: 24,
	},
	// Logo
	logoSection: {
		flex: 1.5,
		alignItems: "center",
		justifyContent: "center",
	},
	logoCard: {
		width: 220,
		height: 220,
		borderRadius: 40,
		backgroundColor: "#3BAFDA",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#3BAFDA",
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.3,
		shadowRadius: 32,
		elevation: 12,
	},
	logoImage: {
		width: 190,
		height: 190,
	},
	// Branding
	brandSection: {
		flex: 1.2,
		alignItems: "center",
		justifyContent: "center",
		paddingBottom: 20,
	},
	headline: {
		fontSize: 38,
		fontWeight: "800",
		color: "#0d2137",
		textAlign: "center",
		lineHeight: 46,
	},
	gradientTextWrapper: {
		borderRadius: 8,
		marginVertical: 4,
	},
	gradientText: {
		fontSize: 40,
		fontWeight: "900",
		color: "#ffffff",
		textAlign: "center",
		lineHeight: 48,
		paddingHorizontal: 12,
	},
	subheadline: {
		fontSize: 18,
		fontWeight: "500",
		color: "#64748b",
		textAlign: "center",
		marginTop: 8,
	},
	// Footer
	footer: {
		flex: 1,
		justifyContent: "flex-end",
		gap: 16,
		paddingBottom: 20,
	},
	ctaButton: {
		height: 56,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
		shadowColor: "#3BAFDA",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.35,
		shadowRadius: 14,
		elevation: 8,
	},
	ctaText: {
		fontSize: 17,
		fontWeight: "700",
		color: "#ffffff",
		letterSpacing: 0.3,
	},
	signInRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	signInNote: {
		fontSize: 15,
		fontWeight: "500",
		color: "#94a3b8",
	},
	signInLink: {
		fontSize: 15,
		fontWeight: "700",
		color: "#3EC9B5",
	},
	trustRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
		paddingBottom: 4,
	},
	trustItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	trustIcon: {
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: "rgba(62,201,181,0.12)",
		alignItems: "center",
		justifyContent: "center",
	},
	trustLabel: {
		fontSize: 13,
		fontWeight: "600",
		color: "#64748b",
	},
	trustDot: {
		width: 4,
		height: 4,
		borderRadius: 2,
		backgroundColor: "#cbd5e1",
	},
});
