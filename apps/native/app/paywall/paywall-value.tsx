import { router } from "expo-router";
import { Button, Card } from "heroui-native";
import { Check } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";

const BENEFITS = [
	"Unlock full wellness protocols",
	"Personalized daily insights",
	"Track your health timeline",
	"Priority AI analysis",
	"Export your health data",
	"Cancel anytime",
];

export default function PaywallValue() {
	return (
		<ScrollView className="flex-1 bg-background">
			<View className="p-6">
				<View className="mb-8">
					<Text className="mb-2 font-bold text-4xl">
						Unlock Your Full Health Plan
					</Text>
					<Text className="text-lg text-muted">
						Get personalized wellness guidance tailored to you
					</Text>
				</View>

				<View className="mb-8 gap-3">
					{BENEFITS.map((benefit) => (
						<Card key={benefit} variant="secondary">
							<Card.Body>
								<View className="flex-row items-center gap-3">
									<View className="rounded-full bg-primary p-1">
										<Check color="white" size={16} />
									</View>
									<Text className="flex-1 text-base">{benefit}</Text>
								</View>
							</Card.Body>
						</Card>
					))}
				</View>

				<Button
					className="w-full"
					onPress={() => router.push("/paywall/paywall-wheel")}
					size="lg"
				>
					Continue
				</Button>
			</View>
		</ScrollView>
	);
}
