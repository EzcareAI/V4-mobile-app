import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Bell, BellOff, Bot } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { StepHeader } from "../common/step-header";

export const NotificationsScreen = () => {
	const router = useRouter();
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleToggle = (val: boolean) => {
		setAnswer("notificationsEnabled", val);
	};

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/20");
	};

	return (
		<View className="flex-1 bg-background">
			<View className="flex-1 justify-between px-5 pb-8">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1 px-1">
						{/* Bot Header Wrap */}
						<View className="mt-4 items-center">
							<View className="h-32 w-32 items-center justify-center rounded-full bg-cyan-400/20">
								<Bot color="#00A8A8" size={48} />
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description={
								<Text>
									Daily healing check-ins boost results by{" "}
									<Text className="font-bold text-[#2DE2E2]">100%</Text>.
								</Text>
							}
							title="Want EZBuddy to guide you every day?"
						/>

						{/* Notification Mockups */}
						<View className="mt-8 overflow-hidden rounded-[32px] bg-white p-4 shadow-blue-100 shadow-sm">
							<View className="flex-row items-center justify-between px-2 py-2">
								<Text className="font-bold text-slate-300">•••</Text>
								<Text className="font-bold text-[#60708F] text-sm">9:41</Text>
								<View className="flex-row items-center gap-1">
									<View className="h-4 w-4 rounded-sm bg-slate-200" />
									<View className="h-4 w-4 rounded-sm bg-slate-200" />
								</View>
							</View>

							<View className="mt-2 space-y-3">
								{/* Notification 1 */}
								<View className="rounded-2xl bg-[#F8FAFF] p-4">
									<View className="flex-row items-center justify-between">
										<View className="flex-row items-center">
											<View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-cyan-400">
												<Bot color="white" size={20} />
											</View>
											<View>
												<Text className="font-bold text-[#0d2137]">
													EZCare AI
												</Text>
											</View>
										</View>
										<Text className="text-[#60708F] text-xs">now</Text>
									</View>
									<Text className="mt-2 text-[#60708F] text-sm leading-5">
										Good morning! 🌅 Ready for your daily healing check-in? Your
										inflammation levels are improving!
									</Text>
								</View>

								{/* Notification 2 */}
								<View className="mt-3 rounded-2xl bg-[#F8FAFF] p-4 opacity-80">
									<View className="flex-row items-center justify-between">
										<View className="flex-row items-center">
											<View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-cyan-400">
												<Bot color="white" size={20} />
											</View>
											<View>
												<Text className="font-bold text-[#0d2137]">
													EZCare AI
												</Text>
											</View>
										</View>
										<Text className="text-[#60708F] text-xs">1h ago</Text>
									</View>
									<Text className="mt-2 text-[#60708F] text-sm leading-5">
										Time for your afternoon energy boost! 💚 Your personalized
										nutrition tip is ready.
									</Text>
								</View>
							</View>
						</View>

						{/* Stats Card */}
						<View className="mt-8 rounded-[32px] bg-white p-6 shadow-blue-100 shadow-sm">
							<Text className="mb-6 text-center font-bold text-[#0d2137] text-lg">
								Users with notifications enabled see:
							</Text>
							<View className="flex-row justify-between">
								<View className="flex-1 items-center">
									<Text className="font-bold text-2xl text-[#2DE2E2]">
										100%
									</Text>
									<Text className="mt-1 text-center text-[11px] text-[#60708F] leading-4">
										Better{"\n"}Results
									</Text>
								</View>
								<View className="flex-1 items-center">
									<Text className="font-bold text-2xl text-[#00A8A8]">85%</Text>
									<Text className="mt-1 text-center text-[11px] text-[#60708F] leading-4">
										Higher{"\n"}Consistency
									</Text>
								</View>
								<View className="flex-1 items-center">
									<Text className="font-bold text-2xl text-[#818CF8]">90%</Text>
									<Text className="mt-1 text-center text-[11px] text-[#60708F] leading-4">
										Goal{"\n"}Achievement
									</Text>
								</View>
							</View>
						</View>

						{/* Action Buttons */}
						<View className="mt-12 mb-6 gap-y-4">
							<Pressable
								onPress={() => {
									handleToggle(true);
									handleContinue();
								}}
							>
								<LinearGradient
									colors={["#2DE2E2", "#00A8A8"]}
									end={{ x: 1, y: 1 }}
									start={{ x: 0, y: 0 }}
									style={{ borderRadius: 36 }}
								>
									<View className="h-16 flex-row items-center justify-center">
										<Bell color="white" size={22} />
										<Text className="ml-3 font-bold text-lg text-white">
											Allow Notifications
										</Text>
									</View>
								</LinearGradient>
							</Pressable>

							<Pressable
								className="opacity-70"
								onPress={() => {
									handleToggle(false);
									handleContinue();
								}}
							>
								<LinearGradient
									colors={["#f4f4f5", "#e4e4e7"]}
									end={{ x: 1, y: 1 }}
									start={{ x: 0, y: 0 }}
									style={{ borderRadius: 36 }}
								>
									<View className="h-16 flex-row items-center justify-center">
										<BellOff color="#71717a" size={22} />
										<Text className="ml-3 font-bold text-lg text-[#60708F]">
											Don't Allow
										</Text>
									</View>
								</LinearGradient>
							</Pressable>
						</View>

						<Text className="mt-2 mb-10 text-center text-[#60708F] text-sm">
							You can change notification preferences anytime in Settings
						</Text>
					</View>
				</ScrollView>
			</View>
		</View>
	);
};
