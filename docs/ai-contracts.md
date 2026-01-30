# AI ARCHITECTURE FOR EZCARE AI POC

## 1️⃣ AI vs RULE-BASED DECISION MAP

### **Body Scan Question Flow**
**Rule-based (hardcoded)**
- WHY: Questions are predefined and follow a clear tree structure. No AI needed for "if digestive → ask bloating Y/N". Saves tokens, faster, predictable.
- Flow: Hardcoded JSON tree with conditional branching based on symptom category.

### **Symptom Clarification Cards (yes/no, scale)**
**Rule-based (hardcoded)**
- WHY: Fixed UI patterns (binary, 1-10 scale). These are data collection, not interpretation. Keep deterministic for clean data structure.
- Example: "Rate your fatigue: 1-10" → stored as integer, no AI involved.

### **AI Result (causes, protocol, avoid, escalation)**
**AI-powered**
- WHY: This is THE core value prop. User expects personalized interpretation of their symptom constellation. Rule-based would feel robotic and miss nuanced patterns.
- Input: All collected scan data → Output: Tailored wellness guidance.

### **Daily Check-In Questions**
**Hybrid**
- WHY: Questions themselves are rule-based (3-5 fixed questions rotating by day), but we MAY use AI to select which 3 questions are most relevant based on yesterday's scan result.
- POC DECISION: Start rule-based (Mon=energy, Tue=sleep, etc.), add AI selection only if time permits Day 4-5.

### **Health Score Calculation**
**Rule-based (hardcoded)**
- WHY: POC needs simple, explainable math. Formula: `score = (consistency_streak * 0.3) + (symptom_severity_inverse * 0.5) + (check_in_completion * 0.2)`. AI would add latency/cost for marginal value.
- Makes score cacheable and instant.

### **Today Insight Text**
**AI-powered**
- WHY: This is the daily dopamine hit. "Based on your 3-day trend, your fatigue may be linked to..." feels magical. Rule-based would be repetitive by Day 3.
- Input: Last 7 days of check-ins + original scan → Output: 2-sentence personalized insight.

### **Paywall Logic**
**Rule-based (hardcoded)**
- WHY: Business logic. Trigger = "scan complete + no subscription". No AI interpretation needed. Clear deterministic gate.

---

## STRICT AI OUTPUT RULES (NON-NEGOTIABLE)

- AI MUST return valid JSON only
- NO markdown
- NO explanations
- NO surrounding text
- NO trailing commas
- MUST match the schema exactly
- If unsure, return a LOW confidence result instead of guessing

---

## 2️⃣ AI INPUT/OUTPUT CONTRACTS

### **ScanAIInput**
```json
{
  "userId": "uuid-string",
  "scanId": "uuid-string",
  "timestamp": "2026-01-31T10:30:00Z",
  "symptoms": {
    "primary": {
      "category": "digestive|energy|sleep|pain|mental|skin",
      "description": "string (user free text, max 500 chars)",
      "severity": 1-10,
      "duration_days": "number"
    },
    "secondary": [
      {
        "name": "bloating|headache|anxiety|etc",
        "present": true,
        "severity": 1-10
      }
    ]
  },
  "lifestyle": {
    "sleep_hours": 1-12,
    "stress_level": 1-10,
    "exercise_frequency": "none|light|moderate|intense",
    "diet_type": "standard|vegetarian|keto|etc"
  },
  "medical_context": {
    "age_range": "18-25|26-35|36-50|51+",
    "biological_sex": "male|female|other|prefer-not-to-say",
    "existing_conditions": ["string array, optional"],
    "medications": ["string array, optional"]
  },
  "meta": {
    "data_quality": "high|medium|low",
    "notes": "optional string"
  }
}
```

### **ScanAIOutput**
```json
{
  "scanId": "uuid-string",
  "confidence": 0.0-1.0,
  "processing_time_ms": "number",
  "result": {
    "summary": "string (50-100 chars, e.g., 'Your symptoms suggest stress-related digestive sensitivity')",
    "possible_contributors": [
      {
        "factor": "string (e.g., 'Chronic stress')",
        "likelihood": "high|medium|low",
        "explanation": "string (1 sentence)"
      }
    ],
    "recommended_actions": [
      {
        "category": "nutrition|movement|sleep|stress|supplements",
        "action": "string (actionable, e.g., 'Try 10min morning walks')",
        "priority": 1-5
      }
    ],
    "things_to_avoid": ["string array, max 5 items"],
    "escalation": {
      "urgency": "none|monitor|consult_professional|urgent_attention",
      "reason": "string or null",
      "red_flags_detected": ["string array or empty"]
    }
  },
  "disclaimer": "This is educational wellness information, not medical diagnosis. Consult a healthcare provider for medical concerns."
}
```

### **DailyInsightInput**
```json
{
  "userId": "uuid-string",
  "date": "2026-01-31",
  "recent_check_ins": [
    {
      "date": "2026-01-30",
      "energy_level": 1-10,
      "sleep_quality": 1-10,
      "symptom_severity": 1-10,
      "notes": "string or null"
    }
  ],
  "original_scan_summary": "string (from ScanAIOutput.result.summary)",
  "days_since_scan": "number"
}
```

