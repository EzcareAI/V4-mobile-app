import { ImpactFeedbackStyle, NotificationFeedbackType, impactAsync, notificationAsync } from "expo-haptics";
import { Star } from "lucide-react-native";
import React from "react";
import {
	Animated,
	Linking,
	Modal,
	Platform,
	Pressable,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

// Native store listing for the "rate us" hand-off (no extra native dep needed).
const APP_STORE_URL = "https://apps.apple.com/app/id6752955679?action=write-review";
const PLAY_STORE_URL = "market://details?id=com.ezcareaiolder";
const PLAY_STORE_WEB = "https://play.google.com/store/apps/details?id=com.ezcareaiolder";

/**
 * In-onboarding star-rating popup. Shows once (guarded by the
 * `ratingPromptShown` flag in the onboarding store). High ratings (4-5) are
 * gently routed to the public store listing; lower ratings are kept in-app.
 */
export const RatingPopup = ({
	visible,
	onClose,
}: {
	visible: boolean;
	onClose: () => void;
}) => {
	const { setAnswer } = useOnboardingStore();
	const [rating, setRating] = React.useState(0);
	const [submitted, setSubmitted] = React.useState(false);
	const scale = React.useRef(new Animated.Value(0.9)).current;

	React.useEffect(() => {
		if (visible) {
			scale.setValue(0.9);
			Animated.spring(scale, {
				toValue: 1,
				damping: 14,
				stiffness: 180,
				useNativeDriver: true,
			}).start();
		}
	}, [visible, scale]);

	const handleStar = (value: number) => {
		setRating(value);
		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
		}
	};

	const openStore = () => {
		if (Platform.OS === "ios") {
			Linking.openURL(APP_STORE_URL).catch(() => {});
		} else {
			Linking.openURL(PLAY_STORE_URL).catch(() => {
				Linking.openURL(PLAY_STORE_WEB).catch(() => {});
			});
		}
	};

	const handleSubmit = () => {
		if (rating === 0) return;
		setAnswer("appRating", rating);
		setAnswer("ratingPromptShown", true);
		if (Platform.OS === "ios") {
			notificationAsync(NotificationFeedbackType.Success).catch(() => {});
		}
		setSubmitted(true);
	};

	const dismiss = () => {
		// Mark as shown so it never reappears, even if dismissed without rating.
		setAnswer("ratingPromptShown", true);
		onClose();
	};

	const isHigh = rating >= 4;

	return (
		<Modal animationType="fade" transparent visible={visible} onRequestClose={dismiss}>
			<Pressable
				onPress={dismiss}
				style={{
					flex: 1,
					backgroundColor: "rgba(13,33,55,0.55)",
					alignItems: "center",
					justifyContent: "center",
					paddingHorizontal: 28,
				}}
			>
				<Animated.View
					style={{ width: "100%", transform: [{ scale }] }}
					// Stop taps inside the card from closing the modal.
					onStartShouldSetResponder={() => true}
				>
					<View
						style={{
							backgroundColor: "#FFFFFF",
							borderRadius: 28,
							padding: 26,
							alignItems: "center",
						}}
					>
						{!submitted ? (
							<>
								<Text style={{ fontSize: 22, fontWeight: "800", color: "#0d2137", textAlign: "center" }}>
									How's your progress so far?
								</Text>
								<Text
									style={{
										fontSize: 14,
										color: "#73808C",
										textAlign: "center",
										marginTop: 8,
										lineHeight: 20,
									}}
								>
									Your rating helps us keep improving EZCare for you.
								</Text>

								<View style={{ flexDirection: "row", gap: 8, marginVertical: 24 }}>
									{[1, 2, 3, 4, 5].map((v) => (
										<TouchableOpacity key={v} activeOpacity={0.7} onPress={() => handleStar(v)}>
											<Star
												color={v <= rating ? "#FFB300" : "#D9E2E0"}
												fill={v <= rating ? "#FFB300" : "#D9E2E0"}
												size={40}
											/>
										</TouchableOpacity>
									))}
								</View>

								<TouchableOpacity
									activeOpacity={0.85}
									disabled={rating === 0}
									onPress={handleSubmit}
									style={{
										width: "100%",
										height: 52,
										borderRadius: 26,
										alignItems: "center",
										justifyContent: "center",
										backgroundColor: rating === 0 ? "#CBD5D2" : "#28B898",
									}}
								>
									<Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>Submit</Text>
								</TouchableOpacity>

								<TouchableOpacity onPress={dismiss} style={{ marginTop: 12, padding: 6 }}>
									<Text style={{ color: "#94A3B8", fontSize: 14, textDecorationLine: "underline" }}>
										Not now
									</Text>
								</TouchableOpacity>
							</>
						) : (
							<>
								<View style={{ flexDirection: "row", gap: 4, marginBottom: 16 }}>
									{[1, 2, 3, 4, 5].map((v) => (
										<Star
											key={v}
											color={v <= rating ? "#FFB300" : "#D9E2E0"}
											fill={v <= rating ? "#FFB300" : "#D9E2E0"}
											size={28}
										/>
									))}
								</View>
								<Text style={{ fontSize: 20, fontWeight: "800", color: "#0d2137", textAlign: "center" }}>
									{isHigh ? "Thank you!" : "Thanks for your feedback"}
								</Text>
								<Text
									style={{
										fontSize: 14,
										color: "#73808C",
										textAlign: "center",
										marginTop: 8,
										lineHeight: 20,
									}}
								>
									{isHigh
										? "We're so glad EZCare is helping. Would you share your rating on the store?"
										: "We'll keep working to make EZCare better for you."}
								</Text>

								{isHigh && (
									<TouchableOpacity
										activeOpacity={0.85}
										onPress={() => {
											openStore();
											onClose();
										}}
										style={{
											width: "100%",
											height: 52,
											borderRadius: 26,
											alignItems: "center",
											justifyContent: "center",
											backgroundColor: "#28B898",
											marginTop: 20,
										}}
									>
										<Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>
											Rate on the store
										</Text>
									</TouchableOpacity>
								)}

								<TouchableOpacity onPress={onClose} style={{ marginTop: 12, padding: 6 }}>
									<Text style={{ color: "#94A3B8", fontSize: 14, textDecorationLine: "underline" }}>
										Continue
									</Text>
								</TouchableOpacity>
							</>
						)}
					</View>
				</Animated.View>
			</Pressable>
		</Modal>
	);
};
