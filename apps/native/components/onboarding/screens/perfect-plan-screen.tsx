import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Sparkles, TrendingUp } from "lucide-react-native";
import { Text, View } from "react-native";

export const PerfectPlanScreen = () => {
	const router = useRouter();

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<View className="mt-12 items-center">
				<View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-primary/10">
					<Sparkles color="#0d2137" size={48} />
				</View>
				<Text className="mb-2 text-center font-bold text-primary uppercase tracking-widest">
					ALMOST THERE
				</Text>
				<Text className="mb-8 text-center font-bold text-3xl text-foreground">
					The perfect plan is taking shape.
				</Text>

				<View className="w-full gap-y-4">
					<View className="items-center rounded-3xl border border-primary/20 bg-card p-6">
						<TrendingUp className="mb-4" color="#0d2137" size={32} />
						<Text className="mb-2 text-center font-bold text-lg">
							94% Success Rate
						</Text>
						<Text className="text-center text-muted-foreground text-sm">
							Users with goals like yours see significant improvements within
							the first 21 days.
						</Text>
					</View>
				</View>
			</View>

			<Button
				className="h-14 rounded-full bg-primary"
				onPress={() => router.push("/(onboarding)/15")}
			>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
