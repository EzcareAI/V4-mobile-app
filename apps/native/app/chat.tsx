import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
	ArrowLeft,
	Bot,
	Info,
	Send,
	Sparkles,
	User,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
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
import { anthropicService } from "@/lib/anthropic";
import { useOnboardingStore } from "@/stores/onboarding-store";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
}

const QuickAction = ({
	label,
	query,
	onPress,
}: {
	label: string;
	query: string;
	onPress: (q: string) => void;
}) => (
	<TouchableOpacity
		activeOpacity={0.7}
		className="mr-2 rounded-full border border-[#3EC9B540] bg-white px-4 py-2 shadow-sm"
		onPress={() => onPress(query)}
	>
		<Text className="font-bold text-[#1A9E8F] text-xs">{label}</Text>
	</TouchableOpacity>
);

export default function ChatScreen() {
	const { firstName, healthScore } = useOnboardingStore();
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "welcome",
			role: "assistant",
			content: `Hi ${firstName || "there"}! I'm EZBuddy. I'm here to help you understand your wellness journey. I can explain your Health Score (${healthScore || 72}), suggest daily actions, or answer general wellness questions. How can I help you today?`,
		},
	]);
	const [isTyping, setIsTyping] = useState(false);
	const scrollRef = useRef<ScrollView>(null);

	const scrollToBottom = () => {
		setTimeout(() => {
			scrollRef.current?.scrollToEnd({ animated: true });
		}, 100);
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages, isTyping]);

	const handleSend = async () => {
		const trimmedInput = input.trim();
		if (!trimmedInput || isTyping) {
			return;
		}

		const userMessage: Message = {
			id: Date.now().toString(),
			role: "user",
			content: trimmedInput,
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsTyping(true);

		try {
			// Prepare history for Anthropic (excluding IDs)
			const history = messages
				.concat(userMessage)
				.map((m) => ({ role: m.role, content: m.content }));

			const response = await anthropicService.sendMessage(history);

			setMessages((prev) => [
				...prev,
				{
					id: (Date.now() + 1).toString(),
					role: "assistant",
					content: response,
				},
			]);
		} catch (error) {
			console.error("Chat Error:", error);
			setMessages((prev) => [
				...prev,
				{
					id: (Date.now() + 1).toString(),
					role: "assistant",
					content:
						"I'm having a bit of trouble connecting right now. Let's try again in a moment.",
				},
			]);
		} finally {
			setIsTyping(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-[#F8FBFA]" edges={["top"]}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				{/* --- Header --- */}
				<View className="flex-row items-center justify-between border-[#3EC9B510] border-b bg-white px-6 py-4">
					<View className="flex-row items-center gap-3">
						<TouchableOpacity
							activeOpacity={0.7}
							className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
							onPress={() => router.back()}
						>
							<ArrowLeft color="#1A2138" size={20} />
						</TouchableOpacity>
						<View className="flex-row items-center gap-3">
							<View className="h-10 w-10 items-center justify-center rounded-full bg-[#E6FFFA] ring-2 ring-[#3EC9B5]">
								<Bot color="#3EC9B5" size={24} />
							</View>
							<View>
								<Text className="font-bold text-[#1A2138] text-lg">
									EZBuddy AI
								</Text>
								<View className="flex-row items-center gap-1">
									<View className="h-2 w-2 rounded-full bg-emerald-500" />
									<Text className="font-medium text-[#60708F] text-xs">
										Always here for you
									</Text>
								</View>
							</View>
						</View>
					</View>
					<TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-slate-50">
						<Info color="#60708F" size={18} />
					</TouchableOpacity>
				</View>

				{/* --- Chat Window --- */}
				<ScrollView
					className="flex-1 px-4 pt-6"
					contentContainerStyle={{ paddingBottom: 24 }}
					ref={scrollRef}
					showsVerticalScrollIndicator={false}
				>
					{messages.map((msg) => (
						<View
							className={`mb-6 flex-row ${msg.role === "user" ? "justify-end" : "justify-start"}`}
							key={msg.id}
						>
							{msg.role === "assistant" && (
								<View className="mt-auto mr-2 h-8 w-8 items-center justify-center rounded-full bg-[#E6FFFA]">
									<Sparkles color="#3EC9B5" size={14} />
								</View>
							)}
							<View
								className={`max-w-[80%] rounded-2xl p-4 ${
									msg.role === "user"
										? "rounded-tr-none bg-[#1A2138]"
										: "rounded-tl-none border border-[#3EC9B515] bg-white shadow-sm"
								}`}
							>
								<Text
									className={`text-base leading-6 ${
										msg.role === "user" ? "text-white" : "text-[#1A2138]"
									}`}
								>
									{msg.content}
								</Text>
							</View>
							{msg.role === "user" && (
								<View className="mt-auto ml-2 h-8 w-8 items-center justify-center rounded-full bg-slate-100">
									<User color="#60708F" size={14} />
								</View>
							)}
						</View>
					))}

					{isTyping && (
						<View className="mb-6 flex-row justify-start">
							<View className="mt-auto mr-2 h-8 w-8 items-center justify-center rounded-full bg-[#E6FFFA]">
								<Sparkles color="#3EC9B5" size={14} />
							</View>
							<View className="flex-row gap-1 rounded-2xl rounded-tl-none border border-[#3EC9B515] bg-white p-4 shadow-sm">
								<ActivityIndicator color="#3EC9B5" size="small" />
								<Text className="font-medium text-[#60708F] text-sm italic">
									EZBuddy is thinking...
								</Text>
							</View>
						</View>
					)}
				</ScrollView>

				{/* --- Input Area --- */}
				<View className="border-[#3EC9B510] border-t bg-white px-4 pt-4 pb-8">
					{/* Quick Actions */}
					<ScrollView
						className="mb-4"
						horizontal
						showsHorizontalScrollIndicator={false}
					>
						<QuickAction
							label="Explain Score"
							onPress={setInput}
							query="Can you explain my Health Score?"
						/>
						<QuickAction
							label="Recovery Tip"
							onPress={setInput}
							query="Give me a quick recovery tip for my focused zones."
						/>
						<QuickAction
							label="Daily Routine"
							onPress={setInput}
							query="What should I do today?"
						/>
						<QuickAction
							label="Sleep Tips"
							onPress={setInput}
							query="How can I improve my sleep?"
						/>
					</ScrollView>

					<View className="flex-row items-center gap-2">
						<View className="flex-1 flex-row items-center rounded-3xl bg-slate-50 px-5 py-2 ring-1 ring-slate-100">
							<TextInput
								className="flex-1 py-2 font-medium text-[#1A2138] text-base"
								multiline
								onChangeText={setInput}
								placeholder="Ask EZBuddy anything..."
								placeholderTextColor="#94A3B8"
								value={input}
							/>
						</View>
						<TouchableOpacity
							activeOpacity={0.85}
							className="h-12 w-12 items-center justify-center overflow-hidden rounded-full shadow-lg"
							disabled={!input.trim() || isTyping}
							onPress={handleSend}
						>
							<LinearGradient
								colors={
									!input.trim() || isTyping
										? ["#CBD5E1", "#94A3B8"]
										: ["#28B898", "#3EC9B5"]
								}
								style={StyleSheet.absoluteFill}
							/>
							<Send color="white" size={20} />
						</TouchableOpacity>
					</View>

					<Text className="mt-3 text-center font-medium text-[#94A3B8] text-[10px] uppercase tracking-wider">
						🛡 AI info is for educational purposes only
					</Text>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
