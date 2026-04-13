import * as AppleAuthentication from "expo-apple-authentication";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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
import Svg, { Path } from "react-native-svg";
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/stores/onboarding-store";

// Required for expo-auth-session to properly close the browser
WebBrowser.maybeCompleteAuthSession();

export function AccountCreationScreen() {
	const router = useRouter();
	const { setAnswer, nextStep, firstName } = useOnboardingStore();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [appleLoading, setAppleLoading] = useState(false);
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

		if (!(hasMinLength && hasUpperCase && hasSpecialChar)) {
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
		router.push("/(onboarding)/23");
	};

	const handleOAuthResult = async (
		result: WebBrowser.WebBrowserAuthSessionResult,
		provider: "google" | "apple"
	) => {
		if (result.type !== "success") {
			if (result.type !== "cancel" && result.type !== "dismiss") {
				setErrorMsg("Authentication was cancelled or failed.");
			}
			return;
		}

		const url = result.url;

		// Exchange the auth code (PKCE flow) or parse fragment tokens
		try {
			// Try PKCE code exchange first (recommended approach)
			const { data: sessionData, error: sessionError } =
				await supabase.auth.exchangeCodeForSession(url);

			if (sessionError) {
				// Fallback: try extracting tokens from hash/query string
				const hashIndex = url.indexOf("#");
				const queryIndex = url.indexOf("?");
				let paramsStr = "";
				if (hashIndex !== -1) {
					paramsStr = url.substring(hashIndex + 1);
				} else if (queryIndex !== -1) {
					paramsStr = url.substring(queryIndex + 1);
				}

				const params = paramsStr.split("&").reduce(
					(acc, pair) => {
						const eqIdx = pair.indexOf("=");
						if (eqIdx > 0) {
							const k = pair.substring(0, eqIdx);
							const v = decodeURIComponent(pair.substring(eqIdx + 1));
							acc[k] = v;
						}
						return acc;
					},
					{} as Record<string, string>
				);

				if (params.error_description) {
					setErrorMsg(params.error_description.replace(/\+/g, " "));
					return;
				}

				if (params.access_token && params.refresh_token) {
					const { data: tokenSession, error: tokenError } =
						await supabase.auth.setSession({
							access_token: params.access_token,
							refresh_token: params.refresh_token,
						});
					if (tokenError) {
						setErrorMsg(tokenError.message);
						return;
					}
					if (tokenSession.user) {
						setAnswer("userId", tokenSession.user.id);
						const userEmail = tokenSession.user.email ?? email;
						if (userEmail) {
							setAnswer("email", userEmail);
						}
						setAnswer("authMethod", provider);
						nextStep();
						router.push("/(onboarding)/23");
					}
				} else {
					setErrorMsg("Authentication failed. Please try again.");
				}
				return;
			}

			if (sessionData.user) {
				setAnswer("userId", sessionData.user.id);
				const userEmail = sessionData.user.email ?? email;
				if (userEmail) {
					setAnswer("email", userEmail);
				}
				setAnswer("authMethod", provider);
				nextStep();
				router.push("/(onboarding)/23");
			}
		} catch {
			setErrorMsg("Authentication failed. Please try again.");
		}
	};

	const handleAppleSignIn = async () => {
		try {
			await impactAsync(ImpactFeedbackStyle.Medium);
		} catch {
			/* ignore */
		}

		setAppleLoading(true);
		setErrorMsg("");

		if (Platform.OS === "ios") {
			try {
				const credential = await AppleAuthentication.signInAsync({
					requestedScopes: [
						AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
						AppleAuthentication.AppleAuthenticationScope.EMAIL,
					],
				});

				if (!credential.identityToken) {
					setErrorMsg("Apple Sign-In failed — no identity token received.");
					return;
				}

				const { data, error } = await supabase.auth.signInWithIdToken({
					provider: "apple",
					token: credential.identityToken,
				});

				if (error) {
					setErrorMsg(error.message);
					return;
				}

				if (data.user) {
					setAnswer("userId", data.user.id);
					const userEmail = data.user.email ?? credential.email ?? email;
					setAnswer("email", userEmail);
					// Prefer Apple-provided name if user doesn't have one yet
					if (!firstName && credential.fullName?.givenName) {
						setAnswer("firstName", credential.fullName.givenName);
					}
					setAnswer("authMethod", "apple");
					nextStep();
					router.push("/(onboarding)/23");
				}
			} catch (err: unknown) {
				const appleErr = err as { code?: string };
				if (appleErr.code === "ERR_REQUEST_CANCELED") {
					setAppleLoading(false);
					return; // User dismissed — not an error
				}
				console.error("Apple sign-in error:", err);
				setErrorMsg(
					"Something went wrong with Apple sign-in. Please try again."
				);
			} finally {
				setAppleLoading(false);
			}
		} else {
			// Web or Android Apple Sign-In via OAuth
			try {
				const redirectTo = Linking.createURL("auth/callback");
				const { data, error } = await supabase.auth.signInWithOAuth({
					provider: "apple",
					options: {
						redirectTo,
						skipBrowserRedirect: true,
					},
				});

				if (error || !data.url) {
					setErrorMsg(error?.message ?? "Could not start Apple sign-in.");
					setAppleLoading(false);
					return;
				}

				const result = await WebBrowser.openAuthSessionAsync(
					data.url,
					redirectTo
				);
				await handleOAuthResult(result, "apple");
			} catch (err) {
				console.error("Apple web sign-in error:", err);
				setErrorMsg(
					"Something went wrong with Apple sign-in. Please try again."
				);
			} finally {
				setAppleLoading(false);
			}
		}
	};
	const handleGoogleSignIn = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {
				/* ignore */
			}
		}

		setGoogleLoading(true);
		setErrorMsg("");
		try {
			// Use Expo Linking to build the redirect URL using the app's scheme
			// This creates e.g. "ezcare://auth/callback" that the OS can intercept
			const redirectTo = Linking.createURL("auth/callback");

			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo,
					skipBrowserRedirect: true,
				},
			});

			if (error || !data.url) {
				setErrorMsg(error?.message ?? "Could not start Google sign-in.");
				setGoogleLoading(false);
				return;
			}

			// openAuthSessionAsync intercepts the redirectTo URL and returns it
			// instead of opening it in the browser — fixes "site can't be reached"
			const result = await WebBrowser.openAuthSessionAsync(
				data.url,
				redirectTo
			);
			await handleOAuthResult(result, "google");
		} catch (err) {
			console.error("Google sign-in error:", err);
			setErrorMsg(
				"Something went wrong with Google sign-in. Please try again."
			);
		} finally {
			setGoogleLoading(false);
		}
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
						Let's create your private account to save your personalized wellness
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
					{/* Apple Button - Universal now */}
					<TouchableOpacity
						activeOpacity={0.8}
						className="flex-row items-center justify-center gap-x-2 rounded-[24px] bg-[#000000] py-4 shadow-sm"
						disabled={appleLoading}
						onPress={handleAppleSignIn}
					>
						{appleLoading ? (
							<ActivityIndicator color="white" />
						) : (
							<>
								<Svg height="22" viewBox="0 0 384 512" width="18">
									<Path
										d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
										fill="white"
									/>
								</Svg>
								<Text className="font-bold text-[17px] text-white tracking-wide">
									Continue with Apple
								</Text>
							</>
						)}
					</TouchableOpacity>

					{/* Google Button */}
					<TouchableOpacity
						activeOpacity={0.8}
						className="flex-row items-center justify-center gap-x-2 rounded-[24px] border border-slate-200 bg-white py-4 shadow-sm"
						disabled={googleLoading}
						onPress={handleGoogleSignIn}
					>
						{googleLoading ? (
							<ActivityIndicator color="#4285F4" />
						) : (
							<Text className="font-bold text-[#29303D] text-[17px] tracking-wide">
								<Text className="text-xl">G</Text> Continue with Google
							</Text>
						)}
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
						Secure cloud sync • Encrypted storage • No data sharing with
						third parties.
					</Text>
				</View>

				{/* Privacy Notice */}
				<Text className="mb-4 px-4 text-center font-medium text-[#73808C] text-[13px] leading-5">
					By creating an account, you agree to our{"\n"}
					<Text className="font-bold text-[#73808C] underline" onPress={() => router.push("/terms-of-service")}>Terms of Use</Text> and{" "}
					<Text className="font-bold text-[#73808C] underline" onPress={() => router.push("/privacy-policy")}>Privacy Policy</Text>.
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
