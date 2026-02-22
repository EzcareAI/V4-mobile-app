import { Button, TextField } from "heroui-native";
import { Bot, Crown, Gift, Sparkles, Users } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export const ReferralScreen = () => {
	const { referralCode, setAnswer, nextStep } = useOnboardingStore();

	const handleFinish = () => {
		// Mark onboarding as complete by incrementing past step 20
		// This will trigger the navigation guard in _layout.tsx to redirect to /(drawer)
		nextStep();
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
						{/* Robot Icon with Gift Badge */}
						<View className="mt-4 mb-6 items-center">
							<View className="relative">
								<View className="h-32 w-32 items-center justify-center rounded-full bg-linear-to-br from-cyan-400/30 to-cyan-500/20">
									<Bot color="#00A8A8" size={56} strokeWidth={2} />
								</View>
								{/* Gift Badge */}
								<View className="absolute -top-1 -right-1 h-12 w-12 items-center justify-center rounded-full bg-amber-400 shadow-amber-400/30 shadow-lg">
									<Gift color="white" fill="white" size={24} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							description="Unlock exclusive benefits and bonus features with a friend's referral code."
							title="Got a referral code?"
						/>

						{/* Benefits Card */}
						<View className="mb-8 overflow-hidden rounded-[32px] bg-white p-6 shadow-blue-100 shadow-sm">
							<Text className="mb-6 text-center font-bold text-[#0d2137] text-xl">
								Referral Benefits
							</Text>

							<View className="gap-y-5">
								{/* Benefit 1 */}
								<View className="flex-row items-start">
									<View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-400 to-cyan-500">
										<Crown color="white" fill="white" size={24} />
									</View>
									<View className="flex-1">
										<Text className="mb-1 font-bold text-[#0d2137] text-base">
											7-day Premium Trial
										</Text>
										<Text className="text-ezcare-slate text-sm leading-5">
											Access all advanced features
										</Text>
									</View>
								</View>

								{/* Benefit 2 */}
								<View className="flex-row items-start">
									<View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-sky-400 to-sky-500">
										<Sparkles color="white" fill="white" size={24} />
									</View>
									<View className="flex-1">
										<Text className="mb-1 font-bold text-[#0d2137] text-base">
											AI Personalization+
										</Text>
										<Text className="text-ezcare-slate text-sm leading-5">
											Enhanced health insights
										</Text>
									</View>
								</View>

								{/* Benefit 3 */}
								<View className="flex-row items-start">
									<View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-purple-400 to-purple-500">
										<Users color="white" fill="white" size={24} />
									</View>
									<View className="flex-1">
										<Text className="mb-1 font-bold text-[#0d2137] text-base">
											Community Access
										</Text>
										<Text className="text-ezcare-slate text-sm leading-5">
											Connect with health enthusiasts
										</Text>
									</View>
								</View>
							</View>
						</View>

						{/* Input Section */}
						<View className="mb-6">
							<TextField className="bg-transparent">
								<TextField.Label>Referral Code (Optional)</TextField.Label>
								<TextField.Input
									autoCapitalize="characters"
									onChangeText={(val) => setAnswer("referralCode", val)}
									placeholder="e.g., HEALTH2024"
									placeholderTextColor="#94a3b8"
									value={referralCode}
								/>
							</TextField>
						</View>

						{/* Submit Button */}
						<ContinueButton
							isDisabled={referralCode?.length === 0}
							label={
								<View className="flex-row items-center">
									<Text className="mr-2 text-2xl text-white">✓</Text>
									<Button.Label className="font-semibold text-base text-white">
										Submit Code
									</Button.Label>
								</View>
							}
							onPress={handleFinish}
						/>

						{/* Skip Link */}
						<Button
							className="mt-2 h-12 bg-transparent"
							onPress={handleFinish}
							variant="ghost"
						>
							<Button.Label className="text-base text-ezcare-slate underline">
								Skip for now
							</Button.Label>
						</Button>

						{/* Footer Info */}
						<View className="mt-4 px-4 pb-10">
							<Text className="text-center text-ezcare-slate text-sm leading-5">
								Don't have a referral code? No worries! You can add one later in
								your profile settings.
							</Text>
						</View>
					</View>
				</ScrollView>
			</View>
		</View>
	);
};
