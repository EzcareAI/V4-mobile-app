import { useRouter } from "expo-router";
import { Cigarette } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { SingleSelectList } from "../common/single-select-list";
import { StepHeader } from "../common/step-header";

const SMOKING_OPTIONS = [
	{
		id: "never",
		label: "Non-Smoker",
		description: "I prefer clean air and lungs",
		emoji: "🍃",
	},
	{
		id: "occasionally",
		label: "Socially",
		description: "A few times per week",
		emoji: "💨",
	},
	{
		id: "regularly",
		label: "Regularly",
		description: "Daily or most days",
		emoji: "🚬",
	},
] as const;

export function SmokingScreen() {
	const router = useRouter();
	const { smokingFrequency, setAnswer, nextStep } = useOnboardingStore();

	const handleSelect = (id: string) => {
		setAnswer("smokingFrequency", id as "never" | "occasionally" | "regularly");
		nextStep();
		router.push("/(onboarding)/8");
	};

	return (
		<View className="flex-1 bg-background">
			<ScrollView
				className="flex-1"
				contentContainerClassName="pb-12 px-6"
				showsVerticalScrollIndicator={false}
			>
				<View className="mt-8 items-center">
					<View className="relative h-32 w-32 items-center justify-center">
						<View className="absolute h-28 w-28 rounded-[32px] bg-rose-50 shadow-2xl shadow-rose-100" />
						<View className="h-24 w-24 items-center justify-center rounded-[28px] border border-slate-50 bg-white shadow-sm">
							<Cigarette color="#E11D48" size={44} strokeWidth={2.5} />
						</View>
					</View>
				</View>

				<StepHeader
					align="center"
					className="mt-10"
					description="Smoking impacts cardiovascular efficiency and cellular oxygenation levels."
					title="Do you smoke?"
				/>

				<View className="mt-12">
					<SingleSelectList
						onSelect={handleSelect}
						options={SMOKING_OPTIONS}
						selectedId={smokingFrequency || null}
					/>
				</View>

				<View className="mt-10 rounded-[32px] border border-rose-100 bg-rose-50/50 p-8 shadow-sm">
					<View className="mb-1 flex-row items-center gap-3">
						<View className="h-6 w-6 items-center justify-center rounded-full bg-rose-500">
							<View className="h-1 w-1 rounded-full bg-white" />
						</View>
						<Text className="font-bold text-rose-900 text-sm">
							Vital Insight
						</Text>
					</View>
					<Text className="font-medium text-[14px] text-rose-800/80 leading-5">
						Stopping smoking can improve lung function and circulation by up to
						30% within weeks.
					</Text>
				</View>
			</ScrollView>
		</View>
	);
}
