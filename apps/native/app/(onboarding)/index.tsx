import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Check, Leaf } from "lucide-react-native";
import {
	Image,
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useOnboardingStore } from "@/stores/onboarding-store";

const logoSource = require("@/assets/images/EZCare_Logo.jpg");

export default function OnboardingIndex() {
	const router = useRouter();
	const reset = useOnboardingStore((state) => state.reset);

	const handleStart = () => {
		if (Platform.OS === "ios") {
			// Fire and forget haptics
			impactAsync(ImpactFeedbackStyle.Medium).catch(() => {
				/* ignore */
			});
		}

		// Reset state before navigating
		reset();

		// Navigate to the first step using the absolute path
		router.replace("/(onboarding)/1");
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
							resizeMode="cover"
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
		paddingHorizontal: 32,
	},
	// Logo
	logoSection: {
		flex: 1.8,
		alignItems: "center",
		justifyContent: "center",
	},
	logoCard: {
		width: 200,
		height: 200,
		borderRadius: 48,
		backgroundColor: "#3BAFDA",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#3BAFDA",
		shadowOffset: { width: 0, height: 20 },
		shadowOpacity: 0.25,
		shadowRadius: 40,
		elevation: 15,
		overflow: "hidden",
	},
	logoImage: {
		width: "100%",
		height: "100%",
	},
	// Branding
	brandSection: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingBottom: 40,
	},
	headline: {
		fontSize: 40,
		fontWeight: "800",
		color: "#0d2137",
		textAlign: "center",
		lineHeight: 48,
		letterSpacing: -0.5,
	},
	gradientTextWrapper: {
		borderRadius: 12,
		marginVertical: 8,
	},
	gradientText: {
		fontSize: 42,
		fontWeight: "900",
		color: "#ffffff",
		textAlign: "center",
		lineHeight: 52,
		paddingHorizontal: 16,
		letterSpacing: -1,
	},
	subheadline: {
		fontSize: 19,
		fontWeight: "500",
		color: "#64748b",
		textAlign: "center",
		marginTop: 12,
		lineHeight: 26,
	},
	// Footer
	footer: {
		flex: 0.8,
		justifyContent: "flex-end",
		gap: 24,
		paddingBottom: 40,
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
