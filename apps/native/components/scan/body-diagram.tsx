import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Ellipse, Rect } from "react-native-svg";

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
					className={`rounded-full px-6 py-2 ${view === "front" ? "bg-primary" : "bg-secondary"}`}
					onPress={() => setView("front")}
				>
					<Text className={`font-medium text-sm ${view === "front" ? "text-white" : "text-foreground"}`}>Front</Text>
				</Pressable>
				<Pressable
					className={`rounded-full px-6 py-2 ${view === "back" ? "bg-primary" : "bg-secondary"}`}
					onPress={() => setView("back")}
				>
					<Text className={`font-medium text-sm ${view === "back" ? "text-white" : "text-foreground"}`}>Back</Text>
				</Pressable>
			</View>

			{/* Body SVG */}
			<Svg height="400" viewBox="0 0 200 400" width="200">
				{view === "front" ? (
					<>
						{/* Head */}
						<Pressable onPress={() => handleZonePress("head")}>
							<Circle
								cx="100"
								cy="40"
								fill={selectedZone === "head" ? "#3b82f6" : "#e5e7eb"}
								opacity={0.8}
								r="30"
							/>
						</Pressable>

						{/* Chest */}
						<Pressable onPress={() => handleZonePress("chest")}>
							<Rect
								fill={selectedZone === "chest" ? "#3b82f6" : "#e5e7eb"}
								height="60"
								opacity={0.8}
								rx="10"
								width="80"
								x="60"
								y="75"
							/>
						</Pressable>

						{/* Stomach */}
						<Pressable onPress={() => handleZonePress("stomach")}>
							<Ellipse
								cx="100"
								cy="165"
								fill={selectedZone === "stomach" ? "#3b82f6" : "#e5e7eb"}
								opacity={0.8}
								rx="40"
								ry="35"
							/>
						</Pressable>

						{/* Arms */}
						<Pressable onPress={() => handleZonePress("arms")}>
							<>
								<Rect
									fill={selectedZone === "arms" ? "#3b82f6" : "#e5e7eb"}
									height="100"
									opacity={0.8}
									rx="10"
									width="20"
									x="30"
									y="80"
								/>
								<Rect
									fill={selectedZone === "arms" ? "#3b82f6" : "#e5e7eb"}
									height="100"
									opacity={0.8}
									rx="10"
									width="20"
									x="150"
									y="80"
								/>
							</>
						</Pressable>

						{/* Legs */}
						<Pressable onPress={() => handleZonePress("legs")}>
							<>
								<Rect
									fill={selectedZone === "legs" ? "#3b82f6" : "#e5e7eb"}
									height="150"
									opacity={0.8}
									rx="12"
									width="25"
									x="70"
									y="210"
								/>
								<Rect
									fill={selectedZone === "legs" ? "#3b82f6" : "#e5e7eb"}
									height="150"
									opacity={0.8}
									rx="12"
									width="25"
									x="105"
									y="210"
								/>
							</>
						</Pressable>
					</>
				) : (
					<>
						{/* Back view - simplified */}
						<Pressable onPress={() => handleZonePress("back")}>
							<Rect
								fill={selectedZone === "back" ? "#3b82f6" : "#e5e7eb"}
								height="120"
								opacity={0.8}
								rx="10"
								width="80"
								x="60"
								y="75"
							/>
						</Pressable>
					</>
				)}
			</Svg>
		</View>
	);
}
