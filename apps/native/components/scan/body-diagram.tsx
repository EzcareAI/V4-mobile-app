import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Svg, { Circle, Ellipse, G, Rect } from "react-native-svg";

interface BodyDiagramProps {
	onZoneSelect: (zone: string) => void;
}

type BodyZone = "head" | "chest" | "stomach" | "back" | "arms" | "legs";

export function BodyDiagram({ onZoneSelect }: BodyDiagramProps) {
	const [view, setView] = useState<"front" | "back">("front");
	const [selectedZone, setSelectedZone] = useState<BodyZone | null>(null);

	const handleZonePress = (zone: BodyZone) => {
		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Medium).catch(() => {
				/* ignore */
			});
		}
		setSelectedZone(zone);
		onZoneSelect(zone);
	};

	const getZoneColor = (zone: BodyZone) =>
		selectedZone === zone ? "#3b82f6" : "#e5e7eb";

	return (
		<View className="items-center">
			{/* Front/Back Toggle */}
			<View className="mb-6 flex-row gap-2">
				<Pressable
					className={`rounded-full px-6 py-2 ${view === "front" ? "bg-primary" : "bg-secondary"}`}
					onPress={() => setView("front")}
				>
					<Text
						className={`font-medium text-sm ${view === "front" ? "text-white" : "text-foreground"}`}
					>
						Front
					</Text>
				</Pressable>
				<Pressable
					className={`rounded-full px-6 py-2 ${view === "back" ? "bg-primary" : "bg-secondary"}`}
					onPress={() => setView("back")}
				>
					<Text
						className={`font-medium text-sm ${view === "back" ? "text-white" : "text-foreground"}`}
					>
						Back
					</Text>
				</Pressable>
			</View>

			{/* Body SVG */}
			<Svg height={400} viewBox="0 0 200 400" width={200}>
				{view === "front" ? (
					<>
						{/* Head */}
						<G onPress={() => handleZonePress("head")}>
							<Circle
								cx={100}
								cy={40}
								fill={getZoneColor("head")}
								opacity={0.8}
								r={30}
							/>
						</G>

						{/* Chest */}
						<G onPress={() => handleZonePress("chest")}>
							<Rect
								fill={getZoneColor("chest")}
								height={60}
								opacity={0.8}
								rx={10}
								width={80}
								x={60}
								y={75}
							/>
						</G>

						{/* Stomach */}
						<G onPress={() => handleZonePress("stomach")}>
							<Ellipse
								cx={100}
								cy={165}
								fill={getZoneColor("stomach")}
								opacity={0.8}
								rx={40}
								ry={35}
							/>
						</G>

						{/* Arms */}
						<G onPress={() => handleZonePress("arms")}>
							<Rect
								fill={getZoneColor("arms")}
								height={100}
								opacity={0.8}
								rx={10}
								width={20}
								x={30}
								y={80}
							/>
							<Rect
								fill={getZoneColor("arms")}
								height={100}
								opacity={0.8}
								rx={10}
								width={20}
								x={150}
								y={80}
							/>
						</G>

						{/* Legs */}
						<G onPress={() => handleZonePress("legs")}>
							<Rect
								fill={getZoneColor("legs")}
								height={150}
								opacity={0.8}
								rx={12}
								width={25}
								x={70}
								y={210}
							/>
							<Rect
								fill={getZoneColor("legs")}
								height={150}
								opacity={0.8}
								rx={12}
								width={25}
								x={105}
								y={210}
							/>
						</G>
					</>
				) : (
					<>
						{/* Back view - simplified */}
						<G onPress={() => handleZonePress("back")}>
							<Rect
								fill={getZoneColor("back")}
								height={120}
								opacity={0.8}
								rx={10}
								width={80}
								x={60}
								y={75}
							/>
						</G>
					</>
				)}
			</Svg>
		</View>
	);
}
