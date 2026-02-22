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
			<Text
				className={`mt-6 mb-3 font-bold text-[34px] text-ezcare-navy leading-[42px] tracking-tight ${textAlignClasses[align]}`}
			>
				{title}
			</Text>
			{description && (
				<View>
					{typeof description === "string" ? (
						<Text
							className={`mb-10 text-[17px] text-ezcare-slate leading-[26px] ${textAlignClasses[align]}`}
						>
							{description}
						</Text>
					) : (
						<View className="mb-10">{description}</View>
					)}
				</View>
			)}
		</View>
	);
};
