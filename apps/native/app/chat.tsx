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
import { useCompanionStore } from "@/stores/companion-store";
import { levelsService } from "@/lib/levels-service";

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
const MEMORY_RE = /<memory>([\s\S]*?)<\/memory>/i;

function extractSuggestions(text: string): {
	body: string;
	suggestions: string[];
	memoryFacts: string[];
} {
	const memMatch = text.match(MEMORY_RE);
	const memoryFacts = memMatch
		? memMatch[1].split("|").map((s) => s.trim()).filter((s) => s.length > 0 && s.length <= 100)
		: [];

	const cleaned = text.replace(MEMORY_RE, "");
	const m = cleaned.match(SUGGESTIONS_RE);
	if (!m) {
		return { body: cleaned.trim(), suggestions: [], memoryFacts };
	}
	const body = cleaned.replace(SUGGESTIONS_RE, "").trim();
	const suggestions = m[1]
		.split("|")
		.map((s) => s.trim())
		.filter((s) => s.length > 0 && s.length <= 80)
		.slice(0, 4);
	return { body, suggestions, memoryFacts };
}

const SYSTEM_PROMPT = `You are a friendly daily companion called EZBuddy. You help users build healthy daily habits like sleep, hydration, movement, mood, and nutrition. You NEVER provide medical advice. You NEVER discuss symptoms, diseases, conditions, diagnostics, treatments, or medications. If a user asks about any medical topic, symptom, or health concern, you respond: "I'm a lifestyle companion, not a medical tool. For any medical question, please consult a healthcare professional. I can help you with daily habits, hydration, sleep, mood, and movement instead." You focus only on lifestyle: routines, hydration goals, sleep schedules, daily steps, mood check-ins, balanced meals (without specific calorie prescriptions), and gentle motivation.

## Your Personality
- **Encouraging & celebratory**: Celebrate every small win. "That's huge!", "Love that you noticed that!", "You're on fire!"
- **Curious**: Ask follow-up questions. Show genuine interest. "Tell me more about that", "What made you think of that?"
- **Playful but smart**: Use casual language and humor, but back it up with general lifestyle knowledge.
- **Direct**: Get to the point. No fluff. Short paragraphs. Talk like a text message, not an essay.
- Emojis: Use 1-3 per message, naturally placed. Never start with an emoji.

## Conversation Flow
1. **Acknowledge first** — validate what they said ("That makes total sense", "I get it")
2. **Ask one clarifying question** before jumping to tips
3. **Share 2-3 possible lifestyle angles** when they share a concern — ask which resonates
4. **Give a mini action plan** (3 steps max, specific and doable TODAY)
5. **End with encouragement** — make them feel capable and motivated
6. **Reference previous messages** — build continuity, never repeat yourself

## Celebration Triggers (go big on these!)
- User reports good sleep, high energy, low stress → celebrate genuinely
- User completed a check-in streak → "You're unstoppable!"
- User is trying something new → "Love that you're experimenting!"
- User shares a win, however small → amplify it

## What You Do
- General daily tips: sleep habits, daily energy, nutrition awareness, exercise, mood, mindfulness
- Habit awareness: help users notice patterns between their daily routines and how they feel
- Action planning: simple, specific, achievable daily habit ideas
- Motivation & accountability: like a supportive coach in their pocket

## What You NEVER Do
- You NEVER give advice about any illness, injury, pain, or bodily discomfort
- You NEVER mention specific foods as cures or treatments for anything
- You NEVER reference lab results, blood work, supplements, or vitamins as remedies
- You NEVER use words like: symptom, diagnosis, treatment, clinical, prescribe, patient, condition, disorder, therapy, cure, disease
- If asked about ANY of the above, you redirect to a qualified professional

## Formatting Rules
- Max 2-3 short paragraphs per message
- **Bold** for key takeaways and action items
- *Italic* for encouragement and emphasis
- Bullet points for lists (max 3-4 items)
- End EVERY response with a <suggestions> block: 3 short follow-up prompts separated by |
  Example: <suggestions>What foods give me energy?|Tips for better sleep habits|Create a morning routine</suggestions>

## Memory
- When the user shares personal details (preferences, goals, habits, routines), include a <memory> block:
  Example: <memory>prefers keto diet|works out 3x per week|wants to improve sleep routine</memory>
  Never mention this system to the user.`;

