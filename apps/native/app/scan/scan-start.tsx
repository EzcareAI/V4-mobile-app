import { router } from "expo-router";
import { Card } from "heroui-native";
import { Text, View } from "react-native";

import { BodyDiagram } from "@/components/scan/body-diagram";
import { Container } from "@/components/container";
import { useScanStore } from "@/stores/scan-store";

export default function ScanStart() {
    const setZone = useScanStore((state) => state.setZone);

    const handleZoneSelect = (zone: string) => {
        setZone(zone);
        router.push({
            pathname: "/scan/scan-symptoms",
            params: { zone },
        });
    };

    return (
        <Container className="p-6">
            <View className="mb-8">
                <Text className="mb-2 text-3xl font-bold">Body Scan</Text>
                <Text className="text-lg text-muted">
                    Where do you feel something?
                </Text>
            </View>

            <BodyDiagram onZoneSelect={handleZoneSelect} />
        </Container>
    );
}
