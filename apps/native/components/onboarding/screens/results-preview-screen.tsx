import { View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useState, useEffect } from "react";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";

const ZONE_NAMES = {
	head: "Mental Clarity",
	chest: "Respiratory",
	stomach: "Digestion",
	joints: "Joint Health",
	inflammation: "Immune System",
	energy: "Energy Levels",
};

const getScoreColor = (score: number) => {
	if (score >= 70) return { bg: "bg-green-50", border: "border-green-300", text: "text-green-700" };
	if (score >= 50) return { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700" };
	return { bg: "bg-red-50", border: "border-red-300", text: "text-red-700" };
};

const getZoneColor = (score: number) => {
	if (score >= 70) return "#10B981"; // Green
	if (score >= 50) return "#F59E0B"; // Amber
	return "#EF4444"; // Red
};

export default function ResultsPreviewScreen() {
	const {
		currentStep,
		setAnswer,
		nextStep,
		computeHealthScore,
		bodyZoneSelected,
		intentType,
	} = useOnboardingStore();

	const [score, setScore] = useState(0);
	const [showDetails, setShowDetails] = useState(false);

	useEffect(() => {
		const computed = computeHealthScore();
		setScore(computed);
		setAnswer("healthScore", computed);
		setAnswer("resultsShown", new Date().toISOString());
	}, []);

	const scoreInfo = getScoreColor(score);

	const probableCauses =
		score < 50
			? [
					"🔴 High stress levels",
					"⚠️ Poor sleep quality",
					"❌ Limited physical activity",
				]
			: score < 70
				? [
						"🟡 Moderate stress",
						"🟡 Variable sleep patterns",
						"🟡 Inconsistent habits",
					]
				: [
						"✅ Good lifestyle balance",
						"✅ Consistent routines",
						"✅ Active mindset",
					];

	return (
		<ScrollView className="flex-1 bg-white">
			{/* Header */}
			<View className="bg-gradient-to-b from-teal-50 to-blue-50 px-6 pt-8 pb-8">
				<Text className="text-2xl font-bold text-gray-900 text-center mb-2">
					Your Health Core is Ready ✨
				</Text>
				<Text className="text-gray-600 text-center text-sm mb-6">
					Here's what we discovered about your wellness
				</Text>

				{/* Health Score Display */}
				<View
					className={`${scoreInfo.bg} border-2 ${scoreInfo.border} rounded-2xl p-8 items-center mb-6`}
				>
					<Svg width={140} height={140} viewBox="0 0 140 140">
						<Circle cx="70" cy="70" r="65" fill="none" stroke="#E0E7FF" strokeWidth="2" />
						<Circle
							cx="70"
							cy="70"
							r="60"
							fill="none"
							stroke={getZoneColor(score)}
							strokeWidth="8"
							strokeDasharray={`${(score / 100) * 377} 377`}
						/>
						<SvgText
							x="70"
							y="75"
							textAnchor="middle"
							fontSize="48"
							fontWeight="bold"
							fill={getZoneColor(score)}
						>
							{score}
						</SvgText>
						<SvgText x="70" y="100" textAnchor="middle" fontSize="12" fill="#6B7280">
							/ 100
						</SvgText>
					</Svg>

					<Text className={`text-lg font-semibold mt-4 ${scoreInfo.text}`}>
						{score >= 70 ? "Excellent" : score >= 50 ? "Good" : "Needs Attention"}
					</Text>
				</View>
			</View>

			{/* Content */}
			<View className="px-6 pt-6">
				{/* Zone Status (if zone selected) */}
				{intentType === "zone" && bodyZoneSelected && (
					<View className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
						<Text className="text-sm font-semibold text-blue-900 mb-2">
							📍 Area of Focus
						</Text>
						<Text className="text-lg font-bold text-blue-900">
							{ZONE_NAMES[bodyZoneSelected as keyof typeof ZONE_NAMES] ||
								bodyZoneSelected}
						</Text>
						<Text className="text-xs text-blue-700 mt-2">
							We're creating a personalized plan for this area
						</Text>
					</View>
				)}

				{/* Probable Causes */}
				<View className="mb-6">
					<Text className="text-lg font-bold text-gray-900 mb-3">Probable Causes</Text>
					{probableCauses.map((cause, idx) => (
						<View key={idx} className="flex-row items-center mb-2">
							<Text className="text-base mr-3">{cause.split(" ")[0]}</Text>
							<Text className="text-gray-700 text-sm">{cause.split(" ").slice(1).join(" ")}</Text>
						</View>
					))}
				</View>

				{/* Blurred Preview Section */}
				<View className="mb-8">
					<Text className="text-lg font-bold text-gray-900 mb-3">Your Plan Preview</Text>

					{/* Blurred 7-Day Plan */}
					<View
						className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-xl p-6 mb-4 opacity-40 blur-sm"
						style={{ pointerEvents: "none" }}
					>
						<Text className="text-sm font-semibold text-gray-600 mb-3">
							📅 7-Day Action Plan
						</Text>
						<View className="space-y-2">
							<Text className="text-xs text-gray-500">Day 1-2: Assessment & Baseline</Text>
							<Text className="text-xs text-gray-500">Day 3-4: Quick Wins</Text>
							<Text className="text-xs text-gray-500">Day 5-7: Building Momentum</Text>
						</View>
					</View>

					{/* Blurred Next Actions */}
					<View
						className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-xl p-6 opacity-40 blur-sm"
						style={{ pointerEvents: "none" }}
					>
						<Text className="text-sm font-semibold text-gray-600 mb-3">
							🎯 Next Actions
						</Text>
						<View className="space-y-2">
							<Text className="text-xs text-gray-500">• Personalized recommendations</Text>
							<Text className="text-xs text-gray-500">• Daily check-ins</Text>
							<Text className="text-xs text-gray-500">• Progress tracking</Text>
						</View>
					</View>

					{/* Unlock CTA Overlay */}
					<View className="absolute inset-0 flex items-center justify-center pointer-events-none">
						<View className="bg-white rounded-lg px-4 py-2">
							<Text className="text-xs font-bold text-gray-600">🔒 Unlock to view</Text>
						</View>
					</View>
				</View>

				{/* Why This Score */}
				<View className="bg-green-50 rounded-lg p-4 mb-8 border border-green-200">
					<Text className="text-xs font-semibold text-green-900 mb-2">✨ How We Calculate</Text>
					<Text className="text-xs text-green-800 leading-5">
						Your score is based on sleep quality, stress level, activity, lifestyle habits, and
						health concerns. Higher scores indicate better overall wellness potential.
					</Text>
				</View>

				{/* Unlock Button */}
				<TouchableOpacity
					onPress={nextStep}
					className="bg-gradient-to-r from-teal-500 to-green-500 rounded-xl py-4 px-6 mb-12 shadow-lg active:opacity-90"
				>
					<Text className="text-white font-bold text-center text-lg">
						Unlock Full Results
					</Text>
					<Text className="text-white text-center text-xs opacity-90 mt-1">
						€39.99/year or €11.99/month
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}
