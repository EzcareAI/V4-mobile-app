import { router } from "expo-router";
import { Button } from "heroui-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
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
            <Text className="mb-8 text-center text-3xl font-bold">
                Spin for Your Discount!
            </Text>

            {/* Wheel */}
            <View className="mb-8 items-center">
                <Animated.View
                    style={[animatedStyle]}
                    className="h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600"
                >
                    <View className="h-56 w-56 items-center justify-center rounded-full bg-background">
                        <Text className="text-6xl font-bold text-primary">78%</Text>
                        <Text className="text-sm uppercase text-muted">OFF</Text>
                    </View>
                </Animated.View>
            </View>

            {discount !== null ? (
                <View className="items-center">
                    <Text className="mb-2 text-2xl font-bold text-primary">
                        You won {discount}% OFF!
                    </Text>
                    <Text className="mb-6 text-center text-muted">
                        This exclusive discount is only available for the next 10 minutes
                    </Text>
                    <Button onPress={handleContinue} size="lg" className="w-full">
                        Claim My Discount
                    </Button>
                </View>
            ) : (
                <Button
                    onPress={handleSpin}
                    isDisabled={isSpinning}
                    size="lg"
                    className="w-full"
                >
                    {isSpinning ? "Spinning..." : "Spin the Wheel"}
                </Button>
            )}
        </View>
    );
}
