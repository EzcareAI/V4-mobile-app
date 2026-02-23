import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { THEME } from "@/lib/theme";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

const PILLARS = [
	{
		emoji: "✓",
		title: "Personalized to YOUR body",
		desc: "Matches your lifestyle, metabolism, and health goals.",
	},
	{
		emoji: "✓",
		title: "Simple enough to actually follow",
		desc: "No extreme measures — natural, sustainable changes.",
	},
	{
		emoji: "✓",
		title: "Science-backed & natural",
		desc: "Evidence-based protocols your body responds to.",
	},
	{
		emoji: "✓",
		title: "Achievable from day one",
		desc: "Quick wins that build lasting healthy habits.",
	},
];

export function ProgressBoostScreen() {
	const router = useRouter();
	const { nextStep } = useOnboardingStore();

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/14");
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-5 pb-8">
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
									<Text style={{ fontSize: 56 }}>🚀</Text>
								</LinearGradient>
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
									<Text style={{ fontSize: 14 }}>💡</Text>
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="By focusing on your health today, you're investing in a stronger, more vibrant future."
							title="You're making a smart choice!"
						/>

						{/* Your Health Core card */}
						<View className="mt-4 rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-xl">
							<Text className="mb-4 font-bold text-[#0d2137] text-base">
								📊 Your Health Core Plan Will Be:
							</Text>
							<View className="gap-y-4">
								{PILLARS.map((p) => (
									<View className="flex-row items-start gap-3" key={p.title}>
										<View
											className="h-8 w-8 shrink-0 items-center justify-center rounded-xl"
											style={{ backgroundColor: THEME.accentBg }}
										>
											<Text
												className="font-bold"
												style={{ color: THEME.accent, fontSize: 14 }}
											>
												{p.emoji}
											</Text>
										</View>
										<View className="flex-1">
											<Text className="font-bold text-[#0d2137] text-sm">
												{p.title}
											</Text>
											<Text className="mt-0.5 text-[#73808C] text-xs leading-4">
												{p.desc}
											</Text>
										</View>
									</View>
								))}
							</View>
						</View>

						{/* Motivational footer note */}
						<View
							className="mt-4 rounded-2xl p-4"
							style={{ backgroundColor: THEME.accentBg }}
						>
							<Text
								className="text-center font-medium text-sm"
								style={{ color: THEME.accent }}
							>
								💡 The next questions help us pinpoint exactly where to focus
								your plan.
							</Text>
						</View>
					</View>
				</ScrollView>

				<SafeAreaView edges={["bottom"]}>
					<View className="pt-4">
						<ContinueButton onPress={handleContinue} />
					</View>
				</SafeAreaView>
			</View>
		</View>
	);
}
