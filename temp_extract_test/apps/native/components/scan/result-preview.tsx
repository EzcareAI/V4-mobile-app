import { Button, Card } from "heroui-native";
import { AlertCircle, CheckCircle2, Shield } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";

interface ResultPreviewProps {
	result: {
		summary: string;
		possible_contributors: Array<{
			factor: string;
			likelihood: "high" | "medium" | "low";
			explanation: string;
		}>;
		recommended_actions: Array<{
			category: string;
			action: string;
			priority: number;
		}>;
		things_to_avoid: string[];
		escalation: {
			urgency: "none" | "monitor" | "consult_soon" | "seek_immediate";
			reason?: string;
			red_flags_detected: string[];
		};
	};
	confidence: number;
	disclaimer: string;
	isSubscribed: boolean;
	onUnlock: () => void;
}

export function ResultPreview({
	result,
	confidence,
	disclaimer,
	isSubscribed,
	onUnlock,
}: ResultPreviewProps) {
	const getConfidenceColor = () => {
		if (confidence >= 0.7) {
			return "text-green-600";
		}
		if (confidence >= 0.4) {
			return "text-yellow-600";
		}
		return "text-red-600";
	};

	const getConfidenceLabel = () => {
		if (confidence >= 0.7) {
			return "High";
		}
		if (confidence >= 0.4) {
			return "Medium";
		}
		return "Low";
	};

	return (
		<ScrollView className="flex-1 bg-background">
			<View className="p-6">
				{/* Header */}
				<View className="mb-6">
					<Text className="mb-2 font-bold text-3xl">Your Scan Results</Text>
					<View className="flex-row items-center gap-2">
						<Text className="text-muted">Confidence:</Text>
						<Text className={`font-semibold ${getConfidenceColor()}`}>
							{getConfidenceLabel()}
						</Text>
					</View>
				</View>

				{/* Summary */}
				<Card className="mb-4" variant="secondary">
					<Card.Body>
						<Text className="text-base leading-relaxed">{result.summary}</Text>
					</Card.Body>
				</Card>

				{/* Possible Contributors (Always Visible) */}
				<View className="mb-4">
					<Text className="mb-3 font-bold text-xl">Possible Contributors</Text>
					{result.possible_contributors.map((contributor) => (
						<Card className="mb-2" key={contributor.factor} variant="secondary">
							<Card.Body>
								<View className="flex-row items-start gap-3">
									<CheckCircle2 color="#3b82f6" size={20} />
									<View className="flex-1">
										<Text className="mb-1 font-semibold">
											{contributor.factor}
										</Text>
										<Text className="text-muted text-sm">
											{contributor.explanation}
										</Text>
										<Text className="mt-1 text-muted text-xs uppercase">
											Likelihood: {contributor.likelihood}
										</Text>
									</View>
								</View>
							</Card.Body>
						</Card>
					))}
				</View>

				{/* Recommended Actions (Blurred if not subscribed) */}
				<View className="mb-4">
					<Text className="mb-3 font-bold text-xl">Recommended Actions</Text>
					{isSubscribed ? (
						result.recommended_actions.map((action) => (
							<Card className="mb-2" key={action.action} variant="secondary">
								<Card.Body>
									<Text className="font-semibold">{action.action}</Text>
									<Text className="mt-1 text-muted text-xs uppercase">
										{action.category} • Priority {action.priority}
									</Text>
								</Card.Body>
							</Card>
						))
					) : (
						<View className="relative overflow-hidden rounded-xl">
							<View className="opacity-30">
								<Card className="mb-2" variant="secondary">
									<Card.Body>
										<Text>Try 10-minute morning walks</Text>
									</Card.Body>
								</Card>
								<Card className="mb-2" variant="secondary">
									<Card.Body>
										<Text>Reduce caffeine after 2pm</Text>
									</Card.Body>
								</Card>
							</View>
							<View className="absolute inset-0 items-center justify-center bg-background/80">
								<Shield color="#3b82f6" size={40} />
								<Text className="mt-2 font-semibold">Unlock to view</Text>
							</View>
						</View>
					)}
				</View>

				{/* Things to Avoid (Blurred if not subscribed) */}
				<View className="mb-4">
					<Text className="mb-3 font-bold text-xl">Things to Avoid</Text>
					{isSubscribed ? (
						result.things_to_avoid.map((item) => (
							<Card className="mb-2" key={item} variant="secondary">
								<Card.Body>
									<Text>{item}</Text>
								</Card.Body>
							</Card>
						))
					) : (
						<View className="relative overflow-hidden rounded-xl">
							<View className="opacity-30">
								<Card className="mb-2" variant="secondary">
									<Card.Body>
										<Text>Avoid heavy meals before bed</Text>
									</Card.Body>
								</Card>
							</View>
							<View className="absolute inset-0 items-center justify-center bg-background/80">
								<Shield color="#3b82f6" size={40} />
								<Text className="mt-2 font-semibold">Unlock to view</Text>
							</View>
						</View>
					)}
				</View>

				{/* Escalation */}
				{result.escalation.urgency !== "none" && (
					<Card className="mb-4 border-2 border-yellow-500" variant="secondary">
						<Card.Body>
							<View className="flex-row items-start gap-3">
								<AlertCircle color="#eab308" size={24} />
								<View className="flex-1">
									<Text className="mb-1 font-semibold">
										{(() => {
											if (result.escalation.urgency === "seek_immediate") {
												return "Seek Immediate Attention";
											}
											if (result.escalation.urgency === "consult_soon") {
												return "Consult a Professional Soon";
											}
											return "Monitor Closely";
										})()}
									</Text>
									{result.escalation.reason && (
										<Text className="text-muted text-sm">
											{result.escalation.reason}
										</Text>
									)}
								</View>
							</View>
						</Card.Body>
					</Card>
				)}

				{/* Unlock CTA */}
				{!isSubscribed && (
					<Button className="mb-4 w-full" onPress={onUnlock} size="lg">
						Unlock Full Plan
					</Button>
				)}

				{/* Disclaimer */}
				<Card variant="secondary">
					<Card.Body>
						<Text className="text-muted text-xs">{disclaimer}</Text>
					</Card.Body>
				</Card>
			</View>
		</ScrollView>
	);
}
