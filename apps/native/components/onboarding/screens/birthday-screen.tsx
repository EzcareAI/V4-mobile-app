import { useRouter } from "expo-router";
import { Cake } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";
import { WheelPicker } from "../common/wheel-picker";

const months = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

export const BirthdayScreen = () => {
	const router = useRouter();
	const { birthDate, setAnswer, nextStep } = useOnboardingStore();

	const initialDate = useMemo(() => {
		if (birthDate) {
			const d = new Date(birthDate);
			return {
				month: d.getMonth(),
				day: d.getDate() - 1,
				year: d.getFullYear(),
			};
		}
		return { month: 3, day: 14, year: 1990 };
	}, [birthDate]);

	const [monthIndex, setMonthIndex] = useState(initialDate.month);
	const [dayIndex, setDayIndex] = useState(initialDate.day);
	const [yearIndex, setYearIndex] = useState(initialDate.year - 1940);

	const days = useMemo(
		() => Array.from({ length: 31 }, (_, i) => String(i + 1)),
		[]
	);
	const yearsOffsets = useMemo(
		() => Array.from({ length: 80 }, (_, i) => String(1940 + i)),
		[]
	);

	const handleContinue = () => {
		const year = 1940 + yearIndex;
		const month = monthIndex;
		const day = dayIndex + 1;
		const dateObj = new Date(year, month, day);

		setAnswer("birthDate", dateObj.toISOString());
		nextStep();
		router.push("/(onboarding)/3");
	};

	const selectedYear = 1940 + yearIndex;
	const isValid = selectedYear >= 1940 && selectedYear <= 2010;

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
						{/* Premium Icon Header */}
						<View className="mt-8 items-center">
							<View className="relative h-32 w-32 items-center justify-center">
								{/* Multi-layered shadow design */}
								<View className="absolute h-28 w-28 rounded-[32px] bg-blue-50 shadow-2xl shadow-blue-100" />
								<View className="h-24 w-24 items-center justify-center rounded-[28px] border border-slate-50 bg-white shadow-sm">
									<Cake color="#28B898" size={44} strokeWidth={2.5} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-10"
							description="We use your age to personalize recommendations."
							title="When were you born?"
						/>

						{/* SaaS Matching 3-Column Wheel Picker UI */}
						<View className="mt-8 flex-row justify-center gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
							<WheelPicker
								items={months}
								onSelect={setMonthIndex}
								selectedIndex={monthIndex}
								width={80}
							/>
							<WheelPicker
								items={days}
								onSelect={setDayIndex}
								selectedIndex={dayIndex}
								width={64}
							/>
							<WheelPicker
								items={yearsOffsets}
								onSelect={setYearIndex}
								selectedIndex={yearIndex}
								width={80}
							/>
						</View>
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton isDisabled={!isValid} onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
};
