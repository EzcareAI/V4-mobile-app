import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
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
		return { month: 3, day: 14, year: 2000 };
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
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-5">
				{/* Content — NOT wrapped in ScrollView so WheelPickers get the touch events */}
				<View className="flex-1 px-1">
					{/* Mascot Header */}
					<View className="mt-4 items-center">
						<View className="relative">
							<LinearGradient
								colors={["#4FD1C5", "#28B898"]}
								start={{ x: 0, y: 0 }}
								style={{
									height: 112,
									width: 112,
									borderRadius: 56,
									alignItems: "center",
									justifyContent: "center",
									shadowColor: "#28B898",
									shadowOffset: { width: 0, height: 10 },
									shadowOpacity: 0.2,
									shadowRadius: 15,
									elevation: 10,
								}}
							>
								<Text style={{ fontSize: 48 }}>🎂</Text>
							</LinearGradient>
							{/* Badge */}
							<View
								className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-pink-400"
								style={{
									shadowColor: "#000",
									shadowOffset: { width: 0, height: 4 },
									shadowOpacity: 0.1,
									shadowRadius: 5,
									elevation: 5,
								}}
							>
								<Text style={{ fontSize: 14 }}>🎉</Text>
							</View>
						</View>
					</View>

					<View className="mt-8 items-center">
						<Text className="font-bold text-2xl text-[#0d2137]">
							When were you born?
						</Text>
						<Text className="mt-2 text-center text-[#73808C]">
							We use your age to personalize recommendations.
						</Text>
					</View>

					{/* Wheel Picker — in a plain View so no outer ScrollView steals touches */}
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

				<ContinueButton isDisabled={!isValid} onPress={handleContinue} />
			</View>
		</View>
	);
};
