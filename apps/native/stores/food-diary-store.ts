import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ── Types ──
export interface FoodEntry {
	id: string;
	name: string;
	calories: number;
	servingSize: string;
}

export interface MealLog {
	id: string;
	timestamp: string; // ISO
	mealName: string;
	photoUri: string | null;
	foods: FoodEntry[];
	totalCalories: number;
	protein: number; // grams
	carbs: number;
	fat: number;
}

export interface DayLog {
	date: string; // YYYY-MM-DD
	meals: MealLog[];
}

export interface NutritionGoals {
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
}

export interface FoodDiaryState {
	// Daily logs keyed by date (YYYY-MM-DD), last 30 days
	dayLogs: DayLog[];

	// User goals
	goals: NutritionGoals;

	// Methods
	logMeal: (meal: Omit<MealLog, "id" | "timestamp">) => void;
	removeMeal: (date: string, mealId: string) => void;
	setGoals: (goals: NutritionGoals) => void;
	getTodayLog: () => DayLog;
	getTodayTotals: () => { calories: number; protein: number; carbs: number; fat: number; mealCount: number };
	getDayLog: (date: string) => DayLog;
	getWeekSummary: () => { date: string; calories: number }[];
}

const MAX_DAYS = 30;

function todayStr(): string {
	return new Date().toISOString().split("T")[0];
}

function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useFoodDiaryStore = create<FoodDiaryState>()(
	persist(
		(set, get) => ({
			dayLogs: [],
			goals: {
				calories: 2000,
				protein: 150,
				carbs: 250,
				fat: 65,
			},

			logMeal: (meal) => {
				const today = todayStr();
				const newMeal: MealLog = {
					...meal,
					id: generateId(),
					timestamp: new Date().toISOString(),
				};

				set((s) => {
					const existing = s.dayLogs.find((d) => d.date === today);
					let updatedLogs: DayLog[];

					if (existing) {
						updatedLogs = s.dayLogs.map((d) =>
							d.date === today
								? { ...d, meals: [...d.meals, newMeal] }
								: d
						);
					} else {
						updatedLogs = [
							...s.dayLogs,
							{ date: today, meals: [newMeal] },
						];
					}

					// Keep only last 30 days
					return {
						dayLogs: updatedLogs
							.sort((a, b) => a.date.localeCompare(b.date))
							.slice(-MAX_DAYS),
					};
				});
			},

			removeMeal: (date, mealId) => {
				set((s) => ({
					dayLogs: s.dayLogs.map((d) =>
						d.date === date
							? { ...d, meals: d.meals.filter((m) => m.id !== mealId) }
							: d
					),
				}));
			},

			setGoals: (goals) => set({ goals }),

			getTodayLog: () => {
				const today = todayStr();
				return get().dayLogs.find((d) => d.date === today) || { date: today, meals: [] };
			},

			getTodayTotals: () => {
				const todayLog = get().getTodayLog();
				const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: todayLog.meals.length };
				for (const meal of todayLog.meals) {
					totals.calories += meal.totalCalories;
					totals.protein += meal.protein;
					totals.carbs += meal.carbs;
					totals.fat += meal.fat;
				}
				return totals;
			},

			getDayLog: (date) => {
				return get().dayLogs.find((d) => d.date === date) || { date, meals: [] };
			},

			getWeekSummary: () => {
				const result: { date: string; calories: number }[] = [];
				for (let i = 6; i >= 0; i--) {
					const d = new Date();
					d.setDate(d.getDate() - i);
					const dateStr = d.toISOString().split("T")[0];
					const dayLog = get().dayLogs.find((dl) => dl.date === dateStr);
					const totalCal = dayLog
						? dayLog.meals.reduce((sum, m) => sum + m.totalCalories, 0)
						: 0;
					result.push({ date: dateStr, calories: totalCal });
				}
				return result;
			},
		}),
		{
			name: "food-diary-storage",
			storage: createJSONStorage(() => AsyncStorage),
		}
	)
);
