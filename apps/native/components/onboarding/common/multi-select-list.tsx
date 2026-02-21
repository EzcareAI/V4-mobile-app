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
			className={`flex-row items-center rounded-[32px] border-2 p-6 transition-all duration-300 ${
				isSelected
					? "border-[#3BAFDA] bg-white shadow-blue-100 shadow-xl"
					: "border-slate-50 bg-slate-50/40"
			}`}
			onPress={onPress}
		>
			<View
				className={`mr-5 h-14 w-14 items-center justify-center rounded-2xl ${
					isSelected
						? "bg-[#3BAFDA] shadow-blue-200 shadow-md"
						: "bg-white shadow-sm"
				}`}
			>
				{option.emoji ? (
					<Text className="text-3xl">{option.emoji}</Text>
				) : option.icon ? (
					<option.icon
						color={isSelected ? "white" : (option.iconColor ?? "#94A3B8")}
						size={26}
						strokeWidth={2.5}
					/>
				) : null}
			</View>
			<Text
				className={`flex-1 font-bold text-lg tracking-tight ${
					isSelected ? "text-slate-900" : "text-slate-600"
				}`}
			>
				{option.label}
			</Text>
			<View
				className={`h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
					isSelected ? "border-[#3BAFDA] bg-[#3BAFDA]" : "border-slate-200"
				}`}
			>
				{isSelected && <Check color="white" size={16} strokeWidth={4} />}
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