### **DailyInsightOutput**
```json
{
  "date": "2026-01-31",
  "insight": {
    "text": "string (2-3 sentences, encouraging + actionable)",
    "tone": "encouraging|cautionary|celebratory",
    "confidence": 0.0-1.0
  },
  "suggested_focus": {
    "area": "nutrition|movement|sleep|stress",
    "micro_action": "string (tiny habit, e.g., '5min breathing before bed')"
  }
}
```

---

## 3️⃣ BACKEND API ENDPOINTS (tRPC)

### **`scan.create`**
- **Input:** `{ userId: string, startedAt: timestamp }`
- **Output:** `{ scanId: string, status: "in_progress" }`
- **AI:** No

### **`scan.submitAnswers`**
- **Input:** `{ scanId: string, answers: ScanAIInput }`
- **Output:** `{ success: boolean, scanId: string }`
- **AI:** No (just saves to DB)

### **`scan.generateResult`**
- **Input:** `{ scanId: string }`
- **Output:** `ScanAIOutput` (blurred if not subscribed)
- **AI:** YES (calls Claude Sonnet 4.5 with ScanAIInput)
- **Side effect:** Saves result to `scan_results` table
- **Paywall behavior:**
  - **Free users:**
    - `summary` → visible
    - `possible_contributors` → visible
    - `recommended_actions` → BLURRED
    - `things_to_avoid` → BLURRED
  - **Paid users:**
    - Full object visible

### **`scan.getResult`**
- **Input:** `{ scanId: string }`
- **Output:** `ScanAIOutput` (blurred if not subscribed)
- **AI:** No (cached from DB)

### **`checkIn.submit`**
- **Input:** `{ userId: string, date: string, answers: { energy: number, sleep: number, notes?: string } }`
- **Output:** `{ checkInId: string, success: boolean }`
- **AI:** No

### **`insights.getToday`**
- **Input:** `{ userId: string, date: string }`
- **Output:** `DailyInsightOutput`
- **AI:** YES (generates on-demand, caches for 24h)

### **`progress.getTimeline`**
- **Input:** `{ userId: string, days: number }`
- **Output:** `{ timeline: Array<{ date, score, check_in_completed }>, healthScore: number }`
- **AI:** No (rule-based aggregation)

### **`progress.getHealthScore`**
- **Input:** `{ userId: string }`
- **Output:** `{ score: 0-100, breakdown: { consistency, symptoms, engagement } }`
- **AI:** No (formula-based)

---

## 4️⃣ GUARDRAILS & FAILURE HANDLING

### **AI Timeout (>10s)**
- **Strategy:** Return cached "generic" response from template pool
- **Template:** "We're analyzing your scan... Check back in 1 min for personalized results."
- **Background:** Queue AI job, save result when complete, notify user
- **POC:** 15s timeout → fallback to generic message + retry once

### **Invalid AI Response (malformed JSON)**
- **Strategy:** Validate against schema before saving
- **Fallback:** If validation fails, log error + return safe default structure
- **Safe Default:**
```json
{
  "summary": "Processing your scan...",
  "confidence": 0.0,
  "escalation": { "urgency": "monitor" },
  "disclaimer": "..."
}
```
- **POC:** Retry once with simplified prompt, then fallback

### **Low Confidence Output (<0.6)**
- **Strategy:** Show result BUT add UI banner: "Limited data - insights will improve with daily check-ins"
- **Include:** Extra-strong disclaimer
- **Escalation override:** If `confidence < 0.6` AND `escalation.urgency != "none"` → force "consult_soon"
- **POC:** Don't block, just add warning flag in UI

### **Inconsistent User Answers**
- **Detection:** Backend validation (e.g., "sleep_hours: 15" → invalid)
- **Handling:**
  - Clamp values to valid ranges (1-12 for sleep)
  - If critical contradiction (e.g., severity=10 + duration=0), add to AI input as `"data_quality": "low"`
  - Claude will see this flag and adjust confidence accordingly
- **POC:** Simple clamping + flag, no complex reconciliation

### **Rate Limiting (Free AI Tier)**
- **Strategy:** 
  - Cache all AI outputs for 7 days
  - Scan results: Never regenerate (stored permanently)
  - Daily insights: Cache per user per day
  - If rate limit hit → serve cached version with timestamp
- **POC:** Monitor token usage, add queue if >500 requests/day

### **General Error UX**
- **Never:** Show raw errors to user
- **Always:** Log to error tracking (Sentry-like)
- **User sees:** "Something went wrong. Try again in a moment."
- **Retry button:** Yes (max 2 attempts)

---

**IMPLEMENTATION PRIORITY FOR POC:**
1. Day 1-2: Scan AI (most critical)
2. Day 3: Daily insights (engagement hook)
3. Day 4-5: Guardrails + polish + paywall integration

## AI NON-GOALS (POC)

AI MUST NOT:
- Diagnose conditions
- Predict diseases
- Recommend medication dosages
- Replace professional care
- Reference user identity directly
