import {
	Circle,
	LinearGradient,
	matchFont,
	vec,
} from "@shopify/react-native-skia";
import { Platform, Text, TextInput, View } from "react-native";
import Animated, {
	type SharedValue,
	useAnimatedProps,
	useAnimatedStyle,
	useDerivedValue,
} from "react-native-reanimated";
import { CartesianChart, Line, useChartPressState } from "victory-native";

const DATA = Array.from({ length: 4 }, (_, i) => ({
	week: i + 1,
	energy: [65, 75, 78, 82][i],
	inflammation: [40, 35, 30, 26][i],
}));

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// Helper Components defined outside
const EnergyValue = ({
	value,
}: {
	value: SharedValue<number | null | undefined>;
}) => {
	const props = useAnimatedProps(() => {
		const val = value.value ?? 0;
		return {
			text: `Energy Level: ${Math.round(val)}%`,
			// biome-ignore lint/suspicious/noExplicitAny: Victory Native / Reanimated type mismatch
		} as unknown as any;
	});
	return (
		<AnimatedTextInput
			animatedProps={props}
			editable={false}
			style={{ fontSize: 9, color: "#64748b", padding: 0 }}
		/>
	);
};

const InflammationValue = ({
	value,
}: {
	value: SharedValue<number | null | undefined>;
}) => {
	const props = useAnimatedProps(() => {
		const val = value.value ?? 0; // Default to 0 if null
		return {
			text: `Inflammation: ${Math.round(val)}%`,
			// biome-ignore lint/suspicious/noExplicitAny: Victory Native / Reanimated type mismatch
		} as unknown as any;
	});
	return (
		<AnimatedTextInput
			animatedProps={props}
			editable={false}
			style={{ fontSize: 9, color: "#64748b", padding: 0 }}
		/>
	);
};

const WeekValue = ({
	value,
}: {
	value: SharedValue<number | null | undefined>;
}) => {
	const props = useAnimatedProps(() => {
		const val = value.value ?? 0;
		return {
			text: `Week ${Math.round(val)}`,
			// biome-ignore lint/suspicious/noExplicitAny: Victory Native / Reanimated type mismatch
		} as unknown as any;
	});
	return (
		<AnimatedTextInput
			animatedProps={props}
			editable={false}
			style={{
				fontSize: 10,
				fontWeight: "bold",
				color: "#1e293b",
				padding: 0,
				marginBottom: 2,
			}}
		/>
	);
};

// ... ToolTip component remains unchanged ...

const ToolTip = ({
	x,
	yEnergy,
	yInflammation,
	xValue,
	isActive,
}: {
	x: SharedValue<number | null | undefined>;
	yEnergy: SharedValue<number | null | undefined>;
	yInflammation: SharedValue<number | null | undefined>;
	xValue: SharedValue<number | null | undefined>;
	isActive: boolean;
}) => {
	const animatedStyle = useAnimatedStyle(() => {
		const translateX = (x.value ?? 0) - 40;
		return {
			transform: [{ translateX }, { translateY: -40 }],
			opacity: isActive ? 1 : 0,
		};
	});

	return (
		<Animated.View
			style={[
				{
					position: "absolute",
					backgroundColor: "white",
					padding: 8,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: "#f1f5f9",
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 4,
					elevation: 3,
					pointerEvents: "none",
					zIndex: 50,
					width: 110,
				},
				animatedStyle,
			]}
		>
			<WeekValue value={xValue} />
			<View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
				<View
					style={{
						width: 6,
						height: 6,
						borderRadius: 3,
						backgroundColor: "#60A5FA",
					}}
				/>
				<EnergyValue value={yEnergy} />
			</View>
			<View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
				<View
					style={{
						width: 6,
						height: 6,
						borderRadius: 3,
						backgroundColor: "#2DE2E2",
					}}
				/>
				<InflammationValue value={yInflammation} />
			</View>
		</Animated.View>
	);
};

