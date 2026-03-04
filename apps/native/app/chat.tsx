import { Ionicons } from "@expo/vector-icons";
import Anthropic from "@anthropic-ai/sdk";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState, useRef, useEffect } from "react";
import {
	ActivityIndicator,
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

// Note: In an Expo native app, making client-side Anthropic calls requires `dangerouslyAllowBrowser: true`.
// Ideally, this should run through a safe backend proxy (e.g. Next.js API or Supabase Edge Function).
const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

const anthropic = new Anthropic({
	apiKey: apiKey || "dummy_key_to_prevent_sdk_crash", 
	dangerouslyAllowBrowser: true, 
});

type Message = {
	id: string;
	role: "user" | "assistant";
	content: string;
};

export default function ChatScreen() {
	const { firstName, healthScore } = useOnboardingStore();
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			role: "assistant",
			content: `Hi ${
				firstName || "there"
			}! I'm EZBuddy. I see your health score is currently ${
				healthScore || "--"
			}. How can I help you today?`,
		},
	]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const scrollRef = useRef<ScrollView>(null);

	const handleSend = async () => {
		if (!input.trim() || isLoading) return;

		const userText = input.trim();
		setInput("");
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Light);
			} catch {}
		}

		// Prevent sending if key isn't configured
		if (!apiKey || apiKey === "dummy_key_to_prevent_sdk_crash") {
			setMessages([
				...messages,
				{ id: Date.now().toString(), role: "user", content: userText },
				{
					id: Date.now().toString() + "-err",
					role: "assistant",
					content:
						"⚠️ API Key Missing: Please ensure your EXPO_PUBLIC_ANTHROPIC_API_KEY is correctly set in apps/native/.env and rebuild the app to start chatting.",
				},
			]);
			return;
		}

		const newMessages: Message[] = [
			...messages,
			{ id: Date.now().toString(), role: "user", content: userText },
		];
		setMessages(newMessages);
		setIsLoading(true);

		try {
			// Extract just the role/content for the Anthropic API
			const apiMessages = newMessages.map((m) => ({
				role: m.role,
				content: m.content,
			}));

			const response = await anthropic.messages.create({
				model: "claude-3-haiku-20240307",
				max_tokens: 500,
				system:
					"You are EZBuddy, a premium health and wellness AI assistant. Keep responses extremely concise, empathetic, and highly actionable. Format nicely.",
				messages: apiMessages,
			});

			const assistantReply =
				response.content[0].type === "text" ? response.content[0].text : "";

			if (Platform.OS === "ios") {
				try {
					await impactAsync(ImpactFeedbackStyle.Medium);
				} catch {}
			}

			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString() + "-ai",
					role: "assistant",
					content: assistantReply,
				},
			]);
		} catch (error) {
			console.error("Anthropic error:", error);
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString() + "-err",
					role: "assistant",
					content:
						"I'm sorry, I couldn't reach my network connection right now. Please ensure your `EXPO_PUBLIC_ANTHROPIC_API_KEY` is set in the `.env` file.",
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
	}, [messages]);

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				{/* HEADER */}
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => router.back()}
						hitSlop={8}
						style={styles.backBtn}
					>
						<Ionicons name="chevron-back" size={24} color="#FFFFFF" />
					</TouchableOpacity>
					<View style={styles.headerTitleContainer}>
						<Text style={styles.headerTitle}>EZBuddy AI</Text>
						<View style={styles.onlineStatus}>
							<View style={styles.onlineDot} />
							<Text style={styles.onlineText}>Online</Text>
						</View>
					</View>
					<View style={styles.spacer} />
				</View>

				{/* CHAT AREA */}
				<ScrollView
					ref={scrollRef}
					style={styles.chatArea}
					contentContainerStyle={styles.chatContent}
					showsVerticalScrollIndicator={false}
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
										<Ionicons name="sparkles" size={14} color="#0B0E17" />
									</LinearGradient>
								)}
								<View
									style={[
										styles.messageCard,
										isUser ? styles.userCard : styles.aiCard,
									]}
								>
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
								<Ionicons name="sparkles" size={14} color="#0B0E17" />
							</LinearGradient>
							<View style={[styles.messageCard, styles.aiCard]}>
								<ActivityIndicator size="small" color="#3EC9B5" />
							</View>
						</View>
					)}
				</ScrollView>

				{/* INPUT AREA */}
				<View style={styles.inputArea}>
					<View style={styles.inputWrapper}>
						<TextInput
							style={styles.textInput}
							placeholder="Message EZBuddy..."
							placeholderTextColor="#94A3B8"
							value={input}
							onChangeText={setInput}
							multiline
							maxLength={500}
						/>
						<TouchableOpacity
							style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
							onPress={handleSend}
							disabled={!input.trim() || isLoading}
						>
							<Ionicons
								name="arrow-up"
								size={20}
								color={input.trim() ? "#0B0E17" : "#94A3B8"}
							/>
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: "#0B0E17",
	},
	container: {
		flex: 1,
	},
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
	headerTitleContainer: {
		alignItems: "center",
	},
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
	onlineText: {
		color: "#3EC9B5",
		fontSize: 11,
		fontWeight: "600",
	},
	spacer: {
		width: 40,
	},
	chatArea: {
		flex: 1,
	},
	chatContent: {
		padding: 24,
		gap: 20,
	},
	messageBubble: {
		flexDirection: "row",
		width: "100%",
	},
	userBubble: {
		justifyContent: "flex-end",
	},
	aiBubble: {
		justifyContent: "flex-start",
		alignItems: "flex-end",
		gap: 12,
	},
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
	messageText: {
		fontSize: 15,
		lineHeight: 22,
	},
	userText: {
		color: "#FFFFFF",
	},
	aiText: {
		color: "#E2E8F0",
	},
	inputArea: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: "rgba(255,255,255,0.05)",
		backgroundColor: "#0B0E17",
	},
	inputWrapper: {
		flexDirection: "row",
		alignItems: "flex-end",
		backgroundColor: "#1A2138",
		borderRadius: 24,
		paddingHorizontal: 16,
		paddingVertical: 8,
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
	sendBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#3EC9B5",
		alignItems: "center",
		justifyContent: "center",
		marginLeft: 12,
		marginBottom: 2,
	},
	sendBtnDisabled: {
		backgroundColor: "rgba(255,255,255,0.05)",
	},
});
