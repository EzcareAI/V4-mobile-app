import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
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
			<LinearGradient
				colors={["#F0F9FF", "#E1F5FE"]}
				style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
			/>

			<View className="flex-1 justify-between px-6 py-8">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1">
						{/* Icon Header */}
						<View className="mt-4 items-center">
							<View className="h-24 w-24 items-center justify-center rounded-full bg-white shadow-blue-100 shadow-lg">
								<View className="h-16 w-16 items-center justify-center rounded-full bg-blue-50/50">
									<Cake color="#3BAFDA" fill="#3BAFDA" size={40} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-6"
							description="We use your age to personalize recommendations."
							title="When were you born?"
						/>

						<View className="mt-8 items-center justify-center rounded-[32px] bg-white/40 p-6 py-10 shadow-sm">
							<DateTimePicker
								display="spinner"
								maximumDate={new Date()}
								mode="date"
								onChange={onChange}
								style={{ width: "100%", height: 200 }}
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
