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
import { useGamificationStore } from "@/stores/gamification-store";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { levelsService } from "@/lib/levels-service";
import { streakService } from "@/lib/streak-service";
import { supabase } from "@/lib/supabase";
import { env } from "@ezcare/env/native";

// Supabase Edge Function that proxies Anthropic — keeps the API key off the
// client. See packages/db/supabase/functions/anthropic-proxy/.
const PROXY_URL = `${env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/anthropic-proxy`;

const { width: SCREEN_W } = Dimensions.get("window");

// ── Data model ──
// "rating" is a lifestyle framing (enjoy freely / balance / occasional) — it is
// NOT a health, safety, or risk score.
type ItemRating = "great" | "good" | "moderate" | "occasional";

interface FoodBenefit {
	name: string;
	rating: ItemRating;
	benefit: string;
	note?: string; // gentle, general "good to know" — optional
}

interface BenefitsResult {
	mealName: string;
	balanceScore: number; // 0-100 general "plate balance" lifestyle score
	scoreLabel: string;
	items: FoodBenefit[];
	summary: string;
	positives: string[];
	considerations: string[];
	swaps: string[];
	tips: string[];
}

const RATING_META: Record<ItemRating, { color: string; label: string }> = {
	great: { color: "#34C759", label: "Great choice" },
	good: { color: "#3EC9B5", label: "Good" },
	moderate: { color: "#FF9500", label: "In balance" },
	occasional: { color: "#FF6B6B", label: "Enjoy occasionally" },
};

function scoreColor(score: number): string {
	if (score >= 75) return "#34C759";
	if (score >= 50) return "#3EC9B5";
	if (score >= 30) return "#FF9500";
	return "#FF6B6B";
}

// Lifestyle/educational framing only. This app is NOT a medical device — see
// the prompt rules below and the disclaimer shown on the result screen.
const BENEFITS_DISCLAIMER =
	"General educational lifestyle information only, based on AI visual estimates. EZCare is not a medical device and does not provide medical, dietary, or health advice. Always consult a qualified professional.";

function prepareImageForApi(
	base64: string,
	uri: string,
): { data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" } {
	let cleaned = base64.replace(/^data:image\/\w+;base64,/, "");
	cleaned = cleaned.replace(/[\s\r\n]/g, "");

	const ext = uri.split(".").pop()?.toLowerCase();
	let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" = "image/jpeg";
	if (ext === "png") mediaType = "image/png";
	else if (ext === "webp") mediaType = "image/webp";
	else if (ext === "gif") mediaType = "image/gif";

	return { data: cleaned, mediaType };
}

