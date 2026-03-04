import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";

type Props = {
	isActive: boolean;
	colors?: string[];
	count?: number;
};

const Particle = ({
	index,
	isActive,
	colors,
	count,
}: {
	index: number;
	isActive: boolean;
	colors: string[];
	count: number;
}) => {
	const progress = useSharedValue(0);
	const opacity = useSharedValue(0);

	// Randomize particle characteristics based on index
	// Fixed math to avoid re-renders changing positions
	const angle = (index * 360) / count + (index % 3) * 15;
	const distance = 40 + (index % 3) * 20;
	const delay = (index % 4) * 50;

	// X/Y target based on angle and distance
	const rad = (angle * Math.PI) / 180;
	const targetX = Math.cos(rad) * distance;
	const targetY = Math.sin(rad) * distance;

	useEffect(() => {
		if (isActive) {
			opacity.value = 1;
			progress.value = withDelay(
				delay,
				withSequence(
					withSpring(1, { damping: 12, stiffness: 100 }),
					withTiming(0, { duration: 0 }) // Reset immediately after hidden
				)
			);
			opacity.value = withDelay(delay + 200, withTiming(0, { duration: 400 }));
		} else {
			progress.value = 0;
			opacity.value = 0;
		}
	}, [isActive, delay, progress, opacity]);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			opacity: opacity.value,
			transform: [
				{ translateX: progress.value * targetX },
				{ translateY: progress.value * targetY },
				{ scale: progress.value === 0 ? 0 : 1 - progress.value * 0.3 },
			],
		};
	});

	const color = colors[index % colors.length];

	return (
		<Animated.View
			style={[
				styles.particle,
				{ backgroundColor: color },
				animatedStyle,
			]}
		/>
	);
};

export function ConfettiBurst({
	isActive,
	colors = ["#3EC9B5", "#FF4F6E", "#FCD34D", "#FFFFFF", "#28B898"],
	count = 12,
}: Props) {
	if (!isActive) return null;

	return (
		<View style={StyleSheet.absoluteFill} pointerEvents="none">
			<View style={styles.center}>
				{Array.from({ length: count }).map((_, i) => (
					<Particle
						key={i}
						index={i}
						isActive={isActive}
						colors={colors}
						count={count}
					/>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	particle: {
		position: "absolute",
		width: 8,
		height: 8,
		borderRadius: 4,
	},
});
