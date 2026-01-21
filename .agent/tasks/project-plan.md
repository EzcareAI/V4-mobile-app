# EZCare AI — Mobile App Project Plan

## Overview

EZCare AI is a mobile-first health companion app that helps users understand their body and improve health naturally through daily tracking, AI guidance, and personalized insights.

**Core Promise**: *"Understand what's happening in your body and improve it naturally — day by day — without needing a doctor for everything."*

---

## Project Phases

### Phase 1 (10-14 days) — Core MVP ✅ CURRENT
**Priority**: Daily check-in → Health Score → AI Companion → Paywall

| Component | Status | Description |
|-----------|--------|-------------|
| Onboarding | 🔲 TODO | 20-question personalized flow |
| Dashboard | 🔲 TODO | Health Score + action buttons + streak |
| Daily Check-In | 🔲 TODO | 30-second 5-metric check-in |
| Health Score | 🔲 TODO | Rolling score with trends |
| AI Companion (Text) | 🔲 TODO | Text chat with health context |
| Paywall | 🔲 TODO | Hard paywall €10.90/€39.99 |

---

### Phase 2 — Enhanced Features
| Component | Status | Description |
|-----------|--------|-------------|
| Meal Scan | 🔲 TODO | Photo-based meal analysis |
| Voice Mode | 🔲 TODO | STT + TTS for AI companion |
| Body Diagram | 🔲 TODO | Tap zones to identify issues |
| Diagnostic Flow | 🔲 TODO | Akinator-style symptom questions |

---

### Phase 3 — Polish & Advanced
| Component | Status | Description |
|-----------|--------|-------------|
| Animations | 🔲 TODO | Micro-animations, transitions |
| Advanced Insights | 🔲 TODO | Detailed charts, patterns |
| Push Notifications | 🔲 TODO | Daily reminders, streak alerts |

---

## Tech Stack

- **Frontend**: React Native (Expo Router), heroui-native, Tailwind (uniwind)
- **Backend**: Hono + tRPC, Drizzle ORM
- **Database**: Supabase (PostgreSQL)
- **Auth**: better-auth
- **Payments**: RevenueCat (planned)
- **AI**: OpenAI API (planned)

---

## Key Files

| Path | Purpose |
|------|---------|
| `apps/native/` | React Native mobile app |
| `apps/server/` | Hono API server |
| `packages/api/` | tRPC routers |
| `packages/db/` | Drizzle schema & migrations |
| `packages/auth/` | Authentication config |

---

## Database Schema (Phase 1)

```
user              — Auth users
user_profile      — Onboarding data, preferences
daily_checkin     — Daily health metrics
health_score      — Calculated scores + trends
chat_message      — AI conversation history
streak            — Check-in streak tracking
subscription      — RevenueCat subscription status
```

---

## Design Principles

1. **Mobile-first, mobile-only**
2. **Habit > diagnosis > monetization**
3. **Value before paywall, but paywall is hard**
4. **Calm, professional, futuristic**
5. **User feels "understood", not "analyzed"**

---

## Status Legend

- 🔲 TODO — Not started
- 🔄 IN PROGRESS — Being implemented
- ✅ DONE — Completed
- ⏸️ BLOCKED — Waiting on dependency
