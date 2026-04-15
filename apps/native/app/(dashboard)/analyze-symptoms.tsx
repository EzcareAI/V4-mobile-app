import { Ionicons } from "@expo/vector-icons";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Platform,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { type AnalysisResponse, aiAnalysisService } from "@/lib/ai-analysis";
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/stores/onboarding-store";

const TEAL = "#3EC9B5";
const DARK = "#0B0E17";
const GREY = "#60708F";

export default function AnalyzeSymptomsScreen() {
	const params = useLocalSearchParams();
	const router = useRouter();

	const zonesParam = params.zones as string;
	const historyId = params.historyId as string;
	const imageBase64 = params.imageBase64 as string;

	const [activeZones, setActiveZones] = useState<string[]>([]);
	const [phase, setPhase] = useState<"input" | "loading" | "results">("input");
	const [painLevel, setPainLevel] = useState<number>(5);
	const [description, setDescription] = useState<string>("");

	const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isHistoryView, setIsHistoryView] = useState(false);

	useEffect(() => {
		if (historyId) {
			setIsHistoryView(true);
			setPhase("loading");
			supabase
				.from("health_analyses")
				.select("*")
				.eq("id", historyId)
				.single()
				.then(({ data, error: fetchErr }) => {
					if (data && !fetchErr) {
						setActiveZones(data.zones || []);
						// Support both old (probableCauses/actionPlan) and new (wellnessTips/wellnessSuggestions) history records
						const tips = data.wellness_tips || data.probable_causes || [];
						const suggestions = data.wellness_suggestions || data.action_plan || [];
						setAnalysis({
							wellnessTips: tips.map((t: any) => ({ name: t.name, description: t.description })),
							wellnessSuggestions: suggestions,
							disclaimer:
								"This is a past wellness check from your history. This is for general lifestyle and educational purposes only — not medical advice, diagnosis, or treatment. Always consult a healthcare professional for health concerns.",
						});
						setPhase("results");
					} else {
						setError("Could not load historical analysis.");
						setPhase("input");
					}
				});
		} else if (zonesParam) {
			setActiveZones(zonesParam.split(","));
			setIsHistoryView(false);
			setPhase("input");
			setPainLevel(5);
			setDescription("");
			setAnalysis(null);
			setError(null);
		}
	}, [historyId, zonesParam]);

	const handleAnalyze = async () => {
		if (description.trim().length < 5) {
			setError("Please provide a little more detail about what you're experiencing.");
			return;
		}

		setError(null);
		setPhase("loading");
		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Medium).catch(() => {});
		}

		try {
			const { isPro } = useOnboardingStore.getState();
			if (!isPro) {
				Alert.alert(
					"Upgrade to Pro",
					"Detailed wellness insights and in-depth analysis require an EZCare Pro subscription.",
					[
						{
							text: "Cancel",
							style: "cancel",
							onPress: () => setPhase("input"),
						},
						{
							text: "View Plans",
							onPress: () => router.push("/settings/subscription"),
						},
					]
				);
				return;
			}

			const res = await aiAnalysisService.analyzeSymptoms({
				zones: activeZones.length > 0 ? activeZones : ["General Wellness Check"],
				painLevel,
				description,
				imageBase64: imageBase64 || undefined,
			});
			setAnalysis(res);
			setPhase("results");
			if (Platform.OS === "ios") {
				impactAsync(ImpactFeedbackStyle.Heavy).catch(() => {});
			}
		} catch (err: unknown) {
			console.error("Analysis Failed:", err);
			setError(
				"We had trouble generating wellness insights. Please try again later."
			);
			setPhase("input");
		}
	};

	const handleSaveHistory = async () => {
		if (!analysis) {
			return;
		}
		setIsSaving(true);
		setError(null);

		try {
			const {
				data: { session },
				error: authError,
			} = await supabase.auth.getSession();

			if (authError) {
				throw new Error(`Authentication error: ${authError.message}`);
			}

			// If the user isn't logged in, we gracefully skip the cloud save and just close the screen
			// so that guest users don't get stuck with an error.
			if (session?.user?.id) {
				let uploadedImageUrl = null;

				// Upload image if present
				if (imageBase64) {
					const fileName = `${session.user.id}/${Date.now()}.jpg`;
					const response = await fetch(`data:image/jpeg;base64,${imageBase64}`);
					const blob = await response.blob();
					
					const { data: uploadData, error: uploadError } = await supabase.storage
						.from("body-scans")
						.upload(fileName, blob, { contentType: "image/jpeg" });
					
					if (uploadError) {
						console.error("Storage upload error:", uploadError);
					} else if (uploadData) {
						const { data: { publicUrl } } = supabase.storage
							.from("body-scans")
							.getPublicUrl(fileName);
						uploadedImageUrl = publicUrl;
					}
				}

				const { error: dbError } = await supabase
					.from("health_analyses")
					.insert({
						user_id: session.user.id,
						zones: activeZones.length > 0 ? activeZones : ["General Wellness Check"],
						symptoms_description: `Discomfort level ${painLevel}/10. ${description}`,
						probable_causes: analysis.wellnessTips,
						action_plan: analysis.wellnessSuggestions,
						image_url: uploadedImageUrl,
					});

				if (dbError) {
					console.error("Supabase insert error:", dbError);
					setError(`Failed to save to history: ${dbError.message}`);
					Alert.alert(
						"Save Error",
						"We couldn't save your analysis history. Please check your connection and try again."
					);
					setIsSaving(false);
					return;
				}
			}

			if (Platform.OS === "ios") {
				impactAsync(ImpactFeedbackStyle.Medium).catch(() => {});
			}
			router.replace("/(dashboard)");
		} catch (err: any) {
			console.error("Save history error:", err);
			setError(
				`Error: ${err.message || "Unknown error occurred while saving."}`
			);
			Alert.alert(
				"Error",
				"An unexpected error occurred while saving your history."
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<SafeAreaView style={styles.safe}>
			{/* HEADER */}
			<View style={styles.header}>
				<TouchableOpacity
					hitSlop={8}
					onPress={() => router.back()}
					style={styles.backBtn}
				>
					<Ionicons color={DARK} name="arrow-back" size={24} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Wellness Check</Text>
				<View style={{ width: 44 }} />
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* INPUT PHASE */}
				{phase === "input" && (
					<View>
					<View style={styles.disclaimerBox}>
						<Ionicons color="#E53E3E" name="warning" size={20} />
						<Text style={styles.disclaimerText}>
							EZCare is a lifestyle and wellness tracking tool — not a medical device or service. The information provided is for general lifestyle and educational purposes only. It is NOT medical advice, a diagnosis, or a treatment plan. Always consult a qualified healthcare professional for any health concerns.
						</Text>
					</View>
					<View style={styles.card}>
						<Text style={styles.cardTitle}>Tell us more</Text>
						<Text style={styles.cardSub}>
							You selected:{" "}
							<Text style={{ fontWeight: "bold", color: TEAL }}>
								{activeZones.length > 0 ? activeZones.join(", ") : "General Wellness Check"}
							</Text>
						</Text>

						{imageBase64 && (
							<View style={styles.imagePreviewContainer}>
								<Image
									source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
									style={styles.imagePreview}
								/>
								<Text style={styles.imageLabel}>Captured Scan Image</Text>
							</View>
						)}

						<Text style={styles.label}>
							How severe is the discomfort? ({painLevel}/10)
						</Text>
						<View style={styles.painRow}>
							{[2, 4, 6, 8, 10].map((level) => (
								<TouchableOpacity
									key={level}
									onPress={() => setPainLevel(level)}
									style={[
										styles.painTick,
										painLevel >= level && { backgroundColor: TEAL },
									]}
								>
									<Text
										style={[
											styles.painText,
											painLevel >= level && { color: "#FFF" },
										]}
									>
										{level}
									</Text>
								</TouchableOpacity>
							))}
						</View>

						<Text style={styles.label}>Describe what you're feeling:</Text>
						<TextInput
							multiline
							numberOfLines={4}
							onChangeText={(text) => {
								setError(null);
								setDescription(text);
							}}
							placeholder="e.g. It's a sharp pain when lifting my arm, started 2 days ago..."
							placeholderTextColor="#A0ABC0"
							style={styles.inputArea}
							value={description}
						/>

						{error && <Text style={styles.errorText}>{error}</Text>}

						<TouchableOpacity onPress={handleAnalyze} style={styles.primaryBtn}>
							<Text style={styles.primaryBtnText}>Get Wellness Insights</Text>
							<Ionicons color="#FFF" name="sparkles" size={18} />
						</TouchableOpacity>
					</View>
					</View>
				)}

				{/* LOADING PHASE */}
				{phase === "loading" && (
					<View style={styles.loadingCard}>
						<ActivityIndicator color={TEAL} size="large" />
						<Text style={styles.loadingTitle}>Generating Wellness Tips...</Text>
						<Text style={styles.loadingSub}>
							Reviewing general lifestyle information to provide
							comfort tips related to {activeZones.join(", ")} discomfort.
						</Text>
					</View>
				)}

				{/* RESULTS PHASE */}
				{phase === "results" && analysis && (
					<View>
						<View style={styles.disclaimerBox}>
							<Ionicons color="#E53E3E" name="warning" size={20} />
							<Text style={styles.disclaimerText}>{analysis.disclaimer}</Text>
						</View>

						<Text style={styles.sectionHeading}>Lifestyle & Comfort Tips</Text>
						{(analysis.wellnessTips || analysis.probableCauses || []).map((tip, idx) => (
							<View key={idx} style={styles.resultCard}>
								<Text style={styles.causeName}>{tip.name}</Text>
								<Text style={[styles.causeDesc, { marginTop: 8 }]}>{tip.description}</Text>
							</View>
						))}

						<Text style={styles.sectionHeading}>Self-Care Ideas</Text>
						{(analysis.wellnessSuggestions || analysis.actionPlan || []).map((plan, idx) => (
							<View key={idx} style={styles.planCard}>
								<View style={styles.planDayBadge}>
									<Text style={styles.planDayText}>Day {plan.day}</Text>
								</View>
								<View style={{ flex: 1, marginLeft: 12 }}>
									<Text style={styles.planActivity}>{plan.activity}</Text>
									<Text style={styles.planDuration}>⏱ {plan.duration}</Text>
								</View>
							</View>
						))}

						{error && <Text style={styles.errorText}>{error}</Text>}

						{!isHistoryView && (
							<TouchableOpacity
								disabled={isSaving}
								onPress={handleSaveHistory}
								style={[styles.primaryBtn, { marginTop: 32 }]}
							>
								{isSaving ? (
									<ActivityIndicator color="#FFF" />
								) : (
									<>
										<Text style={styles.primaryBtnText}>
											Save to History & Finish
										</Text>
										<Ionicons color="#FFF" name="checkmark-circle" size={20} />
									</>
								)}
							</TouchableOpacity>
						)}
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#F7FAFC" },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: "#FFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E2E8F0",
	},
	backBtn: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "#F1F5F9",
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: { fontSize: 18, fontWeight: "700", color: DARK },
	content: { padding: 20, paddingBottom: 60 },

	card: {
		backgroundColor: "#FFF",
		borderRadius: 16,
		padding: 24,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 10,
		elevation: 2,
	},
	cardTitle: { fontSize: 22, fontWeight: "800", color: DARK, marginBottom: 4 },
	cardSub: { fontSize: 14, color: GREY, marginBottom: 24 },

	label: { fontSize: 15, fontWeight: "700", color: DARK, marginBottom: 12 },
	painRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 28,
	},
	painTick: {
		width: 45,
		height: 45,
		borderRadius: 22.5,
		backgroundColor: "#EDF2F7",
		alignItems: "center",
		justifyContent: "center",
	},
	painText: { fontSize: 16, fontWeight: "700", color: GREY },

	inputArea: {
		backgroundColor: "#F7FAFC",
		borderWidth: 1,
		borderColor: "#E2E8F0",
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
		color: DARK,
		minHeight: 120,
		textAlignVertical: "top",
		marginBottom: 24,
	},

	errorText: {
		color: "#E53E3E",
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 16,
		textAlign: "center",
	},

	primaryBtn: {
		backgroundColor: TEAL,
		borderRadius: 100,
		paddingVertical: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		shadowColor: TEAL,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
	},
	primaryBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },

	loadingCard: {
		backgroundColor: "#FFF",
		borderRadius: 16,
		padding: 40,
		alignItems: "center",
		marginTop: 40,
	},
	loadingTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: DARK,
		marginTop: 20,
		marginBottom: 8,
	},
	loadingSub: {
		fontSize: 14,
		color: GREY,
		textAlign: "center",
		lineHeight: 20,
	},

	disclaimerBox: {
		flexDirection: "row",
		backgroundColor: "#FFF5F5",
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#FEB2B2",
		gap: 12,
		marginBottom: 24,
	},
	disclaimerText: {
		flex: 1,
		fontSize: 13,
		color: "#9B2C2C",
		lineHeight: 18,
		fontWeight: "500",
	},

	sectionHeading: {
		fontSize: 20,
		fontWeight: "800",
		color: DARK,
		marginBottom: 16,
		marginTop: 8,
	},
	resultCard: {
		backgroundColor: "#FFF",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 5,
		elevation: 1,
	},
	causeHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 8,
	},
	causeName: { flex: 1, fontSize: 16, fontWeight: "700", color: DARK },
	percentWrap: {
		backgroundColor: "#F7FAFC",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
		marginLeft: 12,
	},
	percentText: { fontSize: 13, fontWeight: "800" },
	barTrack: {
		height: 6,
		backgroundColor: "#EDF2F7",
		borderRadius: 3,
		marginBottom: 12,
		overflow: "hidden",
	},
	barFill: {
		height: "100%",
		borderRadius: 3,
	},
	causeDesc: { fontSize: 14, color: GREY, lineHeight: 20 },

	planCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFF",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
	},
	planDayBadge: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: "rgba(62,201,181,0.15)",
		alignItems: "center",
		justifyContent: "center",
	},
	planDayText: { fontSize: 13, fontWeight: "800", color: TEAL },
	planActivity: {
		fontSize: 15,
		fontWeight: "600",
		color: DARK,
		marginBottom: 4,
	},
	planDuration: { fontSize: 13, color: GREY, fontWeight: "500" },
	imagePreviewContainer: {
		alignItems: "center",
		marginBottom: 20,
		backgroundColor: "#F7FAFC",
		borderRadius: 12,
		padding: 8,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	imagePreview: {
		width: "100%",
		height: 200,
		borderRadius: 8,
		backgroundColor: "#E2E8F0",
	},
	imageLabel: {
		marginTop: 8,
		fontSize: 12,
		color: GREY,
		fontWeight: "600",
	},
});
