import type { LucideIcon } from "lucide-react-native";
import type React from "react";
import { Pressable, Text, View } from "react-native";

export interface MultiSelectOption {
	id: string;
	label: string;
	icon?: LucideIcon;
	emoji?: string;
}

interface MultiSelectGridProps {
	options: MultiSelectOption[];
	selectedIds: string[];
	onToggle: (id: string) => void;
	title: string;
	subtitle?: string;
}

export const MultiSelectGrid: React.FC<MultiSelectGridProps> = ({
	options,
	selectedIds,
	onToggle,
	title,
	subtitle,
}) => {
	return (
		<View>
			<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
				{title}
			</Text>
			{subtitle && (
				<Text className="mb-8 text-lg text-muted-foreground">{subtitle}</Text>
			)}

			<View className="-mx-2 flex-row flex-wrap">
				{options.map((option) => {
					const isSelected = selectedIds.includes(option.id);
					return (
						<Pressable
							className="w-1/2 p-2"
							key={option.id}
							onPress={() => onToggle(option.id)}
						>
							<View
								className={`h-32 items-center justify-center rounded-3xl border-2 p-4 ${
									isSelected
										? "border-primary bg-primary/5"
										: "border-secondary/20 bg-card"
								}`}
							>
								<View
									className={`mb-2 h-12 w-12 items-center justify-center rounded-full ${
										isSelected ? "bg-primary" : "bg-secondary/10"
									}`}
								>
									{option.emoji ? (
										<Text className="text-2xl">{option.emoji}</Text>
									) : option.icon ? (
										<option.icon
											color={isSelected ? "white" : "#666"}
											size={24}
										/>
									) : null}
								</View>
								<Text
									className={`text-center font-semibold ${
										isSelected ? "text-primary" : "text-foreground"
									}`}
								>
									{option.label}
								</Text>

								<View
									className={`absolute top-3 right-3 h-5 w-5 items-center justify-center rounded-full border-2 ${
										isSelected
											? "border-primary bg-primary"
											: "border-secondary/20"
									}`}
								>
									{isSelected && (
										<View className="h-1.5 w-1.5 rounded-full bg-white" />
									)}
								</View>
							</View>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
};
