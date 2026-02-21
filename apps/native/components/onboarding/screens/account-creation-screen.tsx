import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, ShieldCheck } from "lucide-react-native";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function AccountCreationScreen() {
	const { setAnswer, nextStep } = useOnboardingStore();

	const handleContinue = async () => {
		try {
			await impactAsync(ImpactFeedbackStyle.Medium);
		} catch {
			/* ignore */
		}
		setAnswer("authMethod", "email");
		nextStep();
	};

	return (
		<ScrollView
			className="flex-1 bg-background"
			showsVerticalScrollIndicator={false}
		>
			<View className="px-8 pt-12 pb-12">
				<View className="mb-10">
					<Text className="font-black text-[34px] text-slate-900 leading-10 tracking-tight">
						Almost There!
					</Text>
					<Text className="mt-4 font-medium text-[17px] text-slate-500 leading-7">
						Let's create your private account to save your personalized healing
						plan.
					</Text>
				</View>

				{/* Email Input (Mockup for design) */}
				<View className="mb-10">
					<Text className="mb-3 px-2 font-bold text-[15px] text-slate-900 uppercase tracking-widest">
						Email Address
					</Text>
					<View className="rounded-[24px] border-2 border-slate-100 bg-slate-50 px-6 py-5 shadow-sm">
						<Text className="font-medium text-lg text-slate-400">
							your@email.com
						</Text>
					</View>
				</View>

				{/* Auth Options */}
				<View className="mb-10">
					<Text className="mb-5 px-2 font-bold text-[15px] text-slate-900 uppercase tracking-widest">
						Secure Sign Up
					</Text>

					<TouchableOpacity className="mb-4 flex-row items-center rounded-[24px] bg-slate-100 p-5">
						<View className="mr-5 h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
							<Text className="text-2xl">🍎</Text>
						</View>
						<Text className="flex-1 font-bold text-lg text-slate-900">
							Continue with Apple
						</Text>
					</TouchableOpacity>

					<TouchableOpacity className="mb-4 flex-row items-center rounded-[24px] bg-slate-100 p-5">
						<View className="mr-5 h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
							<Text className="text-2xl">🔵</Text>
						</View>
						<Text className="flex-1 font-bold text-lg text-slate-900">
							Continue with Google
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						className="flex-row items-center rounded-[24px] border-2 border-slate-100 bg-white p-5 shadow-sm"
						onPress={handleContinue}
					>
						<View className="mr-5 h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
							<Mail className="text-slate-400" size={24} strokeWidth={2.5} />
						</View>
						<Text className="flex-1 font-bold text-lg text-slate-900">
							Continue with Email
						</Text>
					</TouchableOpacity>
				</View>

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
				<Text className="mb-10 px-4 text-center font-medium text-[13px] text-slate-400 leading-5">
					By creating an account, you agree to our{"\n"}
					<Text className="font-bold text-slate-600">Terms of Service</Text> and{" "}
					<Text className="font-bold text-slate-600">Privacy Policy</Text>.
				</Text>

				{/* CTA */}
				<TouchableOpacity
					activeOpacity={0.9}
					className="relative w-full overflow-hidden rounded-[28px] py-5 shadow-2xl shadow-blue-200"
					onPress={handleContinue}
				>
					<LinearGradient
						colors={["#3BAFDA", "#3EC9B5"]}
						end={{ x: 1, y: 0 }}
						start={{ x: 0, y: 0 }}
						style={StyleSheet.absoluteFill}
					/>
					<Text className="text-center font-black text-white text-xl tracking-tight">
						Create My Plan →
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}
