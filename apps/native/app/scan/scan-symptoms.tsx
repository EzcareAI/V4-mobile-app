import { router, useLocalSearchParams } from "expo-router";

import { Container } from "@/components/container";
import { SymptomSelector } from "@/components/scan/symptom-selector";
import { useScanStore } from "@/stores/scan-store";

export default function ScanSymptoms() {
    const { zone } = useLocalSearchParams<{ zone: string }>();
    const setSymptom = useScanStore((state) => state.setSymptom);

    const handleSelect = (symptom: string) => {
        setSymptom(symptom);
        router.push("/scan/scan-questions");
    };

    return (
        <Container>
            <SymptomSelector zone={zone || ""} onSelect={handleSelect} />
        </Container>
    );
}
