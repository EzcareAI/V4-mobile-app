/**
 * Join Family Screen
 *
 * Enter a 6-character invite code to join an existing family group.
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { familyService } from "@/lib/family-service";

const BG = "#0A0A0F";
const SURFACE = "#1A1A24";
const PURPLE = "#9D4EDD";
const GREEN = "#06FFA5";
const TEXT_COLOR = "#F5F5F7";
const TEXT_DIM = "#8E8E93";
const BORDER = "rgba(255,255,255,0.06)";

const EMOJIS = ["👤", "👩", "👨", "👧", "👦", "🧑", "👵", "👴", "🦸", "🧙"];

export default function JoinFamilyScreen() {
	const [code, setCode] = useState("");
	const [profileName, setProfileName] = useState("");
	const [selectedEmoji, setSelectedEmoji] = useState("👤");
	const [joining, setJoining] = useState(false);

	const handleJoin = async () => {
		if (code.length !== 6) {
			Alert.alert("Invalid Code", "Invite codes are 6 characters long.");
			return;
		}
		if (!profileName.trim()) {
			Alert.alert("Name Required", "Enter your display name for the family.");
			return;
		}

		setJoining(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			setJoining(false);
			return;
		}

		const result = await familyService.joinFamily(
			user.id,
			code,
			profileName.trim(),
			selectedEmoji
		);

		setJoining(false);

		if (result.success) {
			Alert.alert(
				"Welcome!",
				`You've joined ${result.familyGroup?.name ?? "the family"}!`,
				[{ text: "OK", onPress: () => router.replace("/family-dashboard") }]
			);
		} else {
			Alert.alert("Couldn't Join", result.error ?? "Something went wrong.");
		}
	};

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<View style={styles.container}>
					{/* Header */}
					<View style={styles.header}>
						<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
							<Ionicons color="#FFFFFF" name="chevron-back" size={24} />
						</TouchableOpacity>
						<Text style={styles.headerTitle}>Join Family</Text>
						<View style={{ width: 40 }} />
					</View>

					{/* Invite code */}
					<Text style={styles.label}>Invite Code</Text>
					<TextInput
						style={styles.codeInput}
						value={code}
						onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
						placeholder="ABC123"
						placeholderTextColor={TEXT_DIM}
						autoCapitalize="characters"
						maxLength={6}
						autoFocus
					/>

					{/* Profile name */}
					<Text style={styles.label}>Your Display Name</Text>
					<TextInput
						style={styles.textInput}
						value={profileName}
						onChangeText={setProfileName}
						placeholder="e.g. Mom, Dad, Alex..."
						placeholderTextColor={TEXT_DIM}
						maxLength={20}
					/>

					{/* Emoji picker */}
					<Text style={styles.label}>Choose Your Avatar</Text>
					<View style={styles.emojiRow}>
						{EMOJIS.map((emoji) => (
							<TouchableOpacity
								key={emoji}
								style={[
									styles.emojiBtn,
									selectedEmoji === emoji && styles.emojiBtnActive,
								]}
								onPress={() => setSelectedEmoji(emoji)}
							>
								<Text style={styles.emojiText}>{emoji}</Text>
							</TouchableOpacity>
						))}
					</View>

					<View style={{ flex: 1 }} />

					{/* Join button */}
					<TouchableOpacity
						style={[styles.joinBtn, (code.length !== 6 || !profileName.trim()) && styles.joinBtnDisabled]}
						onPress={handleJoin}
						disabled={joining || code.length !== 6 || !profileName.trim()}
					>
						<LinearGradient
							colors={[GREEN, "#00CC88"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={styles.joinGrad}
						>
							{joining ? (
								<ActivityIndicator color="#000" />
							) : (
								<Text style={styles.joinText}>Join Family</Text>
							)}
						</LinearGradient>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: BG },
	container: { flex: 1, paddingHorizontal: 20 },

	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: 8,
		paddingBottom: 24,
	},
	backBtn: { width: 40, height: 40, justifyContent: "center" },
	headerTitle: { fontSize: 20, fontWeight: "700", color: TEXT_COLOR },

	label: { fontSize: 14, fontWeight: "600", color: TEXT_DIM, marginBottom: 8, marginTop: 20 },

	codeInput: {
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 16,
		fontSize: 28,
		fontWeight: "800",
		color: TEXT_COLOR,
		textAlign: "center",
		letterSpacing: 8,
		borderWidth: 1,
		borderColor: BORDER,
	},

	textInput: {
		backgroundColor: SURFACE,
		borderRadius: 16,
		padding: 16,
		fontSize: 16,
		color: TEXT_COLOR,
		borderWidth: 1,
		borderColor: BORDER,
	},

	emojiRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
	},
	emojiBtn: {
		width: 48,
		height: 48,
		borderRadius: 14,
		backgroundColor: SURFACE,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: BORDER,
	},
	emojiBtnActive: {
		borderColor: PURPLE,
		backgroundColor: PURPLE + "20",
	},
	emojiText: { fontSize: 24 },

	joinBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
	joinBtnDisabled: { opacity: 0.5 },
	joinGrad: {
		paddingVertical: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	joinText: { fontSize: 17, fontWeight: "700", color: "#000" },
});
