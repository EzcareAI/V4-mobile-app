/** biome-ignore-all lint/style/noNestedTernary: false positive */
import { PressableFeedback } from "heroui-native";
import { Check, type LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";

export interface MultiSelectOption {
	id: string;
	label: string;
	emoji?: string;
	icon?: LucideIcon;
}

interface MultiSelectListProps {
	options: MultiSelectOption[];
	selectedIds: string[];
	onToggle: (id: string) => void;
}

export const MultiSelectList = ({
	options,
	selectedIds,
	onToggle,
}: MultiSelectListProps) => {
	return (
		<View className="gap-y-4">
			{options.map((option) => {
				const isSelected = selectedIds.includes(option.id);
				return (
					<PressableFeedback
						className={`flex-row items-center rounded-3xl border-2 p-4 ${
							isSelected
								? "border-accent bg-accent/5"
								: "border-secondary/20 bg-card"
						}`}
						key={option.id}
						onPress={() => onToggle(option.id)}
					>
						<View
							className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
								isSelected ? "bg-accent" : "border border-secondary/10 bg-card"
							}`}
						>
							{option.emoji ? (
								<Text className="text-2xl">{option.emoji}</Text>
							) : option.icon ? (
								<option.icon color={isSelected ? "white" : "#666"} size={24} />
							) : null}
						</View>
						<Text
							className={`flex-1 font-semibold text-lg ${
								isSelected ? "text-accent" : "text-foreground"
							}`}
						>
							{option.label}
						</Text>
						<View
							className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
								isSelected ? "border-accent bg-accent" : "border-secondary/20"
							}`}
						>
							{isSelected && <Check color="white" size={14} />}
						</View>
					</PressableFeedback>
				);
			})}
		</View>
	);
};
