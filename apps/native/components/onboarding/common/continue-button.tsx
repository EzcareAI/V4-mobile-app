import { selectionAsync } from "expo-haptics";
import { Button } from "heroui-native";
import { Platform } from "react-native";
import { THEME } from "@/lib/theme";

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
			className="h-14 w-full self-center rounded-2xl shadow-lg transition-all"
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
			style={{
				backgroundColor: isDisabled ? "#94A3B8" : THEME.accent,
				shadowColor: THEME.accentShadow,
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.2,
				shadowRadius: 8,
				elevation: 4,
			}}
		>
			<Button.Label className="font-semibold text-base text-white">
				{label}
			</Button.Label>
		</Button>
	);
};
