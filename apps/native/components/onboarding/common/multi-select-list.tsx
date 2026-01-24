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
			className={`flex-row items-center rounded-[24px] border p-5 transition-all ${
				isSelected
					? "border-[#3EC9B5] bg-white shadow-emerald-100 shadow-md"
					: "border-slate-100 bg-white/60"
			}`}
			onPress={onPress}
		>
			<View
				className={`mr-4 h-14 w-14 items-center justify-center rounded-2xl ${
					isSelected ? "bg-[#3EC9B5]" : "bg-slate-100"
				}`}
			>
				{option.emoji ? (
					<Text className="text-3xl">{option.emoji}</Text>
				) : option.icon ? (
					<option.icon
						color={isSelected ? "white" : (option.iconColor ?? "#64748B")}
						size={28}
					/>
				) : null}
			</View>
			<Text
				className={`flex-1 font-bold text-lg ${
					isSelected ? "text-[#0d2137]" : "text-slate-700"
				}`}
			>
				{option.label}
			</Text>
			<View
				className={`h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
					isSelected ? "border-[#3EC9B5] bg-[#3EC9B5]" : "border-slate-200"
				}`}
			>
				{isSelected && <Check color="white" size={16} strokeWidth={3} />}
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
