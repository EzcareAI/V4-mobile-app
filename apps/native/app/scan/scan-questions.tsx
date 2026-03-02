import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { useMutation } from "@tanstack/react-query";

import { Container } from "@/components/container";
import {
	type ScanCard,
	ScanCardEngine,
} from "@/components/scan/scan-card-engine";
import { useScanStore } from "@/stores/scan-store";
import { trpc } from "@/utils/trpc";

// POC hardcoded question flow (deterministic, no AI)
const SCAN_CARDS: ScanCard[] = [
	{
		id: "duration",
		type: "choice",
		question: "How long have you been experiencing this?",
		options: ["Less than a day", "1-3 days", "4-7 days", "More than a week"],
	},
	{
		id: "severity",
		type: "scale",
		question: "How severe is it right now?",
	},
	{
		id: "constant",
		type: "yesno",
		question: "Is it constant or does it come and go?",
	},
	{
		id: "sleep",
		type: "scale",
		question: "How many hours did you sleep last night?",
	},
	{
		id: "stress",
		type: "scale",
		question: "How stressed have you been lately?",
	},
	{
		id: "exercise",
		type: "choice",
		question: "How often do you exercise?",
		options: ["Never", "1-2 times/week", "3-4 times/week", "5+ times/week"],
	},
	{
		id: "diet",
		type: "choice",
		question: "How would you describe your diet?",
		options: ["Standard", "Vegetarian", "Vegan", "Keto", "Other"],
	},
];

export default function ScanQuestions() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { zone, symptom, scanId, setScanId } = useScanStore();

	const createScan = useMutation(trpc.scan.create.mutationOptions());
	const submitAnswers = useMutation(trpc.scan.submitAnswers.mutationOptions());

	const handleComplete = async (answers: Record<string, unknown>) => {
		try {
			setIsSubmitting(true);

			// Create scan if not already created
			let currentScanId = scanId;
			if (!currentScanId) {
				const scan = await createScan.mutateAsync({
					startedAt: new Date().toISOString(),
				});
				currentScanId = scan.scanId;
				setScanId(currentScanId as string);
			}

			if (!currentScanId) {
				return;
			}

			await submitAnswers.mutateAsync({
				scanId: currentScanId,
				answers: {
					symptoms: {
						primary: {
							category: zone as string,
							description: symptom || "",
							severity: (answers.severity as number) || 5,
							duration_days: getDurationDays(answers.duration as string),
						},
						secondary: [],
					},
					lifestyle: {
						sleep_hours: (answers.sleep as number) || 7,
						stress_level: (answers.stress as number) || 5,
						exercise_frequency: mapExercise(answers.exercise as string),
						diet_type: (answers.diet as string) || "standard",
					},
					medical_context: {
						age_range: "26-35",
						biological_sex: "prefer-not-to-say",
					},
				},
			});

			// Navigate to result
			router.push(`/scan/scan-result?scanId=${currentScanId}`);
		} catch (error) {
			console.error("Failed to submit scan:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isSubmitting) {
		return (
			<Container className="items-center justify-center">
				<ActivityIndicator size="large" />
				<Text className="mt-4 text-muted">Analyzing your scan...</Text>
			</Container>
		);
	}

	return (
		<Container>
			<ScanCardEngine cards={SCAN_CARDS} onComplete={handleComplete} />
		</Container>
	);
}

// Helper functions
function getDurationDays(duration: string): number {
	if (duration === "Less than a day") {
		return 0;
	}
	if (duration === "1-3 days") {
		return 2;
	}
	if (duration === "4-7 days") {
		return 5;
	}
	return 14;
}

function mapExercise(
	exercise: string
): "none" | "light" | "moderate" | "intense" {
	if (exercise === "Never") {
		return "none";
	}
	if (exercise === "1-2 times/week") {
		return "light";
	}
	if (exercise === "3-4 times/week") {
		return "moderate";
	}
	return "intense";
}
