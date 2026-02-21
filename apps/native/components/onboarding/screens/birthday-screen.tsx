import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Cake } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export const BirthdayScreen = () => {
	const router = useRouter();
	const { birthDate, setAnswer, nextStep } = useOnboardingStore();
	const [date, setDate] = useState(
		birthDate ? new Date(birthDate) : new Date(2000, 0, 1)
	);

	const onChange = (_event: unknown, selectedDate?: Date) => {
		const currentDate = selectedDate || date;
		setDate(currentDate);
		setAnswer("birthDate", currentDate.toISOString());
	};

	const handleContinue = () => {
		setAnswer("birthDate", date.toISOString());
		nextStep();
		router.push("/(onboarding)/3");
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
						{/* Premium Icon Header */}
						<View className="mt-8 items-center">
							<View className="relative h-32 w-32 items-center justify-center">
								{/* Multi-layered shadow design */}
								<View className="absolute h-28 w-28 rounded-[32px] bg-blue-50 shadow-2xl shadow-blue-100" />
								<View className="h-24 w-24 items-center justify-center rounded-[28px] border border-slate-50 bg-white shadow-sm">
									<Cake color="#3BAFDA" size={44} strokeWidth={2.5} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-10"
							description="Your age helps us calibrate your biological baseline and metabolic profile."
							title="When is your birthday?"
						/>

						<View className="mt-12 overflow-hidden rounded-[40px] border border-white/50 bg-white/60 p-8 shadow-2xl shadow-blue-100/30">
							<DateTimePicker
								display="spinner"
								maximumDate={new Date()}
								mode="date"
								onChange={onChange}
								style={{ width: "100%", height: 220 }}
								value={date}
							/>
						</View>
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
};
