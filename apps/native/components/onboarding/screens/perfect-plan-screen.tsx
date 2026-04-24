import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Heart, TrendingUp, Zap } from "lucide-react-native";
import React from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export default function PerfectPlanScreen() {
	const router = useRouter();
	const { nextStep, currentStep } = useOnboardingStore();

	const barAnim = useSharedValue(0);

	React.useEffect(() => {
		barAnim.value = withTiming(1, { duration: 1500 });
	}, [barAnim]);

	const withRefStyle = useAnimatedStyle(() => ({
		height: `${Math.max(barAnim.value * 89, 5)}%`,
	}));
	const withoutRefStyle = useAnimatedStyle(() => ({
		height: `${Math.max(barAnim.value * 20, 5)}%`,
	}));

	const handleContinue = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {
				/* ignore */
			}
		}
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="px-6 pt-8">
						{/* Premium Header Visualization */}
						<View className="mb-6 items-center">
							<View className="relative h-32 w-32 items-center justify-center">
								<LinearGradient
									className="h-28 w-28 items-center justify-center rounded-[36px] shadow-blue-200 shadow-lg"
									colors={["#28B898", "#2DE2E2"]}
									start={{ x: 0, y: 0 }}
								>
									<TrendingUp color="white" size={48} strokeWidth={2.5} />
								</LinearGradient>

								<View className="absolute -right-2 -bottom-2 h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-amber-400 shadow-md">
									<Zap color="white" fill="white" size={20} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							description="You're much closer to your goals than you think. Our AI insights show great potential for improvement."
							title="Your plan is working already"
						/>

						{/* Awareness Score Progress Card */}
						<View className="mt-8 rounded-[40px] border border-slate-50 bg-white p-8 shadow-2xl shadow-blue-100/50">
							<View className="mb-8 flex-row items-center justify-start gap-x-4">
								<View>
									<Text className="font-bold text-[#29303D] text-lg">
										Awareness Progress
									</Text>
									<Text className="mt-0.5 font-bold text-[#73808C] text-xs uppercase tracking-widest">
										4-Month Projection
									</Text>
								</View>
							</View>

							{/* Graph Section */}
							<View className="mt-4 mb-4 h-56 flex-row items-end justify-center gap-[4px] border-slate-100 border-b-2 pb-4">
								{/* Without EZCare Bar */}
								<View className="flex-1 items-center">
									<Text className="mb-2 font-black text-lg text-red-500">
										20%
									</Text>
									<View className="h-40 w-20 justify-end overflow-hidden rounded-t-2xl bg-red-50">
										<Animated.View
											className="w-full rounded-t-2xl bg-red-300"
											style={withoutRefStyle}
										/>
									</View>
									<Text className="mt-4 text-center font-bold text-red-400 text-xs leading-4">
										Without{"\n"}EZCare
									</Text>
								</View>

								{/* With EZCare Bar */}
								<View className="flex-1 items-center">
									<Text className="mb-2 font-black text-3xl text-[#28B898]">
										89%
									</Text>
									<View className="h-40 w-24 justify-end overflow-hidden rounded-t-2xl bg-emerald-50">
										<Animated.View
											className="w-full overflow-hidden rounded-t-2xl"
											style={withRefStyle}
										>
											<LinearGradient
												colors={["#2DE2E2", "#28B898"]}
												style={{ flex: 1 }}
											/>
										</Animated.View>
									</View>
									<Text className="mt-4 text-center font-bold text-[#29303D] text-[13px] leading-4">
										With{"\n"}EZCare
									</Text>
								</View>
							</View>
						</View>

						<View className="mt-10 overflow-hidden rounded-[40px] shadow-2xl shadow-blue-200">
							<LinearGradient
								className="p-10"
								colors={["#28B898", "#2DE2E2"]}
								end={{ x: 1, y: 1 }}
								start={{ x: 0, y: 0 }}
							>
								<View className="mb-8 flex-row items-center gap-3">
									<View className="h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20">
										<Heart color="white" fill="white" size={28} />
									</View>
									<Text
										adjustsFontSizeToFit
										className="flex-1 font-black text-2xl text-white tracking-tight"
										numberOfLines={1}
									>
										Keep Going!
									</Text>
								</View>
								<View className="mb-6 h-1.5 w-16 rounded-full bg-white/30" />
								<Text className="font-semibold text-[22px] text-white leading-8">
									Your body is responding beautifully. Every small action today
									creates a massive ripple for your future wellbeing.
								</Text>
							</LinearGradient>
						</View>
					</View>
				</ScrollView>

				<View className="pt-6">
					<ContinueButton label="Begin My Journey →" onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
}
