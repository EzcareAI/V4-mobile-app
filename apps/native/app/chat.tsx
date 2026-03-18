import Anthropic from "@anthropic-ai/sdk";
import { Ionicons } from "@expo/vector-icons";
import {
	BottomSheetBackdrop,
	BottomSheetModal,
	BottomSheetModalProvider,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import Voice, {
	type SpeechErrorEvent,
	type SpeechResultsEvent,
} from "@react-native-voice/voice";
import * as Audio from "expo-av";
import { getDocumentAsync } from "expo-document-picker";
import { readAsStringAsync } from "expo-file-system";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import {
	launchCameraAsync,
	launchImageLibraryAsync,
	requestCameraPermissionsAsync,
	requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/stores/onboarding-store";

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

const anthropic = new Anthropic({
	apiKey: apiKey || "dummy_key_to_prevent_sdk_crash",
	dangerouslyAllowBrowser: true,
});

interface AttachedImage {
	uri: string;
	base64: string;
	mediaType: "image/jpeg" | "image/png" | "image/webp";
}

interface AttachedDoc {
	name: string;
	text: string;
}

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	imageUri?: string;
}

function ChatScreen() {
	const { firstName, healthScore, isPro } = useOnboardingStore();
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			role: "assistant",
			content: `Hi ${firstName || "there"}! I'm EZBuddy. I see your health score is currently ${healthScore || "--"}. How can I help you today?`,
		},
	]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(
		null
	);
	const [attachedDoc, setAttachedDoc] = useState<AttachedDoc | null>(null);
	const scrollRef = useRef<ScrollView>(null);
	const bottomSheetModalRef = useRef<BottomSheetModal>(null);
	const snapPoints = ["35%"];

	// ── Voice ──────────────────────────────────────────────
	const onSpeechResults = useCallback((e: SpeechResultsEvent) => {
		const result = e.value?.[0];
		if (result) {
			setInput((prev) => (prev ? `${prev} ${result}` : result));
		}
	}, []);

	const onSpeechError = useCallback((e: SpeechErrorEvent) => {
		setIsListening(false);
		if (e.error?.code !== "recognition_fail") {
			Alert.alert("Voice Error", e.error?.message ?? "Unknown voice error");
		}
	}, []);

	useEffect(() => {
		Voice.onSpeechResults = onSpeechResults;
		Voice.onSpeechError = onSpeechError;
		Voice.onSpeechEnd = () => setIsListening(false);
		return () => {
			Voice.destroy().then(Voice.removeAllListeners);
		};
	}, [onSpeechResults, onSpeechError]);

	const toggleListening = async () => {
		if (isListening) {
			await Voice.stop();
			setIsListening(false);
		} else {
			try {
				// Request permissions for both Android and iOS
				const { status } = await Audio.Audio.requestPermissionsAsync();
				if (status !== "granted") {
					Alert.alert(
						"Permission required",
						"Microphone access is needed for voice input."
					);
					return;
				}

				if (Platform.OS === "ios") {
					try {
						await impactAsync(ImpactFeedbackStyle.Medium);
					} catch {
						/* ignore */
					}
				}
				await Voice.start("en-US");
				setIsListening(true);
			} catch (_err) {
				Alert.alert(
					"Microphone Error",
					"Could not start voice recognition. Please check permissions."
				);
			}
		}
	};

	// ── Image Picker ───────────────────────────────────────
	const pickImage = async (source: "camera" | "gallery") => {
		if (source === "camera") {
			const { status } = await requestCameraPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Permission required",
					"Camera access is needed to take photos."
				);
				return;
			}
			const result = await launchCameraAsync({
				base64: true,
				quality: 0.7,
				mediaTypes: "images",
			});
			if (!result.canceled && result.assets[0].base64) {
				const asset = result.assets[0];
				const ext = asset.uri.split(".").pop()?.toLowerCase();
				let mediaType: AttachedImage["mediaType"] = "image/jpeg";
				if (ext === "png") {
					mediaType = "image/png";
				} else if (ext === "webp") {
					mediaType = "image/webp";
				}
				setAttachedImage({
					uri: asset.uri,
					base64: asset.base64 ?? "",
					mediaType,
				});
				setAttachedDoc(null);
			}
		} else {
			const { status } = await requestMediaLibraryPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Permission required",
					"Photo library access is needed to upload images."
				);
				return;
			}
			const result = await launchImageLibraryAsync({
				base64: true,
				quality: 0.7,
				mediaTypes: "images",
			});
			if (!result.canceled && result.assets[0].base64) {
				const asset = result.assets[0];
				const ext = asset.uri.split(".").pop()?.toLowerCase();
				let mediaType: AttachedImage["mediaType"] = "image/jpeg";
				if (ext === "png") {
					mediaType = "image/png";
				} else if (ext === "webp") {
					mediaType = "image/webp";
				}
				setAttachedImage({
					uri: asset.uri,
					base64: asset.base64 ?? "",
					mediaType,
				});
				setAttachedDoc(null);
			}
		}
	};

	// ── Document Picker ────────────────────────────────────
	const pickDocument = async () => {
		const result = await getDocumentAsync({
			type: ["text/plain", "text/csv", "application/json"],
			copyToCacheDirectory: true,
		});
		if (!result.canceled && result.assets[0]) {
			const asset = result.assets[0];
			try {
				const text = await readAsStringAsync(asset.uri);
				setAttachedDoc({ name: asset.name, text: text.slice(0, 8000) }); // cap at 8k chars
				setAttachedImage(null);
			} catch {
				Alert.alert(
					"File Error",
					"Could not read that file. Only plain text files are supported."
				);
			}
		}
	};

	// ── Attachment action menu ────────────────────────────
	const openAttachMenu = () => {
		bottomSheetModalRef.current?.present();
	};

	const renderBackdrop = useCallback(
		(props: any) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
				opacity={0.5}
			/>
		),
		[]
	);

	// ── Send ───────────────────────────────────────────────
	const handleSend = async () => {
		const userText = input.trim();
		if (!(userText || attachedImage || attachedDoc) || isLoading) {
			return;
		}

		// Message throttling for non-Pro users
		if (!isPro && messages.length >= 7) {
			Alert.alert(
				"Chat Limit Reached",
				"Unlimited EZBuddy chat requires an EZCare Pro subscription.",
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "View Plans",
						onPress: () => router.push("/settings/subscription"),
					},
				]
			);
			return;
		}

		setInput("");
		const imgSnap = attachedImage;
		const docSnap = attachedDoc;
		setAttachedImage(null);
		setAttachedDoc(null);

		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Light);
			} catch {
				/* ignore */
			}
		}

		if (!apiKey || apiKey === "dummy_key_to_prevent_sdk_crash") {
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					role: "user",
					content: userText,
					imageUri: imgSnap?.uri,
				},
				{
					id: `${Date.now()}-err`,
					role: "assistant",
					content:
						"⚠️ API Key Missing: Please ensure your EXPO_PUBLIC_ANTHROPIC_API_KEY is set in apps/native/.env and rebuild.",
				},
			]);
			return;
		}

		// Build the display message
		let displayText = userText;
		if (docSnap) {
			displayText = `📄 **${docSnap.name}**\n${userText}`;
		}

		const userMsg: Message = {
			id: Date.now().toString(),
			role: "user",
			content: displayText,
			imageUri: imgSnap?.uri,
		};
		const newMessages = [...messages, userMsg];
		setMessages(newMessages);
		setIsLoading(true);

		try {
			// Build Anthropic message content for the last user turn (multimodal)
			type ContentBlock =
				| { type: "text"; text: string }
				| {
						type: "image";
						source: {
							type: "base64";
							media_type: AttachedImage["mediaType"];
							data: string;
						};
				  };

			const userContent: ContentBlock[] = [];

			if (imgSnap) {
				userContent.push({
					type: "image",
					source: {
						type: "base64",
						media_type: imgSnap.mediaType,
						data: imgSnap.base64,
					},
				});
			}

			let promptText = userText;
			if (docSnap) {
				promptText = `[Document attached: ${docSnap.name}]\n\n${docSnap.text}\n\n---\nUser question: ${userText}`;
			}
			if (promptText) {
				userContent.push({ type: "text", text: promptText });
			}

			// Prior messages (text-only for now)
			const priorApiMessages = messages.map((m) => ({
				role: m.role as "user" | "assistant",
				content: m.content,
			}));

			const response = await anthropic.messages.create({
				model: "claude-3-haiku-20240307",
				max_tokens: 2048,
				system:
					"You are EZBuddy, a premium health and wellness AI assistant. Provide long, empathetic, context-rich, and highly actionable responses. Always use relevant emojis to make the conversation feel premium and engaging. Use Markdown formatting (bolding important terms, using italics for emphasis) to help the user parse information easily. Focus on holistic wellness, nutrition, and exercise advice.",
				messages: [...priorApiMessages, { role: "user", content: userContent }],
			});

			const assistantReply =
				response.content[0].type === "text" ? response.content[0].text : "";

			if (Platform.OS === "ios") {
				try {
					await impactAsync(ImpactFeedbackStyle.Medium);
				} catch {
					/* ignore */
				}
			}

			setMessages((prev) => [
				...prev,
				{ id: `${Date.now()}-ai`, role: "assistant", content: assistantReply },
			]);
		} catch (_error) {
			setMessages((prev) => [
				...prev,
				{
					id: `${Date.now()}-err`,
					role: "assistant",
					content:
						"I'm sorry, I couldn't reach my network connection right now. Please check that your API key is set in the `.env` file.",
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		setTimeout(() => {
			scrollRef.current?.scrollToEnd({ animated: true });
		}, 100);
	}, []);

	// Scroll to bottom when keyboard opens so the input is never hidden
	useEffect(() => {
		const sub = Keyboard.addListener("keyboardDidShow", () => {
			setTimeout(() => {
				scrollRef.current?.scrollToEnd({ animated: true });
			}, 100);
		});
		return () => sub.remove();
	}, []);

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
				style={styles.container}
			>
				{/* HEADER */}
				<View style={styles.header}>
					<TouchableOpacity
						hitSlop={8}
						onPress={() => router.back()}
						style={styles.backBtn}
					>
						<Ionicons color="#FFFFFF" name="chevron-back" size={24} />
					</TouchableOpacity>
					<View style={styles.headerTitleContainer}>
						<Text style={styles.headerTitle}>EZBuddy AI</Text>
						<View style={styles.onlineStatus}>
							<View
								style={[
									styles.onlineDot,
									isListening && styles.onlineDotRecording,
								]}
							/>
							<Text
								style={[
									styles.onlineText,
									isListening && styles.onlineTextRecording,
								]}
							>
								{isListening ? "Listening..." : "Online"}
							</Text>
						</View>
					</View>
					<View style={styles.spacer} />
				</View>

				{/* CHAT AREA */}
				<ScrollView
					contentContainerStyle={styles.chatContent}
					ref={scrollRef}
					showsVerticalScrollIndicator={false}
					style={styles.chatArea}
				>
					{messages.map((m) => {
						const isUser = m.role === "user";
						return (
							<View
								key={m.id}
								style={[
									styles.messageBubble,
									isUser ? styles.userBubble : styles.aiBubble,
								]}
							>
								{!isUser && (
									<LinearGradient
										colors={["#28B898", "#3EC9B5"]}
										style={styles.aiAvatar}
									>
										<Ionicons color="#0B0E17" name="sparkles" size={14} />
									</LinearGradient>
								)}
								<View
									style={[
										styles.messageCard,
										isUser ? styles.userCard : styles.aiCard,
									]}
								>
									{m.imageUri && (
										<Image
											resizeMode="cover"
											source={{ uri: m.imageUri }}
											style={styles.attachedImage}
										/>
									)}
									{isUser ? (
										<Text style={[styles.messageText, styles.userText]}>
											{m.content}
										</Text>
									) : (
										<Markdown
											style={{
												body: {
													color: "#E2E8F0",
													fontSize: 15,
													lineHeight: 22,
												},
												strong: { fontWeight: "bold", color: "#FFFFFF" },
												em: { fontStyle: "italic", color: "#3EC9B5" },
											}}
										>
											{m.content}
										</Markdown>
									)}
								</View>
							</View>
						);
					})}
					{isLoading && (
						<View style={[styles.messageBubble, styles.aiBubble]}>
							<LinearGradient
								colors={["#28B898", "#3EC9B5"]}
								style={styles.aiAvatar}
							>
								<Ionicons color="#0B0E17" name="sparkles" size={14} />
							</LinearGradient>
							<View style={[styles.messageCard, styles.aiCard]}>
								<ActivityIndicator color="#3EC9B5" size="small" />
							</View>
						</View>
					)}
					{/* Draft Staging Bubble */}
					{(attachedImage || (attachedDoc && input.trim())) && (
						<View style={[styles.messageBubble, styles.userBubble]}>
							<View
								style={[
									styles.messageCard,
									styles.userCard,
									{ opacity: 0.7, borderStyle: "dashed" },
								]}
							>
								{attachedImage && (
									<Image
										source={{ uri: attachedImage.uri }}
										style={styles.attachedImage}
									/>
								)}
								{(input.trim() || attachedDoc) && (
									<Text style={[styles.messageText, styles.userText]}>
										{attachedDoc ? `📄 ${attachedDoc.name}\n` : ""}
										{input}
									</Text>
								)}
								<View style={styles.draftBadge}>
									<Text style={styles.draftBadgeText}>Draft</Text>
								</View>
							</View>
						</View>
					)}
				</ScrollView>

				{/* INPUT AREA */}
				<SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#0B0E17" }}>
					<View style={styles.inputArea}>
						<TouchableOpacity
							activeOpacity={0.7}
							onPress={openAttachMenu}
							style={styles.attachBtn}
						>
							<Ionicons color="#94A3B8" name="add" size={22} />
						</TouchableOpacity>
						<View style={styles.inputWrapper}>
							<TextInput
								maxLength={1000}
								multiline
								onChangeText={setInput}
								placeholder={
									isListening ? "Listening..." : "Message EZBuddy..."
								}
								placeholderTextColor={isListening ? "#3EC9B5" : "#94A3B8"}
								style={styles.textInput}
								value={input}
							/>
							<TouchableOpacity
								hitSlop={4}
								onPress={toggleListening}
								style={[styles.micBtn, isListening && styles.micBtnActive]}
							>
								<Ionicons
									color={isListening ? "#0B0E17" : "#94A3B8"}
									name={isListening ? "mic" : "mic-outline"}
									size={18}
								/>
							</TouchableOpacity>
							<TouchableOpacity
								disabled={
									!(input.trim() || attachedImage || attachedDoc) || isLoading
								}
								onPress={handleSend}
								style={[
									styles.sendBtn,
									!(input.trim() || attachedImage || attachedDoc) &&
										styles.sendBtnDisabled,
								]}
							>
								<Ionicons
									color={
										input.trim() || attachedImage || attachedDoc
											? "#0B0E17"
											: "#94A3B8"
									}
									name="arrow-up"
									size={20}
								/>
							</TouchableOpacity>
						</View>
					</View>
				</SafeAreaView>
			</KeyboardAvoidingView>

			<BottomSheetModal
				backdropComponent={renderBackdrop}
				backgroundStyle={{ backgroundColor: "#1A2138" }}
				handleIndicatorStyle={{ backgroundColor: "#3EC9B5" }}
				ref={bottomSheetModalRef}
				snapPoints={snapPoints}
			>
				<BottomSheetView style={styles.sheetContent}>
					<Text style={styles.sheetTitle}>Attach to message</Text>
					<View style={styles.sheetRow}>
						<TouchableOpacity
							onPress={() => {
								pickImage("camera");
								bottomSheetModalRef.current?.dismiss();
							}}
							style={styles.sheetBtn}
						>
							<View
								style={[
									styles.sheetIconWrap,
									{ backgroundColor: "#rgba(255,255,255,0.05)" },
								]}
							>
								<Ionicons color="#3EC9B5" name="camera" size={24} />
							</View>
							<Text style={styles.sheetBtnText}>Camera</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={() => {
								pickImage("gallery");
								bottomSheetModalRef.current?.dismiss();
							}}
							style={styles.sheetBtn}
						>
							<View
								style={[
									styles.sheetIconWrap,
									{ backgroundColor: "#rgba(255,255,255,0.05)" },
								]}
							>
								<Ionicons color="#3EC9B5" name="images" size={24} />
							</View>
							<Text style={styles.sheetBtnText}>Gallery</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={() => {
								pickDocument();
								bottomSheetModalRef.current?.dismiss();
							}}
							style={styles.sheetBtn}
						>
							<View
								style={[
									styles.sheetIconWrap,
									{ backgroundColor: "#rgba(255,255,255,0.05)" },
								]}
							>
								<Ionicons color="#3EC9B5" name="document-text" size={24} />
							</View>
							<Text style={styles.sheetBtnText}>Document</Text>
						</TouchableOpacity>
					</View>
				</BottomSheetView>
			</BottomSheetModal>
		</SafeAreaView>
	);
}

