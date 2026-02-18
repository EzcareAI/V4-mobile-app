import { Link, useRouter } from "expo-router";
import { Check, Leaf } from "lucide-react-native";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ContinueButton } from "@/components/onboarding/common/continue-button";

export default function OnboardingIndex() {
	const router = useRouter();

	const handleStart = () => {
		router.push("/(onboarding)/1");
	};

	return (
		<View className="flex-1 bg-gradient-to-b from-teal-50 via-blue-50 to-white">
			<SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>
				<View className="flex-1 flex-col px-1">
					{/* Logo Section - Takes remaining space */}
					<View className="flex-1 items-center justify-center">
						<View className="h-56 w-56 items-center justify-center rounded-[32px] bg-white shadow-lg shadow-teal-200/50">
							<Image
								resizeMode="contain"
								source={require("@/assets/images/EZCare_Logo.jpg")}
								style={{ width: 200, height: 200 }}
							/>
						</View>
					</View>

					{/* Branding Section - Fixed height */}
					<View className="items-center pb-6">
						{/* Headline */}
						<Text className="mb-2 text-center font-bold text-[#0d2137] text-[32px] leading-10">
							Welcome to
						</Text>
						<Text className="bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-center font-bold text-[32px] text-transparent leading-10">
							EZCare AI
						</Text>

						{/* Subheadline */}
						<Text className="mt-3 text-center font-medium text-base text-slate-500">
							Your Natural Healing Companion.
						</Text>
					</View>

					{/* Footer Section - Fixed height */}
					<View className="gap-5 pb-4">
						{/* Get Started Button */}
						<ContinueButton label="Get Started" onPress={handleStart} />

						{/* Sign In Link */}
						<View className="flex-row items-center justify-center">
							<Text className="font-medium text-[15px] text-slate-400">
								Already have an account?{" "}
							</Text>
							<Link asChild href="/sign-in">
								<Text className="font-bold text-[#3EC9B5] text-[15px]">
									Sign in
								</Text>
							</Link>
						</View>

						{/* Trust Indicators */}
						<View className="mt-2 flex-row items-center justify-center gap-4">
							<View className="flex-row items-center gap-2">
								<View className="h-6 w-6 items-center justify-center rounded-full bg-[#3EC9B5]/10">
									<Check color="#3EC9B5" size={14} />
								</View>
								<Text className="font-semibold text-[13px] text-slate-500">
									Clinically Trusted
								</Text>
							</View>
							<View className="h-1 w-1 rounded-full bg-slate-300" />
							<View className="flex-row items-center gap-2">
								<View className="h-6 w-6 items-center justify-center rounded-full bg-[#3EC9B5]/10">
									<Leaf color="#3EC9B5" size={14} />
								</View>
								<Text className="font-semibold text-[13px] text-slate-500">
									100% Natural
								</Text>
							</View>
						</View>
					</View>
				</View>
			</SafeAreaView>
		</View>
	);
}
