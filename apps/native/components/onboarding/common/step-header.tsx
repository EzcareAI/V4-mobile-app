import { Text, View } from "react-native";

interface StepHeaderProps {
	title: string;
	description?: string;
}

export const StepHeader = ({ title, description }: StepHeaderProps) => {
	return (
		<View>
			<Text className="mt-4 mb-3 font-bold text-3xl text-foreground">
				{title}
			</Text>
			{description && (
				<Text className="mb-8 text-base text-muted leading-6">
					{description}
				</Text>
			)}
		</View>
	);
};
