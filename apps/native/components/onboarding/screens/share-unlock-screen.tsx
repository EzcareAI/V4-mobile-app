import { useRouter } from "expo-router";
import { ImpactFeedbackStyle, NotificationFeedbackType, impactAsync, notificationAsync } from "expo-haptics";
import { Button } from "heroui-native";
import { Check, Gift, Share2, Users } from "lucide-react-native";
import React from "react";
import { Platform, Share, Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

// How many friends the user must invite, and the trial they unlock for it.
const REQUIRED_SHARES = 3;
const PROMO_TRIAL_DAYS = 3;
const PAYWALL_STEP = 19;

export const ShareUnlockScreen = () => {
	const router = useRouter();
	const {
		shareInviteCount,
		shareUnlockComplete,
		firstName,
		onboardingRecordId,
		getOrGenerateReferralCode,
		setAnswer,
	} = useOnboardingStore();

	const [count, setCount] = React.useState(shareInviteCount ?? 0);
	const unlocked = shareUnlockComplete || count >= REQUIRED_SHARES;

	const buildShareMessage = () => {
		const code = getOrGenerateReferralCode();
		const link = `https://ezcareapp.vercel.app/?ref=${code}`;
		const who = firstName ? `${firstName} ` : "";
		return `${who}invited you to EZCare AI, your daily lifestyle companion. Use my link to get started: ${link}`;
	};

	const grantTrial = async () => {
		setAnswer("shareUnlockComplete", true);
		setAnswer("promoTrialDays", PROMO_TRIAL_DAYS);
		// Best-effort: record the grant server-side so it survives reinstalls.
		// Never block the UI on this. onboarding_profiles is keyed by the
		// onboardingRecordId the client holds from the sync step.
		if (onboardingRecordId) {
			supabase
				.from("onboarding_profiles")
				.update({
					share_unlock_complete: true,
					promo_trial_days: PROMO_TRIAL_DAYS,
				})
				.eq("id", onboardingRecordId)
				.then(({ error }) => {
					if (error) console.warn("[ShareUnlock] grant sync failed:", error.message);
				});
		}
	};

	const handleShare = async () => {
		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
		}
		try {
			await Share.share({ message: buildShareMessage() });
		} catch {
			// User dismissed or share failed — still counts as a tap so the
			// flow never traps them (store-safe; sharing is encouraged, not forced).
		}

		const next = Math.min(count + 1, REQUIRED_SHARES);
		setCount(next);
		setAnswer("shareInviteCount", next);

		if (next >= REQUIRED_SHARES && !shareUnlockComplete) {
			if (Platform.OS === "ios") {
				notificationAsync(NotificationFeedbackType.Success).catch(() => {});
			}
			await grantTrial();
		}
	};

	const goToPaywall = () => {
		router.push(`/(onboarding)/${PAYWALL_STEP}`);
	};

	const handleContinue = () => {
		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Medium).catch(() => {});
		}
		goToPaywall();
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10 pt-8">
				<View className="flex-1">
					{/* Icon */}
					<View className="mt-2 mb-6 items-center">
						<View className="relative">
							<View className="h-32 w-32 items-center justify-center rounded-full bg-linear-to-br from-cyan-400/30 to-cyan-500/20">
								<Users color="#28B898" size={56} strokeWidth={2} />
							</View>
							<View className="-top-1 -right-1 absolute h-12 w-12 items-center justify-center rounded-full bg-amber-400 shadow-amber-400/30 shadow-lg">
								<Gift color="white" fill="white" size={24} />
							</View>
						</View>
					</View>

					<StepHeader
						align="center"
						description={`Invite ${REQUIRED_SHARES} friends with your link to unlock your ${PROMO_TRIAL_DAYS}-day free trial before you continue.`}
						title="Share to unlock your free trial"
					/>

					{/* Reward card */}
					<View className="mt-6 mb-8 overflow-hidden rounded-[32px] bg-white p-6 shadow-blue-100 shadow-sm">
						<View className="flex-row items-center justify-center gap-x-2">
							<Gift color="#28B898" size={22} />
							<Text className="font-bold text-[#0d2137] text-xl">
								{PROMO_TRIAL_DAYS}-Day Free Trial
							</Text>
						</View>
						<Text className="mt-2 text-center text-[#73808C] text-sm leading-5">
							A thank-you for spreading the word. Unlocked when you invite {REQUIRED_SHARES} friends.
						</Text>

						{/* Progress dots */}
						<View className="mt-6 flex-row items-center justify-center gap-x-3">
							{Array.from({ length: REQUIRED_SHARES }).map((_, i) => {
								const done = i < count;
								return (
									<View
										key={i}
										className={`h-12 w-12 items-center justify-center rounded-full ${
											done ? "bg-[#28B898]" : "bg-[#E2ECEA]"
										}`}
									>
										{done ? (
											<Check color="white" size={22} strokeWidth={3} />
										) : (
											<Text className="font-bold text-[#94A3B8] text-base">{i + 1}</Text>
										)}
									</View>
								);
							})}
						</View>
						<Text className="mt-3 text-center font-semibold text-[#28B898] text-sm">
							{unlocked
								? `Unlocked! Your ${PROMO_TRIAL_DAYS}-day free trial is reserved.`
								: `${count} of ${REQUIRED_SHARES} friends invited`}
						</Text>
					</View>
				</View>

				{/* Footer */}
				<View className="pt-4">
					{!unlocked ? (
						<ContinueButton
							label={
								<View className="flex-row items-center">
									<Share2 color="white" size={20} />
									<Text className="ml-2 font-semibold text-base text-white">
										Share your link
									</Text>
								</View>
							}
							onPress={handleShare}
						/>
					) : (
						<ContinueButton
							label={
								<View className="flex-row items-center">
									<Check color="white" size={20} strokeWidth={3} />
									<Text className="ml-2 font-semibold text-base text-white">
										Claim & Continue
									</Text>
								</View>
							}
							onPress={handleContinue}
						/>
					)}

					{/* Escape hatch — keeps the gate store-compliant (sharing is
					    encouraged, never strictly required to use the app). */}
					{!unlocked && (
						<Button className="mt-2 h-12 bg-transparent" onPress={goToPaywall} variant="ghost">
							<Button.Label className="text-[#73808C] text-base underline">
								Maybe later
							</Button.Label>
						</Button>
					)}

					<View className="mt-4 px-4">
						<Text className="text-center text-[#73808C] text-[13px] leading-5">
							Sharing unlocks your free trial. This does not change the price or your subscription.
						</Text>
					</View>
				</View>
			</View>
		</View>
	);
};