export const JourneyProgressChart = () => {
	const font = matchFont({
		fontFamily: Platform.select({ ios: "Helvetica", default: "sans-serif" }),
		fontSize: 12,
		fontWeight: "normal",
	});

	const { state, isActive } = useChartPressState({
		x: 0,
		y: { energy: 0, inflammation: 0 },
	});

	// Derived values for safe rendering in Circle
	const safeX = useDerivedValue(() => state.x.position.value ?? 0);
	const safeYEnergy = useDerivedValue(() => state.y.energy.position.value ?? 0);
	const safeYInflammation = useDerivedValue(
		() => state.y.inflammation.position.value ?? 0
	);

	return (
		<View style={{ height: 250 }}>
			<CartesianChart
				axisOptions={{
					font,
					tickCount: { x: 4, y: 4 },
					lineColor: "#f1f5f9",
					labelColor: "#94a3b8",
				}}
				chartPressState={state}
				data={DATA}
				padding={{ left: 10, right: 10, top: 20, bottom: 20 }}
				xKey="week"
				yKeys={["energy", "inflammation"]}
			>
				{({ points }) => (
					<>
						<Line
							animate={{ type: "timing", duration: 500 }}
							color="#60A5FA"
							curveType="catmullRom"
							points={points.energy}
							strokeWidth={3}
						>
							<LinearGradient
								colors={["rgba(96, 165, 250, 0.2)", "rgba(96, 165, 250, 0)"]}
								end={vec(0, 200)}
								start={vec(0, 0)}
							/>
						</Line>
						{points.energy.map((p) => (
							<Circle
								color="#60A5FA"
								cx={p.x ?? 0}
								cy={p.y ?? 0}
								key={`energy-${p.x}-${p.y}`}
								r={4}
							/>
						))}

						<Line
							animate={{ type: "timing", duration: 500 }}
							color="#2DE2E2"
							curveType="catmullRom"
							points={points.inflammation}
							strokeWidth={3}
						>
							<LinearGradient
								colors={["rgba(62, 201, 181, 0.2)", "rgba(62, 201, 181, 0)"]}
								end={vec(0, 200)}
								start={vec(0, 0)}
							/>
						</Line>
						{points.inflammation.map((p) => (
							<Circle
								color="#2DE2E2"
								cx={p.x ?? 0}
								cy={p.y ?? 0}
								key={`inflam-${p.x}-${p.y}`}
								r={4}
							/>
						))}

						{isActive && (
							<>
								<Circle
									color="white"
									cx={safeX}
									cy={safeYEnergy}
									r={6}
									style="fill"
								/>
								<Circle
									color="#60A5FA"
									cx={safeX}
									cy={safeYEnergy}
									r={6}
									strokeWidth={3}
									style="stroke"
								/>

								<Circle
									color="white"
									cx={safeX}
									cy={safeYInflammation}
									r={6}
									style="fill"
								/>
								<Circle
									color="#2DE2E2"
									cx={safeX}
									cy={safeYInflammation}
									r={6}
									strokeWidth={3}
									style="stroke"
								/>
							</>
						)}
					</>
				)}
			</CartesianChart>

			<ToolTip
				isActive={isActive}
				// biome-ignore lint/suspicious/noExplicitAny: Library type mismatch
				x={state.x.position as any}
				// biome-ignore lint/suspicious/noExplicitAny: Library type mismatch
				xValue={state.x.value as any}
				// biome-ignore lint/suspicious/noExplicitAny: Library type mismatch
				yEnergy={state.y.energy.value as any}
				// biome-ignore lint/suspicious/noExplicitAny: Library type mismatch
				yInflammation={state.y.inflammation.value as any}
			/>

			{/* Legend */}
			<View className="mt-2 flex-row justify-center gap-6">
				<View className="flex-row items-center gap-2">
					<View className="h-2 w-2 rounded-full bg-blue-400" />
					<Text className="font-medium text-[#60708F] text-xs">
						Energy Level
					</Text>
				</View>
				<View className="flex-row items-center gap-2">
					<View className="h-2 w-2 rounded-full bg-[#2DE2E2]" />
					<Text className="font-medium text-[#60708F] text-xs">
						Inflammation
					</Text>
				</View>
			</View>
		</View>
	);
};
