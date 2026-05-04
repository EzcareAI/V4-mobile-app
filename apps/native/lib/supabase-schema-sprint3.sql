-- ============================================================
-- SPRINT 3: Leagues + Achievements + Avatar Evolution
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ============================================================
-- TABLE 1: user_leagues (current state per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_leagues (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_league  text NOT NULL DEFAULT 'bronze',
  updated_at      timestamptz DEFAULT now(),

  CONSTRAINT unique_user_league UNIQUE (user_id),
  CONSTRAINT valid_league CHECK (current_league IN (
    'bronze', 'silver', 'gold', 'sapphire', 'ruby', 'diamond', 'legendary'
  ))
);

CREATE INDEX IF NOT EXISTS idx_user_leagues_user ON public.user_leagues(user_id);

CREATE TRIGGER set_updated_at_user_leagues
  BEFORE UPDATE ON public.user_leagues
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.user_leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own league"
  ON public.user_leagues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own league"
  ON public.user_leagues FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own league"
  ON public.user_leagues FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE 2: league_week_entries (one row per user per week)
-- This IS the leaderboard. group_id clusters 30 users together.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.league_week_entries (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id        uuid NOT NULL,
  week_start      date NOT NULL,
  league_name     text NOT NULL,
  week_xp         int  NOT NULL DEFAULT 0,
  final_rank      int,
  promoted        boolean DEFAULT false,
  relegated       boolean DEFAULT false,
  finalized       boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  CONSTRAINT unique_user_week UNIQUE (user_id, week_start),
  CONSTRAINT valid_week_league CHECK (league_name IN (
    'bronze', 'silver', 'gold', 'sapphire', 'ruby', 'diamond', 'legendary'
  )),
  CONSTRAINT valid_week_xp CHECK (week_xp >= 0)
);

CREATE INDEX IF NOT EXISTS idx_lwe_user_week ON public.league_week_entries(user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_lwe_group ON public.league_week_entries(group_id, week_xp DESC);
CREATE INDEX IF NOT EXISTS idx_lwe_league_week ON public.league_week_entries(league_name, week_start);

CREATE TRIGGER set_updated_at_lwe
  BEFORE UPDATE ON public.league_week_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.league_week_entries ENABLE ROW LEVEL SECURITY;

-- Users can read ALL entries in their group (leaderboard visibility)
CREATE POLICY "Users can read group entries"
  ON public.league_week_entries FOR SELECT
  USING (
    group_id IN (
      SELECT e.group_id FROM public.league_week_entries e
      WHERE e.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own week entry"
  ON public.league_week_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own week entry"
  ON public.league_week_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE 3: achievements (definitions - static rows)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text NOT NULL,
  rarity      text NOT NULL DEFAULT 'common',
  icon        text NOT NULL DEFAULT 'star',
  xp_bonus    int  NOT NULL DEFAULT 0,
  conditions  jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),

  CONSTRAINT valid_rarity CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

-- No RLS on achievements - everyone can read definitions
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read achievements"
  ON public.achievements FOR SELECT USING (true);

-- ============================================================
-- TABLE 4: user_achievements (unlocked per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at    timestamptz DEFAULT now(),
  progress       jsonb NOT NULL DEFAULT '{}',

  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own achievements"
  ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE 5: avatar_evolution (visual config per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.avatar_evolution (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stage   int   NOT NULL DEFAULT 1,
  glow_intensity  float NOT NULL DEFAULT 0.0,
  color_signature text  NOT NULL DEFAULT '#9D4EDD',
  aura_visible    boolean NOT NULL DEFAULT false,
  particle_density float NOT NULL DEFAULT 0.0,
  pose            text  NOT NULL DEFAULT 'curled',
  updated_at      timestamptz DEFAULT now(),

  CONSTRAINT unique_user_avatar UNIQUE (user_id),
  CONSTRAINT valid_stage CHECK (current_stage >= 1 AND current_stage <= 10),
  CONSTRAINT valid_glow CHECK (glow_intensity >= 0.0 AND glow_intensity <= 1.0),
  CONSTRAINT valid_density CHECK (particle_density >= 0.0 AND particle_density <= 1.0),
  CONSTRAINT valid_pose CHECK (pose IN ('curled', 'sitting', 'standing', 'expansive', 'transcendent'))
);

CREATE INDEX IF NOT EXISTS idx_avatar_evolution_user ON public.avatar_evolution(user_id);

CREATE TRIGGER set_updated_at_avatar
  BEFORE UPDATE ON public.avatar_evolution
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.avatar_evolution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own avatar"
  ON public.avatar_evolution FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own avatar"
  ON public.avatar_evolution FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own avatar"
  ON public.avatar_evolution FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SEED: Initial achievement definitions (20 achievements)
-- ============================================================
INSERT INTO public.achievements (code, name, description, rarity, icon, xp_bonus, conditions) VALUES
  -- Common (white badge)
  ('first_steps',      'First Steps',      'Complete your first quest',              'common',    'footprints',     50,  '{"type":"quest_count","target":1}'),
  ('daily_doer',       'Daily Doer',       'Complete all 3 daily quests in one day', 'common',    'check-circle',   75,  '{"type":"daily_all_quests","target":1}'),
  ('hydration_hero',   'Hydration Hero',   'Hit your water goal once',              'common',    'droplet',        50,  '{"type":"water_goal","target":1}'),
  ('first_scan',       'Scan Master',      'Scan your first meal',                  'common',    'camera',         50,  '{"type":"meal_scan","target":1}'),
  ('vibe_check',       'Vibe Checked',     'Log your mood for the first time',      'common',    'smile',          50,  '{"type":"mood_log","target":1}'),

  -- Rare (silver badge)
  ('early_bird_7d',    'Early Bird',       'Check in before 7 AM for 7 days',       'rare',      'sunrise',        200, '{"type":"early_checkin_streak","target":7}'),
  ('deep_diver',       'Deep Diver',       'Reach a 7-day streak',                  'rare',      'flame',          200, '{"type":"streak","target":7}'),
  ('quest_crusher_30', 'Quest Crusher',    'Complete 30 quests total',              'rare',      'swords',         300, '{"type":"quest_count","target":30}'),
  ('mood_tracker_14',  'Mood Tracker',     'Log your mood for 14 days',            'rare',      'heart',          250, '{"type":"mood_streak","target":14}'),
  ('scan_streak_7',    'Nutrition Nerd',   'Scan meals 7 days in a row',           'rare',      'utensils',       200, '{"type":"scan_streak","target":7}'),

  -- Epic (gold badge)
  ('iron_will',        'Iron Will',        'Complete every daily quest for 30 days', 'epic',      'shield',         500, '{"type":"daily_all_quests_streak","target":30}'),
  ('streak_master_30', 'Streak Master',    'Reach a 30-day streak',                'epic',      'fire',           500, '{"type":"streak","target":30}'),
  ('quest_legend_100', 'Quest Legend',     'Complete 100 quests total',             'epic',      'trophy',         500, '{"type":"quest_count","target":100}'),
  ('chat_sage',        'Chat Sage',        'Have 50 conversations with EZBuddy',   'epic',      'message-circle', 400, '{"type":"chat_count","target":50}'),
  ('league_climber',   'League Climber',   'Get promoted 3 times',                 'epic',      'trending-up',    500, '{"type":"promotions","target":3}'),

  -- Legendary (diamond badge)
  ('awakened',         'Awakened',         'Reach Awakening Level 25',              'legendary', 'zap',            1000, '{"type":"level","target":25}'),
  ('sovereign',        'Sovereign',        'Reach Awakening Level 50',              'legendary', 'crown',          2000, '{"type":"level","target":50}'),
  ('centurion',        'Centurion',        'Reach a 100-day streak',               'legendary', 'award',          1500, '{"type":"streak","target":100}'),
  ('league_champion',  'League Champion',  'Finish #1 in Legendary league',        'legendary', 'medal',          2000, '{"type":"legendary_first","target":1}'),
  ('polymath',         'Polymath',         'Unlock 15 achievements',               'legendary', 'star',           1500, '{"type":"achievement_count","target":15}')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- WEEKLY FINALIZATION FUNCTION (pg_cron or Edge Function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.finalize_weekly_leagues()
RETURNS void AS $$
DECLARE
  grp RECORD;
  entry RECORD;
  member_count int;
  rank_num int;
  promo_threshold int;
  releg_threshold int;
  next_league text;
  prev_league text;
  league_order text[] := ARRAY['bronze','silver','gold','sapphire','ruby','diamond','legendary'];
  current_idx int;
BEGIN
  FOR grp IN
    SELECT DISTINCT group_id, league_name, week_start
    FROM public.league_week_entries
    WHERE finalized = false
      AND week_start < date_trunc('week', now())::date
  LOOP
    rank_num := 0;
    FOR entry IN
      SELECT id, user_id, week_xp
      FROM public.league_week_entries
      WHERE group_id = grp.group_id AND week_start = grp.week_start
      ORDER BY week_xp DESC
    LOOP
      rank_num := rank_num + 1;
      UPDATE public.league_week_entries
        SET final_rank = rank_num, finalized = true
        WHERE id = entry.id;
    END LOOP;

    member_count := rank_num;

    CASE grp.league_name
      WHEN 'bronze'    THEN promo_threshold := 5; releg_threshold := 0;
      WHEN 'silver'    THEN promo_threshold := 5; releg_threshold := 3;
      WHEN 'gold'      THEN promo_threshold := 5; releg_threshold := 5;
      WHEN 'sapphire'  THEN promo_threshold := 5; releg_threshold := 5;
      WHEN 'ruby'      THEN promo_threshold := 3; releg_threshold := 5;
      WHEN 'diamond'   THEN promo_threshold := 3; releg_threshold := 5;
      WHEN 'legendary' THEN promo_threshold := 0; releg_threshold := 5;
    END CASE;

    current_idx := array_position(league_order, grp.league_name);

    -- Promote top N
    IF promo_threshold > 0 AND current_idx < 7 THEN
      next_league := league_order[current_idx + 1];
      UPDATE public.league_week_entries SET promoted = true
        WHERE group_id = grp.group_id AND week_start = grp.week_start
          AND final_rank <= promo_threshold;
      UPDATE public.user_leagues SET current_league = next_league
        WHERE user_id IN (
          SELECT user_id FROM public.league_week_entries
          WHERE group_id = grp.group_id AND week_start = grp.week_start
            AND final_rank <= promo_threshold
        );
    END IF;

    -- Relegate bottom N
    IF releg_threshold > 0 AND current_idx > 1 THEN
      prev_league := league_order[current_idx - 1];
      UPDATE public.league_week_entries SET relegated = true
        WHERE group_id = grp.group_id AND week_start = grp.week_start
          AND final_rank > (member_count - releg_threshold);
      UPDATE public.user_leagues SET current_league = prev_league
        WHERE user_id IN (
          SELECT user_id FROM public.league_week_entries
          WHERE group_id = grp.group_id AND week_start = grp.week_start
            AND final_rank > (member_count - releg_threshold)
        );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- AUTO-CREATE ROWS FOR NEW USERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_sprint3_rows()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_leagues (user_id, current_league)
    VALUES (NEW.id, 'bronze') ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.avatar_evolution (user_id)
    VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_sprint3
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_sprint3_rows();

-- ============================================================
-- UPDATE xp_transactions source constraint for new sources
-- ============================================================
ALTER TABLE public.xp_transactions DROP CONSTRAINT IF EXISTS valid_source;
ALTER TABLE public.xp_transactions ADD CONSTRAINT valid_source CHECK (source IN (
  'quest_completion', 'daily_check_in', 'meal_log',
  'streak_milestone', 'ai_chat', 'mood_log', 'daily_hero_bonus',
  'achievement_bonus', 'league_promotion'
));

-- ============================================================
-- SCHEDULE (run in Supabase SQL after enabling pg_cron):
-- SELECT cron.schedule('weekly-league-reset', '59 23 * * 0', 'SELECT public.finalize_weekly_leagues()');
-- ============================================================
