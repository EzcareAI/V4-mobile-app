import { selectionAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "heroui-native";
import { Platform, StyleSheet } from "react-native";

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
			className="h-[56px] w-[326px] self-center overflow-hidden rounded-full shadow-[#00A8A8]/20 shadow-md"
			isDisabled={isDisabled}
			onPress={() => {
				if (!isDisabled) {
					if (Platform.OS === "ios") {
						selectionAsync().catch(() => {
							/* ignore */
						});
					}
					onPress();
				}
			}}
			pressableFeedbackVariant="none"
			size="lg"
		>
			<LinearGradient
				colors={["#00A8A8", "#2DE2E2"]}
				end={{ x: 1, y: 0 }}
				start={{ x: 0, y: 0 }}
				style={StyleSheet.absoluteFillObject}
			/>
			<Button.Label className="color-white font-bold text-lg text-white">
				{label}
			</Button.Label>
		</Button>
	);
};
