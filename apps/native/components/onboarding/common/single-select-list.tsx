import { selectionAsync } from "expo-haptics";
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
			className={`flex-row items-center rounded-[32px] border-2 p-6 transition-all duration-300 ${
				isSelected
					? "border-[#3BAFDA] bg-white shadow-blue-100 shadow-xl"
					: "border-slate-50 bg-slate-50/40"
			}`}
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
					// biome-ignore lint/style/noNestedTernary: biome false positive
				) : option.icon ? (
					<option.icon
						color={isSelected ? "white" : (option.iconColor ?? "#94A3B8")}
						size={26}
						strokeWidth={2.5}
					/>
				) : null}
			</View>
			<View className="flex-1">
				<RadioGroup.Label
					className={`font-bold text-lg tracking-tight ${
						isSelected ? "text-slate-900" : "text-slate-600"
					}`}
				>
					{option.label}
				</RadioGroup.Label>
				{option.description && (
					<Text
						className={`mt-0.5 font-medium text-sm leading-5 ${isSelected ? "text-slate-500" : "text-slate-400"}`}
					>
						{option.description}
					</Text>
				)}
			</View>
			<View
				className={`ml-3 h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
					isSelected ? "border-[#3BAFDA] bg-[#3BAFDA]" : "border-slate-200"
				}`}
			>
				{isSelected && <View className="h-2 w-2 rounded-full bg-white" />}
			</View>
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
			onValueChange={(value) => {
				selectionAsync();
				onSelect(value as T);
			}}
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
