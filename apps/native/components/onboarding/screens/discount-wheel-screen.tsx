import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Animated,
	BackHandler,
	Dimensions,
	Easing,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Svg, {
	Circle,
	G,
	Path,
	Polygon,
	Text as SvgText,
} from "react-native-svg";
import type {
	PurchasesOffering,
	PurchasesPackage,
} from "react-native-purchases";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { revenueCatService } from "@/lib/revenuecat-service";
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { StepHeader } from "../common/step-header";

const PRIZES = [
	{ label: "🎁", color: "#FBBF24" }, // Winner (Index 0)
	{ label: "1 Mo", color: "#34D399" },
	{ label: "10%", color: "#F87171" },
	{ label: "$5", color: "#60A5FA" },
	{ label: "50%", color: "#A78BFA" },
	{ label: "20%", color: "#F472B6" },
];

const SLICE_ANGLE = 360 / PRIZES.length; // 60 degrees

const SCREEN_WIDTH = Dimensions.get("window").width;
const SVG_SIZE = Math.min(SCREEN_WIDTH - 48, 300); // 24px padding each side, max 300
const CENTER = SVG_SIZE / 2;
const RADIUS = CENTER - 10; // 10px padding to avoid stroke clipping
const WHEEL_FONT_SIZE = Math.round(SVG_SIZE / 10);

function createSlicePath(startAngle: number, endAngle: number) {
	const startX =
		CENTER + RADIUS * Math.cos((Math.PI * (startAngle - 90)) / 180);
	const startY =
		CENTER + RADIUS * Math.sin((Math.PI * (startAngle - 90)) / 180);
	const endX = CENTER + RADIUS * Math.cos((Math.PI * (endAngle - 90)) / 180);
	const endY = CENTER + RADIUS * Math.sin((Math.PI * (endAngle - 90)) / 180);
	const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

	return [
		"M",
		CENTER,
		CENTER,
		"L",
		startX,
		startY,
		"A",
		RADIUS,
		RADIUS,
		0,
		largeArcFlag,
		1,
		endX,
		endY,
		"Z",
	].join(" ");
}

const FireworkParticle = ({
	delay,
	angle,
	distance,
	color,
}: {
	delay: number;
	angle: number;
	distance: number;
	color: string;
}) => {
	const progress = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.sequence([
			Animated.delay(delay),
			Animated.spring(progress, {
				toValue: 1,
				friction: 6,
				tension: 40,
				useNativeDriver: true,
			}),
		]).start();
	}, [delay, progress]);

	const translateX = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [0, Math.cos(angle) * distance],
	});
	const translateY = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [0, Math.sin(angle) * distance],
	});
	const opacity = progress.interpolate({
		inputRange: [0, 0.7, 1],
		outputRange: [1, 1, 0],
	});
	const scale = progress.interpolate({
		inputRange: [0, 0.2, 1],
		outputRange: [0, 1.5, 0],
	});

	return (
		<Animated.View
			style={{
				position: "absolute",
				width: 10,
				height: 10,
				borderRadius: 5,
				backgroundColor: color,
				transform: [{ translateX }, { translateY }, { scale }],
				opacity,
				zIndex: 100,
			}}
		/>
	);
};

const Fireworks = () => {
	const particles = Array.from({ length: 45 }).map((_, i) => ({
		id: i,
		angle: (Math.PI * 2 * i) / 20 + Math.random() * 0.8,
		distance: 80 + Math.random() * 120, // shoot out pretty far
		delay: Math.random() * 400,
		color: ["#F59E0B", "#10B981", "#3EC9B5", "#EC4899", "#8B5CF6", "#38BDF8"][
			Math.floor(Math.random() * 6)
		],
	}));

	return (
		<View
			pointerEvents="none"
			style={[
				StyleSheet.absoluteFill,
				{ alignItems: "center", justifyContent: "center", zIndex: 50 },
			]}
		>
			{particles.map((p) => (
				<FireworkParticle key={p.id} {...p} />
			))}
		</View>
	);
};

