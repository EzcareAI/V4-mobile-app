import Anthropic from "@anthropic-ai/sdk";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import {
	launchImageLibraryAsync,
	requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
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
import Svg, { Circle } from "react-native-svg";
import { useFoodDiaryStore } from "@/stores/food-diary-store";
import { useGamificationStore } from "@/stores/gamification-store";

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const anthropic = new Anthropic({
	apiKey: apiKey || "dummy",
	dangerouslyAllowBrowser: true,
});

const { width: SCREEN_W } = Dimensions.get("window");

// ── Cal AI-style data model ──
interface FoodItem {
	name: string;
	calories: number;
	servingSize: string;
}

interface MacroInfo {
	grams: number;
	goalGrams: number;
	color: string;
}

interface AnalysisResult {
	totalCalories: number;
	mealName: string;
	foods: FoodItem[];
	protein: MacroInfo;
	carbs: MacroInfo;
	fat: MacroInfo;
	tips: string[];
}

const MACRO_COLORS = {
	protein: "#FF6B6B",
	carbs: "#4ECDC4",
	fat: "#FFD93D",
};

const NUTRITION_DISCLAIMER = "Nutritional values shown are AI-generated estimates based on visual analysis. For personalized nutrition advice, consult a healthcare professional.";

// ── Circular Progress Ring Component ──
function MacroRing({
	label,
	grams,
	goalGrams,
	color,
	size = 90,
}: {
	label: string;
	grams: number;
	goalGrams: number;
	color: string;
	size?: number;
}) {
	const strokeWidth = 7;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const progress = Math.min(grams / goalGrams, 1);
	const strokeDashoffset = circumference * (1 - progress);

	return (
		<View style={{ alignItems: "center" }}>
			<View style={{ width: size, height: size }}>
				<Svg width={size} height={size}>
					<Circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke="rgba(255,255,255,0.08)"
						strokeWidth={strokeWidth}
						fill="transparent"
					/>
					<Circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke={color}
						strokeWidth={strokeWidth}
						fill="transparent"
						strokeDasharray={`${circumference} ${circumference}`}
						strokeDashoffset={strokeDashoffset}
						strokeLinecap="round"
						rotation="-90"
						origin={`${size / 2}, ${size / 2}`}
					/>
				</Svg>
				<View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
					<Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "800" }}>{grams}g</Text>
				</View>
			</View>
			<Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "600", marginTop: 6 }}>{label}</Text>
		</View>
	);
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

	const pickFromGallery = async () => {
		const { status } = await requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission required", "Photo library access is needed to pick a photo.");
			return;
		}
		const pickerResult = await launchImageLibraryAsync({
			base64: true,
			quality: 0.7,
			mediaTypes: "images",
		});
		if (!pickerResult.canceled && pickerResult.assets[0]) {
			const asset = pickerResult.assets[0];
			setPhotoUri(asset.uri);
			setPhotoBase64(asset.base64 ?? null);
			setMode("analyzing");
			analyzePhoto(asset.base64 ?? "");
		}
	};

	// Direct fetch to Anthropic API (bypasses SDK for Android/Hermes compatibility)
	const analyzeViaFetch = async (base64: string, systemPrompt: string): Promise<string> => {
		console.log("[MealScanner] analyzeViaFetch: apiKey length =", apiKey?.length ?? 0);
		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey!,
				"anthropic-version": "2023-06-01",
				"anthropic-dangerous-direct-browser-access": "true",
			},
			body: JSON.stringify({
				model: "claude-haiku-4-5-20251001",
				max_tokens: 1024,
				system: systemPrompt,
				messages: [{
					role: "user",
					content: [
						{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
						{ type: "text", text: "Analyze this food photo." },
					],
				}],
			}),
		});
		console.log("[MealScanner] analyzeViaFetch: status =", response.status);
		if (!response.ok) {
			const errBody = await response.text();
			console.error("[MealScanner] API error body:", errBody.slice(0, 500));
			throw new Error(`API error ${response.status}: ${errBody.slice(0, 200)}`);
		}
		const data = (await response.json()) as { content: { type: string; text: string }[] };
		return data.content[0]?.text ?? "";
	};

	const MEAL_SYSTEM_PROMPT = `You are a food calorie and macro analyzer. When shown a photo of food or a meal, identify each food item and estimate calories and macros.

IMPORTANT: This is for EDUCATIONAL and TRACKING purposes only. Estimates are approximate.

Respond in this exact JSON format (no markdown, no code blocks, just raw JSON):
{
  "totalCalories": 680,
  "mealName": "Grilled Chicken Bowl",
  "foods": [
    {"name": "Grilled Chicken Breast", "calories": 230, "servingSize": "6 oz"},
    {"name": "Brown Rice", "calories": 180, "servingSize": "1 cup"},
    {"name": "Mixed Vegetables", "calories": 80, "servingSize": "1 cup"},
    {"name": "Olive Oil Drizzle", "calories": 120, "servingSize": "1 tbsp"},
    {"name": "Side Salad", "calories": 70, "servingSize": "1 cup"}
  ],
  "protein": {"grams": 38, "goalGrams": 50, "color": "#FF6B6B"},
  "carbs": {"grams": 52, "goalGrams": 75, "color": "#4ECDC4"},
  "fat": {"grams": 33, "goalGrams": 65, "color": "#FFD93D"},
  "tips": ["Great protein source!", "Consider adding more greens"]
}

Rules:
- totalCalories must equal the sum of individual food calories
- Be realistic with portion sizes based on what you see
- goalGrams should use standard daily macro targets (protein: 50g per meal, carbs: 75g, fat: 65g)
- Keep food names short and clear
- If the photo is not food, set totalCalories to 0, mealName to "Not Food", empty foods array`;

	const analyzePhoto = async (base64: string) => {
		if (!apiKey || apiKey === "dummy") {
			setRawAnalysis("API key missing. Set EXPO_PUBLIC_ANTHROPIC_API_KEY and rebuild.");
			setMode("result");
			return;
		}

		let fullText = "";
		try {
			// Use direct fetch on Android (Hermes lacks ReadableStream for SDK streaming)
			if (Platform.OS === "android") {
				fullText = await analyzeViaFetch(base64, MEAL_SYSTEM_PROMPT);
			} else {
				try {
					const stream = anthropic.messages.stream({
						model: "claude-haiku-4-5-20251001",
						max_tokens: 1024,
						system: MEAL_SYSTEM_PROMPT,
						messages: [
							{
								role: "user",
								content: [
									{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
									{ type: "text", text: "Analyze this food photo." },
								],
							},
						],
					});

					stream.on("text", (text) => {
						fullText += text;
						setStreamText(fullText);
					});

					await stream.finalMessage();
				} catch (streamErr) {
					console.warn("[MealScanner] Streaming failed, using fetch fallback:", streamErr);
					setStreamText("");
					fullText = await analyzeViaFetch(base64, MEAL_SYSTEM_PROMPT);
				}
			}

			try {
				const jsonMatch = fullText.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					const parsed = JSON.parse(jsonMatch[0]) as AnalysisResult;
					setResult(parsed);

					// Auto-log to food diary
					useFoodDiaryStore.getState().logMeal({
						mealName: parsed.mealName,
						photoUri: photoUri,
						foods: parsed.foods.map((f, i) => ({
							id: `${Date.now()}-${i}`,
							name: f.name,
							calories: f.calories,
							servingSize: f.servingSize,
						})),
						totalCalories: parsed.totalCalories,
						protein: parsed.protein.grams,
						carbs: parsed.carbs.grams,
						fat: parsed.fat.grams,
					});

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
			console.error("[MealScanner] Analysis failed:", err);
			const errMsg = err instanceof Error ? err.message : String(err);
			setRawAnalysis(`Could not analyze: ${errMsg.slice(0, 150)}. Please check your connection and try again.`);
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
						EZCare needs camera access to scan your meals for calorie and macro estimates.
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

	// ── Result Screen (Cal AI Style) ──
	if (mode === "result") {
		return (
			<View style={styles.resultBg}>
				<ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
					{/* Food Photo - full width at top */}
					{photoUri && (
						<View style={styles.photoContainer}>
							<Image source={{ uri: photoUri }} style={styles.resultPhoto} resizeMode="cover" />
							<LinearGradient
								colors={["transparent", "rgba(11,14,23,0.6)", "#0B0E17"]}
								style={styles.photoGradient}
								pointerEvents="none"
							/>
							<SafeAreaView edges={["top"]} style={styles.resultHeaderOverlay}>
								<TouchableOpacity onPress={() => router.back()} style={styles.resultBackBtn}>
									<Ionicons color="#FFFFFF" name="chevron-back" size={22} />
								</TouchableOpacity>
								<TouchableOpacity onPress={retake} style={styles.resultRetakeBtn}>
									<Ionicons color="#FFFFFF" name="camera-outline" size={20} />
								</TouchableOpacity>
							</SafeAreaView>
						</View>
					)}

					{result ? (
						<View style={styles.resultBody}>
							{/* Meal Name & Total Calories */}
							<View style={styles.calHeader}>
								<Text style={styles.mealName}>{result.mealName}</Text>
								<View style={styles.calRow}>
									<Text style={styles.calNumber}>{result.totalCalories}</Text>
									<Text style={styles.calUnit}>cal</Text>
								</View>
							</View>

							{/* Macro Rings */}
							<View style={styles.macroRingsRow}>
								<MacroRing
									label="Protein"
									grams={result.protein.grams}
									goalGrams={result.protein.goalGrams}
									color={MACRO_COLORS.protein}
								/>
								<MacroRing
									label="Carbs"
									grams={result.carbs.grams}
									goalGrams={result.carbs.goalGrams}
									color={MACRO_COLORS.carbs}
								/>
								<MacroRing
									label="Fat"
									grams={result.fat.grams}
									goalGrams={result.fat.goalGrams}
									color={MACRO_COLORS.fat}
								/>
							</View>

							{/* Food Items List */}
							<View style={styles.foodListCard}>
								<Text style={styles.foodListTitle}>Food Items</Text>
								{result.foods.map((food, i) => (
									<View
										key={i}
										style={[
											styles.foodItem,
											i < result.foods.length - 1 && styles.foodItemBorder,
										]}
									>
										<View style={styles.foodItemDot} />
										<View style={styles.foodItemInfo}>
											<Text style={styles.foodItemName}>{food.name}</Text>
											<Text style={styles.foodItemServing}>{food.servingSize}</Text>
										</View>
										<Text style={styles.foodItemCal}>{food.calories} cal</Text>
									</View>
								))}
							</View>

							{/* Tips */}
							{result.tips.length > 0 && (
								<View style={styles.tipsCard}>
									<Ionicons color="#3EC9B5" name="bulb-outline" size={18} />
									<View style={{ flex: 1 }}>
										{result.tips.map((tip, i) => (
											<Text key={i} style={styles.tipText}>{tip}</Text>
										))}
									</View>
								</View>
							)}

							{/* Action Buttons */}
							<View style={styles.actionRow}>
								<TouchableOpacity onPress={retake} style={styles.scanAgainBtn}>
									<Ionicons color="#0B0E17" name="camera" size={20} />
									<Text style={styles.scanAgainText}>Scan Another</Text>
								</TouchableOpacity>
								<TouchableOpacity onPress={() => router.back()} style={styles.homeBtn}>
									<Ionicons color="#3EC9B5" name="home-outline" size={20} />
								</TouchableOpacity>
							</View>

							{/* Disclaimer */}
							<Text style={styles.disclaimerText}>{NUTRITION_DISCLAIMER}</Text>
						</View>
					) : (
						<View style={styles.resultBody}>
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
							<View style={styles.actionRow}>
								<TouchableOpacity onPress={retake} style={styles.scanAgainBtn}>
									<Ionicons color="#0B0E17" name="camera" size={20} />
									<Text style={styles.scanAgainText}>Try Again</Text>
								</TouchableOpacity>
								<TouchableOpacity onPress={() => router.back()} style={styles.homeBtn}>
									<Ionicons color="#3EC9B5" name="home-outline" size={20} />
								</TouchableOpacity>
							</View>
						</View>
					)}
				</ScrollView>
			</View>
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
							<Text style={styles.analyzingTitle}>Scanning your meal...</Text>
							<Text style={styles.analyzingSub}>
								{streamText.length > 0
									? "Almost done..."
									: "Identifying foods and estimating calories"}
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

			<LinearGradient
				colors={["rgba(11,14,23,0.85)", "transparent"]}
				pointerEvents="none"
				style={styles.topGrad}
			/>
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
					<Text style={styles.cameraHint}>Point at your meal</Text>
				</View>

				{/* Bottom controls */}
				<View style={styles.cameraBottom}>
					<TouchableOpacity activeOpacity={0.8} onPress={takePhoto} style={styles.shutterBtn}>
						<LinearGradient colors={["#28B898", "#3EC9B5"]} style={styles.shutterInner} />
						<Ionicons
							color="#0B0E17"
							name="scan-outline"
							size={28}
							style={{ position: "absolute" }}
						/>
					</TouchableOpacity>
					<Text style={styles.shutterLabel}>Tap to Scan</Text>
					<TouchableOpacity activeOpacity={0.8} onPress={pickFromGallery} style={styles.galleryBtn}>
						<Ionicons color="#FFFFFF" name="images-outline" size={22} />
						<Text style={styles.galleryBtnText}>Gallery</Text>
					</TouchableOpacity>
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
	galleryBtn: {
		flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16,
		backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 20, paddingVertical: 10,
		borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
	},
	galleryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
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
	// Result (Cal AI inspired)
	resultBg: { flex: 1, backgroundColor: "#0B0E17" },
	resultScroll: { paddingBottom: 40 },
	photoContainer: { position: "relative", width: "100%", height: 280 },
	resultPhoto: { width: "100%", height: "100%" },
	photoGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 120 },
	resultHeaderOverlay: {
		position: "absolute", top: 0, left: 0, right: 0,
		flexDirection: "row", justifyContent: "space-between",
		paddingHorizontal: 16, paddingTop: 8, zIndex: 10,
	},
	resultBackBtn: {
		width: 40, height: 40, borderRadius: 20,
		backgroundColor: "rgba(0,0,0,0.4)",
		alignItems: "center", justifyContent: "center",
	},
	resultRetakeBtn: {
		width: 40, height: 40, borderRadius: 20,
		backgroundColor: "rgba(0,0,0,0.4)",
		alignItems: "center", justifyContent: "center",
	},
	resultBody: { paddingHorizontal: 20, paddingTop: 4 },
	// Calorie Header
	calHeader: { alignItems: "center", marginBottom: 24 },
	mealName: { color: "#94A3B8", fontSize: 15, fontWeight: "600", marginBottom: 4 },
	calRow: { flexDirection: "row", alignItems: "baseline" },
	calNumber: { color: "#FFFFFF", fontSize: 56, fontWeight: "900", letterSpacing: -2 },
	calUnit: { color: "#94A3B8", fontSize: 22, fontWeight: "700", marginLeft: 4 },
	// Macro Rings
	macroRingsRow: {
		flexDirection: "row", justifyContent: "space-around",
		backgroundColor: "#1A2138", borderRadius: 20, padding: 20,
		marginBottom: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
	},
	// Food Items
	foodListCard: {
		backgroundColor: "#1A2138", borderRadius: 20, padding: 20,
		marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
	},
	foodListTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", marginBottom: 16 },
	foodItem: {
		flexDirection: "row", alignItems: "center",
		paddingVertical: 12,
	},
	foodItemBorder: {
		borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
	},
	foodItemDot: {
		width: 8, height: 8, borderRadius: 4,
		backgroundColor: "#3EC9B5", marginRight: 12,
	},
	foodItemInfo: { flex: 1 },
	foodItemName: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
	foodItemServing: { color: "#64748B", fontSize: 12, fontWeight: "500", marginTop: 2 },
	foodItemCal: { color: "#3EC9B5", fontSize: 15, fontWeight: "700" },
	// Tips
	tipsCard: {
		flexDirection: "row", alignItems: "flex-start", gap: 10,
		backgroundColor: "rgba(62,201,181,0.08)", borderRadius: 16,
		padding: 16, marginBottom: 20, borderWidth: 1,
		borderColor: "rgba(62,201,181,0.15)",
	},
	tipText: { color: "#94A3B8", fontSize: 13, lineHeight: 20, marginBottom: 2 },
	// Actions
	actionRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
	scanAgainBtn: {
		flex: 1, height: 52, borderRadius: 26,
		backgroundColor: "#3EC9B5",
		flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
	},
	scanAgainText: { color: "#0B0E17", fontSize: 15, fontWeight: "800" },
	homeBtn: {
		width: 52, height: 52, borderRadius: 26,
		borderWidth: 1.5, borderColor: "#3EC9B5",
		alignItems: "center", justifyContent: "center",
	},
	// Disclaimer
	disclaimerText: {
		color: "rgba(255,255,255,0.3)", fontSize: 10,
		textAlign: "center", lineHeight: 14, marginHorizontal: 10,
	},
	// Raw fallback
	rawCard: {
		backgroundColor: "#1A2138", borderRadius: 16, padding: 20,
		marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
	},
});
