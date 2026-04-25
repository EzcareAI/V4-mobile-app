import { View, Text, StyleSheet } from "react-native";

/**
 * Analyze-symptoms feature removed to comply with App Store guidelines.
 * This screen is hidden (href: null in _layout) and shows a placeholder
 * if somehow reached.
 */
export default function AnalyzeSymptomsScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.text}>This feature is not available.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F4F6F8",
	},
	text: {
		fontSize: 16,
		color: "#94A3B8",
	},
});
