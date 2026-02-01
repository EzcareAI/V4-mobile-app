import { router } from "expo-router";
import { Button, Card } from "heroui-native";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type PlanType = "yearly" | "monthly";

export default function PaywallPricing() {
	const [selectedPlan, setSelectedPlan] = useState<PlanType>("yearly");
	const [isProcessing, setIsProcessing] = useState(false);

	const handleSubscribe = async () => {
		setIsProcessing(true);

		// POC: Mock subscription (no RevenueCat yet)
		// TODO: Integrate RevenueCat
		setTimeout(() => {
			setIsProcessing(false);
			router.replace("/(drawer)/(tabs)");
		}, 1500);
	};

	return (
		<ScrollView className="flex-1 bg-background">
			<View className="p-6">
				<View className="mb-8">
					<Text className="mb-2 text-center font-bold text-4xl">
						Choose Your Plan
					</Text>
					<Text className="text-center text-lg text-muted">
						Start your 7-day free trial
					</Text>
				</View>

				{/* Yearly Plan (Highlighted) */}
				<Pressable className="mb-4" onPress={() => setSelectedPlan("yearly")}>
					<Card
						className={`border-2 ${
							selectedPlan === "yearly"
								? "border-primary bg-primary/5"
								: "border-border"
						}`}
						variant="secondary"
					>
						<Card.Body>
							<View className="mb-2 flex-row items-center justify-between">
								<View>
									<View className="mb-1 flex-row items-center gap-2">
										<Text className="font-bold text-xl">Yearly</Text>
										<View className="rounded-full bg-primary px-2 py-1">
											<Text className="font-semibold text-white text-xs">
												BEST VALUE
											</Text>
										</View>
									</View>
									<Text className="text-muted text-sm line-through">
										$179.99/year
									</Text>
								</View>
								<View className="items-end">
									<Text className="font-bold text-3xl">$39.99</Text>
									<Text className="text-muted text-sm">/year</Text>
								</View>
							</View>
							<View className="mt-2 flex-row items-center gap-2">
								<Check color="#3b82f6" size={16} />
								<Text className="text-muted text-sm">Save $140 (78% off)</Text>
							</View>
							<View className="flex-row items-center gap-2">
								<Check color="#3b82f6" size={16} />
								<Text className="text-muted text-sm">Just $3.33/month</Text>
							</View>
						</Card.Body>
					</Card>
				</Pressable>

				{/* Monthly Plan */}
				<Pressable className="mb-8" onPress={() => setSelectedPlan("monthly")}>
					<Card
						className={`border-2 ${
							selectedPlan === "monthly"
								? "border-primary bg-primary/5"
								: "border-border"
						}`}
						variant="secondary"
					>
						<Card.Body>
							<View className="flex-row items-center justify-between">
								<View>
									<Text className="mb-1 font-bold text-xl">Monthly</Text>
									<Text className="text-muted text-sm">Billed monthly</Text>
								</View>
								<View className="items-end">
									<Text className="font-bold text-3xl">$14.99</Text>
									<Text className="text-muted text-sm">/month</Text>
								</View>
							</View>
						</Card.Body>
					</Card>
				</Pressable>

				<Button
					className="mb-4 w-full"
					isDisabled={isProcessing}
					onPress={handleSubscribe}
					size="lg"
				>
					{isProcessing ? "Processing..." : "Start 7-Day Free Trial"}
				</Button>

				<Text className="text-center text-muted text-xs">
					Cancel anytime. No commitment. Your trial starts today.
				</Text>
			</View>
		</ScrollView>
	);
}
