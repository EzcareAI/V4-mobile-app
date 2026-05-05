-- ============================================================
-- SPRINT 5: Family Mode
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ============================================================
-- TABLE 1: family_groups
-- ============================================================
CREATE TABLE IF NOT EXISTS public.family_groups (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL DEFAULT 'My Family',
  max_members     int  NOT NULL DEFAULT 4,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  CONSTRAINT unique_family_owner UNIQUE (owner_user_id),
  CONSTRAINT valid_max_members CHECK (max_members >= 2 AND max_members <= 6)
);

CREATE INDEX IF NOT EXISTS idx_family_groups_owner ON public.family_groups(owner_user_id);

CREATE TRIGGER set_updated_at_family_groups
  BEFORE UPDATE ON public.family_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;

-- Owner can do everything; members can read their group
CREATE POLICY "Owner full access to family group"
  ON public.family_groups FOR ALL
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Members can read their family group"
  ON public.family_groups FOR SELECT
  USING (
    id IN (
      SELECT family_group_id FROM public.family_members
      WHERE user_id = auth.uid() AND removed_at IS NULL
    )
  );

-- ============================================================
-- TABLE 2: family_members
-- ============================================================
CREATE TABLE IF NOT EXISTS public.family_members (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id  uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             text NOT NULL DEFAULT 'member',
  profile_name     text NOT NULL,
  profile_color    text NOT NULL DEFAULT '#9D4EDD',
  profile_emoji    text NOT NULL DEFAULT '👤',
  visibility       jsonb NOT NULL DEFAULT '{"streak":true,"level":true,"quests":true,"league":true,"achievements":true}',
  joined_at        timestamptz DEFAULT now(),
  removed_at       timestamptz,

  CONSTRAINT unique_active_user_family UNIQUE (user_id, family_group_id),
  CONSTRAINT valid_role CHECK (role IN ('owner', 'parent', 'member'))
);

CREATE INDEX IF NOT EXISTS idx_family_members_user ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_group ON public.family_members(family_group_id);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Members can read all members in their group
CREATE POLICY "Members can read family members"
  ON public.family_members FOR SELECT
  USING (
    family_group_id IN (
      SELECT family_group_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.removed_at IS NULL
    )
  );

-- Users can insert themselves (joining)
CREATE POLICY "Users can join a family"
  ON public.family_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own membership (visibility, profile)
CREATE POLICY "Users can update own membership"
  ON public.family_members FOR UPDATE
  USING (auth.uid() = user_id);

-- Owner can remove members (soft-delete via removed_at)
CREATE POLICY "Owner can update any member"
  ON public.family_members FOR UPDATE
  USING (
    family_group_id IN (
      SELECT id FROM public.family_groups WHERE owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- TABLE 3: family_invites
-- ============================================================
CREATE TABLE IF NOT EXISTS public.family_invites (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id  uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  code             text NOT NULL,
  created_by       uuid NOT NULL REFERENCES auth.users(id),
  expires_at       timestamptz NOT NULL,
  used_by          uuid REFERENCES auth.users(id),
  used_at          timestamptz,
  created_at       timestamptz DEFAULT now(),

  CONSTRAINT unique_invite_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_family_invites_code ON public.family_invites(code);
CREATE INDEX IF NOT EXISTS idx_family_invites_group ON public.family_invites(family_group_id);

ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can read invites (needed for code validation)
CREATE POLICY "Anyone can read invites by code"
  ON public.family_invites FOR SELECT USING (true);

-- Owner/parent can create invites
CREATE POLICY "Family admins can create invites"
  ON public.family_invites FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    family_group_id IN (
      SELECT fm.family_group_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role IN ('owner', 'parent') AND fm.removed_at IS NULL
    )
  );

-- Update (mark as used)
CREATE POLICY "Anyone can mark invite used"
  ON public.family_invites FOR UPDATE USING (true);

-- ============================================================
-- TABLE 4: family_challenges
-- ============================================================
CREATE TABLE IF NOT EXISTS public.family_challenges (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id  uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  created_by       uuid NOT NULL REFERENCES auth.users(id),
  name             text NOT NULL,
  description      text,
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  target_metric    text NOT NULL,
  target_value     int  NOT NULL,
  participants     jsonb NOT NULL DEFAULT '[]',
  progress         jsonb NOT NULL DEFAULT '{}',
  status           text NOT NULL DEFAULT 'active',
  created_at       timestamptz DEFAULT now(),

  CONSTRAINT valid_challenge_status CHECK (status IN ('active', 'completed', 'failed')),
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_target CHECK (target_value > 0)
);

CREATE INDEX IF NOT EXISTS idx_family_challenges_group ON public.family_challenges(family_group_id, status);

ALTER TABLE public.family_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can read challenges"
  ON public.family_challenges FOR SELECT
  USING (
    family_group_id IN (
      SELECT family_group_id FROM public.family_members
      WHERE user_id = auth.uid() AND removed_at IS NULL
    )
  );

CREATE POLICY "Family members can create challenges"
  ON public.family_challenges FOR INSERT
  WITH CHECK (
    family_group_id IN (
      SELECT family_group_id FROM public.family_members
      WHERE user_id = auth.uid() AND removed_at IS NULL
    )
  );

CREATE POLICY "Family members can update challenges"
  ON public.family_challenges FOR UPDATE
  USING (
    family_group_id IN (
      SELECT family_group_id FROM public.family_members
      WHERE user_id = auth.uid() AND removed_at IS NULL
    )
  );
