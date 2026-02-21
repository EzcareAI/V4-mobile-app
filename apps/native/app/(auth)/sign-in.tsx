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
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { z } from "zod";

import { KeyboardAvoidingContainer } from "@/components/keyboard-avoiding-container";
import { ContinueButton } from "@/components/onboarding/common/continue-button";
import { authClient } from "@/lib/auth-client";

const StyledIonicons = withUniwind(Ionicons);

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

			// Redirection is handled by root layout's session check
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
			<ScrollView
				contentContainerClassName="p-6 pb-10"
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
						<KeyboardAvoidingContainer>
							<Controller
								control={control}
								name="email"
								render={({
									field: { onChange, onBlur, value },
									fieldState: { error },
								}) => (
									<TextField isInvalid={!!error} isRequired>
										<TextField.Label>Email</TextField.Label>
										<View className="w-full flex-row items-center">
											<TextField.Input
												autoCapitalize="none"
												className="flex-1 px-10"
												keyboardType="email-address"
												onBlur={onBlur}
												onChangeText={onChange}
												placeholder="Enter your email"
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
						</KeyboardAvoidingContainer>
					</View>

					{/* Password */}
					<View className="gap-2">
						<KeyboardAvoidingContainer>
							<Controller
								control={control}
								name="password"
								render={({
									field: { onChange, onBlur, value },
									fieldState: { error },
								}) => (
									<TextField isInvalid={!!error} isRequired>
										<TextField.Label>Password</TextField.Label>
										<View className="w-full flex-row items-center">
											<TextField.Input
												className="flex-1 px-10"
												onBlur={onBlur}
												onChangeText={onChange}
												placeholder="Enter your password"
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
														isPasswordVisible
															? "eye-off-outline"
															: "eye-outline"
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
						</KeyboardAvoidingContainer>
						<TouchableOpacity className="mt-1 self-end">
							<Text className="font-semibold text-accent">
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
						className="border-default-200 bg-surface shadow-sm"
						onPress={() => handleSocialLogin("google")}
						size="lg"
						variant="ghost"
					>
						<StyledIonicons
							className="mr-1 text-[#4285F4]"
							name="logo-google"
							pointerEvents="none"
							size={20}
						/>
						<Text className="font-semibold text-foreground">
							Continue with Google
						</Text>
					</Button>

					<Button
						className="bg-[#1e1e1e] shadow-sm"
						onPress={() => handleSocialLogin("apple")}
						size="lg"
						variant="primary"
					>
						<StyledIonicons
							className="mr-1 text-white"
							name="logo-apple"
							pointerEvents="none"
							size={20}
						/>
						<Text className="font-semibold text-white">
							Continue with Apple
						</Text>
					</Button>

					{/* Footer */}
					<View className="flex-row justify-center">
						<Text className="text-muted-foreground">
							Don't have an account?{" "}
						</Text>
						<TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
							<Text className="font-bold text-accent">Sign Up</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
