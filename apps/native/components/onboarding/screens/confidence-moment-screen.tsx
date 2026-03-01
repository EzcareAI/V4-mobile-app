import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { THEME } from "@/lib/theme";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

const BENEFITS = [
	{
		emoji: "🎯",
		title: "Personalized 7-day roadmap",
		desc: "A step-by-step natural health plan built around your answers.",
	},
	{
		emoji: "🤖",
		title: "EZBuddy AI guidance",
		desc: "Your AI health coach available 24/7 to support your journey.",
	},
	{
		emoji: "📊",
		title: "Health score & progress tracking",
		desc: "Watch your wellbeing improve with measurable milestones.",
	},
	{
		emoji: "💪",
		title: "Dopamine rewards & momentum",
		desc: "Small wins that keep you consistent and motivated every day.",
	},
];

const BADGES = [
	{ emoji: "✓", label: "Clinically\nTrusted" },
	{ emoji: "🌿", label: "100%\nNatural" },
	{ emoji: "🔒", label: "Your Data\nProtected" },
];

export function ConfidenceMomentScreen() {
	const router = useRouter();
	const { nextStep, currentStep } = useOnboardingStore();

	const handleContinue = () => {
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					showsVerticalScrollIndicator={false}
				>
					<View className="px-1">
						{/* Mascot Header */}
						<View className="mt-8 items-center">
							<View className="relative">
								<LinearGradient
									colors={THEME.accentGradient}
									start={{ x: 0, y: 0 }}
									style={{
										height: 120,
										width: 120,
										borderRadius: 60,
										alignItems: "center",
										justifyContent: "center",
										shadowColor: THEME.accentShadow,
										shadowOffset: { width: 0, height: 10 },
										shadowOpacity: 0.25,
										shadowRadius: 15,
										elevation: 10,
									}}
								>
									<Text style={{ fontSize: 56 }}>🎉</Text>
								</LinearGradient>
								{/* Badge */}
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white"
									style={{
										backgroundColor: THEME.accentLight,
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 14 }}>⭐</Text>
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="You've given us exactly what we need to build your personalized health plan."
							title="Great job!"
						/>

						{/* Benefits Card */}
						<View className="mt-4 rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-xl">
							<Text className="mb-4 font-bold text-[#0d2137] text-base">
								✨ Your Plan Includes:
							</Text>
							<View className="gap-y-4">
								{BENEFITS.map((b) => (
									<View className="flex-row items-start gap-3" key={b.emoji}>
										<View
											className="h-10 w-10 shrink-0 items-center justify-center rounded-xl"
											style={{ backgroundColor: THEME.accentBg }}
										>
											<Text style={{ fontSize: 18 }}>{b.emoji}</Text>
										</View>
										<View className="flex-1">
											<Text className="font-bold text-[#0d2137] text-sm">
												{b.title}
											</Text>
											<Text className="mt-0.5 text-[#73808C] text-xs leading-4">
												{b.desc}
											</Text>
										</View>
									</View>
								))}
							</View>
						</View>

						{/* Trust Badges */}
						<View className="mt-6 flex-row justify-center gap-6">
							{BADGES.map((b) => (
								<View className="items-center" key={b.label}>
									<View
										className="mb-2 h-12 w-12 items-center justify-center rounded-2xl"
										style={{ backgroundColor: THEME.accentBg }}
									>
										<Text style={{ fontSize: 22 }}>{b.emoji}</Text>
									</View>
									<Text className="text-center font-semibold text-[#73808C] text-xs">
										{b.label}
									</Text>
								</View>
							))}
						</View>
					</View>
				</ScrollView>

				<View className="pt-6">
					<ContinueButton label="See Your Results →" onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
}
