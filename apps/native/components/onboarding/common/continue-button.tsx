import { Button } from "heroui-native";

interface ContinueButtonProps {
	onPress: () => void;
	isDisabled?: boolean;
	label?: string;
}

export const ContinueButton = ({
	onPress,
	isDisabled = false,
	label = "Continue",
}: ContinueButtonProps) => {
	return (
		<Button
			className="h-14 rounded-full bg-accent shadow-surface"
			isDisabled={isDisabled}
			onPress={onPress}
		>
			<Button.Label className="font-bold text-accent-foreground text-lg">
				{label}
			</Button.Label>
		</Button>
	);
};
