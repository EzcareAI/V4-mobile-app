import { ScanAIInput, ScanAIInputSchema, ScanAIOutput, ScanAIOutputSchema } from "./schemas";

/**
 * Validates scan input data before sending to AI.
 * Clamps values to valid ranges where possible.
 */
export function validateScanInput(input: unknown): ScanAIInput {
    // Parse with Zod
    const result = ScanAIInputSchema.safeParse(input);

    if (!result.success) {
        console.error("Scan AI Input Validation Failed:", result.error.format());
        throw new Error(`Invalid scan input: ${result.error.message}`);
    }

    const data = result.data;

    // Value clamping logic (as specified in guardrails)
    return {
        ...data,
        lifestyle: {
            ...data.lifestyle,
            sleep_hours: Math.min(Math.max(data.lifestyle.sleep_hours, 0), 24),
            stress_level: Math.min(Math.max(data.lifestyle.stress_level, 1), 10),
        },
        symptoms: {
            ...data.symptoms,
            primary: {
                ...data.symptoms.primary,
                severity: Math.min(Math.max(data.symptoms.primary.severity, 1), 10),
            },
            secondary: data.symptoms.secondary.map(s => ({
                ...s,
                severity: Math.min(Math.max(s.severity, 1), 10),
            })),
        }
    };
}

/**
 * Validates AI output against the ScanAIOutput schema.
 */
export function validateScanOutput(output: unknown): ScanAIOutput {
    const result = ScanAIOutputSchema.safeParse(output);

    if (!result.success) {
        console.error("Scan AI Output Validation Failed:", result.error.format());
        throw new Error(`Invalid AI response structure: ${result.error.message}`);
    }

    return result.data;
}
