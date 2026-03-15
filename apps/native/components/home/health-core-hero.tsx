import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Flame, Heart } from "lucide-react-native";
import { lazy, Suspense } from "react";
import {
	ActivityIndicator,
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Svg, {
	Circle,
	Defs,
	Stop,
	LinearGradient as SvgLinearGradient,
} from "react-native-svg";
import { useOnboardingStore } from "@/stores/onboarding-store";

// Lazy-load so @react-three/fiber/native is NOT evaluated at module load time.
// Direct imports resolve to `undefined` in production APKs, causing the crash.
const Body3DSelector = lazy(
	() => import("@/components/onboarding/common/body-3d-selector")
);

const RING_RADIUS = 88;
const RING_STROKE = 12;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_SIZE = 220;
const CENTER = RING_SIZE / 2;

interface Props {
	streak: number;
	score: number;
}

export function HealthCoreHero({ streak, score }: Props) {
	const { firstName, bodyZoneSelected, setAnswer } = useOnboardingStore();

	// Score is 30–95 range; map it to ring progress 0.3–1.0 for visual appeal
	const normalizedProgress = Math.max(0.05, Math.min(1, score / 100));
	const strokeDashoffset =
		RING_CIRCUMFERENCE - normalizedProgress * RING_CIRCUMFERENCE;

	const handleScan = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {
				/* ignore */
			}
		}
		setAnswer("scanMode", "home");
		if (bodyZoneSelected && bodyZoneSelected.length > 0) {
			router.push("/scan/body-questions?mode=zone");
		} else {
			router.push("/scan/body-scan");
		}
	};

	const greetingHour = new Date().getHours();
	const greeting =
		greetingHour < 12
			? "Good morning"
			: greetingHour < 17
				? "Good afternoon"
				: "Good evening";

	return (
		<View style={styles.container}>
			{/* Header Row */}
			<View style={styles.headerRow}>
				<View>
					<Text style={styles.greeting}>{greeting} 👋</Text>
					<Text style={styles.name}>{firstName ?? "there"}</Text>
				</View>
				<View style={styles.streakPill}>
					<Flame color="#FF4F6E" fill="#FF4F6E" size={14} />
					<Text style={styles.streakText}>{streak} day streak</Text>
				</View>
			</View>

			{/* Health Core Ring */}
			<View style={styles.ringWrapper}>
				<Svg
					height={RING_SIZE}
					style={StyleSheet.absoluteFillObject}
					viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
					width={RING_SIZE}
				>
					<Defs>
						<SvgLinearGradient id="healthGrad" x1="0" x2="1" y1="0" y2="1">
							<Stop offset="0" stopColor="#28B898" stopOpacity="1" />
							<Stop offset="1" stopColor="#3EC9B5" stopOpacity="1" />
						</SvgLinearGradient>
					</Defs>
					{/* Track ring */}
					<Circle
						cx={CENTER}
						cy={CENTER}
						fill="none"
						r={RING_RADIUS}
						stroke="rgba(255,255,255,0.06)"
						strokeWidth={RING_STROKE}
					/>
					{/* Progress ring */}
					<Circle
						cx={CENTER}
						cy={CENTER}
						fill="none"
						r={RING_RADIUS}
						stroke="url(#healthGrad)"
						strokeDasharray={RING_CIRCUMFERENCE}
						strokeDashoffset={strokeDashoffset}
						strokeLinecap="round"
						strokeWidth={RING_STROKE}
						transform={`rotate(-90 ${CENTER} ${CENTER})`}
					/>
				</Svg>

				{/* Inner Body Silhouette */}
				<View style={styles.innerContent}>
					<Text style={styles.scoreLabel}>Health Core</Text>
					<Text style={styles.scoreValue}>{score}</Text>
					<Text style={styles.scoreMax}>/ 100</Text>

					{/* Mini Body Map Preview */}
					<View style={styles.miniBodyWrapper}>
						<Suspense
							fallback={<ActivityIndicator color="#3EC9B5" size="small" />}
						>
							<Body3DSelector
								onChange={(zones) => {
									setAnswer("bodyZoneSelected", zones);
									if (zones.length > 0) {
										setAnswer("intentType", "zone");
									}
								}}
								value={bodyZoneSelected}
							/>
						</Suspense>
					</View>
				</View>
			</View>

			{/* Heart pulse indicator */}
			<View style={styles.vitalRow}>
				<Heart color="#FF4F6E" fill="#FF4F6E" size={14} />
				<Text style={styles.vitalText}>
					Scan your body to refresh your score
				</Text>
			</View>

			{/* CTA Button */}
			<TouchableOpacity
				activeOpacity={0.9}
				onPress={handleScan}
				style={styles.ctaButton}
			>
				<LinearGradient
					colors={["#28B898", "#3EC9B5"]}
					end={{ x: 1, y: 0.5 }}
					start={{ x: 0, y: 0.5 }}
					style={StyleSheet.absoluteFill}
				/>
				<Text style={styles.ctaText}>Scan My Body</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		paddingTop: 24,
		paddingBottom: 8,
		paddingHorizontal: 24,
	},
	headerRow: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 32,
	},
	greeting: {
		color: "#94A3B8",
		fontSize: 13,
		fontWeight: "500",
	},
	name: {
		color: "#FFFFFF",
		fontSize: 22,
		fontWeight: "800",
		marginTop: 2,
	},
	streakPill: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#1A2138",
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.07)",
		paddingHorizontal: 14,
		paddingVertical: 8,
		gap: 6,
	},
	streakText: {
		color: "#FFFFFF",
		fontSize: 13,
		fontWeight: "700",
	},
	ringWrapper: {
		width: RING_SIZE,
		height: RING_SIZE,
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
	},
	innerContent: {
		alignItems: "center",
		justifyContent: "center",
	},
	scoreLabel: {
		color: "#94A3B8",
		fontSize: 10,
		fontWeight: "800",
		letterSpacing: 1.5,
		textTransform: "uppercase",
		marginBottom: 2,
	},
	scoreValue: {
		color: "#FFFFFF",
		fontSize: 44,
		fontWeight: "900",
		letterSpacing: -2,
		lineHeight: 50,
	},
	scoreMax: {
		color: "#94A3B8",
		fontSize: 12,
		fontWeight: "600",
	},
	miniBodyWrapper: {
		width: 80,
		height: 64,
		marginTop: 6,
		overflow: "hidden",
		borderRadius: 8,
	},
	vitalRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 16,
		marginBottom: 20,
	},
	vitalText: {
		color: "#94A3B8",
		fontSize: 12,
	},
	ctaButton: {
		width: 220,
		height: 52,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
		shadowColor: "#3EC9B5",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.35,
		shadowRadius: 14,
	},
	ctaText: {
		color: "#0B0E17",
		fontSize: 14,
		fontWeight: "900",
		letterSpacing: 1.5,
		textTransform: "uppercase",
	},
});
