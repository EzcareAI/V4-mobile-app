import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export const BirthdayScreen = () => {
	const router = useRouter();
	const { birthDate, setAnswer, nextStep } = useOnboardingStore();
	const [date, setDate] = useState(
		birthDate ? new Date(birthDate) : new Date(2000, 0, 1)
	);
	const foregroundColor = useThemeColor("foreground");

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
		<View className="flex-1 justify-between bg-background px-6 py-8">
			<View>
				<StepHeader
					description="We use your age to personalize recommendations."
					title="When were you born?"
				/>

				<View className="items-center justify-center py-6">
					<DateTimePicker
						display="spinner"
						maximumDate={new Date()}
						mode="date"
						onChange={onChange}
						style={{ width: "100%", height: 200 }}
						textColor={foregroundColor}
						value={date}
					/>
				</View>
			</View>
			<ContinueButton onPress={handleContinue} />
		</View>
	);
};
