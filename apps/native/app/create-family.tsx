/**
 * Create Family Screen
 *
 * Name your family group and set up your profile to get started.
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

const EMOJIS = ["👑", "👩", "👨", "🧑", "👵", "👴", "🦸", "🧙", "🤴", "👸"];

export default function CreateFamilyScreen() {
	const [familyName, setFamilyName] = useState("");
	const [profileName, setProfileName] = useState("");
	const [selectedEmoji, setSelectedEmoji] = useState("👑");
	const [creating, setCreating] = useState(false);

	const handleCreate = async () => {
		if (!familyName.trim()) {
			Alert.alert("Name Required", "Give your family a name.");
			return;
		}
		if (!profileName.trim()) {
			Alert.alert("Name Required", "Enter your display name.");
			return;
		}

		setCreating(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			setCreating(false);
			return;
		}

		const result = await familyService.createFamily(
			user.id,
			familyName.trim(),
			profileName.trim(),
			selectedEmoji
		);

		setCreating(false);

		if (result) {
			Alert.alert(
				"Family Created!",
				"Now invite your family members using an invite code.",
				[{ text: "Let's Go", onPress: () => router.replace("/family-dashboard") }]
			);
		} else {
			Alert.alert("Error", "You may already be in a family, or something went wrong.");
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
						<Text style={styles.headerTitle}>Create Family</Text>
						<View style={{ width: 40 }} />
					</View>

					{/* Family name */}
					<Text style={styles.label}>Family Name</Text>
					<TextInput
						style={styles.textInput}
						value={familyName}
						onChangeText={setFamilyName}
						placeholder="e.g. The Smiths"
						placeholderTextColor={TEXT_DIM}
						maxLength={30}
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

					{/* Create button */}
					<TouchableOpacity
						style={[
							styles.createBtn,
							(!familyName.trim() || !profileName.trim()) && styles.createBtnDisabled,
						]}
						onPress={handleCreate}
						disabled={creating || !familyName.trim() || !profileName.trim()}
					>
						<LinearGradient
							colors={[PURPLE, "#7B2FF7"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={styles.createGrad}
						>
							{creating ? (
								<ActivityIndicator color="#FFF" />
							) : (
								<>
									<Ionicons name="people" size={20} color="#FFF" />
									<Text style={styles.createText}>Create Family</Text>
								</>
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

	createBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
	createBtnDisabled: { opacity: 0.5 },
	createGrad: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 16,
	},
	createText: { fontSize: 17, fontWeight: "700", color: "#FFF" },
});
