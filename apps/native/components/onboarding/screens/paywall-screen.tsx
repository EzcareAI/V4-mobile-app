import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/stores/onboarding-store";

const FEATURES = [
	"🎯 Custom health scoring based on your data",
	"📊 Progress tracking and analytics",
	"🤖 AI-powered EZBuddy recommendations",
	"🔔 Daily wellness reminders",
	"📱 Unlimited access on all devices",
];

const BENEFITS = [
	"Full health analysis",
	"Personalized 7-day plans",
	"Daily check-ins",
	"EZBuddy guidance",
];

export default function PaywallScreen() {
	const { setAnswer, nextStep, prevStep, discountWheelShown } =
		useOnboardingStore();
	const [isProcessing, setIsProcessing] = useState(false);
	const [showDiscountWheel, setShowDiscountWheel] = useState(false);

	const handlePayment = () => {
		setIsProcessing(true);
		// TODO: Integrate with Stripe/RevenueCat
		setTimeout(() => {
			setAnswer("subscriptionStatus", "active");
			setAnswer("paymentAttempted", true);
			setIsProcessing(false);
			nextStep();
		}, 2000);
	};

	const handleExit = () => {
		if (discountWheelShown) {
			prevStep();
		} else {
			setAnswer("discountWheelShown", true);
			setShowDiscountWheel(true);
		}
	};

	return (
		<View style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<LinearGradient
					colors={["#e8faf6", "#e8f4fa"]}
					end={{ x: 0.5, y: 1 }}
					start={{ x: 0.5, y: 0 }}
					style={styles.header}
				>
					<Text style={styles.headerTitle}>Unlock Your Full Health Core</Text>
					<Text style={styles.headerSubtitle}>
						Get personalized plans, daily check-ins, and continuous guidance
					</Text>
				</LinearGradient>

				{/* Pricing Cards */}
				<View style={styles.section}>
					{/* Annual — Primary Card */}
					<TouchableOpacity
						activeOpacity={0.9}
						disabled={isProcessing}
						onPress={handlePayment}
						style={styles.annualCard}
					>
						<LinearGradient
							colors={["#3BAFDA", "#3EC9B5"]}
							end={{ x: 1, y: 1 }}
							start={{ x: 0, y: 0 }}
							style={StyleSheet.absoluteFill}
						/>

						{/* Best Value Badge */}
						<View style={styles.badge}>
							<Text style={styles.badgeText}>BEST VALUE</Text>
						</View>

						<View style={styles.planHeader}>
							<Text style={styles.planTitle}>Annual Plan</Text>
							<Text style={styles.planSubtitle}>
								Commit for a year and save
							</Text>
						</View>

						<View style={styles.priceRow}>
							<Text style={styles.priceMain}>€39.99</Text>
							<Text style={styles.pricePeriod}>/year</Text>
						</View>
						<Text style={styles.priceNote}>€3.33/month billed annually</Text>

						{/* Benefits */}
						<View style={styles.benefitsList}>
							{BENEFITS.map((b) => (
								<View key={b} style={styles.benefitRow}>
									<Text style={styles.checkmark}>✓</Text>
									<Text style={styles.benefitText}>{b}</Text>
								</View>
							))}
						</View>

						<View style={styles.startButton}>
							<Text style={styles.startButtonText}>
								{isProcessing ? "Processing…" : "Start Now →"}
							</Text>
						</View>
					</TouchableOpacity>

					{/* Monthly — Secondary Card */}
					<TouchableOpacity
						activeOpacity={0.9}
						disabled={isProcessing}
						onPress={handlePayment}
						style={styles.monthlyCard}
					>
						<Text style={styles.monthlyTitle}>Monthly Plan</Text>

						<View style={styles.priceRow}>
							<Text style={styles.monthlyPrice}>€11.99</Text>
							<Text style={styles.monthlyPricePeriod}>/month</Text>
						</View>
						<Text style={styles.monthlySubtitle}>
							Cancel anytime, no commitment
						</Text>

						<View style={styles.monthlyButton}>
							<Text style={styles.monthlyButtonText}>
								{isProcessing ? "Processing…" : "Start Now →"}
							</Text>
						</View>
					</TouchableOpacity>
				</View>

				{/* Features List */}
				<View style={styles.featuresBox}>
					<Text style={styles.featuresTitle}>What's Included:</Text>
					{FEATURES.map((f) => (
						<Text key={f} style={styles.featureItem}>
							{f}
						</Text>
					))}
				</View>

				{/* Trust Badges */}
				<View style={styles.trustRow}>
					<View style={styles.trustItem}>
						<Text style={styles.trustIcon}>✓</Text>
						<Text style={styles.trustLabel}>Clinically{"\n"}Trusted</Text>
					</View>
					<View style={styles.trustItem}>
						<Text style={styles.trustIcon}>🌿</Text>
						<Text style={styles.trustLabel}>100%{"\n"}Natural</Text>
					</View>
					<View style={styles.trustItem}>
						<Text style={styles.trustIcon}>🔒</Text>
						<Text style={styles.trustLabel}>Your Data{"\n"}Protected</Text>
					</View>
				</View>

				{/* Decline / Discount Trigger */}
				<TouchableOpacity onPress={handleExit} style={styles.declineButton}>
					<Text style={styles.declineText}>I'll Decide Later</Text>
				</TouchableOpacity>

				{/* Legal */}
				<Text style={styles.legal}>
					By starting your subscription, you agree to our Terms of Service and
					Privacy Policy. Your subscription will renew automatically. Cancel
					anytime.
				</Text>
			</ScrollView>

			{/* Discount Wheel Modal — proper full-screen overlay */}
			<DiscountWheelModal
				onClaim={handlePayment}
				onClose={() => setShowDiscountWheel(false)}
				visible={showDiscountWheel}
			/>
		</View>
	);
}

