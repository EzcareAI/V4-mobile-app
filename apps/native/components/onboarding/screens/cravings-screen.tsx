import { useRouter } from "expo-router";
import { Brain, Cookie } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";
import { MultiSelectGrid, type MultiSelectOption } from "../multi-select-grid";

const CRAVING_OPTIONS: MultiSelectOption[] = [
	{ id: "sugar", label: "Sugar", emoji: "🍭" },
	{ id: "fatty", label: "Fatty foods", emoji: "🧀" },
	{ id: "salty", label: "Salty foods", emoji: "🥨" },
	{ id: "fast_food", label: "Fast food", emoji: "🍔" },
	{ id: "coffee", label: "Coffee", emoji: "☕" },
	{ id: "nothing", label: "Nothing", emoji: "✅" },
];

export const CravingsScreen = () => {
	const router = useRouter();
	const { cravings, setAnswer, nextStep } = useOnboardingStore();

	const handleToggle = (id: string) => {
		let newCravings: string[];

		if (id === "nothing") {
			newCravings = cravings.includes("nothing") ? [] : ["nothing"];
		} else {
			const filtered = cravings.filter((c) => c !== "nothing");
			newCravings = filtered.includes(id)
				? filtered.filter((c) => c !== id)
				: [...filtered, id];
		}

		setAnswer("cravings", newCravings);
	};

	const handleContinue = () => {
		nextStep();
		router.push("/(onboarding)/18");
	};

	return (
		<View className="flex-1 bg-background">
			<View className="flex-1 justify-between px-5 pb-8">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1 px-1">
						{/* Icon Header */}
						<View className="mt-4 items-center">
							<View className="h-28 w-28 items-center justify-center rounded-full bg-blue-50/50">
								<View className="h-24 w-24 items-center justify-center rounded-full bg-white shadow-blue-100 shadow-lg">
									<Text className="text-5xl">😋</Text>
									<View className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-amber-400">
										<Cookie color="white" fill="white" size={20} />
									</View>
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="Select all that apply. This helps us personalize your dopamine regulation plan."
							title="What do you crave most?"
						/>

						<View className="mt-8">
							<MultiSelectGrid
								onToggle={handleToggle}
								options={CRAVING_OPTIONS}
								selectedIds={cravings}
							/>
						</View>

						{/* Dopamine Regulation Info */}
						<View className="mt-10 flex-row items-start rounded-[32px] border border-indigo-50/50 bg-[#F8FAFF] p-6">
							<View className="mr-4 rounded-2xl bg-indigo-100 p-3.5">
								<Brain color="#818CF8" size={22} />
							</View>
							<View className="flex-1">
								<Text className="font-bold text-[#0d2137] text-[17px] leading-6">
									Dopamine Regulation
								</Text>
								<Text className="mt-1 text-[14px] text-[#73808C] leading-[22px]">
									Cravings are often linked to dopamine responses. We'll help
									you build healthier reward pathways naturally.
								</Text>
							</View>
						</View>
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton
						isDisabled={cravings.length === 0}
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
};
