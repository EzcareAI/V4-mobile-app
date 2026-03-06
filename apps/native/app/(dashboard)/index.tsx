import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DailyCheckIn } from "@/components/home/daily-check-in";
import { FloatingOrb } from "@/components/home/floating-orb";
import { HealthCoreHero } from "@/components/home/health-core-hero";
import { MicroMissions } from "@/components/home/micro-missions";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function HomeScreen() {
	const { computeHealthScore, healthScore } = useOnboardingStore();
	const { streak } = useDashboardStore();

	const score = healthScore ?? computeHealthScore();

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				style={styles.scroll}
			>
				{/* ── Hero: Health Core Ring + Body Scan Diagram ── */}
				<HealthCoreHero score={score} streak={streak} />

				{/* ── Daily Check-In ── */}
				<DailyCheckIn />

				{/* ── Micro Missions ── */}
				<MicroMissions />
			</ScrollView>

			{/* ── Floating Orb Overlay ── */}
			<FloatingOrb />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: "#0B0E17",
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingBottom: 32,
	},
});
