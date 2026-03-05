import { ScrollView, StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DailyCheckIn } from "@/components/home/daily-check-in";
import { FloatingOrb } from "@/components/home/floating-orb";
import { HealthCoreHero } from "@/components/home/health-core-hero";
import { MicroMissions } from "@/components/home/micro-missions";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useOnboardingStore } from "@/stores/onboarding-store";

// ── Design tokens ──────────────────────────────────
const BG = "#F4F6F8"; // Original light theme background

export default function HomeScreen() {
	const { computeHealthScore, healthScore } = useOnboardingStore();
	const { streak } = useDashboardStore();

	const score = healthScore ?? computeHealthScore();

	return (
		<SafeAreaView edges={["top"]} style={styles.safe}>
			<StatusBar barStyle="dark-content" />
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				style={styles.scroll}
			>
				{/* 1️⃣ HEALTH CORE HERO */}
				<HealthCoreHero score={score} streak={streak} />

				{/* 2️⃣ DAILY CHECK-IN (COMPACT BUBBLES) */}
				<DailyCheckIn />

				{/* 3️⃣ MICRO MISSIONS (GAMIFIED XP) */}
				<MicroMissions />
			</ScrollView>

			{/* 4️⃣ FLOATING AI ORB */}
			<FloatingOrb />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: BG,
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingBottom: 120, // Extra space for FloatingOrb
	},
});