const BENEFITS_SYSTEM_PROMPT = `You are a food awareness educator embedded in a lifestyle and habit-learning app. When shown a photo of food, give an in-depth, EDUCATIONAL breakdown of the plate: identify each visible food or ingredient, share what it is commonly associated with in everyday balanced living, and rate how it fits a generally balanced lifestyle.

This is an educational LIFESTYLE tool, NOT a medical, nutrition-advice, or food-safety service.

You MUST NOT:
- Diagnose, treat, or reference any disease or medical condition
- Claim any food cures, prevents, treats, or harms health
- Label foods as "dangerous", "toxic", "unhealthy", or a health risk
- Give dosage, calorie targets, diet plans, or personalized health advice
- Use clinical or prescriptive language ("you should eat", "this will lower your...")

Frame everything as general common knowledge and gentle lifestyle balance ("commonly a source of...", "often enjoyed in moderation", "a colorful everyday choice"). The "rating" reflects how often something is commonly enjoyed in a balanced routine — it is a lifestyle framing, never a health or safety judgement.

The "balanceScore" (0-100) reflects how varied and balanced the overall plate looks (colors, food groups, whole vs. processed) — purely a general lifestyle balance indicator, not a health score.

Respond in this exact JSON format (no markdown, no code blocks, just raw JSON):
{
  "mealName": "Grilled Chicken Bowl",
  "balanceScore": 82,
  "scoreLabel": "Nicely balanced plate",
  "items": [
    {"name": "Spinach", "rating": "great", "benefit": "Commonly known as a source of iron and vitamin K, often associated with everyday energy.", "note": "Leafy greens add color and variety to a plate."},
    {"name": "Grilled Chicken", "rating": "good", "benefit": "A common source of protein, often part of a balanced plate."},
    {"name": "White Rice", "rating": "moderate", "benefit": "A familiar everyday carbohydrate that pairs with many dishes.", "note": "Whole grains are a common swap for added variety."},
    {"name": "Fried Topping", "rating": "occasional", "benefit": "Adds crunch and flavor.", "note": "Fried extras are commonly enjoyed now and then."}
  ],
  "summary": "A colorful plate combining lean protein, leafy greens, and a carbohydrate — a balanced everyday combination.",
  "positives": ["Good variety of colors", "Includes a protein and vegetables"],
  "considerations": ["Mostly refined carbohydrate", "Light on whole grains"],
  "swaps": ["Brown rice instead of white for more variety", "Add a second vegetable for color"],
  "tips": ["Pairing greens with protein is a common balanced-plate idea."]
}

Rules:
- "rating" must be exactly one of: "great", "good", "moderate", "occasional"
- Keep food names short and clear; keep each "benefit" to one general sentence
- 1 to 8 items depending on what is visible
- positives, considerations, swaps, tips: each 0 to 4 short, general, neutral entries
- considerations are gentle balance notes, NEVER health warnings or risk claims
- If the photo is not food, set mealName to "Not Food", balanceScore to 0, scoreLabel to "No food detected", items to an empty array, and all arrays empty`;

