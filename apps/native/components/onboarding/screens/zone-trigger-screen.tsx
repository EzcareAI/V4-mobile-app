import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";

export function ZoneTriggerScreen() {
	const router = useRouter();
	const { zoneTriggers, setAnswer, nextStep, scanMode, currentStep } =
		useOnboardingStore();
	const [selected, setSelected] = useState<string[]>(zoneTriggers ?? []);

	const toggleTrigger = (id: string) => {
		if (id === "not-sure") {
			setSelected(["not-sure"]);
			return;
		}

		let next = [...selected].filter((t) => t !== "not-sure");
		if (next.includes(id)) {
			next = next.filter((item) => item !== id);
		} else {
			next.push(id);
		}
		setSelected(next);
	};

	const handleContinue = () => {
		if (selected.length > 0) {
			setAnswer("zoneTriggers", selected);
			nextStep();
			if (scanMode !== "home") {
				router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
			}
		}
	};

	const triggerOptions = [
		{ id: "activity", label: "Physical activity", icon: "🏃" },
		{ id: "food", label: "Certain foods", icon: "🍽️" },
		{ id: "stress", label: "Stress", icon: "😰" },
		{ id: "weather", label: "Weather changes", icon: "🌦️" },
		{ id: "posture", label: "Posture/position", icon: "🧘" },
		{ id: "unknown", label: "No clear trigger", icon: "❓" },
	];

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
					showsVerticalScrollIndicator={false}
				>
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
									<Text style={{ fontSize: 48 }}>⚡</Text>
								</LinearGradient>
								<View
									className="absolute -top-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-blue-400"
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.1,
										shadowRadius: 5,
										elevation: 5,
									}}
								>
									<Text style={{ fontSize: 14 }}>🎯</Text>
								</View>
							</View>
						</View>

						<StepHeader
							className="mt-8"
							description="Select any triggers you've noticed (You can pick multiple)"
							title="What makes it worse?"
						/>

						<View className="mt-8 gap-3">
							{triggerOptions.map(({ id, label, icon }) => {
								const isSelected = selected.includes(id);
								return (
									<TouchableOpacity
										activeOpacity={0.7}
										className={`flex-row items-center justify-between overflow-hidden rounded-2xl border-2 p-4 ${
											isSelected
												? "border-[#28B898] bg-[#28B898]/10"
												: "border-transparent bg-white shadow-[#28B898]/5 shadow-sm"
										}`}
										key={id}
										onPress={() => toggleTrigger(id)}
									>
										<View className="flex-row items-center gap-3">
											<View
												className={`h-6 w-6 items-center justify-center rounded-md border ${isSelected ? "border-[#28B898] bg-[#28B898]" : "border-slate-300 bg-slate-50"}`}
											>
												{isSelected && (
													<Check color="white" size={14} strokeWidth={3} />
												)}
											</View>
											<Text
												className={`font-bold text-base ${
													isSelected ? "text-[#28B898]" : "text-[#0d2137]"
												}`}
											>
												{label}
											</Text>
										</View>
										<Text className="text-2xl">{icon}</Text>
									</TouchableOpacity>
								);
							})}
						</View>

						{/* Skip Option */}
						<View className="mt-6 flex-row items-center justify-center">
							<TouchableOpacity
								className={`rounded-xl px-5 py-3 ${selected.includes("not-sure") ? "bg-[#28B898]/10" : "bg-white shadow-sm"}`}
								onPress={() => toggleTrigger("not-sure")}
							>
								<Text
									className={`font-semibold ${selected.includes("not-sure") ? "text-[#28B898]" : "text-[#64748B]"}`}
								>
									I'm not sure
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>

				<View className="pt-6">
					<ContinueButton
						isDisabled={selected.length === 0}
						onPress={handleContinue}
					/>
				</View>
			</View>
		</View>
	);
}
