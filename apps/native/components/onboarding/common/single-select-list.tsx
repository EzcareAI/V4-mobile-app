import { selectionAsync } from "expo-haptics";
import { RadioGroup } from "heroui-native";
import type { LucideIcon } from "lucide-react-native";
import { Platform, Text, View } from "react-native";

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
					? "border-[#00A8A8] bg-[#00A8A8]/10 shadow-[#00A8A8]/30/20 shadow-lg"
					: "border-transparent bg-white shadow-sm"
			}`}
		>
			<View
				className={`mr-5 h-14 w-14 items-center justify-center rounded-2xl ${
					isSelected
						? "bg-[#00A8A8] shadow-[#00A8A8]/30/30 shadow-md"
						: "border border-slate-100 bg-white shadow-sm"
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
						isSelected ? "text-[#1A2138]" : "text-[#60708F]"
					}`}
				>
					{option.label}
				</RadioGroup.Label>
				{option.description && (
					<Text
						className={`mt-0.5 font-medium text-sm leading-5 ${isSelected ? "text-[#1A2138]/70" : "text-[#60708F]"}`}
					>
						{option.description}
					</Text>
				)}
			</View>
			<View
				className={`ml-3 h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
					isSelected
						? "border-[#00A8A8] bg-[#00A8A8]"
						: "border-slate-200 bg-white"
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
				if (Platform.OS === "ios") {
					selectionAsync().catch(() => {
						/* ignore */
					});
				}
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