export function DiscountWheelScreen() {
	const router = useRouter();
	const spinAnim = useRef(new Animated.Value(0)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;
	const [spinning, setSpinning] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [offering, setOffering] = useState<PurchasesOffering | null>(null);
	const [loading, setLoading] = useState(true);
	const { setAnswer, nextStep, currentStep, onboardingRecordId, setPro } = useOnboardingStore();

	// Block Android back button — user must choose a plan
	useFocusEffect(
		useCallback(() => {
			const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
			return () => sub.remove();
		}, [])
	);

	useEffect(() => {
		async function loadOfferings() {
			try {
				const currentOffering = await revenueCatService.getOfferings();
				setOffering(currentOffering);
			} catch (err) {
				console.error("Load Offerings Error [Wheel]:", err);
			} finally {
				setLoading(false);
			}
		}
		loadOfferings();
	}, []);

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

			// Start pulsing button once spinning stops
			Animated.loop(
				Animated.sequence([
					Animated.timing(pulseAnim, {
						toValue: 1.05,
						duration: 800,
						useNativeDriver: true,
					}),
					Animated.timing(pulseAnim, {
						toValue: 1,
						duration: 800,
						useNativeDriver: true,
					}),
				])
			).start();
		});
	}, [spinAnim, pulseAnim]);

	const handlePurchase = async (priceLabel: string) => {
		if (!offering?.availablePackages) {
			if (__DEV__) {
				setPro(true);
				setAnswer("subscriptionStatus", "active");
				setAnswer("paymentAttempted", true);
				setAnswer("discountWheelShown", true);
				const targetStep = 21;
				setAnswer("currentStep", targetStep);
				router.push(`/(onboarding)/${targetStep}`);
				return;
			}
			Alert.alert("Error", "Pricing information is not available.");
			return;
		}

		// Find the package based on the exact product ID
		let pkg: PurchasesPackage | undefined;

		if (priceLabel === "29.99") {
			// Look for the discounted yearly product by its exact App Store product ID
			pkg = offering.availablePackages.find(p =>
				p.product.identifier === "com.ezcare.yearly_discounted"
			);

			// Fallback: look for any package with "discount" in the identifier
			if (!pkg) {
				pkg = offering.availablePackages.find(p =>
					p.identifier.toLowerCase().includes("discount") ||
					p.product.identifier.toLowerCase().includes("discount")
				);
			}
		} else {
			// Full Price - Look for the main ANNUAL package (most expensive one)
			const annuals = offering.availablePackages
				.filter(p => p.packageType === "ANNUAL" && p.product.identifier !== "com.ezcare.yearly_discounted")
				.sort((a, b) => b.product.price - a.product.price);
			pkg = annuals[0] || offering.availablePackages.find(p => p.packageType === "ANNUAL");
		}

		if (!pkg) {
			pkg = offering.availablePackages[0];
		}

		if (!pkg) {
			Alert.alert("Error", "The selected plan is not available at the moment. Please try again later.");
			return;
		}

		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch { /* ignore */ }
		}
		
		setIsProcessing(true);

		// Log checkout attempt
		await supabase.from("events").insert([
			{
				event_type: "checkout_attempted_wheel",
				session_id: onboardingRecordId,
				timestamp: new Date().toISOString(),
			},
		]);

		try {
			const success = await revenueCatService.purchasePackage(pkg);
			if (success) {
				setPro(true);
				setAnswer("subscriptionStatus", "active");
				setAnswer("paymentAttempted", true);
				setAnswer("discountWheelShown", true);

				await supabase.from("events").insert([
					{
						event_type: `checkout_success_wheel_${pkg.packageType}`,
						session_id: onboardingRecordId,
						timestamp: new Date().toISOString(),
					},
				]).then();

				const targetStep = 21;
				setAnswer("currentStep", targetStep);
				router.push(`/(onboarding)/${targetStep}`);
			}
		} catch (_err) {
			Alert.alert("Error", "Could not complete purchase. Please try again.");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleClaimDiscount = () => {
		handlePurchase("29.99");
	};

	const handlePayFullPrice = () => {
		handlePurchase("39.99");
	};

	// Spin 5 full rotations ending exactly with the slice's center at the top pointer (1800 - 30 degrees = 1770)
	const spinInterpolate = spinAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ["0deg", "1770deg"],
	});

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<ScrollView
				className="flex-1"
				contentContainerStyle={{
					flexGrow: 1,
					paddingBottom: 24,
					paddingHorizontal: 24,
				}}
				showsVerticalScrollIndicator={false}
			>
				<View className="flex-1">
					{/* Header */}
					<View className="mt-2">
						<StepHeader
							align="center"
							description="An exclusive one-time reward has been unlocked!"
							title="🎡 Spin to Save!"
						/>
					</View>

					{/* Spinning Wheel */}
					<View className="relative mt-4 mb-4 items-center justify-center">
						{!spinning && <Fireworks />}
						{/* Downward Pointer Triangle */}
						<View className="z-10 -mb-4 items-center drop-shadow-md">
							<Svg height="30" viewBox="0 0 24 24" width="30">
								<Polygon fill="#EF4444" points="0,0 24,0 12,24" />
							</Svg>
						</View>

						<Animated.View
							className="rounded-full shadow-2xl shadow-blue-200"
							style={{
								width: SVG_SIZE,
								height: SVG_SIZE,
								transform: [{ rotate: spinInterpolate }],
							}}
						>
							<Svg
								height={SVG_SIZE}
								viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
								width={SVG_SIZE}
							>
								<G>
									{PRIZES.map((prize, index) => {
										const startAngle = index * SLICE_ANGLE;
										const endAngle = (index + 1) * SLICE_ANGLE;
										const pathData = createSlicePath(startAngle, endAngle);

										// Position text inside slice
										const textAngle = startAngle + SLICE_ANGLE / 2;
										const rad = (Math.PI * (textAngle - 90)) / 180;
										const textX = CENTER + RADIUS * 0.7 * Math.cos(rad);
										const textY = CENTER + RADIUS * 0.7 * Math.sin(rad);

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
													fontSize={WHEEL_FONT_SIZE}
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
						className={`mb-4 w-full rounded-[32px] border-4 border-yellow-300 bg-white p-6 shadow-blue-100 shadow-lg transition-opacity duration-1000 ${
							spinning ? "opacity-30" : "opacity-100"
						}`}
					>
						<View className="mb-4 items-center">
							<Text className="mb-2 font-black text-5xl text-yellow-500">
								{spinning ? "???" : "80% OFF"}
							</Text>
							<Text className="mb-2 text-center font-bold text-[#29303D] text-xl">
								{spinning ? "Spinning..." : "3-Day FREE Trial!"}
							</Text>
							{!spinning && (
								<Text className="text-center font-medium text-[#73808C] text-sm">
									Then $29.99/year ($2.49/mo) instead of $39.99
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

			{/* Static Footer CTA */}
			<View
				className={`gap-y-3 border-transparent border-t bg-[#EBF5F4] px-6 pt-4 pb-10 ${spinning ? "opacity-0" : "opacity-100"}`}
			>
				<Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
					<TouchableOpacity
						activeOpacity={0.8}
						className="w-full flex-row items-center justify-center rounded-[32px] bg-[#FACC15] py-5 shadow-xl shadow-yellow-200"
						onPress={handleClaimDiscount}
					>
						<Text className="font-black text-[#422006] text-[18px] uppercase tracking-widest">
							✨ Start Free Trial
						</Text>
					</TouchableOpacity>
				</Animated.View>
				<TouchableOpacity
					activeOpacity={0.7}
					className="w-full rounded-[28px] border-2 border-slate-200 bg-transparent py-4 shadow-sm"
					onPress={handlePayFullPrice}
				>
					<Text className="text-center font-bold text-[#73808C] text-[17px]">
						I'll Pay Full Price
					</Text>
				</TouchableOpacity>
			</View>

			{isProcessing && (
				<View className="absolute inset-0 z-50 items-center justify-center bg-black/60">
					<ActivityIndicator color="#FFF" size="large" />
					<Text className="mt-4 font-semibold text-white">Processing...</Text>
				</View>
			)}
			{loading && (
				<View className="absolute inset-0 z-50 items-center justify-center bg-[#EBF5F4]/80">
					<ActivityIndicator color="#3EC9B5" size="large" />
					<Text className="mt-4 font-semibold text-[#73808C]">Updating offers...</Text>
				</View>
			)}
		</View>
	);
}
