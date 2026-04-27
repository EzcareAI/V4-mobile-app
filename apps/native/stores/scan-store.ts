import { create } from "zustand";

interface ScanStore {
	// Scan session
	scanId: string | null;
	zone: string | null;
	concern: string | null;
	answers: Record<string, unknown>;

	// Actions
	setScanId: (id: string) => void;
	setZone: (zone: string) => void;
	setConcern: (concern: string) => void;
	setAnswer: (cardId: string, value: unknown) => void;
	reset: () => void;
}

export const useScanStore = create<ScanStore>((set) => ({
	scanId: null,
	zone: null,
	concern: null,
	answers: {},

	setScanId: (id) => set({ scanId: id }),
	setZone: (zone) => set({ zone }),
	setConcern: (concern) => set({ concern }),
	setAnswer: (cardId, value) =>
		set((state) => ({
			answers: { ...state.answers, [cardId]: value },
		})),
	reset: () =>
		set({
			scanId: null,
			zone: null,
			concern: null,
			answers: {},
		}),
}));
