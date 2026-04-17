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
	Dimensions,
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
	docName?: string;
	suggestions?: string[];
}

const SUGGESTIONS_RE = /<suggestions>([\s\S]*?)<\/suggestions>/i;

function extractSuggestions(text: string): {
	body: string;
	suggestions: string[];
} {
	const m = text.match(SUGGESTIONS_RE);
	if (!m) {
		return { body: text, suggestions: [] };
	}
	const body = text.replace(SUGGESTIONS_RE, "").trim();
	const suggestions = m[1]
		.split("|")
		.map((s) => s.trim())
		.filter((s) => s.length > 0 && s.length <= 80)
		.slice(0, 4);
	return { body, suggestions };
}

function ChatScreen() {
	const { firstName, healthScore, isPro } = useOnboardingStore();
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			role: "assistant",
			content: `Hi ${firstName || "there"}! I'm EZBuddy, your lifestyle wellness companion. Your current wellness score is ${healthScore || "--"}. How can I help you with your wellness journey today?`,
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
				setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
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
				setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
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
				setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
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
	const handleSend = async (overrideText?: string) => {
		const fromSuggestion = overrideText !== undefined;
		const userText = (overrideText ?? input).trim();
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

		if (!fromSuggestion) {
			setInput("");
		}
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

		const userMsg: Message = {
			id: Date.now().toString(),
			role: "user",
			content: userText,
			imageUri: imgSnap?.uri,
			docName: docSnap?.name,
		};
		const newMessages = [...messages, userMsg];
		setMessages(newMessages);
		setIsLoading(true);

		// Scroll to show the new message
		setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);

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
					"You are EZBuddy, a friendly lifestyle and wellness companion. You are NOT a doctor, nurse, or medical professional. You do NOT provide medical advice, diagnoses, or treatment recommendations. Never use clinical or diagnostic language. If a user describes serious symptoms, advise them to contact a healthcare professional immediately. Provide general lifestyle tips about wellness, nutrition, exercise, and self-care. Always include a reminder that your suggestions are for general informational and educational purposes only and are not a substitute for professional medical advice.\n\nFormatting rules:\n- Use relevant emojis to make responses warm and engaging.\n- Use **bold** for key wellness concepts, important terms, and action items the user should remember.\n- Use *italic* for gentle emphasis, encouragement, or softening of suggestions.\n- Keep paragraphs short (2–3 sentences max).\n\nAt the end of every response, append a <suggestions> block with 3 short follow-up questions (max 8 words each) the user might ask next, separated by the pipe character. Example: <suggestions>How do I improve sleep?|What foods help energy?|Tell me about stretching</suggestions>. The block is for the UI — do not mention it to the user.",
				messages: [...priorApiMessages, { role: "user", content: userContent }],
			});

			const rawReply =
				response.content[0].type === "text" ? response.content[0].text : "";
			const { body: assistantReply, suggestions } =
				extractSuggestions(rawReply);

			if (Platform.OS === "ios") {
				try {
					await impactAsync(ImpactFeedbackStyle.Medium);
				} catch {
					/* ignore */
				}
			}

			setMessages((prev) => [
				...prev,
				{
					id: `${Date.now()}-ai`,
					role: "assistant",
					content: assistantReply,
					suggestions: suggestions.length > 0 ? suggestions : undefined,
				},
			]);
			setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
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
											style={styles.chatImage}
										/>
									)}
									{m.docName && (
										<View style={styles.docBubble}>
											<Ionicons color="#3EC9B5" name="document-text" size={22} />
											<Text style={styles.docBubbleName} numberOfLines={1}>{m.docName}</Text>
										</View>
									)}
									{isUser ? (
										m.content ? (
											<Text style={[styles.messageText, styles.userText]}>
												{m.content}
											</Text>
										) : null
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
									{!isUser && m.suggestions && m.suggestions.length > 0 && (
										<ScrollView
											contentContainerStyle={styles.suggestionsRow}
											horizontal
											showsHorizontalScrollIndicator={false}
											style={styles.suggestionsScroll}
										>
											{m.suggestions.map((s) => (
												<TouchableOpacity
													activeOpacity={0.75}
													key={s}
													onPress={() => handleSend(s)}
													style={styles.suggestionChip}
												>
													<Text style={styles.suggestionChipText}>{s}</Text>
												</TouchableOpacity>
											))}
										</ScrollView>
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
					{(attachedImage || attachedDoc) && (
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
										style={styles.chatImage}
									/>
								)}
								{attachedDoc && (
									<View style={styles.docBubble}>
										<Ionicons color="#3EC9B5" name="document-text" size={22} />
										<Text style={styles.docBubbleName} numberOfLines={1}>{attachedDoc.name}</Text>
									</View>
								)}
								{input.trim() ? (
									<Text style={[styles.messageText, styles.userText]}>
										{input}
									</Text>
								) : null}
								<View style={styles.draftBadge}>
									<Text style={styles.draftBadgeText}>Draft</Text>
								</View>
							</View>
						</View>
					)}
				</ScrollView>

				{/* INPUT AREA */}
				<SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#0B0E17" }}>
					{/* Attachment preview strip */}
					{(attachedImage || attachedDoc) && (
						<View style={styles.previewBar}>
							{attachedImage && (
								<View style={styles.previewImageWrapper}>
									<Image
										source={{ uri: attachedImage.uri }}
										style={styles.previewImage}
										resizeMode="cover"
									/>
									<TouchableOpacity
										onPress={() => setAttachedImage(null)}
										style={styles.removeBtn}
									>
										<Ionicons name="close-circle" size={20} color="#FF4F6E" />
									</TouchableOpacity>
								</View>
							)}
							{attachedDoc && (
								<View style={styles.previewImageWrapper}>
									<View style={styles.previewDoc}>
										<Ionicons name="document-text" size={26} color="#3EC9B5" />
										<Text style={styles.previewDocName} numberOfLines={1}>
											{attachedDoc.name}
										</Text>
									</View>
									<TouchableOpacity
										onPress={() => setAttachedDoc(null)}
										style={styles.removeBtn}
									>
										<Ionicons name="close-circle" size={20} color="#FF4F6E" />
									</TouchableOpacity>
								</View>
							)}
						</View>
					)}
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
		maxWidth: Dimensions.get("window").width > 600 ? 480 : "80%",
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
	suggestionsScroll: {
		marginTop: 10,
		marginHorizontal: -4,
	},
	suggestionsRow: {
		paddingHorizontal: 4,
		gap: 8,
	},
	suggestionChip: {
		backgroundColor: "rgba(62,201,181,0.15)",
		borderColor: "rgba(62,201,181,0.35)",
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: 12,
		paddingVertical: 6,
		marginRight: 8,
	},
	suggestionChipText: {
		color: "#3EC9B5",
		fontSize: 13,
		fontWeight: "600",
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
	chatImage: {
		width: "100%",
		aspectRatio: 4 / 3,
		borderRadius: 12,
		marginBottom: 8,
		maxHeight: Math.min(Dimensions.get("window").height * 0.25, 220),
	},
	docBubble: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		backgroundColor: "rgba(62,201,181,0.08)",
		borderWidth: 1,
		borderColor: "rgba(62,201,181,0.25)",
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 10,
		marginBottom: 8,
	},
	docBubbleName: {
		flex: 1,
		color: "#E2E8F0",
		fontSize: 14,
		fontWeight: "600",
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
		width: 56,
		height: 56,
		borderRadius: 10,
		backgroundColor: "#1A2138",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 4,
		borderWidth: 1,
		borderColor: "rgba(62,201,181,0.3)",
	},
	previewDocName: {
		color: "#94A3B8",
		fontSize: 8,
		fontWeight: "600",
		textAlign: "center",
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
