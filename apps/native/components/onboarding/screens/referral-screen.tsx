import { useRouter } from "expo-router";
import { Button, TextField } from "heroui-native";
import { Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export const ReferralScreen = () => {
	const router = useRouter();
	const { referralCode, setAnswer } = useOnboardingStore();

	const handleFinish = () => {
		// In a real app, we would call an API to save the profile here.
		// For Phase 1, we just mark it as finished locally.
		router.replace("/(drawer)");
	};

	return (
		<View className="flex-1 justify-between px-6 py-8">
			<View>
				<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
					Do you have a code?
				</Text>
				<Text className="mb-8 text-lg text-muted-foreground">
					Enter your referral code if you have one.
				</Text>

				<View className="rounded-3xl border-2 border-secondary/10 bg-card p-4">
					<TextField className="bg-transparent">
						<TextField.Label>Referral Code (Optional)</TextField.Label>
						<TextField.Input
							autoCapitalize="characters"
							onChangeText={(val) => setAnswer("referralCode", val)}
							placeholder="EZCARE-2026"
							value={referralCode}
						/>
					</TextField>
				</View>
			</View>

			<Button className="h-14 rounded-full bg-primary" onPress={handleFinish}>
				<Button.Label className="font-bold text-lg text-white">
					Finish Setup
				</Button.Label>
			</Button>
		</View>
	);
};
