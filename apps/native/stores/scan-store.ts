import { create } from "zustand";

interface ScanStore {
	// Scan session
	scanId: string | null;
	zone: string | null;
	symptom: string | null;
	answers: Record<string, any>;

	// Actions
	setScanId: (id: string) => void;
	setZone: (zone: string) => void;
	setSymptom: (symptom: string) => void;
	setAnswer: (cardId: string, value: any) => void;
	reset: () => void;
}

export const useScanStore = create<ScanStore>((set) => ({
	scanId: null,
	zone: null,
	symptom: null,
	answers: {},

	setScanId: (id) => set({ scanId: id }),
	setZone: (zone) => set({ zone }),
	setSymptom: (symptom) => set({ symptom }),
	setAnswer: (cardId, value) =>
		set((state) => ({
			answers: { ...state.answers, [cardId]: value },
		})),
	reset: () =>
		set({
			scanId: null,
			zone: null,
			symptom: null,
			answers: {},
		}),
}));
