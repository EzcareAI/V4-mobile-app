import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DailyCheckIn } from "@/components/home/daily-check-in";
import { FloatingOrb } from "@/components/home/floating-orb";
import { HealthCoreHero } from "@/components/home/health-core-hero";
import { MicroMissions } from "@/components/home/micro-missions";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function HomeScreen() {
	const { healthScore, computeHealthScore } = useOnboardingStore();
	const { streak, resetDailyMissions } = useDashboardStore();

	// Reset missions at the start of each new day
	useEffect(() => {
		resetDailyMissions();
	}, [resetDailyMissions]);

	// Compute health score from onboarding data if not yet set
	const score = healthScore ?? computeHealthScore();

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<HealthCoreHero streak={streak} score={score} />
				<DailyCheckIn />
				<MicroMissions />
			</ScrollView>

			{/* Floating AI Orb — rendered outside ScrollView so it stays fixed */}
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
		paddingBottom: 16,
	},
});
