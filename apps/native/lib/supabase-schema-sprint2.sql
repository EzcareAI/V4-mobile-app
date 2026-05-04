-- ============================================================
-- SPRINT 2: Awakening Levels + Quests + Streaks
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE 1: awakening_levels
-- ============================================================
CREATE TABLE IF NOT EXISTS public.awakening_levels (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level   int  NOT NULL DEFAULT 1,
  current_xp      int  NOT NULL DEFAULT 0,
  total_xp_earned int  NOT NULL DEFAULT 0,
  level_title     text NOT NULL DEFAULT 'Sleeper',
  avatar_stage    int  NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  CONSTRAINT unique_user_level UNIQUE (user_id),
  CONSTRAINT valid_level CHECK (current_level >= 1 AND current_level <= 50),
  CONSTRAINT valid_xp CHECK (current_xp >= 0),
  CONSTRAINT valid_total_xp CHECK (total_xp_earned >= 0),
  CONSTRAINT valid_avatar_stage CHECK (avatar_stage >= 0 AND avatar_stage <= 2)
);

CREATE INDEX IF NOT EXISTS idx_awakening_levels_user ON public.awakening_levels(user_id);

CREATE TRIGGER set_updated_at_awakening
  BEFORE UPDATE ON public.awakening_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.awakening_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own level"
  ON public.awakening_levels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own level"
  ON public.awakening_levels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own level"
  ON public.awakening_levels FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE 2: xp_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     int  NOT NULL,
  source     text NOT NULL,
  metadata   jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_source CHECK (source IN (
    'quest_completion', 'daily_check_in', 'meal_log',
    'streak_milestone', 'ai_chat', 'mood_log', 'daily_hero_bonus'
  ))
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON public.xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON public.xp_transactions(user_id, created_at DESC);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions"
  ON public.xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE 3: daily_quests
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_quests (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                date NOT NULL DEFAULT CURRENT_DATE,
  quests              jsonb NOT NULL,
  completed_quest_ids jsonb NOT NULL DEFAULT '[]',
  bonus_completed     boolean NOT NULL DEFAULT false,
  generated_at        timestamptz DEFAULT now(),
  expires_at          timestamptz NOT NULL,

  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON public.daily_quests(user_id, date DESC);

ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quests"
  ON public.daily_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own quests"
  ON public.daily_quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quests"
  ON public.daily_quests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE 4: streaks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.streaks (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak          int  NOT NULL DEFAULT 0,
  longest_streak          int  NOT NULL DEFAULT 0,
  last_activity_date      date,
  freezes_available       int  NOT NULL DEFAULT 1,
  freezes_used_this_month int  NOT NULL DEFAULT 0,
  freezes_reset_at        timestamptz DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),

  CONSTRAINT unique_user_streak UNIQUE (user_id),
  CONSTRAINT valid_streak CHECK (current_streak >= 0),
  CONSTRAINT valid_longest CHECK (longest_streak >= 0),
  CONSTRAINT valid_freezes CHECK (freezes_available >= 0)
);

CREATE INDEX IF NOT EXISTS idx_streaks_user ON public.streaks(user_id);

CREATE TRIGGER set_updated_at_streaks
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streak"
  ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own streak"
  ON public.streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak"
  ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE ROWS FOR NEW USERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_sprint2_rows()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.awakening_levels (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.streaks (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_sprint2
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_sprint2_rows();
