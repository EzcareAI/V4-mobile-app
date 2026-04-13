import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/stores/onboarding-store";

const TEAL = "#3EC9B5";
const DARK = "#1A1A2E";
const GREY = "#94A3B8";

export default function SignInScreen() {
	const router = useRouter();
	const { setAnswer } = useOnboardingStore();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	const handleSignIn = async () => {
		if (!(email && password)) {
			setErrorMsg("Please enter your email and password.");
			return;
		}

		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Medium).catch(() => {
				/* ignore */
			});
		}

		setLoading(true);
		setErrorMsg("");

		const { data, error } = await supabase.auth.signInWithPassword({
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
			setAnswer("email", data.user.email ?? email);
			setAnswer("onboardingComplete", true);
		}

		setLoading(false);
		router.replace("/(dashboard)");
	};

	return (
		<LinearGradient
			colors={["#e8faf6", "#ddf0f9", "#ffffff"]}
			end={{ x: 0.5, y: 1 }}
			start={{ x: 0.5, y: 0 }}
			style={styles.gradient}
		>
			<SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					style={styles.flex}
				>
					<ScrollView
						contentContainerStyle={styles.content}
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
					>
						{/* Header */}
						<View style={styles.header}>
							<TouchableOpacity
								onPress={() => router.back()}
								style={styles.back}
							>
								<Text style={styles.backText}>← Back</Text>
							</TouchableOpacity>
						</View>

						{/* Title */}
						<View style={styles.titleSection}>
							<Text style={styles.title}>Welcome Back 👋</Text>
							<Text style={styles.subtitle}>
								Sign in to continue your wellness journey
							</Text>
						</View>

						{/* Form */}
						<View style={styles.form}>
							{errorMsg.length > 0 && (
								<View style={styles.errorBox}>
									<Text style={styles.errorText}>{errorMsg}</Text>
								</View>
							)}

							<View style={styles.field}>
								<Text style={styles.fieldLabel}>Email</Text>
								<TextInput
									autoCapitalize="none"
									autoComplete="email"
									keyboardType="email-address"
									onChangeText={setEmail}
									placeholder="you@example.com"
									placeholderTextColor={GREY}
									style={styles.input}
									value={email}
								/>
							</View>

							<View style={styles.field}>
								<Text style={styles.fieldLabel}>Password</Text>
								<TextInput
									autoCapitalize="none"
									autoComplete="password"
									onChangeText={setPassword}
									placeholder="••••••••"
									placeholderTextColor={GREY}
									secureTextEntry
									style={styles.input}
									value={password}
								/>
							</View>

							<TouchableOpacity
								activeOpacity={0.88}
								disabled={loading}
								onPress={handleSignIn}
								style={styles.signInBtn}
							>
								{loading ? (
									<ActivityIndicator color="#fff" />
								) : (
									<LinearGradient
										colors={[TEAL, "#3BAFDA"]}
										end={{ x: 1, y: 0 }}
										start={{ x: 0, y: 0 }}
										style={StyleSheet.absoluteFill}
									/>
								)}
								<Text style={styles.signInBtnText}>Sign In</Text>
							</TouchableOpacity>
						</View>

						{/* Footer link */}
						<View style={styles.footer}>
							<Text style={styles.footerNote}>Don't have an account? </Text>
							<TouchableOpacity
								onPress={() => router.replace("/(onboarding)/1")}
							>
								<Text style={styles.footerLink}>Get Started</Text>
							</TouchableOpacity>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	gradient: { flex: 1 },
	safe: { flex: 1 },
	flex: { flex: 1 },
	content: {
		flexGrow: 1,
		paddingHorizontal: 28,
		paddingBottom: 40,
	},
	header: {
		paddingTop: 16,
		marginBottom: 8,
	},
	back: { paddingVertical: 8 },
	backText: { color: TEAL, fontWeight: "700", fontSize: 16 },
	titleSection: {
		marginTop: 24,
		marginBottom: 36,
	},
	title: {
		fontSize: 34,
		fontWeight: "800",
		color: DARK,
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 16,
		color: GREY,
		marginTop: 6,
		lineHeight: 22,
	},
	form: { gap: 20 },
	field: { gap: 6 },
	fieldLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: DARK,
	},
	input: {
		height: 52,
		borderRadius: 14,
		backgroundColor: "#FFFFFF",
		paddingHorizontal: 16,
		fontSize: 16,
		color: DARK,
		borderWidth: 1.5,
		borderColor: "rgba(0,0,0,0.08)",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04,
		shadowRadius: 4,
		elevation: 1,
	},
	signInBtn: {
		height: 56,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
		marginTop: 8,
		backgroundColor: TEAL,
		shadowColor: TEAL,
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.35,
		shadowRadius: 14,
		elevation: 8,
	},
	signInBtnText: {
		fontSize: 17,
		fontWeight: "700",
		color: "#FFFFFF",
		letterSpacing: 0.3,
	},
	errorBox: {
		backgroundColor: "#FEE2E2",
		borderRadius: 12,
		padding: 14,
		borderWidth: 1,
		borderColor: "#FECACA",
	},
	errorText: {
		color: "#DC2626",
		fontSize: 13,
		fontWeight: "600",
		lineHeight: 18,
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 40,
	},
	footerNote: { color: GREY, fontSize: 14 },
	footerLink: { color: TEAL, fontWeight: "700", fontSize: 14 },
});
