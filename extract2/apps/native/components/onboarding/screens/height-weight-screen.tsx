import { useRouter } from "expo-router";
import { Ruler } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { THEME } from "@/lib/theme";
import {
	type UnitPreference,
	useOnboardingStore,
} from "@/stores/onboarding-store";
import { ContinueButton } from "../common/continue-button";
import { StepHeader } from "../common/step-header";
import { WheelPicker } from "../common/wheel-picker";

// ─── Metric heights: 100 – 250 cm ─────────────────────────────────
const CM_VALUES = Array.from({ length: 151 }, (_, i) => i + 100);
const CM_ITEMS = CM_VALUES.map((v) => `${v} cm`);

// ─── Imperial heights: 3'0" – 8'11" ──────────────────────────────
const FT_VALUES = Array.from({ length: 6 }, (_, i) => i + 3);
const IN_VALUES = Array.from({ length: 12 }, (_, i) => i);
const FT_ITEMS = FT_VALUES.map((v) => `${v} ft`);
const IN_ITEMS = IN_VALUES.map((v) => `${v} in`);

// ─── Metric weights: 30 – 200 kg ──────────────────────────────────
const KG_VALUES = Array.from({ length: 171 }, (_, i) => i + 30);
const KG_ITEMS = KG_VALUES.map((v) => `${v} kg`);

// ─── Imperial weights: 66 – 440 lbs ──────────────────────────────
const LB_VALUES = Array.from({ length: 375 }, (_, i) => i + 66);
const LB_ITEMS = LB_VALUES.map((v) => `${v} lb`);

function cmToFtIn(cm: number): { ft: number; inches: number } {
	const totalIn = cm / 2.54;
	const ft = Math.floor(totalIn / 12);
	const inches = Math.round(totalIn % 12);
	return { ft, inches };
}

// ─── Centered imperial / metric toggle ────────────────────────────
const UnitToggle = ({
	value,
	onChange,
}: {
	value: UnitPreference;
	onChange: (v: UnitPreference) => void;
}) => (
	<View
		className="flex-row self-center rounded-2xl bg-slate-100 p-1"
		style={{ width: 260 }}
	>
		{(["imperial", "metric"] as const).map((unit) => {
			const active = value === unit;
			return (
				<Pressable
					className="flex-1 items-center rounded-xl py-3"
					key={unit}
					onPress={() => onChange(unit)}
					style={
						active
							? {
									backgroundColor: THEME.accent,
									shadowColor: THEME.accentShadow,
									shadowOpacity: 0.25,
									shadowRadius: 6,
									elevation: 3,
								}
							: undefined
					}
				>
					<Text
						className="font-bold text-sm"
						style={{ color: active ? "white" : "#73808C" }}
					>
						{unit === "imperial" ? "Imperial" : "Metric"}
					</Text>
				</Pressable>
			);
		})}
	</View>
);

