-- ============================================================
-- SPRINT 4: Awakening Ritual + AI Insights
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ============================================================
-- TABLE 1: awakening_rituals (one per user per day)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.awakening_rituals (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             date NOT NULL DEFAULT CURRENT_DATE,
  sleep_score      int NOT NULL,
  energy_score     int NOT NULL,
  intention        text NOT NULL,
  breath_completed boolean NOT NULL DEFAULT true,
  quests_generated jsonb,
  completed_at     timestamptz DEFAULT now(),

  CONSTRAINT unique_user_ritual_date UNIQUE (user_id, date),
  CONSTRAINT valid_sleep CHECK (sleep_score >= 1 AND sleep_score <= 5),
  CONSTRAINT valid_energy CHECK (energy_score >= 1 AND energy_score <= 10)
);

CREATE INDEX IF NOT EXISTS idx_rituals_user_date ON public.awakening_rituals(user_id, date DESC);

ALTER TABLE public.awakening_rituals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own rituals"
  ON public.awakening_rituals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rituals"
  ON public.awakening_rituals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE 2: user_insights (AI-generated post-quest insights)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_insights (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_event          text NOT NULL,
  insight                text NOT NULL,
  pattern_detected       text,
  next_action_suggestion text,
  context                jsonb DEFAULT '{}',
  created_at             timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insights_user ON public.user_insights(user_id, created_at DESC);

ALTER TABLE public.user_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own insights"
  ON public.user_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights"
  ON public.user_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- UPDATE xp_transactions source constraint for new sources
-- ============================================================
ALTER TABLE public.xp_transactions DROP CONSTRAINT IF EXISTS valid_source;
ALTER TABLE public.xp_transactions ADD CONSTRAINT valid_source CHECK (source IN (
  'quest_completion', 'daily_check_in', 'meal_log',
  'streak_milestone', 'ai_chat', 'mood_log', 'daily_hero_bonus',
  'achievement_bonus', 'league_promotion', 'awakening_ritual'
));
