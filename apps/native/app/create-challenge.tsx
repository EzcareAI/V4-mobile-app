/**
 * Create Challenge Screen
 *
 * Create a family challenge with name, metric, target, duration, and participants.
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
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
import { supabase } from "@/lib/supabase";
import { familyService, type FamilyMember } from "@/lib/family-service";

const BG = "#0A0A0F";
const SURFACE = "#1A1A24";
const PURPLE = "#9D4EDD";
const GREEN = "#06FFA5";
const GOLD = "#FFD60A";
const TEXT_COLOR = "#F5F5F7";
const TEXT_DIM = "#8E8E93";
const BORDER = "rgba(255,255,255,0.06)";

const METRICS = [
	{ key: "quests_completed", label: "Quests Completed", icon: "trophy-outline" },
	{ key: "streak_days", label: "Streak Days", icon: "flame-outline" },
	{ key: "check_ins", label: "Check-ins", icon: "checkmark-circle-outline" },
	{ key: "xp_earned", label: "XP Earned", icon: "star-outline" },
];

const DURATIONS = [
	{ days: 3, label: "3 days" },
	{ days: 7, label: "1 week" },
	{ days: 14, label: "2 weeks" },
	{ days: 30, label: "1 month" },
];

export default function CreateChallengeScreen() {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [selectedMetric, setSelectedMetric] = useState("quests_completed");
	const [targetValue, setTargetValue] = useState("10");
	const [selectedDuration, setSelectedDuration] = useState(7);
	const [members, setMembers] = useState<FamilyMember[]>([]);
	const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
	const [familyGroupId, setFamilyGroupId] = useState("");
	const [userId, setUserId] = useState("");
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);

	const loadMembers = useCallback(async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;
		setUserId(user.id);

		const family = await familyService.getMyFamily(user.id);
		if (!family) {
			router.back();
			return;
		}
		setFamilyGroupId(family.id);

		const mems = await familyService.getFamilyMembers(family.id);
		setMembers(mems);
		// Auto-select all members
		setSelectedParticipants(mems.map((m) => m.userId));
		setLoading(false);
	}, []);

	useEffect(() => {
		loadMembers();
	}, [loadMembers]);

	const toggleParticipant = (uid: string) => {
		setSelectedParticipants((prev) =>
			prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
		);
	};

	const handleCreate = async () => {
		if (!name.trim()) {
			Alert.alert("Name Required", "Give your challenge a name.");
			return;
		}
		const target = parseInt(targetValue, 10);
		if (!target || target < 1) {
			Alert.alert("Invalid Target", "Enter a target value of at least 1.");
			return;
		}
		if (selectedParticipants.length < 1) {
			Alert.alert("No Participants", "Select at least one participant.");
			return;
		}

		setCreating(true);

		const startDate = new Date().toISOString().split("T")[0];
		const endDate = new Date(Date.now() + selectedDuration * 86400000)
			.toISOString()
			.split("T")[0];

		const result = await familyService.createChallenge(familyGroupId, userId, {
			name: name.trim(),
			description: description.trim() || undefined,
			startDate,
			endDate,
			targetMetric: selectedMetric,
			targetValue: target,
			participantIds: selectedParticipants,
		});

		setCreating(false);

		if (result) {
			Alert.alert("Challenge Created!", "Your family challenge is now active.", [
				{ text: "OK", onPress: () => router.back() },
			]);
		} else {
			Alert.alert("Error", "Failed to create challenge.");
		}
	};

	if (loading) {
		return (
			<SafeAreaView edges={["top"]} style={styles.safe}>
				<View style={styles.center}>
					<ActivityIndicator color={PURPLE} size="large" />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
					{/* Header */}
					<View style={styles.header}>
						<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
							<Ionicons color="#FFFFFF" name="chevron-back" size={24} />
						</TouchableOpacity>
						<Text style={styles.headerTitle}>New Challenge</Text>
						<View style={{ width: 40 }} />
					</View>

					{/* Name */}
					<Text style={styles.label}>Challenge Name</Text>
					<TextInput
						style={styles.textInput}
						value={name}
						onChangeText={setName}
						placeholder="e.g. Weekly Quest Sprint"
						placeholderTextColor={TEXT_DIM}
						maxLength={40}
					/>

					{/* Description */}
					<Text style={styles.label}>Description (optional)</Text>
					<TextInput
						style={[styles.textInput, { minHeight: 60 }]}
						value={description}
						onChangeText={setDescription}
						placeholder="What's this challenge about?"
						placeholderTextColor={TEXT_DIM}
						multiline
						maxLength={100}
					/>

					{/* Metric */}
					<Text style={styles.label}>Metric</Text>
					<View style={styles.chipRow}>
						{METRICS.map((m) => (
							<TouchableOpacity
								key={m.key}
								style={[styles.chip, selectedMetric === m.key && styles.chipActive]}
								onPress={() => setSelectedMetric(m.key)}
							>
								<Ionicons
									name={m.icon as any}
									size={16}
									color={selectedMetric === m.key ? PURPLE : TEXT_DIM}
								/>
								<Text
									style={[
										styles.chipText,
										selectedMetric === m.key && styles.chipTextActive,
									]}
								>
									{m.label}
								</Text>
							</TouchableOpacity>
						))}
					</View>

					{/* Target */}
					<Text style={styles.label}>Target</Text>
					<TextInput
						style={[styles.textInput, { textAlign: "center", fontSize: 24, fontWeight: "700" }]}
						value={targetValue}
						onChangeText={(t) => setTargetValue(t.replace(/[^0-9]/g, ""))}
						keyboardType="number-pad"
						maxLength={5}
					/>

					{/* Duration */}
					<Text style={styles.label}>Duration</Text>
					<View style={styles.chipRow}>
						{DURATIONS.map((d) => (
							<TouchableOpacity
								key={d.days}
								style={[styles.chip, selectedDuration === d.days && styles.chipActive]}
								onPress={() => setSelectedDuration(d.days)}
							>
								<Text
									style={[
										styles.chipText,
										selectedDuration === d.days && styles.chipTextActive,
									]}
								>
									{d.label}
								</Text>
							</TouchableOpacity>
						))}
					</View>

					{/* Participants */}
					<Text style={styles.label}>Participants</Text>
					{members.map((member) => {
						const selected = selectedParticipants.includes(member.userId);
						return (
							<TouchableOpacity
								key={member.id}
								style={[styles.participantRow, selected && styles.participantRowActive]}
								onPress={() => toggleParticipant(member.userId)}
							>
								<Text style={styles.participantEmoji}>{member.profileEmoji}</Text>
								<Text style={styles.participantName}>{member.profileName}</Text>
								<Ionicons
									name={selected ? "checkmark-circle" : "ellipse-outline"}
									size={22}
									color={selected ? GREEN : TEXT_DIM}
								/>
							</TouchableOpacity>
						);
					})}

					{/* Create */}
					<TouchableOpacity
						style={[styles.createBtn, (!name.trim() || creating) && styles.createBtnDisabled]}
						onPress={handleCreate}
						disabled={creating || !name.trim()}
					>
						<LinearGradient
							colors={[GOLD, "#FFAA00"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={styles.createGrad}
						>
							{creating ? (
								<ActivityIndicator color="#000" />
							) : (
								<>
									<Ionicons name="flag" size={20} color="#000" />
									<Text style={styles.createText}>Start Challenge</Text>
								</>
							)}
						</LinearGradient>
					</TouchableOpacity>

					<View style={{ height: 40 }} />
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: BG },
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
	content: { paddingHorizontal: 20, paddingBottom: 40 },

	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: 8,
		paddingBottom: 16,
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

	chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 12,
		backgroundColor: SURFACE,
		borderWidth: 1,
		borderColor: BORDER,
	},
	chipActive: { borderColor: PURPLE, backgroundColor: PURPLE + "15" },
	chipText: { fontSize: 13, color: TEXT_DIM, fontWeight: "500" },
	chipTextActive: { color: PURPLE },

	participantRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		backgroundColor: SURFACE,
		borderRadius: 14,
		padding: 14,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: BORDER,
	},
	participantRowActive: { borderColor: GREEN + "50" },
	participantEmoji: { fontSize: 22 },
	participantName: { flex: 1, fontSize: 15, fontWeight: "500", color: TEXT_COLOR },

	createBtn: { borderRadius: 16, overflow: "hidden", marginTop: 24 },
	createBtnDisabled: { opacity: 0.5 },
	createGrad: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 16,
	},
	createText: { fontSize: 17, fontWeight: "700", color: "#000" },
});
