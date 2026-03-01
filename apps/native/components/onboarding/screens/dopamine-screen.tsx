import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Activity, Sparkles, Zap } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";

interface DopamineScreenProps {
	type: "reinforcement" | "progress";
}

export function DopamineScreen({ type }: DopamineScreenProps) {
	const router = useRouter();
	const { nextStep, currentStep } = useOnboardingStore();

	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.9)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 600,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				friction: 8,
				tension: 40,
				useNativeDriver: true,
			}),
		]).start();
	}, [fadeAnim, scaleAnim]);

	const handleContinue = () => {
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	const isReinforcement = type === "reinforcement";

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-center px-8">
				<Animated.View
					style={{
						opacity: fadeAnim,
						transform: [{ scale: scaleAnim }],
						alignItems: "center",
					}}
				>
					<LinearGradient
						colors={["#E6FFFA", "#F0FDF4"]}
						style={{
							height: 120,
							width: 120,
							borderRadius: 60,
							alignItems: "center",
							justifyContent: "center",
							marginBottom: 32,
						}}
					>
						{isReinforcement ? (
							<Zap color="#3EC9B5" size={48} strokeWidth={2.5} />
						) : (
							<Activity color="#3EC9B5" size={48} strokeWidth={2.5} />
						)}
					</LinearGradient>

					<Text className="text-center font-bold text-[#1A2138] text-[32px] leading-tight">
						{isReinforcement
							? "Great start."
							: "We're building your Health Core."}
					</Text>

					<Text className="mt-4 text-center font-medium text-[#60708F] text-lg leading-6">
						{isReinforcement
							? "Most people never take this step — you already did."
							: "Your personalized strategy is coming together."}
					</Text>

					{/* Visual indicator card */}
					<View className="mt-10 w-full rounded-[32px] bg-white p-6 shadow-black/5 shadow-sm">
						{isReinforcement ? (
							<View className="flex-row items-center justify-around">
								<View className="items-center">
									<View className="mb-2 h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
										<Zap color="#F59E0B" size={24} />
									</View>
									<Text className="font-bold text-[#F59E0B]">+ Energy</Text>
								</View>
								<View className="h-12 w-[1px] bg-slate-100" />
								<View className="items-center">
									<View className="mb-2 h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
										<Activity color="#3B82F6" size={24} />
									</View>
									<Text className="font-bold text-[#3B82F6]">−</Text>
									<Text className="font-bold text-[#3B82F6] text-[10px] uppercase">
										Inflammation
									</Text>
								</View>
							</View>
						) : (
							<View className="items-center py-4">
								<View className="relative h-24 w-16">
									{/* Simple Silhouette Outline */}
									<View className="absolute inset-0 rounded-full border-2 border-slate-100 opacity-20" />
									<View className="absolute right-0 bottom-0 left-0 h-1/2 rounded-full bg-[#3EC9B5] opacity-30" />
									<Sparkles
										className="absolute -top-2 -right-2"
										color="#3EC9B5"
										size={24}
									/>
								</View>
								<Text className="mt-4 font-bold text-[#3EC9B5] text-sm uppercase tracking-widest">
									Profile Analysis 60% Complete
								</Text>
							</View>
						)}
					</View>
				</Animated.View>
			</View>

			<View className="px-6 pb-12">
				<ContinueButton onPress={handleContinue} />
			</View>
		</View>
	);
}
