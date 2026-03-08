import { LinearGradient } from "expo-linear-gradient";
import {
	ActivityIndicator,
	Text,
	TouchableOpacity,
	type TouchableOpacityProps,
} from "react-native";

interface GradientButtonProps extends TouchableOpacityProps {
	title: string;
	isLoading?: boolean;
}

export function GradientButton({
	title,
	isLoading,
	style,
	disabled,
	...props
}: GradientButtonProps) {
	return (
		<TouchableOpacity
			activeOpacity={0.8}
			disabled={disabled || isLoading}
			style={[{ borderRadius: 12, overflow: "hidden" }, style]}
			{...props}
		>
			<LinearGradient
				colors={["#4F46E5", "#2DD4BF"]} // Indigo to Teal
				end={{ x: 1, y: 0 }}
				start={{ x: 0, y: 0 }}
				style={{
					paddingVertical: 16,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{isLoading ? (
					<ActivityIndicator color="white" />
				) : (
					<Text className="font-bold text-lg text-white">{title}</Text>
				)}
			</LinearGradient>
		</TouchableOpacity>
	);
}
