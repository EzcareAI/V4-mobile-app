import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WheelPicker } from "../onboarding/common/wheel-picker";

interface TimePickerModalProps {
	visible: boolean;
	value: string; // e.g. "8:00 AM"
	onConfirm: (time: string) => void;
	onCancel: () => void;
	title?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) =>
	i.toString().padStart(2, "0")
);
const PERIODS = ["AM", "PM"];

export function TimePickerModal({
	visible,
	value,
	onConfirm,
	onCancel,
	title,
}: TimePickerModalProps) {
	const [h, setH] = useState(7);
	const [m, setM] = useState(0);
	const [p, setP] = useState(0);

	// Sync state when modal becomes visible or value changes
	useEffect(() => {
		if (visible) {
			const match = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
			if (match) {
				const hh = Number.parseInt(match[1], 10);
				const mm = Number.parseInt(match[2], 10);
				const pp = match[3].toUpperCase() === "PM" ? 1 : 0;
				setH(Math.max(0, Math.min(11, hh - 1)));
				setM(Math.max(0, Math.min(59, mm)));
				setP(pp);
			}
		}
	}, [visible, value]);

	const handleConfirm = () => {
		onConfirm(`${HOURS[h]}:${MINUTES[m]} ${PERIODS[p]}`);
	};

	return (
		<Modal animationType="slide" transparent visible={visible}>
			<View style={styles.overlay}>
				<View style={styles.sheet}>
					{/* Header */}
					<View style={styles.header}>
						<TouchableOpacity onPress={onCancel} style={styles.btn}>
							<Text style={styles.cancelText}>Cancel</Text>
						</TouchableOpacity>
						<Text style={styles.title}>{title || "Select Time"}</Text>
						<TouchableOpacity onPress={handleConfirm} style={styles.btn}>
							<Text style={styles.doneText}>Done</Text>
						</TouchableOpacity>
					</View>

					{/* Pickers */}
					<View style={styles.pickerContainer}>
						<WheelPicker
							items={HOURS}
							onSelect={setH}
							selectedIndex={h}
							width={80}
						/>
						<Text style={styles.colon}>:</Text>
						<WheelPicker
							items={MINUTES}
							onSelect={setM}
							selectedIndex={m}
							width={80}
						/>
						<WheelPicker
							items={PERIODS}
							onSelect={setP}
							selectedIndex={p}
							width={80}
						/>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0,0,0,0.3)",
	},
	sheet: {
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingBottom: 40, // safe area padding
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.1,
		shadowRadius: 10,
		elevation: 10,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#F0F0F0",
	},
	btn: {
		padding: 4,
	},
	cancelText: {
		fontSize: 16,
		color: "#94A3B8",
		fontWeight: "600",
	},
	doneText: {
		fontSize: 16,
		color: "#3EC9B5",
		fontWeight: "700",
	},
	title: {
		fontSize: 16,
		color: "#1A1A2E",
		fontWeight: "700",
	},
	pickerContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 20,
		gap: 4,
	},
	colon: {
		fontSize: 24,
		fontWeight: "700",
		color: "#1A1A2E",
		marginHorizontal: 4,
		paddingBottom: 4, // align nicely with the text
	},
});
