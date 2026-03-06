import Anthropic from "@anthropic-ai/sdk";
import { Ionicons } from "@expo/vector-icons";
import Voice, {
	type SpeechErrorEvent,
	type SpeechResultsEvent,
} from "@react-native-voice/voice";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActionSheetIOS,
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
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

export default function ChatScreen() {
	const { firstName, healthScore } = useOnboardingStore();
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
				if (Platform.OS === "ios") {
					try {
						await impactAsync(ImpactFeedbackStyle.Medium);
					} catch {
						/* ignore */
					}
				}
				await Voice.start("en-US");
				setIsListening(true);
			} catch (err) {
				Alert.alert(
					"Microphone Error",
					"Could not start voice recognition. Please check permissions."
				);
			}
		}
	};

	// ── Image Picker ───────────────────────────────────────
	const pickImage = async (source: "camera" | "gallery") => {
		let result: ImagePicker.ImagePickerResult;
		if (source === "camera") {
			const { status } = await ImagePicker.requestCameraPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Permission required",
					"Camera access is needed to take photos."
				);
				return;
			}
			result = await ImagePicker.launchCameraAsync({
				base64: true,
				quality: 0.7,
				mediaTypes: "images",
			});
		} else {
			const { status } =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Permission required",
					"Photo library access is needed to upload images."
				);
				return;
			}
			result = await ImagePicker.launchImageLibraryAsync({
				base64: true,
				quality: 0.7,
				mediaTypes: "images",
			});
		}
		if (!result.canceled && result.assets[0].base64) {
			const asset = result.assets[0];
			const ext = asset.uri.split(".").pop()?.toLowerCase();
			const mediaType: AttachedImage["mediaType"] =
				ext === "png"
					? "image/png"
					: ext === "webp"
						? "image/webp"
						: "image/jpeg";
			setAttachedImage({ uri: asset.uri, base64: asset.base64!, mediaType });
			setAttachedDoc(null);
		}
	};

	// ── Document Picker ────────────────────────────────────
	const pickDocument = async () => {
		const result = await DocumentPicker.getDocumentAsync({
			type: ["text/plain", "text/csv", "application/json"],
			copyToCacheDirectory: true,
		});
		if (!result.canceled && result.assets[0]) {
			const asset = result.assets[0];
			try {
				const text = await FileSystem.readAsStringAsync(asset.uri);
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

	// ── Attachment action sheet ────────────────────────────
	const openAttachMenu = () => {
		const options = [
			"Take Photo",
			"Choose from Gallery",
			"Upload Text Document",
			"Cancel",
		];
		if (Platform.OS === "ios") {
			ActionSheetIOS.showActionSheetWithOptions(
				{ options, cancelButtonIndex: 3, title: "Attach to message" },
				(index) => {
					if (index === 0) {
						pickImage("camera");
					} else if (index === 1) {
						pickImage("gallery");
					} else if (index === 2) {
						pickDocument();
					}
				}
			);
		} else {
			Alert.alert("Attach to message", undefined, [
				{ text: "Take Photo", onPress: () => pickImage("camera") },
				{ text: "Choose from Gallery", onPress: () => pickImage("gallery") },
				{ text: "Upload Text Document", onPress: pickDocument },
				{ text: "Cancel", style: "cancel" },
			]);
		}
	};

	// ── Send ───────────────────────────────────────────────
	const handleSend = async () => {
		const userText = input.trim();
		if (!(userText || attachedImage || attachedDoc) || isLoading) {
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
				max_tokens: 1024,
				system:
					"You are EZBuddy, a premium health and wellness AI assistant. Keep responses empathetic, concise, and highly actionable. If the user shares an image for health analysis, describe what you see and provide relevant wellness guidance.",
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
		} catch (error) {
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
	}, [messages, isLoading]);

	return (
		<SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
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
									<Text
										style={[
											styles.messageText,
											isUser ? styles.userText : styles.aiText,
										]}
									>
										{m.content}
									</Text>
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
				</ScrollView>

				{/* ATTACHMENT PREVIEWS */}
				{(attachedImage || attachedDoc) && (
					<View style={styles.previewBar}>
						{attachedImage && (
							<View style={styles.previewImageWrapper}>
								<Image
									source={{ uri: attachedImage.uri }}
									style={styles.previewImage}
								/>
								<TouchableOpacity
									hitSlop={6}
									onPress={() => setAttachedImage(null)}
									style={styles.removeBtn}
								>
									<Ionicons color="#FF4F6E" name="close-circle" size={18} />
								</TouchableOpacity>
							</View>
						)}
						{attachedDoc && (
							<View style={styles.previewDoc}>
								<Ionicons color="#3EC9B5" name="document-text" size={16} />
								<Text numberOfLines={1} style={styles.previewDocName}>
									{attachedDoc.name}
								</Text>
								<TouchableOpacity
									hitSlop={6}
									onPress={() => setAttachedDoc(null)}
								>
									<Ionicons color="#FF4F6E" name="close-circle" size={18} />
								</TouchableOpacity>
							</View>
						)}
					</View>
				)}

				{/* INPUT AREA */}
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
							placeholder={isListening ? "Listening..." : "Message EZBuddy..."}
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
			</KeyboardAvoidingView>
		</SafeAreaView>
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
});
