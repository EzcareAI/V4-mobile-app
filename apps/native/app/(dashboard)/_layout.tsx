import { Redirect, Tabs } from "expo-router";
import { Home, LineChart, Settings, Bot } from "lucide-react-native";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOnboardingStore } from "@/stores/onboarding-store";

// Design tokens — light theme
const TEAL = "#3EC9B5";
const GREY = "#94A3B8";
const BG = "#FFFFFF";

function TabBarIcon({
	Icon,
	color,
	focused,
}: {
	Icon: typeof Home;
	color: string;
	focused: boolean;
}) {
	return (
		<View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
			<Icon color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
		</View>
	);
}

export default function DashboardLayout() {
	const insets = useSafeAreaInsets();
	const isPro = useOnboardingStore((state) => state.isPro);

	if (!isPro) {
		return <Redirect href="/settings/subscription" />;
	}

	// On Android, add the system bottom inset (gesture nav bar height). Floor of 16
	// ensures a visible separation from the nav bar on devices that report a 0 inset
	// under certain edge-to-edge modes.
	// On iOS, use the standard home indicator padding.
	const bottomPad = Platform.OS === "ios" ? 28 : Math.max(insets.bottom, 16);
	const tabBarHeight = Platform.OS === "ios" ? 88 : 60 + bottomPad;

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: TEAL,
				tabBarInactiveTintColor: GREY,
				tabBarStyle: {
					backgroundColor: BG,
					borderTopWidth: 1,
					borderTopColor: "rgba(0,0,0,0.06)",
					height: tabBarHeight,
					paddingBottom: bottomPad,
					paddingTop: 8,
					elevation: 8,
					shadowColor: "#000",
					shadowOffset: { width: 0, height: -2 },
					shadowOpacity: 0.04,
					shadowRadius: 8,
				},
				tabBarLabelStyle: {
					fontSize: 11,
					fontWeight: "600",
					marginTop: 2,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon color={color} focused={focused} Icon={Home} />
					),
				}}
			/>
			<Tabs.Screen
				name="buddy"
				options={{
					title: "EZBuddy",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon color={color} focused={focused} Icon={Bot} />
					),
				}}
			/>
			<Tabs.Screen
				name="progress"
				options={{
					title: "Progress",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon color={color} focused={focused} Icon={LineChart} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Settings",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon color={color} focused={focused} Icon={Settings} />
					),
				}}
			/>
			<Tabs.Screen
				name="analyze-symptoms"
				options={{
					href: null,
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	iconWrap: {
		width: 40,
		height: 32,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 12,
	},
	iconWrapActive: {
		backgroundColor: "rgba(62,201,181,0.12)",
	},
});