function DiscountWheelModal({
	visible,
	onClose,
	onClaim,
}: {
	visible: boolean;
	onClose: () => void;
	onClaim: () => void;
}) {
	return (
		<Modal
			animationType="fade"
			onRequestClose={onClose}
			transparent
			visible={visible}
		>
			<View style={styles.modalOverlay}>
				<SafeAreaView edges={["bottom"]} style={styles.modalCard}>
					<Text style={styles.modalEmoji}>🎁</Text>
					<Text style={styles.modalTitle}>Wait!</Text>
					<Text style={styles.modalSubtitle}>
						You've unlocked an exclusive offer
					</Text>

					{/* Wheel Placeholder */}
					<LinearGradient
						colors={["#3BAFDA", "#3EC9B5"]}
						end={{ x: 1, y: 1 }}
						start={{ x: 0, y: 0 }}
						style={styles.wheelCircle}
					>
						<Text style={styles.wheelEmoji}>🎡</Text>
					</LinearGradient>

					{/* Reward */}
					<View style={styles.rewardBox}>
						<Text style={styles.rewardPercent}>80% OFF</Text>
						<Text style={styles.rewardSave}>Save €10 Today!</Text>
						<Text style={styles.rewardNote}>
							€39.99 → €29.99/year (limited time)
						</Text>
					</View>

					{/* Timer */}
					<View style={styles.timerBox}>
						<Text style={styles.timerText}>⏰ Offer valid for 24 hours</Text>
					</View>

					<TouchableOpacity onPress={onClaim} style={styles.claimButton}>
						<LinearGradient
							colors={["#3BAFDA", "#3EC9B5"]}
							end={{ x: 1, y: 0 }}
							start={{ x: 0, y: 0 }}
							style={StyleSheet.absoluteFill}
						/>
						<Text style={styles.claimButtonText}>Claim Offer</Text>
					</TouchableOpacity>

					<TouchableOpacity onPress={onClose} style={styles.returnButton}>
						<Text style={styles.returnText}>Return to Pricing</Text>
					</TouchableOpacity>
				</SafeAreaView>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#ffffff",
	},
	scrollContent: {
		paddingBottom: 40,
	},
	// Header
	header: {
		paddingHorizontal: 24,
		paddingTop: 32,
		paddingBottom: 24,
	},
	headerTitle: {
		fontSize: 22,
		fontWeight: "700",
		color: "#0d2137",
		textAlign: "center",
		marginBottom: 8,
	},
	headerSubtitle: {
		fontSize: 14,
		color: "#64748b",
		textAlign: "center",
		lineHeight: 20,
	},
	// Pricing section
	section: {
		paddingHorizontal: 20,
		paddingTop: 24,
		gap: 12,
	},
	// Annual card
	annualCard: {
		borderRadius: 20,
		padding: 24,
		overflow: "hidden",
		position: "relative",
	},
	badge: {
		position: "absolute",
		top: 16,
		right: 16,
		backgroundColor: "#facc15",
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 4,
	},
	badgeText: {
		fontSize: 11,
		fontWeight: "700",
		color: "#1a1a1a",
	},
	planHeader: {
		marginBottom: 16,
		paddingRight: 90,
	},
	planTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#ffffff",
	},
	planSubtitle: {
		fontSize: 12,
		color: "rgba(255,255,255,0.85)",
		marginTop: 2,
	},
	priceRow: {
		flexDirection: "row",
		alignItems: "baseline",
		marginBottom: 4,
	},
	priceMain: {
		fontSize: 48,
		fontWeight: "800",
		color: "#ffffff",
	},
	pricePeriod: {
		fontSize: 18,
		color: "rgba(255,255,255,0.85)",
		marginLeft: 6,
	},
	priceNote: {
		fontSize: 12,
		color: "rgba(255,255,255,0.7)",
		marginBottom: 20,
	},
	benefitsList: {
		marginBottom: 20,
		gap: 6,
	},
	benefitRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	checkmark: {
		fontSize: 16,
		color: "#ffffff",
	},
	benefitText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#ffffff",
	},
	startButton: {
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 10,
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	startButtonText: {
		textAlign: "center",
		fontWeight: "700",
		color: "#ffffff",
		fontSize: 16,
	},
	// Monthly card
	monthlyCard: {
		borderRadius: 20,
		borderWidth: 2,
		borderColor: "#e2e8f0",
		backgroundColor: "#f8fafc",
		padding: 24,
	},
	monthlyTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#0d2137",
		marginBottom: 8,
	},
	monthlyPrice: {
		fontSize: 40,
		fontWeight: "800",
		color: "#0d2137",
	},
	monthlyPricePeriod: {
		fontSize: 18,
		color: "#64748b",
		marginLeft: 6,
	},
	monthlySubtitle: {
		fontSize: 12,
		color: "#64748b",
		marginBottom: 16,
	},
	monthlyButton: {
		backgroundColor: "#f0fdfa",
		borderRadius: 10,
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	monthlyButtonText: {
		textAlign: "center",
		fontWeight: "700",
		color: "#0d2137",
		fontSize: 16,
	},
	// Features
	featuresBox: {
		marginHorizontal: 20,
		marginTop: 24,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#bfdbfe",
		backgroundColor: "#eff6ff",
		padding: 16,
		gap: 6,
	},
	featuresTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "#1e3a8a",
		marginBottom: 4,
	},
	featureItem: {
		fontSize: 13,
		color: "#1e3a8a",
		lineHeight: 20,
	},
	// Trust badges
	trustRow: {
		flexDirection: "row",
		justifyContent: "center",
		paddingHorizontal: 20,
		marginTop: 24,
		gap: 32,
	},
	trustItem: {
		alignItems: "center",
	},
	trustIcon: {
		fontSize: 24,
		marginBottom: 4,
	},
	trustLabel: {
		fontSize: 11,
		color: "#64748b",
		textAlign: "center",
		lineHeight: 16,
	},
	// Decline
	declineButton: {
		marginHorizontal: 20,
		marginTop: 24,
		borderRadius: 12,
		backgroundColor: "#f1f5f9",
		paddingVertical: 14,
		paddingHorizontal: 24,
	},
	declineText: {
		textAlign: "center",
		fontWeight: "600",
		color: "#475569",
		fontSize: 15,
	},
	// Legal
	legal: {
		marginHorizontal: 24,
		marginTop: 16,
		fontSize: 11,
		color: "#94a3b8",
		textAlign: "center",
		lineHeight: 18,
	},
	// Modal
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.55)",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
	},
	modalCard: {
		width: "100%",
		backgroundColor: "#ffffff",
		borderRadius: 24,
		padding: 28,
		alignItems: "center",
	},
	modalEmoji: {
		fontSize: 36,
		marginBottom: 4,
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: "800",
		color: "#0d2137",
		marginBottom: 4,
	},
	modalSubtitle: {
		fontSize: 14,
		color: "#64748b",
		marginBottom: 20,
		textAlign: "center",
	},
	wheelCircle: {
		width: 140,
		height: 140,
		borderRadius: 70,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 24,
	},
	wheelEmoji: {
		fontSize: 56,
	},
	rewardBox: {
		width: "100%",
		backgroundColor: "#fefce8",
		borderWidth: 2,
		borderColor: "#fde047",
		borderRadius: 16,
		padding: 16,
		alignItems: "center",
		marginBottom: 12,
	},
	rewardPercent: {
		fontSize: 36,
		fontWeight: "800",
		color: "#ca8a04",
		marginBottom: 4,
	},
	rewardSave: {
		fontSize: 17,
		fontWeight: "700",
		color: "#0d2137",
		marginBottom: 4,
	},
	rewardNote: {
		fontSize: 13,
		color: "#64748b",
	},
	timerBox: {
		width: "100%",
		backgroundColor: "#fef2f2",
		borderRadius: 10,
		padding: 12,
		marginBottom: 20,
	},
	timerText: {
		textAlign: "center",
		fontWeight: "700",
		color: "#b91c1c",
		fontSize: 14,
	},
	claimButton: {
		width: "100%",
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
		overflow: "hidden",
		marginBottom: 12,
	},
	claimButtonText: {
		fontWeight: "700",
		color: "#ffffff",
		fontSize: 16,
	},
	returnButton: {
		paddingVertical: 8,
	},
	returnText: {
		fontWeight: "600",
		color: "#64748b",
		fontSize: 15,
	},
});
