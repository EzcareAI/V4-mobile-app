import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { useOnboardingStore } from "@/stores/onboarding-store";

const ZONE_NAMES = {
	head: "Mental Clarity",
	chest: "Respiratory",
	stomach: "Digestion",
	joints: "Joint Health",
	inflammation: "Immune System",
	energy: "Energy Levels",
};

const getScoreColor = (score: number) => {
	if (score >= 70)
		return {
			bg: "bg-green-50",
			border: "border-green-300",
			text: "text-green-700",
		};
	if (score >= 50)
		return {
			bg: "bg-amber-50",
			border: "border-amber-300",
			text: "text-amber-700",
		};
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
				<Text className="mb-2 text-center font-bold text-2xl text-gray-900">
					Your Health Core is Ready ✨
				</Text>
				<Text className="mb-6 text-center text-gray-600 text-sm">
					Here's what we discovered about your wellness
				</Text>

				{/* Health Score Display */}
				<View
					className={`${scoreInfo.bg} border-2 ${scoreInfo.border} mb-6 items-center rounded-2xl p-8`}
				>
					<Svg height={140} viewBox="0 0 140 140" width={140}>
						<Circle
							cx="70"
							cy="70"
							fill="none"
							r="65"
							stroke="#E0E7FF"
							strokeWidth="2"
						/>
						<Circle
							cx="70"
							cy="70"
							fill="none"
							r="60"
							stroke={getZoneColor(score)}
							strokeDasharray={`${(score / 100) * 377} 377`}
							strokeWidth="8"
						/>
						<SvgText
							fill={getZoneColor(score)}
							fontSize="48"
							fontWeight="bold"
							textAnchor="middle"
							x="70"
							y="75"
						>
							{score}
						</SvgText>
						<SvgText
							fill="#6B7280"
							fontSize="12"
							textAnchor="middle"
							x="70"
							y="100"
						>
							/ 100
						</SvgText>
					</Svg>

					<Text className={`mt-4 font-semibold text-lg ${scoreInfo.text}`}>
						{score >= 70
							? "Excellent"
							: score >= 50
								? "Good"
								: "Needs Attention"}
					</Text>
				</View>
			</View>

			{/* Content */}
			<View className="px-6 pt-6">
				{/* Zone Status (if zone selected) */}
				{intentType === "zone" && bodyZoneSelected && (
					<View className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
						<Text className="mb-2 font-semibold text-blue-900 text-sm">
							📍 Area of Focus
						</Text>
						<Text className="font-bold text-blue-900 text-lg">
							{ZONE_NAMES[bodyZoneSelected as keyof typeof ZONE_NAMES] ||
								bodyZoneSelected}
						</Text>
						<Text className="mt-2 text-blue-700 text-xs">
							We're creating a personalized plan for this area
						</Text>
					</View>
				)}

				{/* Probable Causes */}
				<View className="mb-6">
					<Text className="mb-3 font-bold text-gray-900 text-lg">
						Probable Causes
					</Text>
					{probableCauses.map((cause, idx) => (
						<View className="mb-2 flex-row items-center" key={idx}>
							<Text className="mr-3 text-base">{cause.split(" ")[0]}</Text>
							<Text className="text-gray-700 text-sm">
								{cause.split(" ").slice(1).join(" ")}
							</Text>
						</View>
					))}
				</View>

				{/* Blurred Preview Section */}
				<View className="mb-8">
					<Text className="mb-3 font-bold text-gray-900 text-lg">
						Your Plan Preview
					</Text>

					{/* Blurred 7-Day Plan */}
					<View
						className="mb-4 rounded-xl bg-gradient-to-b from-gray-100 to-gray-50 p-6 opacity-40 blur-sm"
						style={{ pointerEvents: "none" }}
					>
						<Text className="mb-3 font-semibold text-gray-600 text-sm">
							📅 7-Day Action Plan
						</Text>
						<View className="space-y-2">
							<Text className="text-gray-500 text-xs">
								Day 1-2: Assessment & Baseline
							</Text>
							<Text className="text-gray-500 text-xs">Day 3-4: Quick Wins</Text>
							<Text className="text-gray-500 text-xs">
								Day 5-7: Building Momentum
							</Text>
						</View>
					</View>

					{/* Blurred Next Actions */}
					<View
						className="rounded-xl bg-gradient-to-b from-gray-100 to-gray-50 p-6 opacity-40 blur-sm"
						style={{ pointerEvents: "none" }}
					>
						<Text className="mb-3 font-semibold text-gray-600 text-sm">
							🎯 Next Actions
						</Text>
						<View className="space-y-2">
							<Text className="text-gray-500 text-xs">
								• Personalized recommendations
							</Text>
							<Text className="text-gray-500 text-xs">• Daily check-ins</Text>
							<Text className="text-gray-500 text-xs">• Progress tracking</Text>
						</View>
					</View>

					{/* Unlock CTA Overlay */}
					<View className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<View className="rounded-lg bg-white px-4 py-2">
							<Text className="font-bold text-gray-600 text-xs">
								🔒 Unlock to view
							</Text>
						</View>
					</View>
				</View>

				{/* Why This Score */}
				<View className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4">
					<Text className="mb-2 font-semibold text-green-900 text-xs">
						✨ How We Calculate
					</Text>
					<Text className="text-green-800 text-xs leading-5">
						Your score is based on sleep quality, stress level, activity,
						lifestyle habits, and health concerns. Higher scores indicate better
						overall wellness potential.
					</Text>
				</View>

				{/* Unlock Button */}
				<TouchableOpacity
					className="mb-12 rounded-xl bg-gradient-to-r from-teal-500 to-green-500 px-6 py-4 shadow-lg active:opacity-90"
					onPress={nextStep}
				>
					<Text className="text-center font-bold text-lg text-white">
						Unlock Full Results
					</Text>
					<Text className="mt-1 text-center text-white text-xs opacity-90">
						€39.99/year or €11.99/month
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}