export const HeightWeightScreen = () => {
	const router = useRouter();
	const {
		heightCm,
		weightKg,
		unitPreference,
		setAnswer,
		nextStep,
		currentStep,
	} = useOnboardingStore();

	const isImperial = unitPreference === "imperial";

	// Height state
	const { ft: initFt, inches: initIn } = cmToFtIn(heightCm || 170);
	const initCmIdx = Math.max(0, CM_VALUES.indexOf(heightCm || 170));
	const [cmIdx, setCmIdx] = useState(initCmIdx === -1 ? 70 : initCmIdx);
	const [ftIdx, setFtIdx] = useState(Math.max(0, FT_VALUES.indexOf(initFt)));
	const [inIdx, setInIdx] = useState(Math.max(0, IN_VALUES.indexOf(initIn)));

	// Weight state
	const initKgIdx = Math.max(0, KG_VALUES.indexOf(weightKg || 70));
	const [kgIdx, setKgIdx] = useState(initKgIdx === -1 ? 40 : initKgIdx);
	const [lbIdx, setLbIdx] = useState(() => {
		const lbs = Math.round((weightKg || 70) * 2.204_62);
		const idx = LB_VALUES.indexOf(lbs);
		return idx >= 0 ? idx : 100;
	});

	const getCurrentHeightCm = useCallback((): number => {
		if (!isImperial) {
			return CM_VALUES[cmIdx] ?? 170;
		}
		const ft = FT_VALUES[ftIdx] ?? 5;
		const inches = IN_VALUES[inIdx] ?? 6;
		return Math.round((ft * 12 + inches) * 2.54);
	}, [isImperial, cmIdx, ftIdx, inIdx]);

	const getCurrentWeightKg = useCallback((): number => {
		if (!isImperial) {
			return KG_VALUES[kgIdx] ?? 70;
		}
		const lbs = LB_VALUES[lbIdx] ?? 154;
		return Math.round(lbs / 2.204_62);
	}, [isImperial, kgIdx, lbIdx]);

	const handleContinue = () => {
		setAnswer("heightCm", getCurrentHeightCm());
		setAnswer("weightKg", getCurrentWeightKg());
		nextStep();
		router.push(`/(onboarding)/${(currentStep || 0) + 1}`);
	};

	return (
		<View className="flex-1 bg-[#EBF5F4]">
			<View className="flex-1 justify-between px-6 pb-10">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-1 px-1">
						{/* Icon Header */}
						<View className="mt-8 items-center">
							<View className="relative h-32 w-32 items-center justify-center">
								<View className="absolute h-28 w-28 rounded-[32px] bg-blue-50 shadow-2xl shadow-blue-100" />
								<View className="h-24 w-24 items-center justify-center rounded-[28px] border border-slate-50 bg-white shadow-sm">
									<Ruler color={THEME.accent} size={44} strokeWidth={2.5} />
								</View>
							</View>
						</View>

						<StepHeader
							align="center"
							className="mt-8"
							description="We use this to calculate your precise nutritional needs and metabolic index."
							title="What is your body size?"
						/>

						{/* Unit toggle — symmetrically centered */}
						<View className="mt-6 items-center">
							<UnitToggle
								onChange={(v) => setAnswer("unitPreference", v)}
								value={unitPreference}
							/>
						</View>

						{/* Height Card */}
						<View className="mt-8 rounded-[32px] border border-white/50 bg-white/70 p-6 shadow-xl">
							<Text className="mb-6 text-center font-black text-[#29303D] text-[15px] uppercase tracking-widest">
								Height
							</Text>
							{isImperial ? (
								<View className="flex-row items-center justify-center gap-4">
									<WheelPicker
										items={FT_ITEMS}
										onSelect={setFtIdx}
										selectedIndex={ftIdx}
										width={110}
									/>
									<WheelPicker
										items={IN_ITEMS}
										onSelect={setInIdx}
										selectedIndex={inIdx}
										width={110}
									/>
								</View>
							) : (
								<View className="items-center">
									<WheelPicker
										items={CM_ITEMS}
										onSelect={setCmIdx}
										selectedIndex={cmIdx}
										width={160}
									/>
								</View>
							)}
						</View>

						{/* Weight Card */}
						<View className="mt-6 rounded-[32px] border border-white/50 bg-white/70 p-6 shadow-xl">
							<Text className="mb-6 text-center font-black text-[#29303D] text-[15px] uppercase tracking-widest">
								Weight
							</Text>
							<View className="items-center">
								<WheelPicker
									items={isImperial ? LB_ITEMS : KG_ITEMS}
									onSelect={isImperial ? setLbIdx : setKgIdx}
									selectedIndex={isImperial ? lbIdx : kgIdx}
									width={160}
								/>
							</View>
						</View>
					</View>
				</ScrollView>

				<View className="pt-6">
					<ContinueButton onPress={handleContinue} />
				</View>
			</View>
		</View>
	);
};
