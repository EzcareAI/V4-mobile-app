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
	options: SingleSelectOption[];
	selectedId: T | null;
	onSelect: (id: T) => void;
}

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
						<View
							className={`flex-row items-center rounded-3xl border-2 p-5 ${
								isSelected ? "border-accent bg-accent/5" : "border-transparent"
							}`}
						>
							<View
								className="mr-5 h-16 w-16 items-center justify-center rounded-2xl"
								style={{
									backgroundColor: option.iconColor ?? "#888",
								}}
							>
								{option.emoji ? (
									<Text className="text-3xl">{option.emoji}</Text>
								) : option.icon ? (
									<option.icon color="white" size={32} />
								) : null}
							</View>
							<View className="flex-1">
								<RadioGroup.Label className="mb-1 font-bold text-foreground text-xl">
									{option.label}
								</RadioGroup.Label>
								{option.description && (
									<Text className="font-medium text-muted text-sm">
										{option.description}
									</Text>
								)}
							</View>
							<RadioGroup.Indicator className="ml-4">
								<RadioGroup.IndicatorThumb />
							</RadioGroup.Indicator>
						</View>
					)}
				</RadioGroup.Item>
			))}
		</RadioGroup>
	);
};
