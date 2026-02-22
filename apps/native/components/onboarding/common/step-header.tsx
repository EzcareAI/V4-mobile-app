import { Text, View } from "react-native";

interface StepHeaderProps {
	title: string;
	description?: string | React.ReactNode;
	className?: string;
	align?: "start" | "center" | "end";
}

export const StepHeader = ({
	title,
	description,
	className,
	align = "start",
}: StepHeaderProps) => {
	const alignmentClasses = {
		start: "items-start",
		center: "items-center",
		end: "items-end",
	};

	const textAlignClasses = {
		start: "text-left",
		center: "text-center",
		end: "text-right",
	};

	return (
		<View className={`${alignmentClasses[align]} ${className}`}>
			{/* SaaS Center Icon Wrap */}
			{align === "center" && (
				<View className="mt-8 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3F1]">
					{/* Placeholder for when actual SVG icons are passed up from the screens */}
					<Text className="text-3xl">✦</Text>
				</View>
			)}

			<Text
				className={`mb-2 font-bold text-[#29303D] text-xl ${textAlignClasses[align]}`}
			>
				{title}
			</Text>

			{description && (
				<View>
					{typeof description === "string" ? (
						<Text
							className={`mb-6 text-[#73808C] text-sm ${textAlignClasses[align]}`}
						>
							{description}
						</Text>
					) : (
						<View className="mb-6">{description}</View>
					)}
				</View>
			)}
		</View>
	);
};
