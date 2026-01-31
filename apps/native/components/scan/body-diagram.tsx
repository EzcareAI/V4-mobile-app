import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

interface BodyDiagramProps {
    onZoneSelect: (zone: string) => void;
}

type BodyZone = "head" | "chest" | "stomach" | "back" | "arms" | "legs";

export function BodyDiagram({ onZoneSelect }: BodyDiagramProps) {
    const [view, setView] = useState<"front" | "back">("front");
    const [selectedZone, setSelectedZone] = useState<BodyZone | null>(null);

    const handleZonePress = (zone: BodyZone) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedZone(zone);
        onZoneSelect(zone);
    };

    return (
        <View className="items-center">
            {/* Front/Back Toggle */}
            <View className="mb-6 flex-row gap-2">
                <Pressable
                    onPress={() => setView("front")}
                    className={`rounded-full px-6 py-2 ${view === "front" ? "bg-primary" : "bg-secondary"}`}
                >
                    <View className="text-sm font-medium">Front</View>
                </Pressable>
                <Pressable
                    onPress={() => setView("back")}
                    className={`rounded-full px-6 py-2 ${view === "back" ? "bg-primary" : "bg-secondary"}`}
                >
                    <View className="text-sm font-medium">Back</View>
                </Pressable>
            </View>

            {/* Body SVG */}
            <Svg width="200" height="400" viewBox="0 0 200 400">
                {view === "front" ? (
                    <>
                        {/* Head */}
                        <Pressable onPress={() => handleZonePress("head")}>
                            <Circle
                                cx="100"
                                cy="40"
                                r="30"
                                fill={selectedZone === "head" ? "#3b82f6" : "#e5e7eb"}
                                opacity={0.8}
                            />
                        </Pressable>

                        {/* Chest */}
                        <Pressable onPress={() => handleZonePress("chest")}>
                            <Rect
                                x="60"
                                y="75"
                                width="80"
                                height="60"
                                rx="10"
                                fill={selectedZone === "chest" ? "#3b82f6" : "#e5e7eb"}
                                opacity={0.8}
                            />
                        </Pressable>

                        {/* Stomach */}
                        <Pressable onPress={() => handleZonePress("stomach")}>
                            <Ellipse
                                cx="100"
                                cy="165"
                                rx="40"
                                ry="35"
                                fill={selectedZone === "stomach" ? "#3b82f6" : "#e5e7eb"}
                                opacity={0.8}
                            />
                        </Pressable>

                        {/* Arms */}
                        <Pressable onPress={() => handleZonePress("arms")}>
                            <>
                                <Rect
                                    x="30"
                                    y="80"
                                    width="20"
                                    height="100"
                                    rx="10"
                                    fill={selectedZone === "arms" ? "#3b82f6" : "#e5e7eb"}
                                    opacity={0.8}
                                />
                                <Rect
                                    x="150"
                                    y="80"
                                    width="20"
                                    height="100"
                                    rx="10"
                                    fill={selectedZone === "arms" ? "#3b82f6" : "#e5e7eb"}
                                    opacity={0.8}
                                />
                            </>
                        </Pressable>

                        {/* Legs */}
                        <Pressable onPress={() => handleZonePress("legs")}>
                            <>
                                <Rect
                                    x="70"
                                    y="210"
                                    width="25"
                                    height="150"
                                    rx="12"
                                    fill={selectedZone === "legs" ? "#3b82f6" : "#e5e7eb"}
                                    opacity={0.8}
                                />
                                <Rect
                                    x="105"
                                    y="210"
                                    width="25"
                                    height="150"
                                    rx="12"
                                    fill={selectedZone === "legs" ? "#3b82f6" : "#e5e7eb"}
                                    opacity={0.8}
                                />
                            </>
                        </Pressable>
                    </>
                ) : (
                    <>
                        {/* Back view - simplified */}
                        <Pressable onPress={() => handleZonePress("back")}>
                            <Rect
                                x="60"
                                y="75"
                                width="80"
                                height="120"
                                rx="10"
                                fill={selectedZone === "back" ? "#3b82f6" : "#e5e7eb"}
                                opacity={0.8}
                            />
                        </Pressable>
                    </>
                )}
            </Svg>
        </View>
    );
}
