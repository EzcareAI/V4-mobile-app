import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import { Container } from "@/components/container";
import { ResultPreview } from "@/components/scan/result-preview";
import { trpc } from "@/utils/trpc";

export default function ScanResult() {
    const { scanId } = useLocalSearchParams<{ scanId: string }>();

    const { data: result, isLoading } = trpc.scan.generateResult.useMutation();
    const { data: subscription } = trpc.subscription.getStatus.useQuery();

    const isSubscribed = subscription?.status === "active" || subscription?.status === "trial";

    const handleUnlock = () => {
        router.push("/paywall/paywall-value");
    };

    if (isLoading || !result) {
        return (
            <Container className="items-center justify-center">
                <ActivityIndicator size="large" />
                <Text className="mt-4 text-muted">Generating your results...</Text>
            </Container>
        );
    }

    return (
        <Container>
            <ResultPreview
                result={result.result}
                confidence={result.confidence}
                disclaimer={result.disclaimer}
                isSubscribed={isSubscribed}
                onUnlock={handleUnlock}
            />
        </Container>
    );
}
