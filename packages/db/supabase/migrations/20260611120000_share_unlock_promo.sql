-- Share-to-unlock promo (pre-paywall growth gate).
--
-- When a user invites 3 friends on the share-unlock onboarding screen, the
-- client records the grant here so it survives reinstalls and can be honored
-- server-side later. This does NOT touch billing or the paywall — it only
-- marks that the user earned their free trial by sharing.
--
-- The app's profile table is onboarding_profiles (keyed by id, the
-- onboardingRecordId the client holds).

alter table public.onboarding_profiles
  add column if not exists share_unlock_complete boolean not null default false;

alter table public.onboarding_profiles
  add column if not exists promo_trial_days int not null default 0;

comment on column public.onboarding_profiles.share_unlock_complete is
  'True once the user invited the required number of friends on the share-unlock onboarding screen.';
comment on column public.onboarding_profiles.promo_trial_days is
  'Free trial days earned by sharing (0 if not unlocked). 3 to match the standard free trial.';
