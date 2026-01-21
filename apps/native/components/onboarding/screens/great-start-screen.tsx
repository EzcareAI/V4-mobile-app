import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { ShieldCheck, Zap } from "lucide-react-native";
import { Text, View } from "react-native";

export const GreatStartScreen = () => {
	const router = useRouter();

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<View className="mt-12 items-center">
				<View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-success/10">
					<ShieldCheck color="#10b981" size={48} />
				</View>
				<Text className="mb-2 text-center font-bold text-primary uppercase tracking-widest">
					GREAT START!
				</Text>
				<Text className="mb-8 text-center font-bold text-3xl text-foreground">
					You're already doing better than most.
				</Text>

				<View className="w-full gap-y-4">
					<View className="flex-row items-center rounded-2xl border border-secondary/10 bg-card p-4">
						<View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
							<Zap color="#0d2137" size={20} />
						</View>
						<View className="flex-1">
							<Text className="font-bold">+31% Energy</Text>
							<Text className="text-muted-foreground text-sm">
								Expected within first 14 days
							</Text>
						</View>
					</View>

					<View className="flex-row items-center rounded-2xl border border-secondary/10 bg-card p-4">
						<View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-danger/10">
							<ShieldCheck color="#ef4444" size={20} />
						</View>
						<View className="flex-1">
							<Text className="font-bold">-25% Inflammation</Text>
							<Text className="text-muted-foreground text-sm">
								Reduction in systemic markers
							</Text>
						</View>
					</View>
				</View>
			</View>

			<Button
				className="rounded-full"
				color="primary"
				onPress={() => router.push("/(onboarding)/6")}
				size="lg"
			>
				I'm Ready
			</Button>
		</View>
	);
};
