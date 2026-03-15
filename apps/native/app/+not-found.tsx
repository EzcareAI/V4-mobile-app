import { Link, Stack } from "expo-router";
import { Button, Surface } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

// Fallbacks for heroui-native components
const SafeSurface = (props: Record<string, unknown>) => {
	if (typeof Surface === "undefined") {
		return <View {...props} />;
	}
	return <Surface {...props} />;
};

const SafeButton = (props: Record<string, unknown>) => {
	if (typeof Button === "undefined") {
		return <View {...props} />;
	}
	return <Button {...props} />;
};

export default function NotFoundScreen() {
	return (
		<>
			<Stack.Screen options={{ title: "Not Found" }} />
			<Container>
				<View className="flex-1 items-center justify-center p-4">
					<SafeSurface
						className="max-w-sm items-center rounded-lg p-6"
						variant="secondary"
					>
						<Text className="mb-3 text-4xl">🤔</Text>
						<Text className="mb-1 font-medium text-foreground text-lg">
							Page Not Found
						</Text>
						<Text className="mb-4 text-center text-muted text-sm">
							The page you're looking for doesn't exist.
						</Text>
						<Link asChild href="/">
							<SafeButton size="sm">
								<Text>Go Home</Text>
							</SafeButton>
						</Link>
					</SafeSurface>
				</View>
			</Container>
		</>
	);
}
