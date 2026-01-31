import { router } from "expo-router";
import { Button, Card } from "heroui-native";
import { Activity } from "lucide-react-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

export default function Home() {
	return (
		<Container className="p-6">
			<View className="mb-8">
				<Text className="mb-2 text-3xl font-bold">Welcome to EZCare AI</Text>
				<Text className="text-lg text-muted">
					Your personal health companion
				</Text>
			</View>

			{/* Hero CTA */}
			<Card className="mb-6" variant="secondary">
				<Card.Body className="items-center p-8">
					<View className="mb-4 rounded-full bg-white/20 p-4">
						<Activity size={48} color="white" />
					</View>
					<Text className="mb-2 text-center text-2xl font-bold text-white">
						Where do you feel something?
					</Text>
					<Text className="mb-6 text-center text-white/80">
						Start a body scan to get personalized wellness insights
					</Text>
					<Button
						onPress={() => router.push("/scan/scan-start")}
						variant="secondary"
						size="lg"
						className="w-full"
					>
						Start Body Scan
					</Button>
				</Card.Body>
			</Card>

			{/* Today Card Placeholder */}
			<Card variant="secondary">
				<Card.Body>
					<Text className="mb-2 text-lg font-semibold">Today</Text>
					<Text className="text-muted">
						Complete your first scan to unlock daily insights
					</Text>
				</Card.Body>
			</Card>
		</Container>
	);
}
