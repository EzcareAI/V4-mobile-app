import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Activity, History, MessageCircle, Pill, Settings, X } from "lucide-react-native";
import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type OrbAction = {
	id: string;
	label: string;
	icon: React.ReactNode;
	onPress: () => void;
};

export function FloatingOrb() {
	const [expanded, setExpanded] = useState(false);

	const toggleOrb = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Light);
			} catch {
				/* ignore */
			}
		}
		setExpanded((prev) => !prev);
	};

	const actions: OrbAction[] = [
		{
			id: "chat",
			label: "Chat with EZBuddy",
			icon: <MessageCircle size={18} color="#3EC9B5" />,
			onPress: () => {
				setExpanded(false);
				router.push("/chat");
			},
		},
		{
			id: "history",
			label: "My History",
			icon: <History size={18} color="#3EC9B5" />,
			onPress: () => setExpanded(false),
		},
		{
			id: "supplements",
			label: "My Supplements",
			icon: <Pill size={18} color="#3EC9B5" />,
			onPress: () => setExpanded(false),
		},
		{
			id: "scan",
			label: "Scan Symptom",
			icon: <Activity size={18} color="#3EC9B5" />,
			onPress: () => {
				setExpanded(false);
				router.push("/scan/body-scan");
			},
		},
		{
			id: "settings",
			label: "Settings",
			icon: <Settings size={18} color="#3EC9B5" />,
			onPress: () => {
				setExpanded(false);
				router.push("/settings");
			},
		},
	];

	return (
		<View style={styles.wrapper} pointerEvents="box-none">
			{/* Action menu — rendered above orb */}
			{expanded && (
				<View style={styles.menu}>
					{actions.map((action) => (
						<TouchableOpacity
							key={action.id}
							onPress={action.onPress}
							activeOpacity={0.85}
							style={styles.menuItem}
						>
							<Text style={styles.menuLabel}>{action.label}</Text>
							<View style={styles.menuIconWrapper}>{action.icon}</View>
						</TouchableOpacity>
					))}
				</View>
			)}

			{/* Main orb button */}
			<TouchableOpacity
				onPress={toggleOrb}
				activeOpacity={0.9}
				style={styles.orb}
				accessibilityLabel={expanded ? "Close AI menu" : "Open AI assistant menu"}
				accessibilityRole="button"
			>
				<LinearGradient
					colors={["#28B898", "#3EC9B5"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={StyleSheet.absoluteFill}
				/>
				{expanded ? (
					<X size={26} color="#0B0E17" strokeWidth={2.5} />
				) : (
					<MessageCircle size={26} color="#0B0E17" strokeWidth={2} />
				)}
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		position: "absolute",
		bottom: 24,
		right: 24,
		zIndex: 100,
		alignItems: "flex-end",
	},
	orb: {
		width: 60,
		height: 60,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
		shadowColor: "#3EC9B5",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.55,
		shadowRadius: 18,
		elevation: 12,
	},
	menu: {
		marginBottom: 16,
		alignItems: "flex-end",
		gap: 10,
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#1A2138",
		borderRadius: 999,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 10,
		elevation: 6,
		gap: 12,
	},
	menuLabel: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "600",
	},
	menuIconWrapper: {
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: "rgba(62,201,181,0.15)",
		alignItems: "center",
		justifyContent: "center",
	},
});
