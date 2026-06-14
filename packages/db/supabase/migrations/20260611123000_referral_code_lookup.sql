-- Referral code validation.
--
-- The referral onboarding screen lets a user enter a friend's code. That means
-- reading a DIFFERENT user's onboarding_profiles row by referral_code, which
-- row-level security normally forbids. This SECURITY DEFINER function performs
-- the existence check server-side and returns only a boolean — no row data
-- leaks, and it works for any caller.
--
-- (Previously the screen queried a public.profiles table that does not exist,
-- so every code was rejected. This restores the feature against the real
-- onboarding_profiles table.)

create or replace function public.referral_code_exists(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.onboarding_profiles
    where upper(referral_code) = upper(trim(p_code))
  );
$$;

grant execute on function public.referral_code_exists(text) to anon, authenticated;
