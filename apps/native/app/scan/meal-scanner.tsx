import Anthropic from "@anthropic-ai/sdk";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	Image,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGamificationStore } from "@/stores/gamification-store";

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const anthropic = new Anthropic({
	apiKey: apiKey || "dummy",
	dangerouslyAllowBrowser: true,
});

const { width: SCREEN_W } = Dimensions.get("window");

interface MacroData {
	label: string;
	value: string;
	color: string;
	percent: number;
	icon: string;
}

interface AnalysisResult {
	plateScore: number;
	scoreLabel: string;
	summary: string;
	macros: MacroData[];
	tips: string[];
	lifestyleImpact: string;
}

const SCORE_COLORS: Record<string, string[]> = {
	great: ["#10B981", "#34D399"],
	good: ["#3EC9B5", "#6EE7B7"],
	fair: ["#F59E0B", "#FBBF24"],
	poor: ["#EF4444", "#F87171"],
};

function getScoreGradient(score: number): string[] {
	if (score >= 80) return SCORE_COLORS.great;
	if (score >= 60) return SCORE_COLORS.good;
	if (score >= 40) return SCORE_COLORS.fair;
	return SCORE_COLORS.poor;
}

export default function MealScannerScreen() {
	const [permission, requestPermission] = useCameraPermissions();
	const [mode, setMode] = useState<"camera" | "analyzing" | "result">("camera");
	const [photoUri, setPhotoUri] = useState<string | null>(null);
	const [photoBase64, setPhotoBase64] = useState<string | null>(null);
	const [result, setResult] = useState<AnalysisResult | null>(null);
	const [rawAnalysis, setRawAnalysis] = useState("");
	const [streamText, setStreamText] = useState("");
	const cameraRef = useRef<CameraView>(null);

	const takePhoto = async () => {
		if (!cameraRef.current) return;
		if (Platform.OS === "ios") {
			try { await impactAsync(ImpactFeedbackStyle.Heavy); } catch {}
		}

		try {
			const photo = await cameraRef.current.takePictureAsync({
				quality: 0.7,
				base64: true,
			});
			if (photo) {
				setPhotoUri(photo.uri);
				setPhotoBase64(photo.base64 ?? null);
				setMode("analyzing");
				analyzePhoto(photo.base64 ?? "");
			}
		} catch (err) {
			console.error("Camera capture failed:", err);
		}
	};

	const analyzePhoto = async (base64: string) => {
		if (!apiKey) {
			setRawAnalysis("API key missing. Set EXPO_PUBLIC_ANTHROPIC_API_KEY.");
			setMode("result");
			return;
		}

		try {
			const stream = anthropic.messages.stream({
				model: "claude-haiku-4-5-20251001",
				max_tokens: 1024,
				system: `You are a food and product analyzer for the EZCare lifestyle app. When shown a photo of food, a meal, or a packaged product:

1. Identify what's in the photo
2. Estimate the nutritional breakdown (approximate, educational only)
3. Give a "Plate Score" from 1-100 based on overall nutritional balance
4. Provide a lifestyle impact assessment (positive/negative habits)
5. Give 2-3 actionable tips

IMPORTANT: This is for EDUCATIONAL purposes only. You are NOT providing professional dietary advice. Always frame as "learning about nutrition" not "measuring health".

Respond in this exact JSON format (no markdown, no code blocks, just raw JSON):
{
  "plateScore": 75,
  "scoreLabel": "Good Balance",
  "summary": "A brief 1-sentence description of what you see",
  "macros": [
    {"label": "Protein", "value": "~25g", "color": "#EF4444", "percent": 30, "icon": "💪"},
    {"label": "Carbs", "value": "~45g", "color": "#3B82F6", "percent": 40, "icon": "🌾"},
    {"label": "Fats", "value": "~15g", "color": "#F59E0B", "percent": 20, "icon": "🥑"},
    {"label": "Fiber", "value": "~8g", "color": "#10B981", "percent": 10, "icon": "🥬"}
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "lifestyleImpact": "A fun, encouraging 1-sentence lifestyle impact like 'This meal fuels a productive afternoon!' or 'Swap the soda for water to level up your energy game.'"
}

If it's a packaged product, analyze the likely nutritional content and ingredients.
If the photo is not food-related, still respond with the JSON but set plateScore to 0, scoreLabel to "Not Food", and explain in summary.`,
				messages: [
					{
						role: "user",
						content: [
							{
								type: "image",
								source: { type: "base64", media_type: "image/jpeg", data: base64 },
							},
							{ type: "text", text: "Analyze this food/product photo." },
						],
					},
				],
			});

			let fullText = "";
			stream.on("text", (text) => {
				fullText += text;
				setStreamText(fullText);
			});

			await stream.finalMessage();

			try {
				// Try to parse JSON from the response
				const jsonMatch = fullText.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					const parsed = JSON.parse(jsonMatch[0]) as AnalysisResult;
					setResult(parsed);
					// Track meal scan for gamification
					const gamStore = useGamificationStore.getState();
					gamStore.incrementStat("totalMealsScanned");
					gamStore.addXp(50);
					gamStore.addCoins(10);
					gamStore.updateChallengeProgress("dc_scan", 1);
				} else {
					setRawAnalysis(fullText);
				}
			} catch {
				setRawAnalysis(fullText);
			}
			setMode("result");
		} catch (err) {
			setRawAnalysis("Could not analyze. Check your connection and try again.");
			setMode("result");
		}
	};

	const retake = () => {
		setPhotoUri(null);
		setPhotoBase64(null);
		setResult(null);
		setRawAnalysis("");
		setStreamText("");
		setMode("camera");
	};

	if (!permission) return <View style={styles.bg} />;

	if (!permission.granted) {
		return (
			<SafeAreaView style={styles.bg}>
				<View style={styles.permBox}>
					<View style={styles.permIconWrap}>
						<Ionicons color="#3EC9B5" name="camera-outline" size={48} />
					</View>
					<Text style={styles.permTitle}>Camera Access</Text>
					<Text style={styles.permSub}>
						EZCare needs camera access to scan your meals and products for educational insights.
					</Text>
					<TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
						<LinearGradient colors={["#28B898", "#3EC9B5"]} style={StyleSheet.absoluteFill} />
						<Text style={styles.permBtnText}>Continue</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => router.back()} style={styles.permSkip}>
						<Text style={styles.permSkipText}>Not Now</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	// ── Result Screen ──
	if (mode === "result") {
		return (
			<SafeAreaView edges={["top"]} style={styles.resultSafe}>
				<ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
					{/* Header */}
					<View style={styles.resultHeader}>
						<TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
							<Ionicons color="#FFFFFF" name="close" size={22} />
						</TouchableOpacity>
						<Text style={styles.resultHeaderTitle}>Meal Insights</Text>
						<TouchableOpacity onPress={retake} style={styles.retakeBtn}>
							<Ionicons color="#3EC9B5" name="camera-outline" size={20} />
						</TouchableOpacity>
					</View>

					{/* Photo */}
					{photoUri && (
						<View style={styles.photoCard}>
							<Image source={{ uri: photoUri }} style={styles.resultPhoto} resizeMode="cover" />
						</View>
					)}

					{result ? (
						<>
							{/* Plate Score */}
							<View style={styles.scoreCard}>
								<LinearGradient
									colors={getScoreGradient(result.plateScore)}
									style={styles.scoreGradient}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 1 }}
								>
									<Text style={styles.scoreNumber}>{result.plateScore}</Text>
									<Text style={styles.scoreMax}>/100</Text>
								</LinearGradient>
								<View style={styles.scoreInfo}>
									<Text style={styles.scoreLabel}>{result.scoreLabel}</Text>
									<Text style={styles.scoreSummary}>{result.summary}</Text>
								</View>
							</View>

							{/* Lifestyle Impact */}
							<View style={styles.impactCard}>
								<Text style={styles.impactIcon}>⚡</Text>
								<Text style={styles.impactText}>{result.lifestyleImpact}</Text>
							</View>

							{/* Macro Breakdown */}
							<Text style={styles.sectionTitle}>Nutritional Breakdown</Text>
							<View style={styles.macroGrid}>
								{result.macros.map((macro) => (
									<View key={macro.label} style={styles.macroCard}>
										<Text style={styles.macroIcon}>{macro.icon}</Text>
										<Text style={styles.macroLabel}>{macro.label}</Text>
										<Text style={[styles.macroValue, { color: macro.color }]}>
											{macro.value}
										</Text>
										<View style={styles.macroBar}>
											<View
												style={[
													styles.macroBarFill,
													{
														backgroundColor: macro.color,
														width: `${Math.min(macro.percent, 100)}%`,
													},
												]}
											/>
										</View>
										<Text style={styles.macroPercent}>{macro.percent}%</Text>
									</View>
								))}
							</View>

							{/* Tips */}
							<Text style={styles.sectionTitle}>Tips to Level Up</Text>
							{result.tips.map((tip, i) => (
								<View key={i} style={styles.tipCard}>
									<View style={styles.tipNumber}>
										<Text style={styles.tipNumberText}>{i + 1}</Text>
									</View>
									<Text style={styles.tipText}>{tip}</Text>
								</View>
							))}

							{/* Disclaimer */}
							<View style={styles.disclaimer}>
								<Ionicons color="#D97706" name="information-circle" size={16} />
								<Text style={styles.disclaimerText}>
									Educational estimate only. Not a substitute for professional dietary advice.
								</Text>
							</View>
						</>
					) : (
						<View style={styles.rawCard}>
							<Markdown
								style={{
									body: { color: "#E2E8F0", fontSize: 15, lineHeight: 22 },
									strong: { fontWeight: "bold", color: "#FFFFFF" },
								}}
							>
								{rawAnalysis}
							</Markdown>
						</View>
					)}

					{/* Action Buttons */}
					<View style={styles.actionRow}>
						<TouchableOpacity onPress={retake} style={styles.actionBtn}>
							<LinearGradient colors={["#28B898", "#3EC9B5"]} style={StyleSheet.absoluteFill} />
							<Ionicons color="#0B0E17" name="camera" size={20} />
							<Text style={styles.actionBtnText}>Scan Another</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => router.back()} style={styles.actionBtnOutline}>
							<Ionicons color="#3EC9B5" name="home" size={20} />
							<Text style={styles.actionBtnOutlineText}>Home</Text>
						</TouchableOpacity>
					</View>

					{/* Educational Disclaimer */}
					<Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textAlign: "center", marginTop: 16, marginHorizontal: 20, lineHeight: 14 }}>
						For educational purposes only. Nutritional estimates are approximate and not a substitute for professional dietary advice.
					</Text>
				</ScrollView>
			</SafeAreaView>
		);
	}

	// ── Analyzing Screen ──
	if (mode === "analyzing") {
		return (
			<SafeAreaView style={styles.bg}>
				<View style={styles.analyzingContainer}>
					{photoUri && (
						<Image
							source={{ uri: photoUri }}
							style={styles.analyzingPhoto}
							resizeMode="cover"
							blurRadius={10}
						/>
					)}
					<View style={styles.analyzingOverlay}>
						<View style={styles.analyzingCard}>
							<ActivityIndicator color="#3EC9B5" size="large" />
							<Text style={styles.analyzingTitle}>Analyzing your meal...</Text>
							<Text style={styles.analyzingSub}>
								{streamText.length > 0
									? "Almost done..."
									: "Our AI is identifying ingredients and nutrients"}
							</Text>
						</View>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	// ── Camera Screen ──
	return (
		<View style={styles.cameraWrap}>
			<CameraView facing="back" ref={cameraRef} style={StyleSheet.absoluteFill} />

			{/* Top gradient */}
			<LinearGradient
				colors={["rgba(11,14,23,0.85)", "transparent"]}
				pointerEvents="none"
				style={styles.topGrad}
			/>
			{/* Bottom gradient */}
			<LinearGradient
				colors={["transparent", "rgba(11,14,23,0.9)", "#0B0E17"]}
				pointerEvents="none"
				style={styles.bottomGrad}
			/>

			<SafeAreaView edges={["top", "bottom"]} style={styles.cameraSafe}>
				{/* Header */}
				<View style={styles.cameraHeader}>
					<TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
						<Ionicons color="#FFFFFF" name="close" size={22} />
					</TouchableOpacity>
					<View style={styles.headerPill}>
						<Ionicons color="#3EC9B5" name="nutrition-outline" size={16} />
						<Text style={styles.headerPillText}>Meal Scanner</Text>
					</View>
					<View style={{ width: 40 }} />
				</View>

				{/* Center guide */}
				<View style={styles.cameraCenter}>
					<View style={styles.scanFrame}>
						<View style={[styles.corner, styles.tl]} />
						<View style={[styles.corner, styles.tr]} />
						<View style={[styles.corner, styles.bl]} />
						<View style={[styles.corner, styles.br]} />
					</View>
					<Text style={styles.cameraHint}>
						Point at your meal or product
					</Text>
				</View>

				{/* Bottom controls */}
				<View style={styles.cameraBottom}>
					<TouchableOpacity activeOpacity={0.8} onPress={takePhoto} style={styles.shutterBtn}>
						<LinearGradient
							colors={["#28B898", "#3EC9B5"]}
							style={styles.shutterInner}
						/>
						<Ionicons
							color="#0B0E17"
							name="scan-outline"
							size={28}
							style={{ position: "absolute" }}
						/>
					</TouchableOpacity>
					<Text style={styles.shutterLabel}>Tap to Scan</Text>
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	bg: { flex: 1, backgroundColor: "#0B0E17" },
	// Permission
	permBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
	permIconWrap: {
		width: 100, height: 100, borderRadius: 50,
		backgroundColor: "rgba(62,201,181,0.15)",
		alignItems: "center", justifyContent: "center", marginBottom: 24,
	},
	permTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", marginBottom: 8 },
	permSub: { color: "#94A3B8", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 32 },
	permBtn: {
		width: "100%", height: 56, borderRadius: 28,
		alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 12,
	},
	permBtnText: { color: "#0B0E17", fontSize: 16, fontWeight: "800" },
	permSkip: { padding: 12 },
	permSkipText: { color: "#94A3B8", fontSize: 15, fontWeight: "600" },
	// Camera
	cameraWrap: { flex: 1, backgroundColor: "#0B0E17" },
	cameraSafe: { flex: 1, justifyContent: "space-between" },
	topGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 140, zIndex: 1 },
	bottomGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 200, zIndex: 1 },
	cameraHeader: {
		flexDirection: "row", alignItems: "center", justifyContent: "space-between",
		paddingHorizontal: 20, paddingTop: 10, zIndex: 10,
	},
	closeBtn: {
		width: 40, height: 40, borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.1)",
		alignItems: "center", justifyContent: "center",
	},
	headerPill: {
		flexDirection: "row", alignItems: "center", gap: 6,
		backgroundColor: "rgba(62,201,181,0.15)",
		paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
		borderWidth: 1, borderColor: "rgba(62,201,181,0.3)",
	},
	headerPillText: { color: "#3EC9B5", fontSize: 14, fontWeight: "700" },
	cameraCenter: { flex: 1, alignItems: "center", justifyContent: "center", zIndex: 10 },
	scanFrame: {
		width: SCREEN_W * 0.75, height: SCREEN_W * 0.75,
		position: "relative",
	},
	corner: { position: "absolute", width: 32, height: 32, borderColor: "#3EC9B5" },
	tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
	tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
	bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
	br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
	cameraHint: {
		color: "#FFFFFF", fontSize: 15, fontWeight: "500",
		marginTop: 20, textShadowColor: "rgba(0,0,0,0.5)",
		textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
	},
	cameraBottom: { alignItems: "center", paddingBottom: 40, zIndex: 10 },
	shutterBtn: {
		width: 80, height: 80, borderRadius: 40,
		alignItems: "center", justifyContent: "center",
		borderWidth: 4, borderColor: "#FFFFFF",
		overflow: "hidden",
	},
	shutterInner: { ...StyleSheet.absoluteFillObject },
	shutterLabel: { color: "#94A3B8", fontSize: 13, fontWeight: "600", marginTop: 12 },
	// Analyzing
	analyzingContainer: { flex: 1, position: "relative" },
	analyzingPhoto: { ...StyleSheet.absoluteFillObject },
	analyzingOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(11,14,23,0.8)",
		alignItems: "center", justifyContent: "center",
	},
	analyzingCard: {
		backgroundColor: "#1A2138", borderRadius: 24, padding: 32,
		alignItems: "center", gap: 16, borderWidth: 1,
		borderColor: "rgba(62,201,181,0.2)", width: SCREEN_W * 0.8,
	},
	analyzingTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
	analyzingSub: { color: "#94A3B8", fontSize: 14, textAlign: "center" },
	// Result
	resultSafe: { flex: 1, backgroundColor: "#0B0E17" },
	resultContent: { padding: 20, paddingBottom: 40 },
	resultHeader: {
		flexDirection: "row", alignItems: "center", justifyContent: "space-between",
		marginBottom: 20,
	},
	resultHeaderTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
	retakeBtn: {
		width: 40, height: 40, borderRadius: 20,
		backgroundColor: "rgba(62,201,181,0.15)",
		alignItems: "center", justifyContent: "center",
	},
	photoCard: { borderRadius: 20, overflow: "hidden", marginBottom: 20 },
	resultPhoto: { width: "100%", height: 200, borderRadius: 20 },
	// Score
	scoreCard: {
		flexDirection: "row", alignItems: "center", gap: 16,
		backgroundColor: "#1A2138", borderRadius: 20, padding: 20,
		marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
	},
	scoreGradient: {
		width: 80, height: 80, borderRadius: 40,
		alignItems: "center", justifyContent: "center",
	},
	scoreNumber: { color: "#FFFFFF", fontSize: 32, fontWeight: "900", lineHeight: 36 },
	scoreMax: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700" },
	scoreInfo: { flex: 1 },
	scoreLabel: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginBottom: 4 },
	scoreSummary: { color: "#94A3B8", fontSize: 14, lineHeight: 20 },
	// Impact
	impactCard: {
		flexDirection: "row", alignItems: "center", gap: 12,
		backgroundColor: "rgba(62,201,181,0.1)", borderRadius: 16,
		padding: 16, marginBottom: 24, borderWidth: 1,
		borderColor: "rgba(62,201,181,0.2)",
	},
	impactIcon: { fontSize: 24 },
	impactText: { flex: 1, color: "#3EC9B5", fontSize: 14, fontWeight: "600", lineHeight: 20 },
	// Macros
	sectionTitle: {
		color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginBottom: 12,
	},
	macroGrid: {
		flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24,
	},
	macroCard: {
		width: (SCREEN_W - 52) / 2, backgroundColor: "#1A2138",
		borderRadius: 16, padding: 16, borderWidth: 1,
		borderColor: "rgba(255,255,255,0.06)",
	},
	macroIcon: { fontSize: 20, marginBottom: 8 },
	macroLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "600", marginBottom: 4 },
	macroValue: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
	macroBar: {
		height: 6, backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 3, overflow: "hidden", marginBottom: 4,
	},
	macroBarFill: { height: "100%", borderRadius: 3 },
	macroPercent: { color: "#94A3B8", fontSize: 11, fontWeight: "600" },
	// Tips
	tipCard: {
		flexDirection: "row", alignItems: "flex-start", gap: 12,
		backgroundColor: "#1A2138", borderRadius: 16, padding: 16,
		marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
	},
	tipNumber: {
		width: 28, height: 28, borderRadius: 14,
		backgroundColor: "rgba(62,201,181,0.15)",
		alignItems: "center", justifyContent: "center",
	},
	tipNumberText: { color: "#3EC9B5", fontSize: 14, fontWeight: "800" },
	tipText: { flex: 1, color: "#E2E8F0", fontSize: 14, lineHeight: 20 },
	// Disclaimer
	disclaimer: {
		flexDirection: "row", alignItems: "center", gap: 8,
		backgroundColor: "rgba(217,119,6,0.1)", borderRadius: 12,
		padding: 12, marginTop: 16, marginBottom: 24,
	},
	disclaimerText: { flex: 1, color: "#D97706", fontSize: 11, lineHeight: 16 },
	// Raw fallback
	rawCard: {
		backgroundColor: "#1A2138", borderRadius: 16, padding: 20,
		marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
	},
	// Actions
	actionRow: { flexDirection: "row", gap: 12 },
	actionBtn: {
		flex: 1, height: 52, borderRadius: 26,
		flexDirection: "row", alignItems: "center", justifyContent: "center",
		gap: 8, overflow: "hidden",
	},
	actionBtnText: { color: "#0B0E17", fontSize: 15, fontWeight: "800" },
	actionBtnOutline: {
		flex: 1, height: 52, borderRadius: 26,
		flexDirection: "row", alignItems: "center", justifyContent: "center",
		gap: 8, borderWidth: 1.5, borderColor: "#3EC9B5",
	},
	actionBtnOutlineText: { color: "#3EC9B5", fontSize: 15, fontWeight: "800" },
});
