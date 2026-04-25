import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface ConversationSummary {
	date: string; // ISO date
	topics: string[]; // key topics discussed
	insights: string; // brief summary of what was learned about the user
}

export interface CompanionState {
	// Persistent user profile built from conversations
	knownFacts: string[]; // things the AI learned about the user
	preferredTopics: string[]; // topics user asks about frequently
	conversationCount: number;
	lastConversationDate: string | null;
	conversationSummaries: ConversationSummary[];
	moodHistory: { date: string; mood: string }[];

	// Methods
	addFact: (fact: string) => void;
	removeFact: (fact: string) => void;
	addTopic: (topic: string) => void;
	addConversationSummary: (summary: ConversationSummary) => void;
	addMoodEntry: (mood: string) => void;
	incrementConversationCount: () => void;
	getMemoryContext: () => string; // Returns formatted context for system prompt
}

const MAX_FACTS = 30;
const MAX_SUMMARIES = 20;
const MAX_MOODS = 30;

export const useCompanionStore = create<CompanionState>()(
	persist(
		(set, get) => ({
			knownFacts: [],
			preferredTopics: [],
			conversationCount: 0,
			lastConversationDate: null,
			conversationSummaries: [],
			moodHistory: [],

			addFact: (fact) => {
				set((s) => {
					// Avoid duplicates
					if (s.knownFacts.some((f) => f.toLowerCase() === fact.toLowerCase())) {
						return s;
					}
					const updated = [...s.knownFacts, fact].slice(-MAX_FACTS);
					return { knownFacts: updated };
				});
			},

			removeFact: (fact) => {
				set((s) => ({
					knownFacts: s.knownFacts.filter((f) => f !== fact),
				}));
			},

			addTopic: (topic) => {
				set((s) => {
					const lower = topic.toLowerCase();
					if (s.preferredTopics.includes(lower)) return s;
					return { preferredTopics: [...s.preferredTopics, lower].slice(-15) };
				});
			},

			addConversationSummary: (summary) => {
				set((s) => ({
					conversationSummaries: [...s.conversationSummaries, summary].slice(-MAX_SUMMARIES),
				}));
			},

			addMoodEntry: (mood) => {
				set((s) => ({
					moodHistory: [
						...s.moodHistory,
						{ date: new Date().toISOString(), mood },
					].slice(-MAX_MOODS),
				}));
			},

			incrementConversationCount: () => {
				set((s) => ({
					conversationCount: s.conversationCount + 1,
					lastConversationDate: new Date().toISOString(),
				}));
			},

			getMemoryContext: () => {
				const state = get();
				const parts: string[] = [];

				if (state.knownFacts.length > 0) {
					parts.push(
						`## What you know about this user:\n${state.knownFacts.map((f) => `- ${f}`).join("\n")}`
					);
				}

				if (state.preferredTopics.length > 0) {
					parts.push(
						`## Topics they care about: ${state.preferredTopics.join(", ")}`
					);
				}

				if (state.conversationSummaries.length > 0) {
					const recent = state.conversationSummaries.slice(-5);
					parts.push(
						`## Recent conversation history:\n${recent
							.map(
								(s) =>
									`- ${s.date}: Topics: ${s.topics.join(", ")}. ${s.insights}`
							)
							.join("\n")}`
					);
				}

				if (state.moodHistory.length > 0) {
					const recent = state.moodHistory.slice(-7);
					parts.push(
						`## Recent mood pattern: ${recent.map((m) => `${m.mood}`).join(" -> ")}`
					);
				}

				if (state.conversationCount > 0) {
					parts.push(
						`## This is conversation #${state.conversationCount + 1} with this user.`
					);
				}

				return parts.length > 0
					? `\n\n--- MEMORY (use this to personalize, but don't explicitly mention you have a memory system) ---\n${parts.join("\n\n")}`
					: "";
			},
		}),
		{
			name: "companion-storage",
			storage: createJSONStorage(() => AsyncStorage),
		}
	)
);
