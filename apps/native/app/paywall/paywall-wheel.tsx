import { router } from "expo-router";
import { Button } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";

export default function PaywallWheel() {
	const [isSpinning, setIsSpinning] = useState(false);
	const [discount, setDiscount] = useState<number | null>(null);
	const rotation = useSharedValue(0);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	const handleSpin = () => {
		setIsSpinning(true);

		// Spin animation (always lands on 78%)
		rotation.value = withTiming(360 * 5 + 280, { duration: 3000 }, () => {
			setDiscount(78);
			setIsSpinning(false);
		});
	};

	const handleContinue = () => {
		router.push("/paywall/paywall-pricing");
	};

	return (
		<View className="flex-1 items-center justify-center bg-background p-6">
			<Text className="mb-8 text-center font-bold text-3xl">
				Spin for Your Discount!
			</Text>

			{/* Wheel */}
			<View className="mb-8 items-center">
				<Animated.View
					className="h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600"
					style={[animatedStyle]}
				>
					<View className="h-56 w-56 items-center justify-center rounded-full bg-background">
						<Text className="font-bold text-6xl text-primary">78%</Text>
						<Text className="text-muted text-sm uppercase">OFF</Text>
					</View>
				</Animated.View>
			</View>

			{discount !== null ? (
				<View className="items-center">
					<Text className="mb-2 font-bold text-2xl text-primary">
						You won {discount}% OFF!
					</Text>
					<Text className="mb-6 text-center text-muted">
						This exclusive discount is only available for the next 10 minutes
					</Text>
					<Button className="w-full" onPress={handleContinue} size="lg">
						Claim My Discount
					</Button>
				</View>
			) : (
				<Button
					className="w-full"
					isDisabled={isSpinning}
					onPress={handleSpin}
					size="lg"
				>
					{isSpinning ? "Spinning..." : "Spin the Wheel"}
				</Button>
			)}
		</View>
	);
}
