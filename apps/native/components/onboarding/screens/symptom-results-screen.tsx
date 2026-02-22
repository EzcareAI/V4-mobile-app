import { useRouter } from "expo-router";
import { Bot, Clock, Heart, Leaf, Sparkles, Star } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { ContinueButton } from "../common/continue-button";

export const SymptomResultsScreen = () => {
	const router = useRouter();

	const handleContinue = () => {
		router.push("/(onboarding)/10");
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-5 pb-8">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1 px-1">
						{/* Robot Header */}
						<View className="mt-4 items-center">
							<View className="relative">
								<View
									className="h-28 w-28 items-center justify-center rounded-full bg-white"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 10 },
										shadowOpacity: 0.1,
										shadowRadius: 15,
										elevation: 10,
									}}
								>
									<View className="h-20 w-20 items-center justify-center rounded-full border-4 border-blue-50/50 bg-blue-50/30">
										<Bot color="#28B898" size={48} />
									</View>
								</View>
								{/* Heart Badge */}
								<View
									className="absolute top-0 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-white"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Heart color="#FF6B6B" fill="#FF6B6B" size={20} />
								</View>
							</View>

							{/* Pagination Dots */}
							<View className="mt-6 flex-row gap-2">
								<View className="h-2.5 w-2.5 rounded-full bg-[#BAE6FD]" />
								<View className="h-2.5 w-2.5 rounded-full bg-[#2DE2E2]" />
								<View className="h-2.5 w-2.5 rounded-full bg-[#BAE6FD]" />
							</View>
						</View>

						{/* Main Result Card */}
						<View
							className="mt-10 rounded-[40px] bg-white/60 p-10"
							style={{
								shadowColor: "#00BAA5",
								shadowOffset: { width: 0, height: 20 },
								shadowOpacity: 0.05,
								shadowRadius: 30,
								elevation: 10,
							}}
						>
							<View className="items-center">
								<View className="h-28 w-28 items-center justify-center rounded-full bg-[#2DE2E2]">
									<Text className="font-bold text-4xl text-white">69%</Text>
								</View>

								<Text className="mt-8 text-center font-bold text-2xl text-[#0d2137] leading-9">
									Great news! <Text className="text-[#28B898]">69%</Text> of
									your symptoms can improve naturally
								</Text>

								<Text className="mt-4 text-center text-lg text-[#73808C] leading-7">
									In the first <Text className="text-[#28B898]">30 days</Text>{" "}
									when you follow the right routine
								</Text>
							</View>
						</View>

						{/* Triple Icon Row */}
						<View className="mt-12 flex-row justify-around">
							<View className="items-center">
								<View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
									<Leaf color="#10B981" size={28} />
								</View>
								<Text className="font-bold text-[#0d2137]">Natural</Text>
							</View>

							<View className="items-center">
								<View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-[#DBEAFE]">
									<Clock color="#3B82F6" size={28} />
								</View>
								<Text className="font-bold text-[#0d2137]">30 Days</Text>
							</View>

							<View className="items-center">
								<View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-[#FCE7F3]">
									<Sparkles color="#EC4899" size={28} />
								</View>
								<Text className="font-bold text-[#0d2137]">Proven</Text>
							</View>
						</View>

						{/* Testimonial Card */}
						<View
							className="mt-12 mb-6 rounded-[32px] bg-white p-6"
							style={{
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 10 },
								shadowOpacity: 0.05,
								shadowRadius: 20,
								elevation: 5,
							}}
						>
							<View className="flex-row items-start gap-4">
								<View className="h-14 w-14 items-center justify-center rounded-full bg-blue-50/50">
									<Bot color="#28B898" size={32} />
								</View>
								<View className="flex-1">
									<View className="flex-row items-center justify-between">
										<View className="flex-row gap-0.5">
											{[1, 2, 3, 4, 5].map((i) => (
												<Star
													fill="#FACC15"
													key={i}
													size={16}
													stroke="#FACC15"
												/>
											))}
										</View>
										<Text className="font-bold text-[#0d2137]">Sarah M.</Text>
									</View>
									<Text className="mt-2 text-[#73808C] italic leading-6">
										"My energy levels completely transformed in just 3 weeks.
										The natural approach really works!"
									</Text>
								</View>
							</View>
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
