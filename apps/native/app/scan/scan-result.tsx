import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text } from "react-native";

import { Container } from "@/components/container";
import { ResultPreview } from "@/components/scan/result-preview";
import { trpc } from "@/utils/trpc";

export default function ScanResult() {
	const { scanId } = useLocalSearchParams<{ scanId: string }>();

	const generateResult = trpc.scan.generateResult.useMutation();
	const { data: subscription } = trpc.subscription.getStatus.useQuery();

	// Call mutation on mount
	useEffect(() => {
		if (scanId && !generateResult.data && !generateResult.isPending) {
			generateResult.mutate({ scanId });
		}
	}, [scanId, generateResult.data, generateResult.isPending, generateResult]);

	const isSubscribed =
		subscription?.status === "active" || subscription?.status === "trial";

	const handleUnlock = () => {
		router.push("/paywall/paywall-value");
	};

	if (generateResult.isPending || !generateResult.data) {
		return (
			<Container className="items-center justify-center">
				<ActivityIndicator size="large" />
				<Text className="mt-4 text-muted">Generating your results...</Text>
			</Container>
		);
	}

	if (generateResult.error) {
		return (
			<Container className="items-center justify-center">
				<Text className="text-danger">
					Error: {generateResult.error.message}
				</Text>
			</Container>
		);
	}

	const result = generateResult.data;

	return (
		<Container>
			<ResultPreview
				confidence={result.confidence}
				disclaimer={result.disclaimer}
				isSubscribed={isSubscribed}
				onUnlock={handleUnlock}
				result={result.result}
			/>
		</Container>
	);
}
