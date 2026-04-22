import { db } from "@ezcare/db";
import {
	chatMessage,
	dailyCheckin,
	healthScore,
	userProfile,
} from "@ezcare/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

// System prompt for the AI wellness companion
const SYSTEM_PROMPT = `You are a calm, professional wellness companion for the EZCare AI app. You help users build better daily habits and understand their lifestyle patterns. You are:
- Reassuring but not dismissive
- Educational without being condescending
- Action-oriented (suggest natural lifestyle improvements)
- Never alarmist

You NEVER:
- Use clinical or diagnostic language
- Recommend specific medications or clinical interventions
- Act as a substitute for professional advice

You have access to the user's wellness data which will be provided as context. Use this to personalize your responses.

Respond in 2-4 sentences. Be warm but professional. Focus on encouragement and practical lifestyle tips.`;

interface UserContext {
	healthScore?: number;
	recentCheckins?: Array<{
		date: string;
		sleepScore: number;
		energyScore: number;
		stressScore: number;
		digestionScore: number;
		hasPain: boolean;
	}>;
	profile?: {
		primaryGoal?: string | null;
		feelings?: string[];
	};
}

// Build context string from user data
function buildContextString(context: UserContext): string {
	const parts: string[] = [];

	if (context.healthScore !== undefined) {
		parts.push(`Current wellness score: ${context.healthScore}/100`);
	}

	if (context.profile?.primaryGoal) {
		parts.push(`Primary goal: ${context.profile.primaryGoal}`);
	}

	if (context.profile?.feelings && context.profile.feelings.length > 0) {
		parts.push(`Areas of focus: ${context.profile.feelings.join(", ")}`);
	}

	if (context.recentCheckins && context.recentCheckins.length > 0) {
		const latest = context.recentCheckins[0];
		if (latest) {
			parts.push(
				`Latest check-in (${latest.date}): Sleep ${latest.sleepScore}/5, Energy ${latest.energyScore}/5, Stress ${latest.stressScore}/5, Digestion ${latest.digestionScore}/5${latest.hasPain ? ", experiencing pain" : ""}`
			);
		}
	}

	return parts.length > 0
		? `\n\nUser context:\n${parts.join("\n")}`
		: "\n\nNo wellness data available yet.";
}

export const companionRouter = router({
	// Send message and get AI response
	chat: protectedProcedure
		.input(z.object({ message: z.string().min(1).max(2000) }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// Gather user context
			const [latestScore] = await db
				.select()
				.from(healthScore)
				.where(eq(healthScore.userId, userId))
				.orderBy(desc(healthScore.date))
				.limit(1);

			const recentCheckins = await db
				.select()
				.from(dailyCheckin)
				.where(eq(dailyCheckin.userId, userId))
				.orderBy(desc(dailyCheckin.date))
				.limit(7);

			const [profile] = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, userId));

			const userContext: UserContext = {
				healthScore: latestScore?.overallScore,
				recentCheckins: recentCheckins.map((c) => ({
					date: c.date,
					sleepScore: c.sleepQuality,
					energyScore: c.energy,
					stressScore: c.mood, // Mapping mood to stress score temporarily
					digestionScore: c.digestion,
					hasPain: c.pain > 0,
				})),
				profile: profile
					? {
							primaryGoal: profile.primaryGoal,
							feelings: (profile.symptoms as string[]) ?? [],
						}
					: undefined,
			};

			// Get recent conversation history (last 10 messages)
			const recentMessages = await db
				.select()
				.from(chatMessage)
				.where(eq(chatMessage.userId, userId))
				.orderBy(desc(chatMessage.createdAt))
				.limit(10);

			// Save user message
			await db.insert(chatMessage).values({
				userId,
				role: "user",
				content: input.message,
				context: userContext,
			});

			// Build messages array for OpenAI
			const contextString = buildContextString(userContext);
			const messages = [
				{ role: "system" as const, content: SYSTEM_PROMPT + contextString },
				...recentMessages.reverse().map((m) => ({
					role: m.role as "user" | "assistant",
					content: m.content,
				})),
				{ role: "user" as const, content: input.message },
			];

			// TODO: Call OpenAI API - for now return a placeholder
			// This will be implemented when OpenAI key is provided
			const aiResponse = generatePlaceholderResponse(
				input.message,
				userContext
			);

			// Save AI response
			const [savedMessage] = await db
				.insert(chatMessage)
				.values({
					userId,
					role: "assistant",
					content: aiResponse,
				})
				.returning();

			return {
				message: savedMessage,
				// Return messages array for future OpenAI integration
				_debug: { messagesCount: messages.length },
			};
		}),

	// Get conversation history
	history: protectedProcedure
		.input(z.object({ limit: z.number().min(1).max(50).default(20) }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const messages = await db
				.select()
				.from(chatMessage)
				.where(eq(chatMessage.userId, userId))
				.orderBy(desc(chatMessage.createdAt))
				.limit(input.limit);

			// Return in chronological order
			return messages.reverse();
		}),

	// Clear conversation history
	clear: protectedProcedure.mutation(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		await db.delete(chatMessage).where(eq(chatMessage.userId, userId));

		return { success: true };
	}),
});

// Placeholder response generator (will be replaced with OpenAI)
function generatePlaceholderResponse(
	message: string,
	context: UserContext
): string {
	const lowerMessage = message.toLowerCase();

	if (lowerMessage.includes("tired") || lowerMessage.includes("fatigue")) {
		return "I understand feeling tired can be frustrating. Based on your recent check-ins, focusing on consistent sleep timing might help. Try going to bed 30 minutes earlier tonight and see how you feel tomorrow.";
	}

	if (lowerMessage.includes("stress")) {
		return "Stress is something many people deal with. Consider taking 5 minutes today for deep breathing exercises. Even small moments of calm can make a difference in how you feel.";
	}

	if (lowerMessage.includes("sleep")) {
		return "Good sleep is foundational to feeling your best. Try limiting screen time an hour before bed and keeping your room cool. Your body will thank you!";
	}

	if (context.healthScore !== undefined) {
		if (context.healthScore >= 70) {
			return `Your wellness score of ${context.healthScore} shows you're doing well! Keep up your current habits and stay consistent with your daily check-ins.`;
		}
		return `I see your wellness score is ${context.healthScore}. Remember, small daily improvements add up. Focus on one area today - which feels most important to you?`;
	}

	return "I'm here to help you understand and improve your wellness. Feel free to ask me about sleep, stress, energy, or any wellness topic you're curious about!";
}
