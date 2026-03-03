import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { Button, Card, TextField } from "heroui-native";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Alert,
	Pressable,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { z } from "zod";

import { ContinueButton } from "@/components/onboarding/common/continue-button";
import { authClient } from "@/lib/auth-client";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { mapOnboardingToProfile } from "@/utils/onboarding-sync";
import { api } from "@/utils/trpc";

const StyledIonicons = withUniwind(Ionicons);

const GoogleLogo = ({ size = 24 }) => (
	<Svg height={size} viewBox="0 0 24 24" width={size}>
		<Path
			d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
			fill="#4285F4"
		/>
		<Path
			d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
			fill="#34A853"
		/>
		<Path
			d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
			fill="#FBBC05"
		/>
		<Path
			d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
			fill="#EA4335"
		/>
	</Svg>
);

const signInSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignInScreen() {
	const router = useRouter();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { control, handleSubmit } = useForm<SignInForm>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: SignInForm) => {
		setIsLoading(true);
		try {
			const { error } = await authClient.signIn.email({
				email: data.email,
				password: data.password,
			});

			if (error) {
				Alert.alert("Error", error.message || "Invalid email or password");
				return;
			}

			// 2. Sync local onboarding data if it exists and profile is incomplete
			try {
				const onboardingState = useOnboardingStore.getState();
				// If we have some basic data like gender, assume there's something to sync
				if (onboardingState.gender) {
					const profileInput = mapOnboardingToProfile(onboardingState);
					await api.profile.completeOnboarding.mutate(profileInput);
				}
			} catch (syncError) {
				console.warn("Post-login sync failed:", syncError);
			}

			// Explicit redirection to dashboard after successful login
			router.replace("/(drawer)");
		} catch (error) {
			Alert.alert("Error", "An unexpected error occurred");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSocialLogin = (provider: "google" | "apple") => {
		// Note: For native social auth, you typically need to use keys and deep linking.
		// This is a placeholder for the standard Supabase flow.
		Alert.alert(
			"Not Implemented",
			`Social login with ${provider} is coming soon!`
		);
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<Stack.Screen options={{ headerShown: false }} />
			<KeyboardAwareScrollView
				bottomOffset={62}
				contentContainerClassName="px-8 pt-6 pb-10"
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View className="mb-6 flex-row items-center justify-between">
					<TouchableOpacity className="-ml-2 p-2" onPress={() => router.back()}>
						<ChevronLeft color="#1F2937" size={24} />
					</TouchableOpacity>
					<Text className="font-bold text-foreground text-xl">Sign In</Text>
					<View className="w-8" />
				</View>

				{/* Welcome Card */}
				<Card
					className="mb-8 h-32 justify-center rounded-3xl p-8"
					variant="secondary"
				>
					<LinearGradient
						colors={["#4F46E5", "#2DD4BF"]}
						end={{ x: 1, y: 1 }}
						start={{ x: 0, y: 0 }}
						style={StyleSheet.absoluteFill}
					/>
					<Text className="mb-2 text-center font-bold text-3xl text-white">
						Welcome Back
					</Text>
					<Text className="text-center font-medium text-white/90">
						Continue your health journey with Ez
					</Text>
				</Card>

				<View className="gap-6">
					{/* Email */}
					<View className="gap-2">
						<Controller
							control={control}
							name="email"
							render={({
								field: { onChange, onBlur, value },
								fieldState: { error },
							}) => (
								<TextField isInvalid={!!error} isRequired>
									<TextField.Label className="font-bold text-slate-900">
										Email
									</TextField.Label>
									<View className="w-full flex-row items-center">
										<TextField.Input
											autoCapitalize="none"
											className="flex-1 px-10"
											keyboardType="email-address"
											onBlur={onBlur}
											onChangeText={onChange}
											placeholder="Enter your email"
											placeholderTextColor="#CBD5E1"
											value={value}
										/>
										<StyledIonicons
											className="absolute left-3.5 text-muted"
											name="mail-outline"
											pointerEvents="none"
											size={16}
										/>
									</View>
									<TextField.ErrorMessage>
										{error?.message}
									</TextField.ErrorMessage>
								</TextField>
							)}
						/>
					</View>

					{/* Password */}
					<View className="gap-2">
						<Controller
							control={control}
							name="password"
							render={({
								field: { onChange, onBlur, value },
								fieldState: { error },
							}) => (
								<TextField isInvalid={!!error} isRequired>
									<TextField.Label className="font-bold text-slate-900">
										Password
									</TextField.Label>
									<View className="w-full flex-row items-center">
										<TextField.Input
											className="flex-1 px-10"
											onBlur={onBlur}
											onChangeText={onChange}
											placeholder="Enter your password"
											placeholderTextColor="#CBD5E1"
											secureTextEntry={!isPasswordVisible}
											value={value}
										/>
										<StyledIonicons
											className="absolute left-3.5 text-muted"
											name="lock-closed-outline"
											pointerEvents="none"
											size={16}
										/>
										<Pressable
											className="absolute right-4"
											onPress={() => setIsPasswordVisible(!isPasswordVisible)}
										>
											<StyledIonicons
												className="text-muted"
												name={
													isPasswordVisible ? "eye-off-outline" : "eye-outline"
												}
												size={16}
											/>
										</Pressable>
									</View>
									<TextField.ErrorMessage>
										{error?.message}
									</TextField.ErrorMessage>
								</TextField>
							)}
						/>
						<TouchableOpacity className="mt-1 self-end">
							<Text className="font-semibold text-blue-900">
								Forgot Password?
							</Text>
						</TouchableOpacity>
					</View>

					{/* Sign In Button */}
					<ContinueButton
						isDisabled={isLoading}
						label={isLoading ? "Signing In..." : "Sign In"}
						onPress={handleSubmit(onSubmit)}
					/>

					{/* Or Divider */}
					<View className="flex-row items-center gap-4 py-1">
						<View className="h-px flex-1 bg-muted/10" />
						<Text className="text-muted-foreground text-sm">or</Text>
						<View className="h-px flex-1 bg-muted/10" />
					</View>

					{/* Social Buttons */}
					<Button
						className="h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-lg"
						onPress={() => handleSocialLogin("google")}
						size="lg"
						style={{ shadowColor: "#94a3b8", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 2 }}
						variant="ghost"
					>
						<View className="flex-row items-center justify-center">
							<GoogleLogo size={22} />
							<Text className="ml-3 font-bold text-[#334155] text-[17px]">
								Continue with Google
							</Text>
						</View>
					</Button>
					
					<Button
						className="h-14 items-center justify-center rounded-2xl bg-black shadow-lg"
						onPress={() => handleSocialLogin("apple")}
						size="lg"
						style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
						variant="primary"
					>
						<View className="flex-row items-center justify-center">
							<StyledIonicons
								className="mr-2 text-white"
								name="logo-apple"
								pointerEvents="none"
								size={24}
							/>
							<Text className="ml-1 font-bold text-[17px] text-white">
								Continue with Apple
							</Text>
						</View>
					</Button>

					{/* Footer */}
					<View className="flex-row justify-center">
						<Text className="text-muted-foreground">
							Don't have an account?{" "}
						</Text>
						<TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
							<Text className="font-bold text-[#3EC9B5]">Sign Up</Text>
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAwareScrollView>
		</SafeAreaView>
	);
}
