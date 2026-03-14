import { cn } from "heroui-native";
import type { PropsWithChildren } from "react";
import { ScrollView, View, type ViewProps } from "react-native";
import Animated, { type AnimatedProps } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedView = Animated.createAnimatedComponent(View);

type Props = AnimatedProps<ViewProps> & {
	className?: string;
};

// Fallback for cn if heroui-native is not available
const safeCn = (...args: any[]) => {
	if (typeof cn === "function") {
		return cn(...args);
	}
	return args.filter(Boolean).join(" ");
};

export function Container({
	children,
	className,
	...props
}: PropsWithChildren<Props>) {
	const insets = useSafeAreaInsets();

	return (
		<AnimatedView
			className={safeCn("flex-1 bg-background", className)}
			style={{
				paddingBottom: insets.bottom,
			}}
			{...props}
		>
			<ScrollView contentContainerStyle={{ flexGrow: 1 }}>
				{children}
			</ScrollView>
		</AnimatedView>
	);
}
