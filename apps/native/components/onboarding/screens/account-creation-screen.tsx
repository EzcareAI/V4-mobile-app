import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import {
	ActivityIndicator,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function AccountCreationScreen() {
	const router = useRouter();
	const { setAnswer, nextStep, currentStep } = useOnboardingStore();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	const handleSignUp = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {
				/* ignore */
			}
		}

		if (!(email && password)) {
			setErrorMsg("Please enter both email and password.");
			return;
		}

		setLoading(true);
		setErrorMsg("");

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
		});

		if (error) {
			setErrorMsg(error.message);
			setLoading(false);
			return;
		}

		if (data.user) {
			setAnswer("userId", data.user.id);
		}

		setAnswer("authMethod", "email");
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	return (
		<ScrollView
			className="flex-1 bg-[#EBF5F4]"
			showsVerticalScrollIndicator={false}
		>
			<View className="px-8 pt-12 pb-12">
				<View className="mb-10">
					<Text className="font-black text-[#29303D] text-[34px] leading-10 tracking-tight">
						Almost There!
					</Text>
					<Text className="mt-4 font-medium text-[#73808C] text-[17px] leading-7">
						Let's create your private account to save your personalized healing
						plan.
					</Text>
				</View>

				{/* Email & Password Input */}
				<View className="mb-8">
					<Text className="mb-2 px-2 font-bold text-[#29303D] text-[15px] uppercase tracking-widest">
						Email Address
					</Text>
					<View className="mb-4 rounded-[24px] border-2 border-slate-100 bg-slate-50 px-6 py-4 shadow-sm focus:border-blue-400">
						<TextInput
							autoCapitalize="none"
							autoCorrect={false}
							className="font-medium text-[#29303D] text-lg"
							keyboardType="email-address"
							onChangeText={setEmail}
							placeholder="your@email.com"
							placeholderTextColor="#94A3B8"
							value={email}
						/>
					</View>

					<Text className="mb-2 px-2 font-bold text-[#29303D] text-[15px] uppercase tracking-widest">
						Password
					</Text>
					<View className="rounded-[24px] border-2 border-slate-100 bg-slate-50 px-6 py-4 shadow-sm focus:border-blue-400">
						<TextInput
							autoCapitalize="none"
							className="font-medium text-[#29303D] text-lg"
							onChangeText={setPassword}
							placeholder="••••••••"
							placeholderTextColor="#94A3B8"
							secureTextEntry
							value={password}
						/>
					</View>

					{errorMsg ? (
						<Text className="mt-3 px-4 font-medium text-red-500 text-sm">
							{errorMsg}
						</Text>
					) : null}
				</View>

				{/* Auth Options logic hidden for scope, email logic is primary */}

				{/* Benefits Guarantee */}
				<View className="mb-12 rounded-[32px] border border-emerald-100 bg-emerald-50/50 p-8">
					<View className="mb-3 flex-row items-center">
						<ShieldCheck color="#10B981" size={24} />
						<Text className="ml-3 font-bold text-emerald-900 text-lg tracking-tight">
							Your Privacy Is Guaranteed
						</Text>
					</View>
					<Text className="font-medium text-[15px] text-emerald-800/80 leading-6">
						Secure cloud sync • HIPAA-grade encryption • No data sharing with
						third parties.
					</Text>
				</View>

				{/* Privacy Notice */}
				<Text className="mb-10 px-4 text-center font-medium text-[#73808C] text-[13px] leading-5">
					By creating an account, you agree to our{"\n"}
					<Text className="font-bold text-[#73808C]">Terms of Service</Text> and{" "}
					<Text className="font-bold text-[#73808C]">Privacy Policy</Text>.
				</Text>

				{/* CTA */}
				<TouchableOpacity
					activeOpacity={0.9}
					className="relative w-full overflow-hidden rounded-[28px] py-5 shadow-2xl shadow-blue-200"
					disabled={loading}
					onPress={handleSignUp}
				>
					<LinearGradient
						colors={["#28B898", "#2DE2E2"]}
						end={{ x: 1, y: 0 }}
						start={{ x: 0, y: 0 }}
						style={StyleSheet.absoluteFill}
					/>
					{loading ? (
						<ActivityIndicator color="white" />
					) : (
						<Text className="text-center font-black text-white text-xl tracking-tight">
							Create My Plan →
						</Text>
					)}
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}
