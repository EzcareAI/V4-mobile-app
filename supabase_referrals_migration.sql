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

-- Function to generate a random 6-character string (A-Z, 2-9)
CREATE OR REPLACE FUNCTION public.generate_random_referral()
RETURNS text AS $$
DECLARE
    chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result text := '';
    i integer := 0;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN 'EZCARE-' || result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function to guarantee uniqueness by looping until an unused code is found
CREATE OR REPLACE FUNCTION public.assign_unique_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code text;
    is_unique boolean := false;
BEGIN
    IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
        WHILE NOT is_unique LOOP
            new_code := public.generate_random_referral();
            
            -- Check if anyone already has this code
            PERFORM 1 FROM public.onboarding_profiles WHERE referral_code = new_code;
            IF NOT FOUND THEN
                is_unique := true;
                NEW.referral_code := new_code;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the onboarding_profiles table (BEFORE INSERT)
DROP TRIGGER IF EXISTS ensure_unique_referral_code ON public.onboarding_profiles;
CREATE TRIGGER ensure_unique_referral_code
    BEFORE INSERT ON public.onboarding_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_unique_referral_code();
