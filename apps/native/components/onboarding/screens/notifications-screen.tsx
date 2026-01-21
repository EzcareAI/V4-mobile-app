import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Bell, MessageSquare, Zap } from "lucide-react-native";
import { Switch, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export const NotificationsScreen = () => {
	const router = useRouter();
	const { notificationsEnabled, setAnswer, nextStep } = useOnboardingStore();

	const handleToggle = (val: boolean) => {
		setAnswer("notificationsEnabled", val);
	};

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/20");
	};

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<View>
				<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
					Never miss a beat
				</Text>
				<Text className="mb-8 text-lg text-muted-foreground">
					Enable notifications for your daily check-in reminders and AI updates.
				</Text>

				<View className="rounded-3xl border-2 border-secondary/10 bg-card p-6">
					<View className="mb-8 flex-row items-center justify-between">
						<View className="flex-row items-center">
							<View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								<Bell color="#0d2137" size={20} />
							</View>
							<Text className="font-bold text-lg">Push Notifications</Text>
						</View>
						<Switch
							onValueChange={handleToggle}
							trackColor={{ false: "#e5e7eb", true: "#0d2137" }}
							value={notificationsEnabled}
						/>
					</View>

					<View className="space-y-4">
						<View className="mb-4 flex-row items-center opacity-70">
							<MessageSquare className="mr-3" color="#666" size={18} />
							<Text className="text-muted-foreground">
								Daily check-in reminders
							</Text>
						</View>
						<View className="flex-row items-center opacity-70">
							<Zap className="mr-3" color="#666" size={18} />
							<Text className="text-muted-foreground">
								AI health insights & tips
							</Text>
						</View>
					</View>
				</View>
			</View>

			<Button className="h-14 rounded-full bg-primary" onPress={handleContinue}>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
