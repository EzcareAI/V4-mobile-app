import { selectionAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "heroui-native";
import { StyleSheet } from "react-native";

interface ContinueButtonProps {
	onPress: () => void;
	isDisabled?: boolean;
	label?: string | React.ReactNode;
}

export const ContinueButton = ({
	onPress,
	isDisabled = false,
	label = "Continue",
}: ContinueButtonProps) => {
	return (
		<Button
			// className="h-14 rounded-full bg-accent shadow-surface"
			isDisabled={isDisabled}
			onPress={() => {
				if (!isDisabled) {
					try {
						selectionAsync();
					} catch {
						// Ignore haptics errors to prevent app crash
					}
					onPress();
				}
			}}
			pressableFeedbackVariant="none"
			size="lg"
		>
			<LinearGradient
				colors={["#3BAFDA", "#3EC9B5"]}
				end={{ x: 1, y: 0 }}
				start={{ x: 0, y: 0 }}
				style={StyleSheet.absoluteFill}
			/>
			<Button.Label className="color-white font-bold text-lg text-white">
				{label}
			</Button.Label>
		</Button>
	);
};
