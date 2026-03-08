import { useWindowDimensions } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

export const KeyboardAvoidingContainer = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { height } = useWindowDimensions();

	const { progress } = useReanimatedKeyboardAnimation();

	const rStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateY: progress.value === 1 ? -height * 0.15 : 0 }],
		};
	});

	return <Animated.View style={rStyle}>{children}</Animated.View>;
};