export default function FoodBenefitsScreen() {
	const [permission, requestPermission] = useCameraPermissions();
	const [mode, setMode] = useState<"camera" | "analyzing" | "result">("camera");
	const [photoUri, setPhotoUri] = useState<string | null>(null);
	const [result, setResult] = useState<BenefitsResult | null>(null);
	const [rawAnalysis, setRawAnalysis] = useState("");
	const cameraRef = useRef<CameraView>(null);

	const takePhoto = async () => {
		if (!cameraRef.current) return;
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Heavy);
			} catch {}
		}
		try {
			const photo = await cameraRef.current.takePictureAsync({
				quality: 0.5,
				base64: true,
				imageType: "jpg",
			});
			if (photo) {
				setPhotoUri(photo.uri);
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
			quality: 0.5,
			mediaTypes: "images",
		});
		if (!pickerResult.canceled && pickerResult.assets[0]) {
			const asset = pickerResult.assets[0];
			setPhotoUri(asset.uri);
			setMode("analyzing");
			analyzePhoto(asset.base64 ?? "");
		}
	};

	// Fetch via Supabase Edge Function proxy. The Anthropic key lives on the
	// server side; we authenticate via the user's Supabase session.
	const analyzeViaFetch = async (
		base64Data: string,
		mediaType: string,
		systemPrompt: string,
	): Promise<string> => {
		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session) {
			throw new Error("Not signed in. Please sign in again and retry.");
		}
		const response = await fetch(PROXY_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${session.access_token}`,
				apikey: env.EXPO_PUBLIC_SUPABASE_KEY,
			},
			body: JSON.stringify({
				model: "claude-haiku-4-5-20251001",
				max_tokens: 1024,
				system: systemPrompt,
				messages: [
					{
						role: "user",
						content: [
							{ type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
							{ type: "text", text: "Identify the foods and share their general lifestyle benefits." },
						],
					},
				],
			}),
		});
		if (!response.ok) {
			const errBody = await response.text();
			console.warn("[FoodBenefits] API error body:", errBody.slice(0, 500));
			throw new Error(`API error ${response.status}: ${errBody.slice(0, 200)}`);
		}
		const data = (await response.json()) as { content: { type: string; text: string }[] };
		return data.content[0]?.text ?? "";
	};

	const analyzePhoto = async (base64: string) => {
		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session) {
			setRawAnalysis("You've been signed out. Please sign in again to scan food.");
			setMode("result");
			return;
		}

		if (!base64 || base64.length < 100) {
			setRawAnalysis("Could not capture image data. Please try again.");
			setMode("result");
			return;
		}

		const { data: cleanedBase64, mediaType } = prepareImageForApi(base64, photoUri ?? "photo.jpg");

		try {
			const fullText = await analyzeViaFetch(cleanedBase64, mediaType, BENEFITS_SYSTEM_PROMPT);

			try {
				const jsonMatch = fullText.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					const parsed = JSON.parse(jsonMatch[0]) as BenefitsResult;
					setResult(parsed);

					// Light engagement reward (no calorie/food-diary logging here —
					// this flow is educational, not nutrition tracking).
					const gamStore = useGamificationStore.getState();
					gamStore.addXp(30);
					gamStore.addCoins(5);

					const uid = useOnboardingStore.getState().userId;
					if (uid && parsed.items.length > 0) {
						levelsService.addXp(uid, 15, "meal_log", { meal: parsed.mealName, source: "food_benefits" }).catch(() => {});
						streakService.recordActivity(uid).catch(() => {});
					}
				} else {
					setRawAnalysis(fullText);
				}
			} catch {
				setRawAnalysis(fullText);
			}
			setMode("result");
		} catch (err) {
			console.error("[FoodBenefits] Analysis failed:", err);
			const errMsg = err instanceof Error ? err.message : String(err);
			setRawAnalysis(`Could not analyze: ${errMsg.slice(0, 150)}. Please check your connection and try again.`);
			setMode("result");
		}
	};

	const retake = () => {
		setPhotoUri(null);
		setResult(null);
		setRawAnalysis("");
		setMode("camera");
	};

	if (!permission) return <View style={styles.bg} />;

	if (!permission.granted) {
		return (
			<SafeAreaView style={styles.bg}>
				<View style={styles.permBox}>
					<View style={styles.permIconWrap}>
						<Ionicons color="#3EC9B5" name="leaf-outline" size={48} />
					</View>
					<Text style={styles.permTitle}>Camera Access</Text>
					<Text style={styles.permSub}>
						EZCare needs camera access to scan your food and share general lifestyle benefits.
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
			<View style={styles.resultBg}>
				<ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
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

					{result && result.items.length > 0 ? (
						<View style={styles.resultBody}>
							<View style={styles.calHeader}>
								<View style={styles.benefitPill}>
									<Ionicons color="#3EC9B5" name="leaf" size={14} />
									<Text style={styles.benefitPillText}>Food Benefits</Text>
								</View>
								<Text style={styles.mealName}>{result.mealName}</Text>
							</View>

							{/* Plate balance score */}
							<View style={styles.scoreCard}>
								<View
									style={[
										styles.scoreCircle,
										{ borderColor: scoreColor(result.balanceScore) },
									]}
								>
									<Text style={[styles.scoreNumber, { color: scoreColor(result.balanceScore) }]}>
										{result.balanceScore}
									</Text>
									<Text style={styles.scoreOutOf}>/100</Text>
								</View>
								<View style={{ flex: 1 }}>
									<Text style={styles.scoreLabel}>{result.scoreLabel}</Text>
									<Text style={styles.scoreCaption}>Plate balance, a general lifestyle indicator</Text>
								</View>
							</View>

							{result.summary ? (
								<View style={styles.summaryCard}>
									<Text style={styles.summaryText}>{result.summary}</Text>
								</View>
							) : null}

							<View style={styles.foodListCard}>
								<Text style={styles.foodListTitle}>What's on your plate</Text>
								{result.items.map((item, i) => {
									const meta = RATING_META[item.rating] ?? RATING_META.good;
									return (
										<View
											key={i}
											style={[styles.foodItem, i < result.items.length - 1 && styles.foodItemBorder]}
										>
											<View style={[styles.foodItemDot, { backgroundColor: meta.color }]} />
											<View style={styles.foodItemInfo}>
												<View style={styles.foodItemTopRow}>
													<Text style={styles.foodItemName}>{item.name}</Text>
													<View style={[styles.ratingBadge, { backgroundColor: `${meta.color}22` }]}>
														<Text style={[styles.ratingBadgeText, { color: meta.color }]}>{meta.label}</Text>
													</View>
												</View>
												<Text style={styles.foodItemBenefit}>{item.benefit}</Text>
												{item.note ? <Text style={styles.foodItemNote}>{item.note}</Text> : null}
											</View>
										</View>
									);
								})}
							</View>

							{/* Positives */}
							{result.positives?.length > 0 && (
								<View style={styles.listCard}>
									<View style={styles.listHeader}>
										<Ionicons color="#34C759" name="checkmark-circle" size={18} />
										<Text style={styles.listTitle}>What's working</Text>
									</View>
									{result.positives.map((p, i) => (
										<View key={i} style={styles.bulletRow}>
											<View style={[styles.bulletDot, { backgroundColor: "#34C759" }]} />
											<Text style={styles.bulletText}>{p}</Text>
										</View>
									))}
								</View>
							)}

							{/* Considerations */}
							{result.considerations?.length > 0 && (
								<View style={styles.listCard}>
									<View style={styles.listHeader}>
										<Ionicons color="#FF9500" name="information-circle" size={18} />
										<Text style={styles.listTitle}>Good to know</Text>
									</View>
									{result.considerations.map((c, i) => (
										<View key={i} style={styles.bulletRow}>
											<View style={[styles.bulletDot, { backgroundColor: "#FF9500" }]} />
											<Text style={styles.bulletText}>{c}</Text>
										</View>
									))}
								</View>
							)}

							{/* Swaps */}
							{result.swaps?.length > 0 && (
								<View style={styles.listCard}>
									<View style={styles.listHeader}>
										<Ionicons color="#5B9BD5" name="swap-horizontal" size={18} />
										<Text style={styles.listTitle}>Swap ideas</Text>
									</View>
									{result.swaps.map((s, i) => (
										<View key={i} style={styles.bulletRow}>
											<View style={[styles.bulletDot, { backgroundColor: "#5B9BD5" }]} />
											<Text style={styles.bulletText}>{s}</Text>
										</View>
									))}
								</View>
							)}

							{result.tips.length > 0 && (
								<View style={styles.tipsCard}>
									<Ionicons color="#3EC9B5" name="bulb-outline" size={18} />
									<View style={{ flex: 1 }}>
										{result.tips.map((tip, i) => (
											<Text key={i} style={styles.tipText}>
												{tip}
											</Text>
										))}
									</View>
								</View>
							)}

							<View style={styles.actionRow}>
								<TouchableOpacity onPress={retake} style={styles.scanAgainBtn}>
									<Ionicons color="#0B0E17" name="camera" size={20} />
									<Text style={styles.scanAgainText}>Scan Another</Text>
								</TouchableOpacity>
								<TouchableOpacity onPress={() => router.back()} style={styles.homeBtn}>
									<Ionicons color="#3EC9B5" name="home-outline" size={20} />
								</TouchableOpacity>
							</View>

							<Text style={styles.disclaimerText}>{BENEFITS_DISCLAIMER}</Text>
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
									{rawAnalysis || result?.summary || "No food detected. Try another photo."}
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
							<Text style={styles.disclaimerText}>{BENEFITS_DISCLAIMER}</Text>
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
						<Image source={{ uri: photoUri }} style={styles.analyzingPhoto} resizeMode="cover" blurRadius={10} />
					)}
					<View style={styles.analyzingOverlay}>
						<View style={styles.analyzingCard}>
							<ActivityIndicator color="#3EC9B5" size="large" />
							<Text style={styles.analyzingTitle}>Reading your food...</Text>
							<Text style={styles.analyzingSub}>Identifying foods and their everyday benefits</Text>
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
				<View style={styles.cameraHeader}>
					<TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
						<Ionicons color="#FFFFFF" name="close" size={22} />
					</TouchableOpacity>
					<View style={styles.headerPill}>
						<Ionicons color="#3EC9B5" name="leaf-outline" size={16} />
						<Text style={styles.headerPillText}>Food Benefits</Text>
					</View>
					<View style={{ width: 40 }} />
				</View>

				<View style={styles.cameraCenter}>
					<View style={styles.scanFrame}>
						<View style={[styles.corner, styles.tl]} />
						<View style={[styles.corner, styles.tr]} />
						<View style={[styles.corner, styles.bl]} />
						<View style={[styles.corner, styles.br]} />
					</View>
					<Text style={styles.cameraHint}>Point at your food</Text>
				</View>

				<View style={styles.cameraBottom}>
					<TouchableOpacity activeOpacity={0.8} onPress={takePhoto} style={styles.shutterBtn}>
						<LinearGradient colors={["#28B898", "#3EC9B5"]} style={styles.shutterInner} />
						<Ionicons color="#0B0E17" name="leaf-outline" size={28} style={{ position: "absolute" }} />
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
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: "rgba(62,201,181,0.15)",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 24,
	},
	permTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", marginBottom: 8 },
	permSub: { color: "#94A3B8", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 32 },
	permBtn: {
		width: "100%",
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
		marginBottom: 12,
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
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingTop: 10,
		zIndex: 10,
	},
	closeBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.1)",
		alignItems: "center",
		justifyContent: "center",
	},
	headerPill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "rgba(62,201,181,0.15)",
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "rgba(62,201,181,0.3)",
	},
	headerPillText: { color: "#3EC9B5", fontSize: 14, fontWeight: "700" },
	cameraCenter: { flex: 1, alignItems: "center", justifyContent: "center", zIndex: 10 },
	scanFrame: { width: SCREEN_W * 0.75, height: SCREEN_W * 0.75, position: "relative" },
	corner: { position: "absolute", width: 32, height: 32, borderColor: "#3EC9B5" },
	tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
	tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
	bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
	br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
	cameraHint: {
		color: "#FFFFFF",
		fontSize: 15,
		fontWeight: "500",
		marginTop: 20,
		textShadowColor: "rgba(0,0,0,0.5)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 4,
	},
	cameraBottom: { alignItems: "center", paddingBottom: 40, zIndex: 10 },
	shutterBtn: {
		width: 80,
		height: 80,
		borderRadius: 40,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 4,
		borderColor: "#FFFFFF",
		overflow: "hidden",
	},
	shutterInner: { ...StyleSheet.absoluteFillObject },
	shutterLabel: { color: "#94A3B8", fontSize: 13, fontWeight: "600", marginTop: 12 },
	galleryBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 16,
		backgroundColor: "rgba(255,255,255,0.15)",
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.25)",
	},
	galleryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
	// Analyzing
	analyzingContainer: { flex: 1, position: "relative" },
	analyzingPhoto: { ...StyleSheet.absoluteFillObject },
	analyzingOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(11,14,23,0.8)",
		alignItems: "center",
		justifyContent: "center",
	},
	analyzingCard: {
		backgroundColor: "#1A2138",
		borderRadius: 24,
		padding: 32,
		alignItems: "center",
		gap: 16,
		borderWidth: 1,
		borderColor: "rgba(62,201,181,0.2)",
		width: SCREEN_W * 0.8,
	},
	analyzingTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
	analyzingSub: { color: "#94A3B8", fontSize: 14, textAlign: "center" },
	// Result
	resultBg: { flex: 1, backgroundColor: "#0B0E17" },
	resultScroll: { paddingBottom: 40 },
	photoContainer: { position: "relative", width: "100%", height: 280 },
	resultPhoto: { width: "100%", height: "100%" },
	photoGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 120 },
	resultHeaderOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingTop: 8,
		zIndex: 10,
	},
	resultBackBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(0,0,0,0.4)",
		alignItems: "center",
		justifyContent: "center",
	},
	resultRetakeBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(0,0,0,0.4)",
		alignItems: "center",
		justifyContent: "center",
	},
	resultBody: { paddingHorizontal: 20, paddingTop: 4 },
	calHeader: { alignItems: "center", marginBottom: 20 },
	benefitPill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "rgba(62,201,181,0.12)",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "rgba(62,201,181,0.25)",
		marginBottom: 10,
	},
	benefitPillText: { color: "#3EC9B5", fontSize: 12, fontWeight: "700" },
	mealName: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", textAlign: "center" },
	// Score
	scoreCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		backgroundColor: "#1A2138",
		borderRadius: 20,
		padding: 18,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.06)",
	},
	scoreCircle: {
		width: 76,
		height: 76,
		borderRadius: 38,
		borderWidth: 5,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
	},
	scoreNumber: { fontSize: 26, fontWeight: "900" },
	scoreOutOf: { color: "#64748B", fontSize: 11, fontWeight: "700", marginLeft: 1, marginBottom: -8 },
	scoreLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
	scoreCaption: { color: "#94A3B8", fontSize: 12, lineHeight: 16, marginTop: 4 },
	summaryCard: {
		backgroundColor: "#1A2138",
		borderRadius: 16,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.06)",
	},
	summaryText: { color: "#CBD5E1", fontSize: 14, lineHeight: 21 },
	foodListCard: {
		backgroundColor: "#1A2138",
		borderRadius: 20,
		padding: 20,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.06)",
	},
	foodListTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", marginBottom: 16 },
	foodItem: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12 },
	foodItemBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
	foodItemDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#3EC9B5",
		marginRight: 12,
		marginTop: 5,
	},
	foodItemInfo: { flex: 1 },
	foodItemTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
	foodItemName: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", flexShrink: 1 },
	ratingBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
	ratingBadgeText: { fontSize: 10, fontWeight: "800" },
	foodItemBenefit: { color: "#94A3B8", fontSize: 13, lineHeight: 19, marginTop: 4 },
	foodItemNote: { color: "#64748B", fontSize: 12, lineHeight: 17, marginTop: 3, fontStyle: "italic" },
	// Positives / considerations / swaps
	listCard: {
		backgroundColor: "#1A2138",
		borderRadius: 16,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.06)",
	},
	listHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
	listTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
	bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
	bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
	bulletText: { color: "#CBD5E1", fontSize: 13, lineHeight: 19, flex: 1 },
	tipsCard: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 10,
		backgroundColor: "rgba(62,201,181,0.08)",
		borderRadius: 16,
		padding: 16,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "rgba(62,201,181,0.15)",
	},
	tipText: { color: "#94A3B8", fontSize: 13, lineHeight: 20, marginBottom: 4 },
	actionRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
	scanAgainBtn: {
		flex: 1,
		height: 52,
		borderRadius: 26,
		backgroundColor: "#3EC9B5",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	scanAgainText: { color: "#0B0E17", fontSize: 15, fontWeight: "800" },
	homeBtn: {
		width: 52,
		height: 52,
		borderRadius: 26,
		borderWidth: 1.5,
		borderColor: "#3EC9B5",
		alignItems: "center",
		justifyContent: "center",
	},
	disclaimerText: {
		color: "rgba(255,255,255,0.3)",
		fontSize: 10,
		textAlign: "center",
		lineHeight: 14,
		marginHorizontal: 10,
	},
	rawCard: {
		backgroundColor: "#1A2138",
		borderRadius: 16,
		padding: 20,
		marginBottom: 24,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.06)",
	},
});
