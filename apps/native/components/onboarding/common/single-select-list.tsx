/** biome-ignore-all lint/style/noNestedTernary: false positive */
import { RadioGroup } from "heroui-native";
import type { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";

export interface SingleSelectOption {
	id: string;
	label: string;
	description?: string;
	icon?: LucideIcon;
	emoji?: string;
	iconColor?: string;
}

interface SingleSelectListProps<T extends string = string> {
	options: readonly (SingleSelectOption | Readonly<SingleSelectOption>)[];
	selectedId: T | null;
	onSelect: (id: T) => void;
}

const SelectItem = ({
	option,
	isSelected,
}: {
	option: SingleSelectOption | Readonly<SingleSelectOption>;
	isSelected: boolean;
}) => {
	return (
		<View
			className={`flex-row items-center rounded-[24px] border p-5 transition-all ${
				isSelected
					? "border-[#3EC9B5] bg-white shadow-emerald-100 shadow-md"
					: "border-slate-100 bg-white/60"
			}`}
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
			<View className="flex-1">
				<RadioGroup.Label
					className={`font-bold text-lg ${
						isSelected ? "text-[#0d2137]" : "text-slate-700"
					}`}
				>
					{option.label}
				</RadioGroup.Label>
				{option.description && (
					<Text className="mt-0.5 text-slate-500 text-sm leading-5">
						{option.description}
					</Text>
				)}
			</View>
			{isSelected && (
				<View className="ml-2 h-6 w-6 items-center justify-center rounded-full bg-[#3EC9B5]">
					<View className="h-2 w-2 rounded-full bg-white" />
				</View>
			)}
		</View>
	);
};

export const SingleSelectList = <T extends string = string>({
	options,
	selectedId,
	onSelect,
}: SingleSelectListProps<T>) => {
	return (
		<RadioGroup
			className="gap-y-4"
			onValueChange={(value) => onSelect(value as T)}
			value={selectedId ?? undefined}
		>
			{options.map((option) => (
				<RadioGroup.Item
					className="rounded-3xl shadow-surface"
					key={option.id}
					value={option.id}
				>
					{({ isSelected }) => (
						<SelectItem isSelected={isSelected} option={option} />
					)}
				</RadioGroup.Item>
			))}
		</RadioGroup>
	);
};