// Wrap the screen in providers
export default function ChatScreenWrapper() {
	return (
		<BottomSheetModalProvider>
			<ChatScreen />
		</BottomSheetModalProvider>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#0B0E17" },
	container: { flex: 1 },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255,255,255,0.05)",
	},
	backBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.05)",
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitleContainer: { alignItems: "center" },
	headerTitle: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "700",
		letterSpacing: 0.5,
	},
	onlineStatus: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 2,
		gap: 4,
	},
	onlineDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#3EC9B5",
	},
	onlineDotRecording: { backgroundColor: "#FF4F6E" },
	onlineText: { color: "#3EC9B5", fontSize: 11, fontWeight: "600" },
	onlineTextRecording: { color: "#FF4F6E" },
	spacer: { width: 40 },
	chatArea: { flex: 1 },
	chatContent: { padding: 24, gap: 20 },
	messageBubble: { flexDirection: "row", width: "100%" },
	userBubble: { justifyContent: "flex-end" },
	aiBubble: { justifyContent: "flex-start", alignItems: "flex-end", gap: 12 },
	aiAvatar: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 4,
	},
	messageCard: {
		maxWidth: "80%",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 20,
	},
	userCard: {
		backgroundColor: "#1A2138",
		borderBottomRightRadius: 4,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",
	},
	aiCard: {
		backgroundColor: "rgba(62,201,181,0.1)",
		borderBottomLeftRadius: 4,
		borderWidth: 1,
		borderColor: "rgba(62,201,181,0.2)",
	},
	messageText: { fontSize: 15, lineHeight: 22 },
	userText: { color: "#FFFFFF" },
	aiText: { color: "#E2E8F0" },
	attachedImage: {
		width: "100%",
		height: 160,
		borderRadius: 12,
		marginBottom: 8,
	},
	// Attachment preview bar
	previewBar: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		flexDirection: "row",
		gap: 8,
	},
	previewImageWrapper: { position: "relative" },
	previewImage: { width: 56, height: 56, borderRadius: 10 },
	removeBtn: { position: "absolute", top: -6, right: -6 },
	previewDoc: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#1A2138",
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 6,
		gap: 6,
		flex: 1,
	},
	previewDocName: {
		color: "#FFFFFF",
		fontSize: 12,
		fontWeight: "600",
		flex: 1,
	},
	// Input
	inputArea: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderTopWidth: 1,
		borderTopColor: "rgba(255,255,255,0.05)",
		backgroundColor: "#0B0E17",
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 8,
	},
	attachBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.06)",
		alignItems: "center",
		justifyContent: "center",
	},
	inputWrapper: {
		flex: 1,
		flexDirection: "row",
		alignItems: "flex-end",
		backgroundColor: "#1A2138",
		borderRadius: 24,
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",
	},
	textInput: {
		flex: 1,
		color: "#FFFFFF",
		fontSize: 15,
		maxHeight: 120,
		minHeight: 36,
		paddingTop: 8,
		paddingBottom: 8,
	},
	micBtn: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		marginLeft: 4,
		marginBottom: 2,
	},
	micBtnActive: { backgroundColor: "#FF4F6E" },
	sendBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#3EC9B5",
		alignItems: "center",
		justifyContent: "center",
		marginLeft: 6,
		marginBottom: 2,
	},
	sendBtnDisabled: { backgroundColor: "rgba(255,255,255,0.05)" },
	// Bottom Sheet
	sheetContent: {
		padding: 24,
		alignItems: "center",
	},
	sheetTitle: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "800",
		marginBottom: 24,
	},
	sheetRow: {
		flexDirection: "row",
		justifyContent: "space-around",
		width: "100%",
	},
	sheetBtn: {
		alignItems: "center",
		gap: 8,
	},
	sheetIconWrap: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	sheetBtnText: {
		color: "#94A3B8",
		fontSize: 13,
		fontWeight: "600",
	},
	draftBadge: {
		position: "absolute",
		top: -8,
		left: -8,
		backgroundColor: "#3EC9B5",
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 8,
	},
	draftBadgeText: {
		color: "#0B0E17",
		fontSize: 10,
		fontWeight: "800",
	},
});
