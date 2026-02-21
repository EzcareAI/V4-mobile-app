import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type React from "react";
import { useState } from "react";
import {
	Dimensions,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { type BodyZone, useOnboardingStore } from "@/stores/onboarding-store";
import { StepHeader } from "../common/step-header";

const BodyPart = ({
	id,
	selectedZone,
	color = "rgba(14, 165, 233, 0.15)",
	stroke = "rgba(14, 165, 233, 0.4)",
	children,
}: {
	id: string;
	selectedZone: string | null;
	color?: string;
	stroke?: string;
	children: React.ReactNode;
}) => {
	const isSelected = selectedZone === id;
	const activeColor = isSelected ? "rgba(45, 212, 191, 0.4)" : color;
	const activeStroke = isSelected ? "#2DD4BF" : stroke;
	const opacity = isSelected ? 1 : 0.8;

	return (
		<G opacity={opacity}>
			<G
				fill={activeColor}
				stroke={activeStroke}
				strokeWidth={isSelected ? "3" : "1.5"}
			>
				{children}
			</G>
			{isSelected && (
				<G opacity={0.3}>
					<Circle
						cx={id === "head" ? "100" : "100"}
						cy={id === "head" ? "60" : "200"}
						fill="#2DD4BF"
						r="40"
					/>
				</G>
			)}
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
		<View className="mb-10 items-center overflow-hidden rounded-[40px] border border-blue-100/30 bg-slate-900/5 py-10 shadow-2xl">
			<Svg height={420} viewBox="0 0 200 420" width={width - 48}>
				{/* Background Grid for Blueprint feel */}
				<G opacity={0.1}>
					{[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200].map((x) => (
						<Path d={`M ${x} 0 L ${x} 420`} key={`v-${x}`} stroke="#0EA5E9" />
					))}
					{[
						0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280,
						300, 320, 340, 360, 380, 400, 420,
					].map((y) => (
						<Path d={`M 0 ${y} L 200 ${y}`} key={`h-${y}`} stroke="#0EA5E9" />
					))}
				</G>

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

interface ZoneCardProps {
	id: BodyZone;
	label: string;
	description: string;
	icon: string;
	isSelected: boolean;
	onPress: (id: BodyZone) => void;
}

const ZoneCard = ({
	id,
	label,
	description,
	icon,
	isSelected,
	onPress,
}: ZoneCardProps) => {
	const handlePress = async () => {
		try {
			await impactAsync(ImpactFeedbackStyle.Light);
		} catch {
			/* ignore */
		}
		onPress(id);
	};

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			className={`relative mb-4 flex-row items-center rounded-3xl border-2 p-5 transition-all ${
				isSelected
					? "border-[#3BAFDA] bg-white shadow-blue-100 shadow-xl"
					: "border-slate-100 bg-white"
			}`}
			onPress={handlePress}
		>
			<View
				className={`mr-4 h-14 w-14 items-center justify-center rounded-2xl ${isSelected ? "bg-[#3BAFDA]" : "bg-slate-50"}`}
			>
				<Text className="text-2xl">{icon}</Text>
			</View>
			<View className="flex-1">
				<Text
					className={`font-bold text-lg ${isSelected ? "text-[#0d2137]" : "text-slate-700"}`}
				>
					{label}
				</Text>
				<Text className="text-slate-500 text-sm">{description}</Text>
			</View>
			{isSelected && (
				<View className="h-6 w-6 items-center justify-center rounded-full bg-[#3BAFDA]">
					<View className="h-2 w-2 rounded-full bg-white" />
				</View>
			)}
		</TouchableOpacity>
	);
};

export default function BodyDiagramScreen() {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();
	const [selectedZone, setSelectedZone] = useState<BodyZone | null>(null);
	const { width } = Dimensions.get("window");

	const handleZoneSelect = (zoneId: BodyZone) => {
		setSelectedZone(zoneId);
		setAnswer("bodyZoneSelected", zoneId);
		setAnswer("intentType", "zone");
		setTimeout(() => {
			nextStep();
			router.push("/(onboarding)/14");
		}, 600);
	};

	const handleOverallHealth = async () => {
		try {
			await impactAsync(ImpactFeedbackStyle.Medium);
		} catch {
			/* ignore */
		}
		setSelectedZone(null);
		setAnswer("bodyZoneSelected", null);
		setAnswer("intentType", "overall");
		setTimeout(() => {
			nextStep();
			router.push("/(onboarding)/14");
		}, 300);
	};

	return (
		<ScrollView
			className="flex-1 bg-background"
			contentContainerClassName="px-6 pt-10 pb-20"
			showsVerticalScrollIndicator={false}
		>
			<StepHeader
				align="center"
				description="Tap a body area to focus on specific issues, or choose overall wellness."
				title="Focus Areas"
			/>

			<BodyDiagram selectedZone={selectedZone} width={width} />

			<View className="mt-2">
				<ZoneCard
					description="Focus on your brain health, stress, and mood."
					icon="🧠"
					id="head"
					isSelected={selectedZone === "head"}
					label="Head & Mental"
					onPress={handleZoneSelect}
				/>
				<ZoneCard
					description="Heart health, breathing, and circulation."
					icon="❤️"
					id="chest"
					isSelected={selectedZone === "chest"}
					label="Chest & Heart"
					onPress={handleZoneSelect}
				/>
				<ZoneCard
					description="Gut health, digestion, and metabolic wellness."
					icon="🔄"
					id="stomach"
					isSelected={selectedZone === "stomach"}
					label="Digestion & Gut"
					onPress={handleZoneSelect}
				/>
				<ZoneCard
					description="Mobility, recovery, and physical strength."
					icon="💪"
					id="joints"
					isSelected={selectedZone === "joints"}
					label="Joints & Mobility"
					onPress={handleZoneSelect}
				/>
				<ZoneCard
					description="Immunity, energy levels, and inflammation."
					icon="🛡️"
					id="inflammation"
					isSelected={selectedZone === "inflammation"}
					label="Immune & Vitality"
					onPress={handleZoneSelect}
				/>
			</View>

			<TouchableOpacity
				activeOpacity={0.9}
				className="mt-6 overflow-hidden rounded-[28px] shadow-blue-200 shadow-lg"
				onPress={handleOverallHealth}
			>
				<LinearGradient
					colors={["#3BAFDA", "#3EC9B5"]}
					end={{ x: 1, y: 0 }}
					start={{ x: 0, y: 0 }}
					style={StyleSheet.absoluteFill}
				/>
				<View className="px-8 py-5">
					<Text className="text-center font-bold text-white text-xl">
						Overall Wellness
					</Text>
					<Text className="mt-1 text-center text-sm text-white/80">
						I want to improve my general longevity & health
					</Text>
				</View>
			</TouchableOpacity>
		</ScrollView>
	);
}
