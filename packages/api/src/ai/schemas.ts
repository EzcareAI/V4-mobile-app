import { z } from "zod";

// --- Input Schemas ---

export const ScanAIInputSchema = z.object({
    userId: z.string().uuid(),
    scanId: z.string().uuid(),
    timestamp: z.string().datetime(),
    symptoms: z.object({
        primary: z.object({
            category: z.enum(["digestive", "energy", "sleep", "pain", "mental", "skin"]),
            description: z.string().max(500),
            severity: z.number().int().min(1).max(10),
            duration_days: z.number().int().nonnegative(),
        }),
        secondary: z.array(
            z.object({
                name: z.string(),
                present: z.boolean(),
                severity: z.number().int().min(1).max(10),
            })
        ),
    }),
    lifestyle: z.object({
        sleep_hours: z.number().min(0).max(24),
        stress_level: z.number().int().min(1).max(10),
        exercise_frequency: z.enum(["none", "light", "moderate", "intense"]),
        diet_type: z.string(),
    }),
    medical_context: z.object({
        age_range: z.string(), // e.g., "18-25"
        biological_sex: z.string(), // e.g., "male", "female"
        existing_conditions: z.array(z.string()).optional(),
        medications: z.array(z.string()).optional(),
    }),
});

export type ScanAIInput = z.infer<typeof ScanAIInputSchema>;

// --- Output Schemas ---

export const ScanAIOutputSchema = z.object({
    scanId: z.string().uuid(),
    confidence: z.number().min(0).max(1),
    processing_time_ms: z.number().int().nonnegative(),
    result: z.object({
        summary: z.string(),
        possible_contributors: z.array(
            z.object({
                factor: z.string(),
                likelihood: z.enum(["high", "medium", "low"]),
                explanation: z.string(),
            })
        ),
        recommended_actions: z.array(
            z.object({
                category: z.enum(["nutrition", "movement", "sleep", "stress", "supplements"]),
                action: z.string(),
                priority: z.number().int().min(1).max(5),
            })
        ),
        things_to_avoid: z.array(z.string()).max(5),
        escalation: z.object({
            urgency: z.enum(["none", "monitor", "consult_soon", "seek_immediate"]),
            reason: z.string().optional().nullable(),
            red_flags_detected: z.array(z.string()),
        }),
    }),
    disclaimer: z.string(),
});

export type ScanAIOutput = z.infer<typeof ScanAIOutputSchema>;

// --- Daily Insight (Stubs for Day 3) ---

export const DailyInsightInputSchema = z.object({
    userId: z.string().uuid(),
    date: z.string(),
    recent_check_ins: z.array(z.any()), // Simplified for POC
    original_scan_summary: z.string(),
    days_since_scan: z.number().int(),
});

export type DailyInsightInput = z.infer<typeof DailyInsightInputSchema>;

export const DailyInsightOutputSchema = z.object({
    date: z.string(),
    insight: z.object({
        text: z.string(),
        tone: z.enum(["encouraging", "cautionary", "celebratory"]),
        confidence: z.number().min(0).max(1),
    }),
    suggested_focus: z.object({
        area: z.enum(["nutrition", "movement", "sleep", "stress"]),
        micro_action: z.string(),
    }),
});

export type DailyInsightOutput = z.infer<typeof DailyInsightOutputSchema>;
