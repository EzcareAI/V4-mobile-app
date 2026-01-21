import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Activity, CheckCircle, Heart } from "lucide-react-native";
import { Text, View } from "react-native";

export const SymptomResultsScreen = () => {
	const router = useRouter();

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<View className="mt-12 items-center">
				<View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-primary/10">
					<Activity color="#0d2137" size={48} />
				</View>
				<Text className="mb-2 text-center font-bold text-primary uppercase tracking-widest">
					WE HEAR YOU
				</Text>
				<Text className="mb-8 text-center font-bold text-3xl text-foreground">
					These symptoms are signals from your body.
				</Text>

				<View className="w-full gap-y-4">
					<View className="flex-row items-start rounded-2xl border border-secondary/10 bg-card p-4">
						<Heart className="mt-1 mr-4" color="#10b981" size={20} />
						<View className="flex-1">
							<Text className="font-bold">Natural Approach</Text>
							<Text className="text-muted-foreground text-sm">
								92% of users reported reduction in these symptoms within 30 days
								of following their plan.
							</Text>
						</View>
					</View>
					<View className="flex-row items-start rounded-2xl border border-secondary/10 bg-card p-4">
						<CheckCircle className="mt-1 mr-4" color="#0d2137" size={20} />
						<View className="flex-1">
							<Text className="font-bold">Root Cause Focus</Text>
							<Text className="text-muted-foreground text-sm">
								We'll help you address the source, not just mask the symptoms.
							</Text>
						</View>
					</View>
				</View>
			</View>

			<Button
				className="h-14 rounded-full bg-primary"
				onPress={() => router.push("/(onboarding)/10")}
			>
				<Button.Label className="font-bold text-lg text-white">
					Show My Plan
				</Button.Label>
			</Button>
		</View>
	);
};
