import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
	Animated,
	Easing,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Svg, { Circle, G, Path, Polygon, Text as SvgText } from "react-native-svg";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

const PRIZES = [
	{ label: "80% OFF", color: "#FBBF24" }, // Winner (Index 0)
	{ label: "1 Mo FREE", color: "#34D399" },
	{ label: "10% OFF", color: "#F87171" },
	{ label: "€5 OFF", color: "#60A5FA" },
	{ label: "50% OFF", color: "#A78BFA" },
	{ label: "20% OFF", color: "#F472B6" },
];

const SLICE_ANGLE = 360 / PRIZES.length; // 60 degrees

const SVG_SIZE = 280;
const RADIUS = SVG_SIZE / 2;
const CENTER = RADIUS;

function createSlicePath(startAngle: number, endAngle: number) {
	const startX = CENTER + RADIUS * Math.cos((Math.PI * (startAngle - 90)) / 180);
	const startY = CENTER + RADIUS * Math.sin((Math.PI * (startAngle - 90)) / 180);
	const endX = CENTER + RADIUS * Math.cos((Math.PI * (endAngle - 90)) / 180);
	const endY = CENTER + RADIUS * Math.sin((Math.PI * (endAngle - 90)) / 180);
	const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

	return [
		"M", CENTER, CENTER,
		"L", startX, startY,
		"A", RADIUS, RADIUS, 0, largeArcFlag, 1, endX, endY,
		"Z",
	].join(" ");
}

export function DiscountWheelScreen() {
	const router = useRouter();
	const { setAnswer, nextStep, currentStep, discountWheelShown } =
		useOnboardingStore();

	const spinAnim = useRef(new Animated.Value(0)).current;
	const [spinning, setSpinning] = useState(true);

	// Immediately skip if already spun (handled by paywall back interceptor, but safety net)
	useEffect(() => {
		// If they already claimed it or skipped it before, we shouldn't show it again.
		// However, we want them to see it when they hit back on Paywall.
		// Our interceptor sets discountWheelShown to true right before pushing here,
		// so if we immediately redirect them, the wheel is skipped!
		// But wait! If paywall back interceptor sets it to true, we must NOT immediately skip!
		// We'll trust the routing. The only reason to skip automatically is if they completed it.
	}, []);

	useEffect(() => {
		Animated.timing(spinAnim, {
			toValue: 1,
			duration: 4000,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}).start(() => {
			setSpinning(false);
		});
	}, [spinAnim]);

	const handleClaimDiscount = () => {
		// We mark that it was definitively handled. (It was already set to true in the Paywall back interceptor, but we'll do it again to be safe).
		setAnswer("discountWheelShown", true);
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	const handleSkip = () => {
		setAnswer("discountWheelShown", true);
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	// Spin 5 full rotations ending exactly on 0 degrees (the 80% OFF slice)
	const spinInterpolate = spinAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ["0deg", "1800deg"],
	});

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1">
						{/* Header */}
						<View className="mt-8">
							<StepHeader
								align="center"
								description="An exclusive one-time reward has been unlocked!"
								title="🎡 Spin to Save!"
							/>
						</View>

						{/* Spinning Wheel */}
						<View className="mt-6 mb-8 items-center justify-center">
							{/* Downward Pointer Triangle */}
							<View className="z-10 -mb-4 items-center drop-shadow-md">
								<Svg height="30" viewBox="0 0 24 24" width="30">
									<Polygon fill="#EF4444" points="0,0 24,0 12,24" />
								</Svg>
							</View>

							<Animated.View
								style={{
									width: SVG_SIZE,
									height: SVG_SIZE,
									transform: [{ rotate: spinInterpolate }],
								}}
								className="rounded-full shadow-2xl shadow-blue-200"
							>
								<Svg height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} width={SVG_SIZE}>
									<G>
										{PRIZES.map((prize, index) => {
											const startAngle = index * SLICE_ANGLE;
											const endAngle = (index + 1) * SLICE_ANGLE;
											const pathData = createSlicePath(startAngle, endAngle);

											// Position text inside slice
											const textAngle = startAngle + SLICE_ANGLE / 2;
											const rad = (Math.PI * (textAngle - 90)) / 180;
											const textX = CENTER + RADIUS * 0.65 * Math.cos(rad);
											const textY = CENTER + RADIUS * 0.65 * Math.sin(rad);

											return (
												<G key={prize.label}>
													<Path
														d={pathData}
														fill={prize.color}
														stroke="#FFFFFF"
														strokeWidth="3"
													/>
													<SvgText
														alignmentBaseline="middle"
														fill="#FFFFFF"
														fontSize="16"
														fontWeight="bold"
														textAnchor="middle"
														transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
														x={textX}
														y={textY}
													>
														{prize.label}
													</SvgText>
												</G>
											);
										})}
										{/* Center aesthetic dot */}
										<Circle
											cx={CENTER}
											cy={CENTER}
											fill="#FFFFFF"
											r={24}
											stroke="#FBBF24"
											strokeWidth="6"
										/>
									</G>
								</Svg>
							</Animated.View>
						</View>

						{/* Result Box (Fades in) */}
						<View
							className={`mb-6 w-full rounded-[32px] border-4 border-yellow-300 bg-white p-6 shadow-blue-100 shadow-lg transition-opacity duration-1000 ${
								spinning ? "opacity-30" : "opacity-100"
							}`}
						>
							<View className="mb-4 items-center">
								<Text className="mb-2 font-black text-5xl text-yellow-500">
									{spinning ? "???" : "€10 OFF"}
								</Text>
								<Text className="mb-2 text-center font-bold text-[#29303D] text-xl">
									{spinning ? "Spinning..." : "Save €10 on Annual Plan"}
								</Text>
								{!spinning && (
									<Text className="text-center font-medium text-[#73808C] text-sm">
										€39.99 → €29.99/year
									</Text>
								)}
							</View>

							{!spinning && (
								<View className="rounded-2xl border border-red-200 bg-red-50 p-4">
									<Text className="text-center font-bold text-[13px] text-red-600 tracking-tight">
										⏰ This offer expires in 24 hours!
									</Text>
								</View>
							)}
						</View>
					</View>
				</ScrollView>

				{/* Footer CTA */}
				<View className={`gap-y-3 pt-6 ${spinning ? "opacity-0" : "opacity-100"}`}>
					<ContinueButton label="Claim €10 Off Now" onPress={handleClaimDiscount} />
					<TouchableOpacity
						activeOpacity={0.7}
						className="w-full rounded-[28px] border-2 border-slate-200 bg-transparent py-4 shadow-sm"
						onPress={handleSkip}
					>
						<Text className="text-center font-bold text-[#73808C] text-[17px]">
							I'll Pay Full Price
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
