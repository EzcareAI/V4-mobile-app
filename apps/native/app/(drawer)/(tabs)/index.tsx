import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Card } from "heroui-native";
import {
	Activity,
	Bell,
	ChevronRight,
	Heart,
	Sparkles,
	Trophy,
} from "lucide-react-native";
import {
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
	const handleStartScan = async () => {
		if (Platform.OS === "ios") {
			try {
				await impactAsync(ImpactFeedbackStyle.Medium);
			} catch {
				/* ignore */
			}
		}
		router.push("/scan/scan-start");
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<ScrollView
				contentContainerClassName="p-6 pb-24"
				showsVerticalScrollIndicator={false}
			>
				{/* Top Bar */}
				<View className="mb-8 flex-row items-center justify-between">
					<View>
						<Text className="font-medium text-muted-foreground">
							Good Morning
						</Text>
						<Text className="font-bold text-3xl text-foreground">
							Health Explorer
						</Text>
					</View>
					<TouchableOpacity className="rounded-full bg-surface p-2 shadow-sm">
						<Bell color="#4F46E5" size={24} />
					</TouchableOpacity>
				</View>

				{/* Premium Hero CTA Card */}
				<TouchableOpacity activeOpacity={0.9} onPress={handleStartScan}>
					<Card className="mb-10 overflow-hidden rounded-[32px] border-0 shadow-xl">
						<LinearGradient
							colors={["#4F46E5", "#7C3AED", "#2DD4BF"]}
							end={{ x: 1, y: 1 }}
							start={{ x: 0, y: 0 }}
							style={StyleSheet.absoluteFill}
						/>
						<Card.Body className="p-8">
							<View className="flex-row items-start justify-between">
								<View className="flex-1">
									<View className="mb-4 w-12 flex-row items-center justify-center rounded-2xl bg-white/20 p-3">
										<Activity color="white" size={28} />
									</View>
									<Text className="mb-2 font-bold text-3xl text-white">
										Ready for a check-in?
									</Text>
									<Text className="mb-6 text-lg text-white/80">
										Scan your health biomarkers and get instant AI-powered
										guidance.
									</Text>
								</View>
								<View className="ml-4 h-12 w-12 items-center justify-center rounded-full bg-white/10">
									<Sparkles color="white" size={24} />
								</View>
							</View>
							<View className="h-14 w-full flex-row items-center justify-center rounded-2xl bg-white/20">
								<Text className="mr-2 font-bold text-lg text-white">
									Start Body Scan
								</Text>
								<ChevronRight color="white" size={20} />
							</View>
						</Card.Body>
					</Card>
				</TouchableOpacity>

				{/* Productivity Section */}
				<Text className="mb-6 font-bold text-2xl text-foreground">
					Featured Insights
				</Text>
				<View className="flex-row gap-4">
					<Card className="flex-1 rounded-[24px] bg-surface p-6 shadow-sm">
						<View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
							<Heart color="#F97316" size={20} />
						</View>
						<Text className="mb-1 font-bold text-xl">Wellness Score</Text>
						<Text className="text-muted-foreground text-sm">
							Waiting for first scan
						</Text>
					</Card>
					<Card className="flex-1 rounded-[24px] bg-surface p-6 shadow-sm">
						<View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
							<Trophy color="#3B82F6" size={20} />
						</View>
						<Text className="mb-1 font-bold text-xl">Daily Streak</Text>
						<Text className="text-muted-foreground text-sm">
							Join the 1% today
						</Text>
					</Card>
				</View>

				{/* Personalized Card Section */}
				<View className="mt-10">
					<Text className="mb-6 font-bold text-2xl text-foreground">
						Your Plan
					</Text>
					<Card className="mb-4 rounded-[24px] border border-muted/20 bg-surface p-6 shadow-sm">
						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center gap-4">
								<View className="h-12 w-12 items-center justify-center rounded-full bg-muted/10">
									<Activity color="#4F46E5" size={24} />
								</View>
								<View>
									<Text className="font-bold text-lg">Foundation Routine</Text>
									<Text className="text-muted-foreground">
										3 personalized steps
									</Text>
								</View>
							</View>
							<ChevronRight color="#94A3B8" size={20} />
						</View>
					</Card>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