function buildUserProfile(): string {
	const s = useOnboardingStore.getState();
	const parts: string[] = [];
	if (s.firstName) parts.push(`Name: ${s.firstName}`);
	if (s.gender) parts.push(`Gender: ${s.gender}`);
	if (s.birthDate) parts.push(`Birthday: ${s.birthDate}`);
	if (s.heightCm) parts.push(`Height: ${s.heightCm}cm`);
	if (s.weightKg) parts.push(`Weight: ${s.weightKg}kg`);
	if (s.activityLevel) parts.push(`Activity level: ${s.activityLevel}/5`);
	if (s.sleepQuality) parts.push(`Sleep quality: ${s.sleepQuality}/5`);
	if (s.stressLevel) parts.push(`Stress level: ${s.stressLevel}`);
	if (s.primaryGoal) parts.push(`Primary goal: ${s.primaryGoal}`);
	if (s.goals?.length) parts.push(`Goals: ${s.goals.join(", ")}`);
	if (s.dietType) parts.push(`Diet preference: ${s.dietType}`);
	if (s.overallPriority) parts.push(`Top priority: ${s.overallPriority}`);
	if (s.overallBlocker) parts.push(`Main blocker: ${s.overallBlocker}`);
	if (parts.length === 0) return "";
	return `\n\n## User Profile (from onboarding — use this to personalize your advice)\n${parts.join("\n")}`;
}

