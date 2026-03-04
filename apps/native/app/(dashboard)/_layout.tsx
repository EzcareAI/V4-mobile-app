import { Tabs } from "expo-router";
import { Home, LineChart, Settings } from "lucide-react-native";
import { Platform, StyleSheet, View } from "react-native";

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
			<Icon size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
		</View>
	);
}

export default function DashboardLayout() {
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
					height: Platform.OS === "ios" ? 88 : 64,
					paddingBottom: Platform.OS === "ios" ? 28 : 10,
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
						<TabBarIcon Icon={Home} color={color} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="progress"
				options={{
					title: "Progress",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon Icon={LineChart} color={color} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Settings",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon Icon={Settings} color={color} focused={focused} />
					),
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	iconWrap: {
		width: 40,
		height: 30,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 12,
	},
	iconWrapActive: {
		backgroundColor: "rgba(62,201,181,0.12)",
	},
});
