import { selectionAsync } from "expo-haptics";
import type React from "react";
import { useCallback, useRef } from "react";
import {
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	Platform,
	ScrollView,
	Text,
	View,
} from "react-native";

interface WheelPickerProps {
	items: string[];
	selectedIndex: number;
	onSelect: (index: number) => void;
	itemHeight?: number;
	visibleItems?: number;
	width?: number;
}

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

	const handleScroll = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			const offsetY = event.nativeEvent.contentOffset.y;
			const index = Math.round(offsetY / itemHeight);
			if (index >= 0 && index < items.length && index !== selectedIndex) {
				if (Platform.OS === "ios") {
					selectionAsync().catch(() => {
						/* ignore */
					});
				}
				onSelect(index);
			}
		},
		[itemHeight, items.length, selectedIndex, onSelect]
	);

	const handleMomentumScrollEnd = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			const offsetY = event.nativeEvent.contentOffset.y;
			const index = Math.round(offsetY / itemHeight);
			if (index >= 0 && index < items.length && index !== selectedIndex) {
				onSelect(index);
			}
		},
		[itemHeight, items.length, selectedIndex, onSelect]
	);

	return (
		<View
			className="relative overflow-hidden"
			style={{
				height: itemHeight * visibleItems,
				width,
			}}
		>
			{/* Selection highlight */}
			<View
				className="pointer-events-none absolute inset-x-2 z-10 rounded-lg border-[#28B898]/10 border-y bg-[#28B898]/5"
				style={{
					height: itemHeight,
					top: paddingTopBottom,
				}}
			/>

			<ScrollView
				contentContainerStyle={{
					paddingVertical: paddingTopBottom,
				}}
				contentOffset={{ x: 0, y: selectedIndex * itemHeight }}
				decelerationRate="fast"
				onMomentumScrollEnd={handleMomentumScrollEnd}
				onScroll={handleScroll}
				ref={scrollViewRef}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				snapToInterval={itemHeight}
			>
				{items.map((item, index) => {
					const distance = Math.abs(index - selectedIndex);

					let textStyle = "text-[#73808C]/40 text-sm";
					if (distance === 0) {
						textStyle = "text-[#29303D] font-bold text-lg";
					} else if (distance === 1) {
						textStyle = "text-[#73808C] text-base";
					}

					return (
						<View
							className="items-center justify-center"
							key={`${item}-${index}`}
							style={{ height: itemHeight }}
						>
							<Text className={textStyle}>{item}</Text>
						</View>
					);
				})}
			</ScrollView>
		</View>
	);
};
