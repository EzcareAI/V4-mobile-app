import type { ScanAIInput } from "../schemas";

/**
 * Generates the system prompt for Claude to process a wellness scan.
 * Enforces strict JSON output and non-diagnostic language.
 */
export function getScanSystemPrompt(): string {
	return `You are a high-end health and wellness assistant for EZCare AI. 
Your task is to analyze user-submitted symptom data and provide a personalized wellness interpretation.

### STRICTURE RULES:
1. OUTPUT: Valid JSON ONLY. No markdown, no commentary, no surrounding text.
2. TONE: Calm, reassuring, and professional.
3. MEDICAL BOUNDARY: Never claim to diagnose a condition. Never use "you have [disease]". Use "Your symptoms suggest...", "Possible contributors include...", etc.
4. CITATIONS: Implicitly align with CDC, NIH, or WHO public health guidance.
5. ESCALATION: Always include an escalation urgency level based on red flags.

### JSON SCHEMA:
{
  "scanId": "string (uuid)",
  "confidence": "number (0.0 - 1.0)",
  "processing_time_ms": "number (0)",
  "result": {
    "summary": "string (brief, 50-100 characters)",
    "possible_contributors": [
      {
        "factor": "string",
        "likelihood": "high|medium|low",
        "explanation": "string (1 sentence)"
      }
    ],
    "recommended_actions": [
      {
        "category": "nutrition|movement|sleep|stress|supplements",
        "action": "string (highly actionable)",
        "priority": "number (1-5, 1=highest)"
      }
    ],
    "things_to_avoid": ["string (max 5 items)"],
    "escalation": {
      "urgency": "none|monitor|consult_soon|seek_immediate",
      "reason": "string or null",
      "red_flags_detected": ["string array"]
    }
  },
  "disclaimer": "This is educational wellness information, not medical advice. Always consult a healthcare professional for clinical concerns."
}

### CONFIDENCE CALIBRATION:
- Reduce confidence if data quality is low (e.g., vague primary description, contradictory data).
- Ensure high urgency if red flags are present (e.g., severe pain, neurological symptoms, sudden onset).
`;
}

/**
 * Formats the user data into a clean prompt for Claude.
 */
export function formatScanUserPrompt(data: ScanAIInput): string {
	return `Here is the user's scan data to analyze:

SYMPTOMS:
- Primary: ${data.symptoms.primary.category} (${data.symptoms.primary.description})
- Severity: ${data.symptoms.primary.severity}/10
- Duration: ${data.symptoms.primary.duration_days} days
- Secondary: ${data.symptoms.secondary.map((s) => `${s.name} (${s.severity}/10, present: ${s.present})`).join(", ")}

LIFESTYLE:
- Sleep: ${data.lifestyle.sleep_hours}h
- Stress: ${data.lifestyle.stress_level}/10
- Exercise: ${data.lifestyle.exercise_frequency}
- Diet: ${data.lifestyle.diet_type}

CONTEXT:
- Age preference: ${data.medical_context.age_range}
- Biological sex: ${data.medical_context.biological_sex}
- Conditions: ${data.medical_context.existing_conditions?.join(", ") ?? "None"}
- Medications: ${data.medical_context.medications?.join(", ") ?? "None"}

Please generate the JSON response now.`;
}

/**
 * Simplified prompt for retry on failure.
 */
export function getSimplifiedScanPrompt(): string {
	return `The previous attempt failed or was malformed. 
Please provide a very simple, conservative wellness interpretation for the provided data. 
Ensure the JSON structure exactly matches the requested schema. 
Keep explanations extremely brief.`;
}
