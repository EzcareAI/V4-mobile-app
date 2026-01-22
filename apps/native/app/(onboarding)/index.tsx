import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Check, Leaf } from "lucide-react-native";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingIndex() {
	const router = useRouter();

	const handleStart = () => {
		router.push("/(onboarding)/1");
	};

	return (
		<LinearGradient colors={["#F8FEFE", "#E6F7F7"]} style={{ flex: 1 }}>
			<SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>
				<View className="flex-1 flex-col">
					{/* 1. Character Card Section - Takes remaining space */}
					<View className="flex-1 items-center justify-center">
						<View className="h-56 w-56 items-center justify-center rounded-[32px] bg-white shadow-[#40E0D0]/20 shadow-lg">
							<Text className="text-[80px]">🤖</Text>
							<View className="mt-4 h-1.5 w-16 rounded-full bg-[#40E0D0]/20" />
						</View>
					</View>

					{/* 2. Branding Section - Fixed height */}
					<View className="items-center pb-6">
						{/* Logo Badge */}
						<View className="mb-6 flex-row items-center gap-3 rounded-2xl border border-white/50 bg-white/40 px-5 py-2.5">
							<View className="h-10 w-10 items-center justify-center rounded-xl bg-accent">
								<View className="absolute h-0.5 w-3.5 rounded-full bg-white" />
								<View className="absolute h-3.5 w-0.5 rounded-full bg-white" />
							</View>
							<Text className="font-bold text-2xl text-accent">EZCare AI</Text>
						</View>

						{/* Headline */}
						<Text className="text-center font-bold text-[#0d2137] text-[32px] leading-10">
							Welcome to
						</Text>
						<Text className="text-center font-bold text-[#0d2137] text-[32px] leading-10">
							EZCare AI
						</Text>

						{/* Subheadline */}
						<Text className="mt-3 text-center font-medium text-base text-slate-500">
							Your Natural Healing Companion.
						</Text>
					</View>

					{/* 3. Footer Section - Fixed height */}
					<View className="items-center gap-5 pb-4">
						{/* Get Started Button */}
						<Button
							className="h-16 w-full rounded-3xl"
							onPress={handleStart}
							variant="primary"
						>
							<Button.Label className="font-bold text-[19px]">
								Get Started
							</Button.Label>
						</Button>

						{/* Sign In Link */}
						<View className="flex-row items-center">
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
		</LinearGradient>
	);
}
