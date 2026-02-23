/** biome-ignore-all lint/style/noNestedTernary: false positive */
import { selectionAsync } from "expo-haptics";
import { RadioGroup } from "heroui-native";
import type { LucideIcon } from "lucide-react-native";
import { Platform, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { THEME } from "@/lib/theme";

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
			className={`flex-row items-center rounded-2xl border-2 p-4 transition-all duration-300 ${
				isSelected
					? "border-blue-500 bg-blue-50 shadow-lg"
					: "border-transparent bg-white shadow-sm"
			}`}
			style={
				isSelected
					? {
							borderColor: THEME.accent,
							backgroundColor: THEME.accentBg,
							shadowColor: THEME.accentShadow,
							shadowOpacity: 0.15,
							shadowRadius: 8,
							elevation: 3,
						}
					: undefined
			}
		>
			<View
				className={`mr-4 h-12 w-12 items-center justify-center rounded-xl ${
					isSelected
						? "shadow-md"
						: "border border-slate-100 bg-white shadow-sm"
				}`}
				style={
					isSelected
						? {
								backgroundColor: THEME.accent,
								shadowColor: THEME.accentShadow,
								shadowOpacity: 0.3,
								shadowRadius: 6,
								elevation: 3,
							}
						: undefined
				}
			>
				{option.emoji ? (
					<Text className="text-2xl">{option.emoji}</Text>
				) : // biome-ignore lint/style/noNestedTernary: biome false positive
				option.icon ? (
					<option.icon
						color={isSelected ? "white" : (option.iconColor ?? "#73808C")}
						size={24}
						strokeWidth={2.5}
					/>
				) : null}
			</View>
			<View className="flex-1">
				<RadioGroup.Label
					className={`font-semibold text-base tracking-tight ${
						isSelected ? "text-[#29303D]" : "text-[#73808C]"
					}`}
				>
					{option.label}
				</RadioGroup.Label>
				{option.description && (
					<Text
						className={`mt-0.5 font-medium text-sm leading-5 ${isSelected ? "text-[#29303D]/70" : "text-[#73808C]"}`}
					>
						{option.description}
					</Text>
				)}
			</View>

			<View
				className={`ml-4 h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
					isSelected ? "bg-blue-500" : "border-slate-200 bg-white"
				}`}
				style={
					isSelected
						? { borderColor: THEME.accent, backgroundColor: THEME.accent }
						: undefined
				}
			>
				{isSelected && (
					<Svg
						className="color-white h-full w-full text-white"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<Path
							clipRule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							fillRule="evenodd"
						/>
					</Svg>
				)}
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
