import type { LucideIcon } from "lucide-react-native";
import type React from "react";
import { Pressable, Text, View } from "react-native";

export interface MultiSelectOption {
	id: string;
	label: string;
	icon?: LucideIcon;
	emoji?: string;
	fullWidth?: boolean;
}

interface MultiSelectGridProps {
	options: MultiSelectOption[];
	selectedIds: string[];
	onToggle: (id: string) => void;
	variant?: "top-right" | "bottom-center";
}

const GridItem = ({
	option,
	isSelected,
	onPress,
	variant = "top-right",
}: {
	option: MultiSelectOption;
	isSelected: boolean;
	onPress: () => void;
	variant?: "top-right" | "bottom-center";
}) => {
	const iconColor = isSelected ? "#3EC9B5" : "#64748B";

	let optionContent = null;
	if (option.emoji) {
		optionContent = <Text className="text-4xl">{option.emoji}</Text>;
	} else if (option.icon) {
		optionContent = <option.icon color={iconColor} size={32} />;
	}

	return (
		<Pressable
			className={`${option.fullWidth ? "w-full" : "w-1/2"} p-2`}
			onPress={onPress}
		>
			<View
				className={`h-44 items-center justify-center rounded-[24px] border p-4 transition-all ${
					isSelected ? "border-[#3EC9B5]" : "border-slate-50"
				}`}
				style={{
					backgroundColor: isSelected ? "white" : "rgba(255, 255, 255, 0.8)",
					shadowColor: isSelected ? "#3EC9B5" : "#000",
					shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
					shadowOpacity: isSelected ? 0.1 : 0.05,
					shadowRadius: isSelected ? 8 : 4,
					elevation: isSelected ? 4 : 2,
				}}
			>
				<View
					className={`mb-3 h-16 w-16 items-center justify-center rounded-2xl ${
						isSelected ? "bg-[#3EC9B5]/10" : "bg-slate-50"
					}`}
				>
					{optionContent}
				</View>
				<Text
					className={`text-center font-bold text-base leading-5 ${
						isSelected ? "text-[#0d2137]" : "text-slate-600"
					}`}
				>
					{option.label}
				</Text>

				{(() => {
					if (variant === "top-right") {
						return (
							isSelected && (
								<View className="absolute top-3 right-3 h-6 w-6 items-center justify-center rounded-full bg-[#3EC9B5]">
									<View className="h-2 w-2 rounded-full bg-white" />
								</View>
							)
						);
					}

					const indicatorBorderColor = isSelected ? "border-[#3EC9B5]" : "border-slate-200";
					const indicatorBgColor = isSelected ? "bg-white" : "bg-transparent";

					return (
						<View
							className={`mt-4 h-7 w-7 items-center justify-center rounded-full border-2 ${indicatorBorderColor} ${indicatorBgColor}`}
						>
							{isSelected && (
								<View className="h-3.5 w-3.5 rounded-full bg-[#3EC9B5]" />
							)}
						</View>
					);
				})()}
			</View>
		</Pressable>
	);
};

export const MultiSelectGrid: React.FC<MultiSelectGridProps> = ({
	options,
	selectedIds,
	onToggle,
	variant = "top-right",
}) => {
	return (
		<View className="-mx-2 flex-row flex-wrap">
			{options.map((option) => (
				<GridItem
					isSelected={selectedIds.includes(option.id)}
					key={option.id}
					onPress={() => onToggle(option.id)}
					option={option}
					variant={variant}
				/>
			))}
		</View>
	);
};