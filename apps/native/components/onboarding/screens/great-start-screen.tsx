import { useRouter } from "expo-router";
import { ThumbsUp } from "lucide-react-native";
import { Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";
import { JourneyProgressChart } from "./journey-progress-chart";

export const GreatStartScreen = () => {
	const router = useRouter();

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
						{/* Mascot Section */}
						<View className="mt-4 items-center">
							<View className="relative h-32 w-32 items-center justify-center rounded-full bg-white shadow-blue-100 shadow-lg">
								<Text className="text-6xl">🤖</Text>
								<View className="absolute right-0 bottom-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#2DE2E2]">
									<ThumbsUp color="white" size={14} />
								</View>
							</View>

							<StepHeader
								align="center"
								description="Most people never take the first step toward natural healing. You're already ahead."
								title="Great Start!"
							/>
						</View>

						{/* Progress Card */}
						<View className="mt-10 rounded-[32px] bg-white p-6 shadow-md">
							<View className="items-center">
								<Text className="font-bold text-[#0d2137] text-lg">
									Your Journey Progress
								</Text>
								<Text className="mt-1 font-medium text-[#73808C] text-sm">
									Energy ↑ Inflammation ↓
								</Text>
							</View>

							<View className="mt-8 h-[250px] w-full px-4">
								<JourneyProgressChart />
							</View>
						</View>

						{/* Stat Cards Row */}
						<View className="mt-6 flex-row gap-4">
							<View className="flex-1 items-center rounded-[24px] bg-white p-5 shadow-md">
								<Text className="font-bold text-2xl text-blue-400">+31%</Text>
								<Text className="mt-1 text-center font-medium text-[13px] text-[#73808C]">
									Expected Energy Boost
								</Text>
							</View>
							<View className="flex-1 items-center rounded-[24px] bg-white p-5 shadow-md">
								<Text className="font-bold text-2xl text-[#2DE2E2]">-25%</Text>
								<Text className="mt-1 text-center font-medium text-[13px] text-[#73808C]">
									Inflammation Reduction
								</Text>
							</View>
						</View>
					</View>
				</ScrollView>

				<View className="pt-4">
					<ContinueButton onPress={() => router.push("/(onboarding)/6")} />
				</View>
			</View>
		</View>
	);
};
