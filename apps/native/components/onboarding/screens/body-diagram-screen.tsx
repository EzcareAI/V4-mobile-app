import { useRouter } from "expo-router";
import { useState } from "react";
import {
	Dimensions,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { type BodyZone, useOnboardingStore } from "@/stores/onboarding-store";

const BODY_ZONES = [
	{ id: "head", label: "Head", color: "#10B981", y: 60 },
	{ id: "chest", label: "Chest", color: "#10B981", y: 120 },
	{ id: "stomach", label: "Stomach", color: "#10B981", y: 180 },
	{ id: "energy", label: "Energy", color: "#10B981", y: 240 },
	{ id: "joints", label: "Joints", color: "#10B981", y: 300 },
	{ id: "inflammation", label: "Immune", color: "#10B981", y: 360 },
];

export default function BodyDiagramScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();
	const [selectedZone, setSelectedZone] = useState<string | null>(null);
	const { width } = Dimensions.get("window");

	const handleZoneSelect = (zoneId: BodyZone) => {
		setSelectedZone(zoneId);
		setAnswer("bodyZoneSelected", zoneId);
		setAnswer("intentType", "zone");
		setTimeout(() => {
			nextStep();
			router.push("/(onboarding)/14");
		}, 300);
	};

	const handleOverallHealth = () => {
		setSelectedZone(null);
		setAnswer("bodyZoneSelected", null);
		setAnswer("intentType", "overall");
		setTimeout(() => {
			nextStep();
			router.push("/(onboarding)/14");
		}, 300);
	};

	return (
		<ScrollView className="flex-1 bg-white px-6 pt-8">
			{/* Header */}
			<View className="mb-8">
				<Text className="mb-2 text-center font-bold text-2xl text-gray-900">
					What do you want to work on today?
				</Text>
				<Text className="text-center text-gray-600 text-sm">
					Tap a body area or choose overall wellness
				</Text>
			</View>

			{/* Body Diagram SVG */}
			<View className="mb-8 items-center rounded-2xl bg-gradient-to-b from-teal-50 to-green-50 py-8">
				<Svg height={420} viewBox="0 0 200 420" width={width - 48}>
					{/* Simple body silhouette */}
					<G>
						{/* Head */}
						<Circle
							cx="100"
							cy="60"
							fill={selectedZone === "head" ? "#10B981" : "#E0F2FE"}
							opacity={selectedZone === "head" ? 1 : 0.6}
							r="35"
							stroke={selectedZone === "head" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
						/>

						{/* Neck connection */}
						<Path
							d="M 90 90 L 90 110 L 110 110 L 110 90"
							fill={selectedZone === "chest" ? "#10B981" : "#E0F2FE"}
							opacity={selectedZone === "chest" ? 1 : 0.6}
							stroke={selectedZone === "chest" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
						/>

						{/* Chest */}
						<Rect
							fill={selectedZone === "chest" ? "#10B981" : "#E0F2FE"}
							height="50"
							opacity={selectedZone === "chest" ? 1 : 0.6}
							rx="10"
							stroke={selectedZone === "chest" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							width="50"
							x="75"
							y="110"
						/>

						{/* Stomach */}
						<Rect
							fill={selectedZone === "stomach" ? "#10B981" : "#E0F2FE"}
							height="50"
							opacity={selectedZone === "stomach" ? 1 : 0.6}
							rx="10"
							stroke={selectedZone === "stomach" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							width="50"
							x="75"
							y="165"
						/>

						{/* Legs (Energy/Overall) */}
						<Rect
							fill={selectedZone === "energy" ? "#10B981" : "#E0F2FE"}
							height="60"
							opacity={selectedZone === "energy" ? 1 : 0.6}
							rx="5"
							stroke={selectedZone === "energy" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							width="15"
							x="80"
							y="220"
						/>
						<Rect
							fill={selectedZone === "energy" ? "#10B981" : "#E0F2FE"}
							height="60"
							opacity={selectedZone === "energy" ? 1 : 0.6}
							rx="5"
							stroke={selectedZone === "energy" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							width="15"
							x="105"
							y="220"
						/>

						{/* Arms (Joints/Inflammation) */}
						<Rect
							fill={selectedZone === "joints" ? "#10B981" : "#E0F2FE"}
							height="50"
							opacity={selectedZone === "joints" ? 1 : 0.6}
							rx="5"
							stroke={selectedZone === "joints" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							width="15"
							x="45"
							y="125"
						/>
						<Rect
							fill={selectedZone === "joints" ? "#10B981" : "#E0F2FE"}
							height="50"
							opacity={selectedZone === "joints" ? 1 : 0.6}
							rx="5"
							stroke={selectedZone === "joints" ? "#059669" : "#0EA5E9"}
							strokeWidth="2"
							width="15"
							x="140"
							y="125"
						/>
					</G>
				</Svg>
			</View>

			{/* Zone Selection Buttons */}
			<View className="mb-8 gap-3">
				<TouchableOpacity
					className={`rounded-xl border-2 p-4 ${
						selectedZone === "head"
							? "border-teal-500 bg-teal-50"
							: "border-gray-200 bg-gray-50"
					}`}
					onPress={() => handleZoneSelect("head")}
				>
					<Text className="font-semibold text-gray-900">🧠 Head & Mental</Text>
					<Text className="text-gray-600 text-xs">
						Headaches, clarity, focus
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					className={`rounded-xl border-2 p-4 ${
						selectedZone === "chest"
							? "border-teal-500 bg-teal-50"
							: "border-gray-200 bg-gray-50"
					}`}
					onPress={() => handleZoneSelect("chest")}
				>
					<Text className="font-semibold text-gray-900">❤️ Chest & Heart</Text>
					<Text className="text-gray-600 text-xs">Breathing, heart health</Text>
				</TouchableOpacity>

				<TouchableOpacity
					className={`rounded-xl border-2 p-4 ${
						selectedZone === "stomach"
							? "border-teal-500 bg-teal-50"
							: "border-gray-200 bg-gray-50"
					}`}
					onPress={() => handleZoneSelect("stomach")}
				>
					<Text className="font-semibold text-gray-900">🔄 Digestion</Text>
					<Text className="text-gray-600 text-xs">Stomach, gut, energy</Text>
				</TouchableOpacity>

				<TouchableOpacity
					className={`rounded-xl border-2 p-4 ${
						selectedZone === "joints"
							? "border-teal-500 bg-teal-50"
							: "border-gray-200 bg-gray-50"
					}`}
					onPress={() => handleZoneSelect("joints")}
				>
					<Text className="font-semibold text-gray-900">💪 Joints & Pain</Text>
					<Text className="text-gray-600 text-xs">Mobility, comfort</Text>
				</TouchableOpacity>

				<TouchableOpacity
					className={`rounded-xl border-2 p-4 ${
						selectedZone === "inflammation"
							? "border-teal-500 bg-teal-50"
							: "border-gray-200 bg-gray-50"
					}`}
					onPress={() => handleZoneSelect("inflammation")}
				>
					<Text className="font-semibold text-gray-900">🛡️ Immune System</Text>
					<Text className="text-gray-600 text-xs">Inflammation, immunity</Text>
				</TouchableOpacity>
			</View>

			{/* Overall Health Button */}
			<TouchableOpacity
				className="mb-12 rounded-xl bg-gradient-to-r from-teal-400 to-green-400 px-6 py-4 shadow-lg"
				onPress={handleOverallHealth}
			>
				<Text className="text-center font-bold text-lg text-white">
					Overall Wellness
				</Text>
				<Text className="text-center text-white text-xs opacity-90">
					I want to improve my general health
				</Text>
			</TouchableOpacity>

			{/* Info Footer */}
			<View className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
				<Text className="text-center text-blue-900 text-xs">
					💡 Your answers help EZBuddy personalize your health plan
				</Text>
			</View>
		</ScrollView>
	);
}
