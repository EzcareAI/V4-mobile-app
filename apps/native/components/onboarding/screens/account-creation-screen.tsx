import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Lock, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import Svg, { Path } from "react-native-svg";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
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
	const { setAnswer, nextStep, currentStep, firstName } = useOnboardingStore();
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

		const hasMinLength = password.length >= 8;
		const hasUpperCase = /[A-Z]/.test(password);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\-_]/.test(password);

		if (!hasMinLength || !hasUpperCase || !hasSpecialChar) {
			setErrorMsg(
				"Password must be at least 8 characters, include a capital letter, and a special character."
			);
			return;
		}

		setLoading(true);
		setErrorMsg("");

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					first_name: firstName,
					name: firstName, // Common fallback field
				},
			},
		});

		if (error) {
			setErrorMsg(error.message);
			setLoading(false);
			return;
		}

		if (data.user) {
			setAnswer("userId", data.user.id);
		}

		setAnswer("email", email);
		setAnswer("authMethod", "email");
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	return (
		<ScrollView
			className="flex-1 bg-[#EBF5F4]"
			showsVerticalScrollIndicator={false}
		>
			<View className="px-8 pt-6 pb-6">
				<View className="mb-6">
					<Text className="font-black text-[#29303D] text-[34px] leading-10 tracking-tight">
						Almost There!
					</Text>
					<Text className="mt-4 font-medium text-[#73808C] text-[17px] leading-7">
						Let's create your private account to save your personalized healing
						plan.
					</Text>
				</View>

				{/* Email & Password Input */}
				<View className="mb-6">
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
					<Text className="mt-2 px-4 font-medium text-[#73808C] text-[12px] leading-5">
						Minimum 8 characters, 1 capital letter, and 1 special character.
					</Text>

					{errorMsg ? (
						<Text className="mt-3 px-4 font-medium text-red-500 text-sm">
							{errorMsg}
						</Text>
					) : null}
				</View>

				<View className="mb-6 flex-row items-center">
					<View className="h-[1px] flex-1 bg-slate-200" />
					<Text className="px-4 font-bold text-[#94A3B8] text-xs uppercase tracking-widest">
						Or Continue With
					</Text>
					<View className="h-[1px] flex-1 bg-slate-200" />
				</View>

				<View className="mb-8 gap-y-3">
					{/* Apple Button */}
					<TouchableOpacity
						activeOpacity={0.8}
						className="flex-row items-center justify-center gap-x-2 rounded-[24px] bg-[#000000] py-4 shadow-sm"
					>
						<Svg height="22" viewBox="0 0 384 512" width="18">
							<Path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" fill="white" />
						</Svg>
						<Text className="font-bold text-[17px] text-white tracking-wide">
							Continue with Apple
						</Text>
					</TouchableOpacity>

					{/* Google Button */}
					<TouchableOpacity
						activeOpacity={0.8}
						className="flex-row items-center justify-center rounded-[24px] border border-slate-200 bg-white py-4 shadow-sm"
					>
						<Text className="font-bold text-[17px] text-[#29303D] tracking-wide">
							<Text className="text-xl">G</Text>  Continue with Google
						</Text>
					</TouchableOpacity>
				</View>

				{/* Benefits Guarantee */}
				<View className="mb-6 rounded-[32px] border border-emerald-100 bg-emerald-50/50 p-8">
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
				<Text className="mb-4 px-4 text-center font-medium text-[#73808C] text-[13px] leading-5">
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
