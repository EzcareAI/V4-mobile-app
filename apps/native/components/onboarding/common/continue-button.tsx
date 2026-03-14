import { selectionAsync } from "expo-haptics";
import { Button } from "heroui-native";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
	const insets = useSafeAreaInsets();

	const SafeButton = ({ children, ...props }: any) => {
		if (typeof Button === "undefined") {
			return (
				<View
					{...props}
					style={[
						props.style,
						{
							height: 56,
							justifyContent: "center",
							alignItems: "center",
							borderRadius: 16,
						},
					]}
				>
					{children}
				</View>
			);
		}
		return <Button {...props}>{children}</Button>;
	};

	const SafeButtonLabel = ({ children, ...props }: any) => {
		if (typeof Button === "undefined" || typeof Button.Label === "undefined") {
			return <Text {...props}>{children}</Text>;
		}
		return <Button.Label {...props}>{children}</Button.Label>;
	};

	return (
		<View
			style={{
				paddingTop: 16,
				paddingBottom: Math.max(insets.bottom, 24),
				paddingHorizontal: 20,
				width: "100%",
				backgroundColor: "transparent", // Ensures it blends with parent
			}}
		>
			<SafeButton
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
				<SafeButtonLabel className="font-semibold text-base text-white">
					{label}
				</SafeButtonLabel>
			</SafeButton>
		</View>
	);
};
