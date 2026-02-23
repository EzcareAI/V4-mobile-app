/**
 * WheelPicker — smooth, jank-free custom wheel picker for React Native.
 *
 * PERFORMANCE DESIGN
 * ------------------
 * - Local `activeIdx` ref tracks the highlighted row DURING scroll without
 *   triggering any parent re-renders (no setState on every frame).
 * - Parent `onSelect(index)` is only called once when scrolling fully stops
 *   (onMomentumScrollEnd OR onScrollEndDrag for finger-lift without momentum).
 * - Item rows are extracted into a memoized sub-component so the text styles
 *   only re-compute when `activeIdx` changes, not on every scroll pixel.
 * - Haptics fire via a ref-tracked debounce to avoid flooding the haptic engine.
 * - scrollEventThrottle={32} halves the scroll event rate vs the default 16ms.
 */
import { selectionAsync } from "expo-haptics";
import React, { memo, useCallback, useEffect, useRef } from "react";
import {
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	Platform,
	ScrollView,
	Text,
	View,
} from "react-native";
import { THEME } from "@/lib/theme";

interface WheelPickerProps {
	items: string[];
	selectedIndex: number;
	onSelect: (index: number) => void;
	itemHeight?: number;
	visibleItems?: number;
	width?: number;
}

// ── Memoized row — only re-renders when its own active state changes ──────────
const WheelRow = memo(
	({
		label,
		isActive,
		isNearby,
		height,
	}: {
		label: string;
		isActive: boolean;
		isNearby: boolean;
		height: number;
	}) => {
		let textStyle: {
			color: string;
			fontSize: number;
			fontWeight: "400" | "500" | "700";
			opacity: number;
		};
		if (isActive) {
			textStyle = {
				color: "#29303D",
				fontSize: 19,
				fontWeight: "700",
				opacity: 1,
			};
		} else if (isNearby) {
			textStyle = {
				color: "#73808C",
				fontSize: 15,
				fontWeight: "500",
				opacity: 0.7,
			};
		} else {
			textStyle = {
				color: "#73808C",
				fontSize: 13,
				fontWeight: "400",
				opacity: 0.35,
			};
		}

		return (
			<View
				style={{
					height,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Text style={textStyle}>{label}</Text>
			</View>
		);
	}
);

// ── Main component ────────────────────────────────────────────────────────────
export const WheelPicker: React.FC<WheelPickerProps> = ({
	items,
	selectedIndex,
	onSelect,
	itemHeight = 44,
	visibleItems = 5,
	width = 80,
}) => {
	const scrollViewRef = useRef<ScrollView>(null);
	const paddingTopBottom = ((visibleItems - 1) / 2) * itemHeight;

	// activeIdx is stored in a ref so fast scrolling doesn't cause renders.
	// We use a separate state just for the visible highlights.
	const [activeIdx, setActiveIdx] = React.useState(selectedIndex);
	const lastHapticIdx = useRef(-1);
	const isMounted = useRef(false);

	// ── Commit selection (called on scroll end only) ──────────────────────────
	const commitIndex = useCallback(
		(offsetY: number) => {
			const raw = offsetY / itemHeight;
			const index = Math.max(0, Math.min(Math.round(raw), items.length - 1));
			setActiveIdx(index);
			if (index !== selectedIndex) {
				onSelect(index);
			}
		},
		[itemHeight, items.length, selectedIndex, onSelect]
	);

	// ── Lightweight scroll handler: only updates local highlight + haptics ────
	const handleScroll = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			const offsetY = event.nativeEvent.contentOffset.y;
			const raw = offsetY / itemHeight;
			const index = Math.max(0, Math.min(Math.round(raw), items.length - 1));

			// Update highlight without notifying parent (no external setState)
			if (index !== activeIdx) {
				setActiveIdx(index);
			}

			// Haptic tick rate: only once per distinct index, iOS only
			if (Platform.OS === "ios" && index !== lastHapticIdx.current) {
				lastHapticIdx.current = index;
				selectionAsync().catch(() => {
					/* ignore */
				});
			}
		},
		[itemHeight, items.length, activeIdx]
	);

	// ── Commit on momentum end (finger flick) ────────────────────────────────
	const handleMomentumScrollEnd = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			commitIndex(event.nativeEvent.contentOffset.y);
		},
		[commitIndex]
	);

	// ── Commit on drag end (slow swipe, no momentum) ─────────────────────────
	const handleScrollEndDrag = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			commitIndex(event.nativeEvent.contentOffset.y);
		},
		[commitIndex]
	);

	// ── Scroll to position when selectedIndex changes externally ─────────────
	useEffect(() => {
		const y = selectedIndex * itemHeight;
		if (!isMounted.current) {
			const id = requestAnimationFrame(() => {
				scrollViewRef.current?.scrollTo({ y, animated: false });
			});
			isMounted.current = true;
			setActiveIdx(selectedIndex);
			return () => cancelAnimationFrame(id);
		}
		scrollViewRef.current?.scrollTo({ y, animated: true });
		setActiveIdx(selectedIndex);
		return undefined;
	}, [selectedIndex, itemHeight]);

	return (
		<View
			style={{
				height: itemHeight * visibleItems,
				width,
				overflow: "hidden",
				position: "relative",
			}}
		>
			{/* Selection highlight bar */}
			<View
				pointerEvents="none"
				style={{
					position: "absolute",
					left: 8,
					right: 8,
					top: paddingTopBottom,
					height: itemHeight,
					backgroundColor: `${THEME.accent}18`,
					borderTopWidth: 1,
					borderBottomWidth: 1,
					borderColor: `${THEME.accent}30`,
					borderRadius: 10,
					zIndex: 10,
				}}
			/>

			<ScrollView
				contentContainerStyle={{ paddingVertical: paddingTopBottom }}
				decelerationRate="fast"
				nestedScrollEnabled
				onMomentumScrollEnd={handleMomentumScrollEnd}
				onScroll={handleScroll}
				onScrollEndDrag={handleScrollEndDrag}
				ref={scrollViewRef}
				// 32ms = ~30fps event fire rate, halving the event bus load
				scrollEventThrottle={32}
				showsVerticalScrollIndicator={false}
				snapToInterval={itemHeight}
			>
				{items.map((item, index) => (
					<WheelRow
						height={itemHeight}
						isActive={index === activeIdx}
						isNearby={Math.abs(index - activeIdx) === 1}
						key={item}
						label={item}
					/>
				))}
			</ScrollView>
		</View>
	);
};