function ChatScreen() {
	const { firstName, isPro } = useOnboardingStore();
	const { getMemoryContext, incrementConversationCount, addTopic } = useCompanionStore();
	const buddyGreeting = (() => {
		const hour = new Date().getHours();
		const name = firstName || "there";
		if (hour < 12) return `Good morning, ${name}! ☀️`;
		if (hour < 17) return `Hey ${name}! 👋`;
		return `Evening, ${name}! 🌙`;
	})();

	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			role: "assistant",
			content: `${buddyGreeting}\n\nI'm EZBuddy — your personal daily companion. Think of me as a friend who knows about daily habits, routines, and self-care ideas.\n\n**I learn about you over time**, so the more we chat, the better I get at sharing useful tips. What's on your mind today?`,
			suggestions: [
				"I want more energy",
				"Help me build better habits",
				"I want to manage stress",
				"Build a morning routine",
			],
		},
	]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [streamingText, setStreamingText] = useState("");
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
					} catch {}
				}
				await Voice.start("en-US");
				setIsListening(true);
			} catch {
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
				Alert.alert("Permission required", "Camera access is needed to take photos.");
				return;
			}
			const result = await launchCameraAsync({ base64: true, quality: 0.7, mediaTypes: "images" });
			if (!result.canceled && result.assets[0].base64) {
				const asset = result.assets[0];
				const ext = asset.uri.split(".").pop()?.toLowerCase();
				let mediaType: AttachedImage["mediaType"] = "image/jpeg";
				if (ext === "png") mediaType = "image/png";
				else if (ext === "webp") mediaType = "image/webp";
				setAttachedImage({ uri: asset.uri, base64: asset.base64 ?? "", mediaType });
				setAttachedDoc(null);
			}
		} else {
			const { status } = await requestMediaLibraryPermissionsAsync();
			if (status !== "granted") {
				Alert.alert("Permission required", "Photo library access is needed.");
				return;
			}
			const result = await launchImageLibraryAsync({ base64: true, quality: 0.7, mediaTypes: "images" });
			if (!result.canceled && result.assets[0].base64) {
				const asset = result.assets[0];
				const ext = asset.uri.split(".").pop()?.toLowerCase();
				let mediaType: AttachedImage["mediaType"] = "image/jpeg";
				if (ext === "png") mediaType = "image/png";
				else if (ext === "webp") mediaType = "image/webp";
				setAttachedImage({ uri: asset.uri, base64: asset.base64 ?? "", mediaType });
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
			try {
				const text = await readAsStringAsync(result.assets[0].uri);
				setAttachedDoc({ name: result.assets[0].name, text: text.slice(0, 8000) });
				setAttachedImage(null);
			} catch {
				Alert.alert("File Error", "Could not read that file.");
			}
		}
	};

	const openAttachMenu = () => bottomSheetModalRef.current?.present();

	const renderBackdrop = useCallback(
		(props: any) => (
			<BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
		),
		[]
	);

	// ── Direct fetch to Anthropic API (bypasses SDK for Android/Hermes compatibility) ──
	const sendViaFetch = async (
		systemPrompt: string,
		apiMessages: { role: "user" | "assistant"; content: any }[],
	): Promise<string> => {
		console.log("[Chat] sendViaFetch: apiKey length =", apiKey?.length ?? 0);
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
				messages: apiMessages,
			}),
		});
		console.log("[Chat] sendViaFetch: status =", response.status);
		if (!response.ok) {
			const errBody = await response.text();
			console.error("[Chat] sendViaFetch error body:", errBody.slice(0, 500));
			throw new Error(`API ${response.status}: ${errBody.slice(0, 200)}`);
		}
		const data = (await response.json()) as { content: { type: string; text: string }[] };
		return data.content[0]?.text ?? "";
	};

	// ── Send with streaming (fallback to non-streaming on error) ─────
	const handleSend = async (overrideText?: string) => {
		const fromSuggestion = overrideText !== undefined;
		const userText = (overrideText ?? input).trim();
		if (!(userText || attachedImage || attachedDoc) || isLoading) return;

		if (!isPro && messages.length >= 7) {
			Alert.alert("Chat Limit Reached", "Unlimited EZBuddy chat requires EZCare Pro.", [
				{ text: "Cancel", style: "cancel" },
				{ text: "View Plans", onPress: () => router.push("/settings/subscription") },
			]);
			return;
		}

		if (!fromSuggestion) setInput("");
		const imgSnap = attachedImage;
		const docSnap = attachedDoc;
		setAttachedImage(null);
		setAttachedDoc(null);

		if (Platform.OS === "ios") {
			try { await impactAsync(ImpactFeedbackStyle.Light); } catch {}
		}

		if (!apiKey || apiKey === "dummy_key_to_prevent_sdk_crash") {
			setMessages((prev) => [
				...prev,
				{ id: Date.now().toString(), role: "user", content: userText, imageUri: imgSnap?.uri },
				{ id: `${Date.now()}-err`, role: "assistant", content: "API key missing. Please set EXPO_PUBLIC_ANTHROPIC_API_KEY and rebuild." },
			]);
			return;
		}

		// Track conversation on first user message
		if (messages.filter((m) => m.role === "user").length === 0) {
			incrementConversationCount();
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
		setStreamingText("");

		setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);

		try {
			type ContentBlock =
				| { type: "text"; text: string }
				| { type: "image"; source: { type: "base64"; media_type: AttachedImage["mediaType"]; data: string } };

			const userContent: ContentBlock[] = [];

			if (imgSnap) {
				userContent.push({
					type: "image",
					source: { type: "base64", media_type: imgSnap.mediaType, data: imgSnap.base64 },
				});
			}

			let promptText = userText;
			if (docSnap) {
				promptText = `[Document: ${docSnap.name}]\n\n${docSnap.text}\n\n---\nUser: ${userText}`;
			}
			if (promptText) {
				userContent.push({ type: "text", text: promptText });
			}

			const priorApiMessages = messages.map((m) => ({
				role: m.role as "user" | "assistant",
				content: m.content,
			}));

			// Build system prompt with user profile + companion memory
			const userProfile = buildUserProfile();
			const memoryContext = getMemoryContext();
			const fullSystemPrompt = SYSTEM_PROMPT + userProfile + memoryContext;

			const apiMessages = [...priorApiMessages, { role: "user" as const, content: userContent }];

			let rawReply = "";

			// Use direct fetch on Android (Hermes lacks ReadableStream for streaming)
			// Also use fetch on iOS for consistency and reliability
			if (Platform.OS === "android") {
				rawReply = await sendViaFetch(fullSystemPrompt, apiMessages);
			} else {
				// iOS: try streaming via SDK, fall back to fetch
				try {
					const stream = anthropic.messages.stream({
						model: "claude-haiku-4-5-20251001",
						max_tokens: 1024,
						system: fullSystemPrompt,
						messages: apiMessages,
					});

					let fullText = "";

					stream.on("text", (text) => {
						fullText += text;
						setStreamingText(fullText);
						scrollRef.current?.scrollToEnd({ animated: false });
					});

					const finalMessage = await stream.finalMessage();
					rawReply = finalMessage.content[0].type === "text" ? finalMessage.content[0].text : fullText;
				} catch (streamErr) {
					console.warn("[Chat] Streaming failed, using fetch fallback:", streamErr);
					setStreamingText("");
					rawReply = await sendViaFetch(fullSystemPrompt, apiMessages);
				}
			}

			const { body: assistantReply, suggestions, memoryFacts } = extractSuggestions(rawReply);

			// Save memory facts from the AI's response
			if (memoryFacts.length > 0) {
				const { addFact } = useCompanionStore.getState();
				for (const fact of memoryFacts) {
					addFact(fact);
				}
			}

			if (Platform.OS === "ios") {
				try { await impactAsync(ImpactFeedbackStyle.Medium); } catch {}
			}

			setStreamingText("");
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

			// Award XP for AI chat (max 5/day)
			const uid = useOnboardingStore.getState().userId;
			if (uid) {
				levelsService.getTodayCountForSource(uid, "ai_chat").then((count) => {
					if (count < 5) {
						levelsService.addXp(uid, 10, "ai_chat").catch(() => {});
					}
				}).catch(() => {});
			}
		} catch (error) {
			console.error("[Chat] Send failed:", error);
			setStreamingText("");
			const errMsg = error instanceof Error ? error.message : String(error);
			const isNetwork = errMsg.includes("network") || errMsg.includes("fetch") || errMsg.includes("timeout") || errMsg.includes("Network");
			setMessages((prev) => [
				...prev,
				{
					id: `${Date.now()}-err`,
					role: "assistant",
					content: isNetwork
						? "Network error. Please check your internet connection and try again."
						: `Something went wrong: ${errMsg.slice(0, 120)}. Please try again.`,
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
	}, []);

	useEffect(() => {
		const sub = Keyboard.addListener("keyboardDidShow", () => {
			setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
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
					<TouchableOpacity hitSlop={8} onPress={() => router.back()} style={styles.backBtn}>
						<Ionicons color="#FFFFFF" name="chevron-back" size={24} />
					</TouchableOpacity>
					<View style={styles.headerTitleContainer}>
						<Text style={styles.headerTitle}>EZBuddy</Text>
						<View style={styles.onlineStatus}>
							<View style={[styles.onlineDot, isListening && styles.onlineDotRecording]} />
							<Text style={[styles.onlineText, isListening && styles.onlineTextRecording]}>
								{isListening ? "Listening..." : isLoading ? "Typing..." : "Online"}
							</Text>
						</View>
					</View>
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
								style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}
							>
								{!isUser && (
									<LinearGradient colors={["#28B898", "#3EC9B5"]} style={styles.aiAvatar}>
										<Ionicons color="#0B0E17" name="sparkles" size={14} />
									</LinearGradient>
								)}
								<View style={[styles.messageCard, isUser ? styles.userCard : styles.aiCard]}>
									{m.imageUri && (
										<Image resizeMode="cover" source={{ uri: m.imageUri }} style={styles.chatImage} />
									)}
									{m.docName && (
										<View style={styles.docBubble}>
											<Ionicons color="#3EC9B5" name="document-text" size={22} />
											<Text style={styles.docBubbleName} numberOfLines={1}>{m.docName}</Text>
										</View>
									)}
									{isUser ? (
										m.content ? (
											<Text style={[styles.messageText, styles.userText]}>{m.content}</Text>
										) : null
									) : (
										<Markdown
											style={{
												body: { color: "#E2E8F0", fontSize: 15, lineHeight: 22 },
												strong: { fontWeight: "bold", color: "#FFFFFF" },
												em: { fontStyle: "italic", color: "#3EC9B5" },
												bullet_list: { marginTop: 4, marginBottom: 4 },
												list_item: { marginBottom: 2 },
											}}
										>
											{m.content}
										</Markdown>
									)}
									{!isUser && m.suggestions && m.suggestions.length > 0 && (
										<View style={styles.suggestionsWrap}>
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
										</View>
									)}
								</View>
							</View>
						);
					})}

					{/* Streaming response */}
					{isLoading && streamingText ? (
						<View style={[styles.messageBubble, styles.aiBubble]}>
							<LinearGradient colors={["#28B898", "#3EC9B5"]} style={styles.aiAvatar}>
								<Ionicons color="#0B0E17" name="sparkles" size={14} />
							</LinearGradient>
							<View style={[styles.messageCard, styles.aiCard]}>
								<Markdown
									style={{
										body: { color: "#E2E8F0", fontSize: 15, lineHeight: 22 },
										strong: { fontWeight: "bold", color: "#FFFFFF" },
										em: { fontStyle: "italic", color: "#3EC9B5" },
									}}
								>
									{streamingText.replace(SUGGESTIONS_RE, "")}
								</Markdown>
								<View style={styles.typingDots}>
									<View style={[styles.dot, styles.dot1]} />
									<View style={[styles.dot, styles.dot2]} />
									<View style={[styles.dot, styles.dot3]} />
								</View>
							</View>
						</View>
					) : isLoading ? (
						<View style={[styles.messageBubble, styles.aiBubble]}>
							<LinearGradient colors={["#28B898", "#3EC9B5"]} style={styles.aiAvatar}>
								<Ionicons color="#0B0E17" name="sparkles" size={14} />
							</LinearGradient>
							<View style={[styles.messageCard, styles.aiCard]}>
								<View style={styles.typingDots}>
									<View style={[styles.dot, styles.dot1]} />
									<View style={[styles.dot, styles.dot2]} />
									<View style={[styles.dot, styles.dot3]} />
								</View>
							</View>
						</View>
					) : null}

					{/* Draft preview */}
					{(attachedImage || attachedDoc) && (
						<View style={[styles.messageBubble, styles.userBubble]}>
							<View style={[styles.messageCard, styles.userCard, { opacity: 0.7 }]}>
								{attachedImage && <Image source={{ uri: attachedImage.uri }} style={styles.chatImage} />}
								{attachedDoc && (
									<View style={styles.docBubble}>
										<Ionicons color="#3EC9B5" name="document-text" size={22} />
										<Text style={styles.docBubbleName} numberOfLines={1}>{attachedDoc.name}</Text>
									</View>
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
					{(attachedImage || attachedDoc) && (
						<View style={styles.previewBar}>
							{attachedImage && (
								<View style={styles.previewImageWrapper}>
									<Image source={{ uri: attachedImage.uri }} style={styles.previewImage} resizeMode="cover" />
									<TouchableOpacity onPress={() => setAttachedImage(null)} style={styles.removeBtn}>
										<Ionicons name="close-circle" size={20} color="#FF4F6E" />
									</TouchableOpacity>
								</View>
							)}
							{attachedDoc && (
								<View style={styles.previewImageWrapper}>
									<View style={styles.previewDoc}>
										<Ionicons name="document-text" size={26} color="#3EC9B5" />
										<Text style={styles.previewDocName} numberOfLines={1}>{attachedDoc.name}</Text>
									</View>
									<TouchableOpacity onPress={() => setAttachedDoc(null)} style={styles.removeBtn}>
										<Ionicons name="close-circle" size={20} color="#FF4F6E" />
									</TouchableOpacity>
								</View>
							)}
						</View>
					)}
					<View style={styles.inputArea}>
						<TouchableOpacity activeOpacity={0.7} onPress={openAttachMenu} style={styles.attachBtn}>
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
								disabled={!(input.trim() || attachedImage || attachedDoc) || isLoading}
								onPress={() => handleSend()}
								style={[
									styles.sendBtn,
									!(input.trim() || attachedImage || attachedDoc) && styles.sendBtnDisabled,
								]}
							>
								<Ionicons
									color={input.trim() || attachedImage || attachedDoc ? "#0B0E17" : "#94A3B8"}
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
						<TouchableOpacity onPress={() => { pickImage("camera"); bottomSheetModalRef.current?.dismiss(); }} style={styles.sheetBtn}>
							<View style={styles.sheetIconWrap}>
								<Ionicons color="#3EC9B5" name="camera" size={24} />
							</View>
							<Text style={styles.sheetBtnText}>Camera</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => { pickImage("gallery"); bottomSheetModalRef.current?.dismiss(); }} style={styles.sheetBtn}>
							<View style={styles.sheetIconWrap}>
								<Ionicons color="#3EC9B5" name="images" size={24} />
							</View>
							<Text style={styles.sheetBtnText}>Gallery</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => { pickDocument(); bottomSheetModalRef.current?.dismiss(); }} style={styles.sheetBtn}>
							<View style={styles.sheetIconWrap}>
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
		fontSize: 17,
		fontWeight: "800",
		letterSpacing: 0.5,
	},
	onlineStatus: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 2,
		gap: 4,
	},
	onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#3EC9B5" },
	onlineDotRecording: { backgroundColor: "#FF4F6E" },
	onlineText: { color: "#3EC9B5", fontSize: 11, fontWeight: "600" },
	onlineTextRecording: { color: "#FF4F6E" },
	chatArea: { flex: 1 },
	chatContent: { padding: 20, gap: 16 },
	messageBubble: { flexDirection: "row", width: "100%" },
	userBubble: { justifyContent: "flex-end" },
	aiBubble: { justifyContent: "flex-start", alignItems: "flex-end", gap: 10 },
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
		borderColor: "rgba(255,255,255,0.06)",
	},
	aiCard: {
		backgroundColor: "rgba(62,201,181,0.08)",
		borderBottomLeftRadius: 4,
		borderWidth: 1,
		borderColor: "rgba(62,201,181,0.15)",
	},
	suggestionsWrap: {
		marginTop: 12,
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	suggestionChip: {
		backgroundColor: "rgba(62,201,181,0.12)",
		borderColor: "rgba(62,201,181,0.3)",
		borderWidth: 1,
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
	suggestionChipText: {
		color: "#3EC9B5",
		fontSize: 13,
		fontWeight: "600",
	},
	messageText: { fontSize: 15, lineHeight: 22 },
	userText: { color: "#FFFFFF" },
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
	docBubbleName: { flex: 1, color: "#E2E8F0", fontSize: 14, fontWeight: "600" },
	// Typing indicator dots
	typingDots: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingVertical: 4,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#3EC9B5",
		opacity: 0.4,
	},
	dot1: { opacity: 0.8 },
	dot2: { opacity: 0.5 },
	dot3: { opacity: 0.3 },
	// Preview bar
	previewBar: { paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row", gap: 8 },
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
	previewDocName: { color: "#94A3B8", fontSize: 8, fontWeight: "600", textAlign: "center" },
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
	// Sheet
	sheetContent: { padding: 24, alignItems: "center" },
	sheetTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginBottom: 24 },
	sheetRow: { flexDirection: "row", justifyContent: "space-around", width: "100%" },
	sheetBtn: { alignItems: "center", gap: 8 },
	sheetIconWrap: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "rgba(255,255,255,0.05)",
		alignItems: "center",
		justifyContent: "center",
	},
	sheetBtnText: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },
	draftBadge: {
		position: "absolute",
		top: -8,
		left: -8,
		backgroundColor: "#3EC9B5",
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 8,
	},
	draftBadgeText: { color: "#0B0E17", fontSize: 10, fontWeight: "800" },
});
