/** biome-ignore-all lint/style/noNestedTernary: false positive */
import { PressableFeedback } from "heroui-native";
import { Check, type LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";

export interface MultiSelectOption {
	id: string;
	label: string;
	emoji?: string;
	icon?: LucideIcon;
	iconColor?: string;
}

interface MultiSelectListProps {
	options: MultiSelectOption[];
	selectedIds: string[];
	onToggle: (id: string) => void;
}

const MultiSelectItem = ({
	option,
	isSelected,
	onPress,
}: {
	option: MultiSelectOption;
	isSelected: boolean;
	onPress: () => void;
}) => {
	return (
		<PressableFeedback
			className={`flex-row items-center rounded-2xl border-2 p-4 transition-all duration-300 ${
				isSelected
					? "border-[#28B898] bg-[#EAF3F1] shadow-[#28B898]/30 shadow-lg"
					: "border-transparent bg-white shadow-sm"
			}`}
			onPress={onPress}
		>
			<View
				className={`mr-4 h-12 w-12 items-center justify-center rounded-xl ${
					isSelected
						? "bg-[#28B898] shadow-[#28B898]/30 shadow-md"
						: "border border-slate-100 bg-white shadow-sm"
				}`}
			>
				{option.emoji ? (
					<Text className="text-2xl">{option.emoji}</Text>
				) : option.icon ? (
					<option.icon
						color={isSelected ? "white" : (option.iconColor ?? "#73808C")}
						size={24}
						strokeWidth={2.5}
					/>
				) : null}
			</View>
			<Text
				className={`flex-1 font-semibold text-base tracking-tight ${
					isSelected ? "text-[#29303D]" : "text-[#73808C]"
				}`}
			>
				{option.label}
			</Text>
			<View
				className={`ml-4 h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
					isSelected
						? "border-[#28B898] bg-[#28B898]"
						: "border-slate-200 bg-white"
				}`}
			>
				{isSelected && <Check color="white" size={14} strokeWidth={4} />}
			</View>
		</PressableFeedback>
	);
};

export const MultiSelectList = ({
	options,
	selectedIds,
	onToggle,
}: MultiSelectListProps) => {
	return (
		<View className="gap-y-4">
			{options.map((option) => (
				<MultiSelectItem
					isSelected={selectedIds.includes(option.id)}
					key={option.id}
					onPress={() => onToggle(option.id)}
					option={option}
				/>
			))}
		</View>
	);
};
