import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export function NameScreen() {
	const router = useRouter();
	const { firstName, setAnswer, nextStep, currentStep } = useOnboardingStore();
	const [name, setName] = useState(firstName || "");

	const handleContinue = () => {
		impactAsync(ImpactFeedbackStyle.Medium).catch(() => {
			/* ignore haptic errors */
		});

		if (name.trim()) {
			setAnswer("firstName", name.trim());
			nextStep();
			router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			className="flex-1"
		>
			<View className="flex-1 bg-[#EBF5F4]">
				<View className="flex-1 justify-between px-6 pb-10">
					<ScrollView
						className="flex-1"
						contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
						showsVerticalScrollIndicator={false}
					>
						<View className="flex-1 px-1">
							{/* Mascot Header */}
							<View className="mt-4 items-center">
								<View className="relative">
									<LinearGradient
										colors={["#4FD1C5", "#28B898"]}
										start={{ x: 0, y: 0 }}
										style={{
											height: 112,
											width: 112,
											borderRadius: 56,
											alignItems: "center",
											justifyContent: "center",
											shadowColor: "#28B898",
											shadowOffset: { width: 0, height: 10 },
											shadowOpacity: 0.2,
											shadowRadius: 15,
											elevation: 10,
										}}
									>
										<Text style={{ fontSize: 48 }}>👋</Text>
									</LinearGradient>
								</View>
							</View>

							<StepHeader
								className="mt-8"
								description="We'd love to know what to call you as we build your personalized wellness plan."
								title="What's your name?"
							/>

							<View className="mt-10">
								<Text className="mb-3 px-2 font-bold text-[#29303D] text-[15px] uppercase tracking-widest">
									First Name
								</Text>
								<View className="overflow-hidden rounded-[24px] border-2 border-slate-100 bg-white shadow-sm focus:border-[#28B898]">
									<TextInput
										autoFocus
										className="px-6 py-5 font-bold text-[#1A2138] text-xl"
										onChangeText={setName}
										placeholder="e.g. Alice"
										placeholderTextColor="#94A3B8"
										value={name}
									/>
								</View>
							</View>

							<View className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
								<Text className="text-[#64748B] text-xs italic leading-5">
									✨ Tip: Your name helps EZBuddy personalize your daily
									check-ins and wellness suggestions.
								</Text>
							</View>
						</View>
					</ScrollView>

					<View className="pt-6">
						<ContinueButton
							isDisabled={!name.trim()}
							onPress={handleContinue}
						/>
					</View>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}
