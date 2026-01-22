import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";

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
		<View className="flex-1 justify-between px-6 py-8">
			<View>
				<Text className="mt-4 mb-2 font-bold text-3xl text-foreground">
					When is your birthday?
				</Text>
				<Text className="mb-8 text-lg text-muted-foreground">
					This helps us calculate your health stats accurately.
				</Text>
				<View className="items-center justify-center py-12">
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
			<Button className="h-14 rounded-full bg-primary" onPress={handleContinue}>
				<Button.Label className="font-bold text-lg text-white">
					Continue
				</Button.Label>
			</Button>
		</View>
	);
};
