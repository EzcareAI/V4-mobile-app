-- Anthropic proxy usage log + per-user rate limiting.
--
-- The anthropic-proxy Edge Function writes one row per upstream call so we
-- have an audit trail of who's spending the team's Anthropic budget. The
-- same table is queried by the function to enforce a per-user rate limit
-- (default: 60 requests per 60 seconds).

create extension if not exists pgcrypto;

create table if not exists public.anthropic_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  model text,
  input_tokens int,
  output_tokens int,
  cache_read_input_tokens int,
  cache_creation_input_tokens int,
  status int,
  request_id text,
  route text
);

-- Per-user-by-time queries dominate (rate-limit count + recent usage view).
create index if not exists anthropic_usage_user_time
  on public.anthropic_usage (user_id, created_at desc);

-- RLS: users can read their own rows; nobody can write from client. The
-- Edge Function uses the service-role key to insert, bypassing RLS.
alter table public.anthropic_usage enable row level security;

drop policy if exists "users read own anthropic_usage"
  on public.anthropic_usage;
create policy "users read own anthropic_usage"
  on public.anthropic_usage
  for select
  to authenticated
  using (user_id = auth.uid());

-- Rate-limit helper. Returns the count of requests this user has made in
-- the last <window_seconds> seconds. Marked stable so PostgREST can call it.
create or replace function public.anthropic_recent_count(
  p_user_id uuid,
  p_window_seconds int
)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.anthropic_usage
  where user_id = p_user_id
    and created_at >= now() - make_interval(secs => p_window_seconds);
$$;
