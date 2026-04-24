import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/stores/onboarding-store";

const { width } = Dimensions.get("window");
const RETICLE_SIZE = width * 0.75;

export default function BodyScanScreen() {
	const [permission, requestPermission] = useCameraPermissions();
	const [isScanning, setIsScanning] = useState(false);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const { computeHealthScore } = useOnboardingStore();
	const cameraRef = useRef<CameraView>(null);

	const scanLineY = useSharedValue(0);

	// Start scanning animation loop when active
	useEffect(() => {
		if (isScanning) {
			scanLineY.value = withRepeat(
				withSequence(
					withTiming(RETICLE_SIZE - 4, {
						duration: 1500,
						easing: Easing.inOut(Easing.ease),
					}),
					withTiming(0, {
						duration: 1500,
						easing: Easing.inOut(Easing.ease),
					})
				),
				-1,
				true
			);
		} else {
			scanLineY.value = withTiming(0, { duration: 300 });
		}
	}, [isScanning, scanLineY]);

	const animatedLineStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: scanLineY.value }],
		opacity: isScanning ? 1 : 0,
	}));

	if (!permission) {
		return <View style={styles.container} />;
	}

	if (!permission.granted) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.permissionBox}>
					<Ionicons color="#3EC9B5" name="camera-outline" size={64} />
					<Text style={styles.permissionTitle}>Camera Access Required</Text>
					<Text style={styles.permissionSub}>
						EZCare AI needs camera access for the AR body awareness
						feature.
					</Text>
					<TouchableOpacity
						onPress={requestPermission}
						style={styles.primaryBtn}
					>
						<Text style={styles.primaryBtnText}>Continue</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	const handleAction = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {}
		}

		if (!isScanning && cameraRef.current) {
			setIsScanning(true);

			// 1. Actually trigger the camera hardware to take a hi-res snapshot
			try {
				const _photo = await cameraRef.current.takePictureAsync({
					quality: 0.8,
					base64: true,
				});

				if (Platform.OS === "ios") {
					try {
						await impactAsync(ImpactFeedbackStyle.Heavy);
					} catch {}
				}

				setIsScanning(false);
				setIsAnalyzing(true);

				// 2. Here we would normally send `photo.base64` to an AI model.
				// Now we pass it to the analysis screen for a vision-augmented check.
				computeHealthScore();

				if (Platform.OS === "ios") {
					try {
						await impactAsync(ImpactFeedbackStyle.Light);
					} catch {}
				}

				// Navigate to Analyze Symptoms with the image
				router.push({
					pathname: "/(dashboard)/analyze-symptoms",
					params: { imageBase64: _photo.base64 },
				} as any);
			} catch (error) {
				console.error("Camera capture failed", error);
				setIsScanning(false);
			}
		}
	};

	return (
		<View style={styles.wrapper}>
			{/* live camera feed */}
			<CameraView
				facing="back"
				ref={cameraRef}
				style={StyleSheet.absoluteFill}
			/>

			{/* overlay dark gradients */}
			<LinearGradient
				colors={["rgba(11,14,23,0.9)", "transparent"]}
				pointerEvents="none"
				style={styles.topGradient}
			/>
			<LinearGradient
				colors={["transparent", "rgba(11,14,23,0.9)", "#0B0E17"]}
				pointerEvents="none"
				style={styles.bottomGradient}
			/>

			<SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
				{/* Top Nav */}
				<View style={styles.header}>
					<TouchableOpacity
						hitSlop={8}
						onPress={() => {
							if (router.canGoBack()) {
								router.dismissAll();
							} else {
								router.replace("/");
							}
						}}
						style={styles.backBtn}
					>
						<Ionicons color="#FFFFFF" name="close" size={24} />
					</TouchableOpacity>
					<View style={styles.headerPill}>
						<Ionicons color="#3EC9B5" name="scan-outline" size={14} />
						<Text style={styles.headerPillText}>AR Body Awareness</Text>
					</View>
					<View style={styles.spacer} />
				</View>

				{/* Center Reticle */}
				<View style={styles.centerSection}>
					<View style={styles.reticleWrapper}>
						{/* Four corner brackets */}
						<View style={[styles.corner, styles.tl]} />
						<View style={[styles.corner, styles.tr]} />
						<View style={[styles.corner, styles.bl]} />
						<View style={[styles.corner, styles.br]} />

						{/* Animated scanning laser line */}
						<Animated.View style={[styles.laserLine, animatedLineStyle]} />

						{isAnalyzing && (
							<View style={styles.analyzingOverlay}>
								<ActivityIndicator color="#3EC9B5" size="large" />
								<Text style={styles.analyzingText}>
									Processing your input...
								</Text>
							</View>
						)}
					</View>
				</View>

				{/* Bottom Controls */}
				<View style={styles.bottomSection}>
					{!(isScanning || isAnalyzing) && (
						<Text style={styles.instruction}>
							Position full body inside the frame
						</Text>
					)}
					{isScanning && (
						<Text style={styles.instructionActive}>
							Analyzing your input...
						</Text>
					)}

					<TouchableOpacity
						activeOpacity={0.8}
						disabled={isScanning || isAnalyzing}
						onPress={handleAction}
						style={styles.shutterBtn}
					>
						{isScanning ? (
							<View style={styles.shutterScanning} />
						) : isAnalyzing ? (
							<Ionicons color="#0B0E17" name="checkmark" size={32} />
						) : (
							<View style={styles.shutterIdle} />
						)}
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: "#0B0E17",
	},
	safe: {
		flex: 1,
		justifyContent: "space-between",
	},
	topGradient: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 140,
		zIndex: 1,
	},
	bottomGradient: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		height: 240,
		zIndex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingTop: 10,
		zIndex: 10,
	},
	backBtn: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "rgba(255,255,255,0.1)",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",
	},
	headerPill: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(62,201,181,0.15)",
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "rgba(62,201,181,0.3)",
		gap: 6,
	},
	headerPillText: {
		color: "#3EC9B5",
		fontSize: 13,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	spacer: {
		width: 44,
	},
	centerSection: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		zIndex: 10,
	},
	reticleWrapper: {
		width: RETICLE_SIZE,
		height: RETICLE_SIZE * 1.3,
		position: "relative",
	},
	corner: {
		position: "absolute",
		width: 40,
		height: 40,
		borderColor: "#3EC9B5",
	},
	tl: {
		top: 0,
		left: 0,
		borderTopWidth: 4,
		borderLeftWidth: 4,
		borderTopLeftRadius: 16,
	},
	tr: {
		top: 0,
		right: 0,
		borderTopWidth: 4,
		borderRightWidth: 4,
		borderTopRightRadius: 16,
	},
	bl: {
		bottom: 0,
		left: 0,
		borderBottomWidth: 4,
		borderLeftWidth: 4,
		borderBottomLeftRadius: 16,
	},
	br: {
		bottom: 0,
		right: 0,
		borderBottomWidth: 4,
		borderRightWidth: 4,
		borderBottomRightRadius: 16,
	},
	laserLine: {
		position: "absolute",
		top: 0,
		left: 10,
		right: 10,
		height: 2,
		backgroundColor: "#3EC9B5",
		shadowColor: "#3EC9B5",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 1,
		shadowRadius: 10,
		elevation: 10,
	},
	analyzingOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(11,14,23,0.7)",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 16,
		gap: 16,
	},
	analyzingText: {
		color: "#3EC9B5",
		fontSize: 14,
		fontWeight: "600",
	},
	bottomSection: {
		alignItems: "center",
		paddingBottom: 40,
		zIndex: 10,
	},
	instruction: {
		color: "#FFFFFF",
		fontSize: 15,
		fontWeight: "500",
		marginBottom: 24,
		textShadowColor: "rgba(0,0,0,0.5)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 4,
	},
	instructionActive: {
		color: "#3EC9B5",
		fontSize: 15,
		fontWeight: "700",
		marginBottom: 24,
		letterSpacing: 0.5,
	},
	shutterBtn: {
		width: 76,
		height: 76,
		borderRadius: 38,
		backgroundColor: "rgba(255,255,255,0.2)",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 4,
		borderColor: "#FFFFFF",
	},
	shutterIdle: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "#FFFFFF",
	},
	shutterScanning: {
		width: 32,
		height: 32,
		borderRadius: 6,
		backgroundColor: "#FF4F6E",
	},
	// Perms
	container: {
		flex: 1,
		backgroundColor: "#0B0E17",
	},
	permissionBox: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 40,
	},
	permissionTitle: {
		color: "#FFFFFF",
		fontSize: 22,
		fontWeight: "800",
		marginTop: 20,
		marginBottom: 8,
	},
	permissionSub: {
		color: "#94A3B8",
		fontSize: 15,
		textAlign: "center",
		lineHeight: 22,
		marginBottom: 32,
	},
	primaryBtn: {
		backgroundColor: "#3EC9B5",
		width: "100%",
		paddingVertical: 16,
		borderRadius: 999,
		alignItems: "center",
		marginBottom: 12,
	},
	primaryBtnText: {
		color: "#0B0E17",
		fontSize: 16,
		fontWeight: "700",
	},
	ghostBtn: {
		width: "100%",
		paddingVertical: 16,
		borderRadius: 999,
		alignItems: "center",
	},
	ghostBtnText: {
		color: "#94A3B8",
		fontSize: 16,
		fontWeight: "600",
	},
});
