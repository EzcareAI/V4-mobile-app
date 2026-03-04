-- Migration: Add Referral System to Onboarding Profiles
-- Timestamp: 2026-03-04
-- Note: This is a safe migration that adds columns only if they do not exist.

DO $$
BEGIN
    -- Add referral_code to onboarding_profiles
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'onboarding_profiles'
          AND column_name = 'referral_code'
    ) THEN
        ALTER TABLE public.onboarding_profiles ADD COLUMN referral_code text;
    END IF;

    -- Add referred_by_code to onboarding_profiles
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'onboarding_profiles'
          AND column_name = 'referred_by_code'
    ) THEN
        ALTER TABLE public.onboarding_profiles ADD COLUMN referred_by_code text;
    END IF;
END $$;

-- Drop function if exists to allow safe replacement
DROP FUNCTION IF EXISTS public.get_referral_count(text);

-- Creating the RPC function to count how many users were referred by a specific code
CREATE OR REPLACE FUNCTION public.get_referral_count(my_code text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)::integer
  FROM public.onboarding_profiles
  WHERE referred_by_code = my_code
    AND referred_by_code IS NOT NULL
    AND referred_by_code != '';
$$;
