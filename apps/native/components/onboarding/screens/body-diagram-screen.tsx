import { View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useOnboardingStore, type BodyZone } from "@/stores/onboarding-store";
import { useState } from "react";
import Svg, { Circle, Path, G, Rect } from "react-native-svg";

const BODY_ZONES = [
	{ id: "head", label: "Head", color: "#10B981", y: 60 },
	{ id: "chest", label: "Chest", color: "#10B981", y: 120 },
	{ id: "stomach", label: "Stomach", color: "#10B981", y: 180 },
	{ id: "energy", label: "Energy", color: "#10B981", y: 240 },
	{ id: "joints", label: "Joints", color: "#10B981", y: 300 },
	{ id: "inflammation", label: "Immune", color: "#10B981", y: 360 },
];

export default function BodyDiagramScreen() {
	const { setAnswer, nextStep } = useOnboardingStore();
	const [selectedZone, setSelectedZone] = useState<string | null>(null);
	const { width } = Dimensions.get("window");

	const handleZoneSelect = (zoneId: BodyZone) => {
		setSelectedZone(zoneId);
		setAnswer("bodyZoneSelected", zoneId);
		setAnswer("intentType", "zone");
		setTimeout(() => nextStep(), 300);
	};

	const handleOverallHealth = () => {
		setSelectedZone(null);
		setAnswer("bodyZoneSelected", null);
		setAnswer("intentType", "overall");
		setTimeout(() => nextStep(), 300);
	};

	return (
		<ScrollView className="flex-1 bg-white px-6 pt-8">
			{/* Header */}
			<View className="mb-8">
				<Text className="text-2xl font-bold text-gray-900 text-center mb-2">
					What do you want to work on today?
				</Text>
				<Text className="text-gray-600 text-center text-sm">
					Tap a body area or choose overall wellness
				</Text>
			</View>

			{/* Body Diagram SVG */}
			<View className="items-center mb-8 bg-gradient-to-b from-teal-50 to-green-50 rounded-2xl py-8">
				<Svg width={width - 48} height={420} viewBox="0 0 200 420">
					{/* Simple body silhouette */}
					<G>
						{/* Head */}
						<Circle
							cx="100"
							cy="60"
							r="35"
							fill={selectedZone === "head" ? "#10B981" : "#E0F2FE"}
							stroke={selectedZone === "head" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							opacity={selectedZone === "head" ? 1 : 0.6}
						/>

						{/* Neck connection */}
						<Path
							d="M 90 90 L 90 110 L 110 110 L 110 90"
							fill={selectedZone === "chest" ? "#10B981" : "#E0F2FE"}
							stroke={selectedZone === "chest" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							opacity={selectedZone === "chest" ? 1 : 0.6}
						/>

						{/* Chest */}
						<Rect
							x="75"
							y="110"
							width="50"
							height="50"
							rx="10"
							fill={selectedZone === "chest" ? "#10B981" : "#E0F2FE"}
							stroke={selectedZone === "chest" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							opacity={selectedZone === "chest" ? 1 : 0.6}
						/>

						{/* Stomach */}
						<Rect
							x="75"
							y="165"
							width="50"
							height="50"
							rx="10"
							fill={selectedZone === "stomach" ? "#10B981" : "#E0F2FE"}
							stroke={selectedZone === "stomach" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							opacity={selectedZone === "stomach" ? 1 : 0.6}
						/>

						{/* Legs (Energy/Overall) */}
						<Rect
							x="80"
							y="220"
							width="15"
							height="60"
							rx="5"
							fill={selectedZone === "energy" ? "#10B981" : "#E0F2FE"}
							stroke={selectedZone === "energy" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							opacity={selectedZone === "energy" ? 1 : 0.6}
						/>
						<Rect
							x="105"
							y="220"
							width="15"
							height="60"
							rx="5"
							fill={selectedZone === "energy" ? "#10B981" : "#E0F2FE"}
							stroke={selectedZone === "energy" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							opacity={selectedZone === "energy" ? 1 : 0.6}
						/>

						{/* Arms (Joints/Inflammation) */}
						<Rect
							x="45"
							y="125"
							width="15"
							height="50"
							rx="5"
							fill={selectedZone === "joints" ? "#10B981" : "#E0F2FE"}
							stroke={selectedZone === "joints" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							opacity={selectedZone === "joints" ? 1 : 0.6}
						/>
						<Rect
							x="140"
							y="125"
							width="15"
							height="50"
							rx="5"
							fill={selectedZone === "joints" ? "#10B981" : "#E0F2FE"}
							stroke={selectedZone === "joints" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							opacity={selectedZone === "joints" ? 1 : 0.6}
						/>
					</G>
				</Svg>
			</View>

			{/* Zone Selection Buttons */}
			<View className="gap-3 mb-8">
				<TouchableOpacity
					onPress={() => handleZoneSelect("head")}
					className={`p-4 rounded-xl border-2 ${
						selectedZone === "head"
							? "border-teal-500 bg-teal-50"
							: "border-gray-200 bg-gray-50"
					}`}
				>
					<Text className="font-semibold text-gray-900">🧠 Head & Mental</Text>
					<Text className="text-xs text-gray-600">Headaches, clarity, focus</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => handleZoneSelect("chest")}
					className={`p-4 rounded-xl border-2 ${
						selectedZone === "chest"
							? "border-teal-500 bg-teal-50"
							: "border-gray-200 bg-gray-50"
					}`}
				>
					<Text className="font-semibold text-gray-900">❤️ Chest & Heart</Text>
					<Text className="text-xs text-gray-600">Breathing, heart health</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => handleZoneSelect("stomach")}
					className={`p-4 rounded-xl border-2 ${
						selectedZone === "stomach"
							? "border-teal-500 bg-teal-50"
							: "border-gray-200 bg-gray-50"
					}`}
				>
					<Text className="font-semibold text-gray-900">🔄 Digestion</Text>
					<Text className="text-xs text-gray-600">Stomach, gut, energy</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => handleZoneSelect("joints")}
					className={`p-4 rounded-xl border-2 ${
						selectedZone === "joints"
							? "border-teal-500 bg-teal-50"
							: "border-gray-200 bg-gray-50"
					}`}
				>
					<Text className="font-semibold text-gray-900">💪 Joints & Pain</Text>
					<Text className="text-xs text-gray-600">Mobility, comfort</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => handleZoneSelect("inflammation")}
					className={`p-4 rounded-xl border-2 ${
						selectedZone === "inflammation"
							? "border-teal-500 bg-teal-50"
							: "border-gray-200 bg-gray-50"
					}`}
				>
					<Text className="font-semibold text-gray-900">🛡️ Immune System</Text>
					<Text className="text-xs text-gray-600">Inflammation, immunity</Text>
				</TouchableOpacity>
			</View>

			{/* Overall Health Button */}
			<TouchableOpacity
				onPress={handleOverallHealth}
				className="bg-gradient-to-r from-teal-400 to-green-400 rounded-xl py-4 px-6 mb-12 shadow-lg"
			>
				<Text className="text-white font-bold text-center text-lg">
					Overall Wellness
				</Text>
				<Text className="text-white text-center text-xs opacity-90">
					I want to improve my general health
				</Text>
			</TouchableOpacity>

			{/* Info Footer */}
			<View className="bg-blue-50 rounded-lg p-4 mb-8 border border-blue-200">
				<Text className="text-xs text-blue-900 text-center">
					💡 Your answers help EZBuddy personalize your health plan
				</Text>
			</View>
		</ScrollView>
	);
}
