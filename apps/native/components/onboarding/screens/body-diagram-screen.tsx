import { useRouter } from "expo-router";
import type React from "react";
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

const BodyPart = ({
	id,
	selectedZone,
	color = "#E0F2FE",
	stroke = "#0EA5E9",
	children,
}: {
	id: string;
	selectedZone: string | null;
	color?: string;
	stroke?: string;
	children: React.ReactNode;
}) => {
	const isSelected = selectedZone === id;
	const activeColor = isSelected ? "#10B981" : color;
	const activeStroke = isSelected ? "#059669" : stroke;
	const opacity = isSelected ? 1 : 0.6;

	return (
		<G opacity={opacity}>
			<G fill={activeColor} stroke={activeStroke} strokeWidth="2">
				{children}
			</G>
		</G>
	);
};

const BodyDiagram = ({
	selectedZone,
	width,
}: {
	selectedZone: string | null;
	width: number;
}) => {
	return (
		<View className="mb-8 items-center rounded-2xl bg-gradient-to-b from-teal-50 to-green-50 py-8">
			<Svg height={420} viewBox="0 0 200 420" width={width - 48}>
				<G>
					<BodyPart id="head" selectedZone={selectedZone}>
						<Circle cx="100" cy="60" r="35" />
					</BodyPart>

					<BodyPart id="chest" selectedZone={selectedZone}>
						<Path d="M 90 90 L 90 110 L 110 110 L 110 90" />
						<Rect height="50" rx="10" width="50" x="75" y="110" />
					</BodyPart>

					<BodyPart id="stomach" selectedZone={selectedZone}>
						<Rect height="50" rx="10" width="50" x="75" y="165" />
					</BodyPart>

					<BodyPart id="energy" selectedZone={selectedZone}>
						<Rect height="60" rx="5" width="15" x="80" y="220" />
						<Rect height="60" rx="5" width="15" x="105" y="220" />
					</BodyPart>

					<BodyPart id="joints" selectedZone={selectedZone}>
						<Rect height="50" rx="5" width="15" x="45" y="125" />
						<Rect height="50" rx="5" width="15" x="140" y="125" />
					</BodyPart>
				</G>
			</Svg>
		</View>
	);
};

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

			<BodyDiagram selectedZone={selectedZone} width={width} />

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
