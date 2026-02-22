import { selectionAsync } from "expo-haptics";
import { Button } from "heroui-native";
import { Platform } from "react-native";

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
			className="h-14 w-full self-center rounded-2xl bg-[#28B898] shadow-[#28B898]/20 shadow-lg transition-all"
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
			<Button.Label className="font-semibold text-base text-white">
				{label}
			</Button.Label>
		</Button>
	);
};
