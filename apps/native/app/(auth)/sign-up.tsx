import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { Button, Card, Checkbox, FormField, TextField } from "heroui-native";
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

const signUpSchema = z
	.object({
		fullName: z.string().min(2, "Full name must be at least 2 characters"),
		email: z.string().email("Please enter a valid email address"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z
			.string()
			.min(6, "Password must be at least 6 characters"),
		agree: z.boolean().refine((val) => val === true, {
			message: "You must agree to the terms",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
	const router = useRouter();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
		useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { control, handleSubmit, watch } = useForm<SignUpForm>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			fullName: "",
			email: "",
			password: "",
			confirmPassword: "",
			agree: false,
		},
	});

	const isAgreed = watch("agree");

	const onSubmit = async (data: SignUpForm) => {
		setIsLoading(true);
		try {
			const { error } = await authClient.signUp.email({
				email: data.email,
				password: data.password,
				name: data.fullName,
			});

			if (error) {
				Alert.alert("Error", error.message || "Failed to create account");
				return;
			}

			Alert.alert("Success", "Account created! You can now sign in.", [
				{ text: "OK", onPress: () => router.replace("/(auth)/sign-in") },
			]);
		} catch (error) {
			Alert.alert("Error", "An unexpected error occurred");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
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
					<Text className="font-bold text-foreground text-xl">Sign Up</Text>
					<View className="w-8" />
				</View>

				{/* Hero Card */}
				<Card
					className="mb-8 justify-center rounded-3xl p-8"
					variant="secondary"
				>
					<LinearGradient
						colors={["#4F46E5", "#2DD4BF"]}
						end={{ x: 1, y: 1 }}
						start={{ x: 0, y: 0 }}
						style={StyleSheet.absoluteFill}
					/>
					<Text className="mb-2 text-center font-bold text-3xl text-white">
						Join EZCare AI
					</Text>
					<Text className="text-center font-medium text-white/90">
						Start your health journey with Ez
					</Text>
				</Card>

				<View className="gap-6">
					{/* Full Name */}
					<View className="gap-2">
						<KeyboardAvoidingContainer>
							<Controller
								control={control}
								name="fullName"
								render={({
									field: { onChange, onBlur, value },
									fieldState: { error },
								}) => (
									<TextField isInvalid={!!error} isRequired>
										<TextField.Label>Full Name</TextField.Label>
										<View className="w-full flex-row items-center">
											<TextField.Input
												className="flex-1 px-10"
												onBlur={onBlur}
												onChangeText={onChange}
												placeholder="Enter your full name"
												value={value}
											/>
											<StyledIonicons
												className="absolute left-3.5 text-muted"
												name="person-outline"
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
										<TextField.Label>Email Address</TextField.Label>
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
												placeholder="Create a password"
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
					</View>
					{/* Confirm Password */}
					<View className="gap-2">
						<KeyboardAvoidingContainer>
							<Controller
								control={control}
								name="confirmPassword"
								render={({
									field: { onChange, onBlur, value },
									fieldState: { error },
								}) => (
									<TextField isInvalid={!!error} isRequired>
										<TextField.Label>Confirm Password</TextField.Label>
										<View className="w-full flex-row items-center">
											<TextField.Input
												className="flex-1 px-10"
												onBlur={onBlur}
												onChangeText={onChange}
												placeholder="Confirm your password"
												secureTextEntry={!isConfirmPasswordVisible}
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
												onPress={() =>
													setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
												}
											>
												<StyledIonicons
													className="text-muted"
													name={
														isConfirmPasswordVisible
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
					</View>
					{/* Terms Checkbox */}
					<Controller
						control={control}
						name="agree"
						render={({ field: { onChange, value }, fieldState: { error } }) => (
							<View>
								<FormField
									className="flex-row items-center gap-3"
									isSelected={value}
									onSelectedChange={onChange}
								>
									<FormField.Indicator>
										<Checkbox />
									</FormField.Indicator>
									<View className="-mt-1 flex-1 flex-row items-center">
										<Text className="text-muted-foreground leading-5">
											I agree to the{" "}
										</Text>
										<TouchableOpacity
											onPress={() => router.push("/privacy-policy")}
										>
											<Text className="font-medium text-accent">
												Privacy Policy{" "}
											</Text>
										</TouchableOpacity>
										<Text className="text-muted-foreground">and </Text>
										<TouchableOpacity
											onPress={() => router.push("/terms-of-service")}
										>
											<Text className="font-medium text-accent">
												Terms of Service
											</Text>
										</TouchableOpacity>
									</View>
								</FormField>
								{error && (
									<Text className="mt-1 text-danger text-xs">
										{error.message}
									</Text>
								)}
							</View>
						)}
					/>
					{/* Sign Up Button */}
					<ContinueButton
						isDisabled={isLoading || !isAgreed}
						label={isLoading ? "Creating Account..." : "Create Account"}
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
						size="lg"
						variant="ghost"
					>
						<StyledIonicons
							className="mr-1"
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
							Already have an account?{" "}
						</Text>
						<TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
							<Text className="font-bold text-accent">Sign In</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
