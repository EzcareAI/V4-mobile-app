import { Link, useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function OnboardingIndex() {
	const router = useRouter();
	const reset = useOnboardingStore((state) => state.reset);

	const handleStart = () => {
		reset();
		router.push("/(onboarding)/1");
	};

	return (
		<SafeAreaView className="flex-1 justify-between bg-background px-6 py-12">
			<View className="mt-8 items-center">
				<View className="mb-8 h-32 w-32 items-center justify-center rounded-full bg-secondary/10">
					{/* EZBuddy Mascot Placeholder */}
					<Text className="text-center text-4xl">🤖</Text>
				</View>

				<Text className="mb-4 text-center font-bold text-3xl text-foreground">
					Welcome to EZCare AI
				</Text>
				<Text className="mb-8 text-center text-lg text-muted-foreground">
					Your personalized natural healing companion. Let's start by getting to
					know you.
				</Text>
			</View>

			<View className="gap-y-4">
				<Button
					className="rounded-full"
					color="primary"
					onPress={handleStart}
					size="lg"
					variant="solid"
				>
					Get Started
				</Button>
				<Link asChild href="/sign-in">
					<Button size="lg" variant="light">
						Already have an account? Sign In
					</Button>
				</Link>
			</View>
		</SafeAreaView>
	);
}
