import { Button } from "heroui-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface SymptomSelectorProps {
    zone: string;
    onSelect: (symptom: string) => void;
}

// POC hardcoded symptom data
const SYMPTOMS_BY_ZONE: Record<string, string[]> = {
    head: [
        "Headache",
        "Dizziness",
        "Brain fog",
        "Migraine",
        "Tension",
    ],
    chest: [
        "Chest pain",
        "Shortness of breath",
        "Heart palpitations",
        "Tightness",
        "Pressure",
    ],
    stomach: [
        "Bloating",
        "Nausea",
        "Cramping",
        "Indigestion",
        "Acid reflux",
    ],
    back: [
        "Lower back pain",
        "Upper back pain",
        "Stiffness",
        "Muscle tension",
        "Sharp pain",
    ],
    arms: [
        "Numbness",
        "Tingling",
        "Weakness",
        "Joint pain",
        "Muscle soreness",
    ],
    legs: [
        "Leg pain",
        "Swelling",
        "Cramping",
        "Restlessness",
        "Weakness",
    ],
};

export function SymptomSelector({ zone, onSelect }: SymptomSelectorProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const symptoms = SYMPTOMS_BY_ZONE[zone] || [];

    const handleSelect = (symptom: string) => {
        setSelected(symptom);
    };

    const handleContinue = () => {
        if (selected) {
            onSelect(selected);
        }
    };

    return (
        <View className="flex-1">
            <ScrollView className="flex-1 p-6">
                <Text className="mb-2 text-sm uppercase text-muted">
                    {zone.toUpperCase()}
                </Text>
                <Text className="mb-6 text-2xl font-bold">
                    What are you experiencing?
                </Text>

                <View className="gap-3">
                    {symptoms.map((symptom) => (
                        <Pressable
                            key={symptom}
                            onPress={() => handleSelect(symptom)}
                            className={`rounded-xl border-2 p-4 ${selected === symptom
                                ? "border-primary bg-primary/10"
                                : "border-border bg-card"
                                }`}
                        >
                            <Text
                                className={`text-base ${selected === symptom ? "font-semibold" : "font-normal"
                                    }`}
                            >
                                {symptom}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            <View className="border-t border-border p-6">
                <Button
                    onPress={handleContinue}
                    isDisabled={!selected}
                    size="lg"
                    className="w-full"
                >
                    Continue
                </Button>
            </View>
        </View>
    );
}
