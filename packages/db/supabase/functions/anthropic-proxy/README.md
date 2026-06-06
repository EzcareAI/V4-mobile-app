# Anthropic key rotation + proxy deployment

This document covers the security incident from June 6 2026 and the steps
needed to ship the fix.

## What happened

Two different Anthropic API keys (`sk-ant-api03-bQPAL0AF...` in
`apps/native/eas.json` and `sk-ant-api03-1omv_uXkb...` in
`packages/env/src/native.ts`) were hardcoded in tracked files. They were
also bundled into every EAS build via `EXPO_PUBLIC_ANTHROPIC_API_KEY`,
which means anyone with a copy of the production APK/IPA can extract
them.

Anthropic auto-scans GitHub for leaked `sk-ant-*` patterns and
auto-revokes any keys it finds. Production now returns
`401 invalid x-api-key` because both keys were nuked the moment they
hit GitHub (even though the repo is private, the scanner may have flagged
them via webhook or push event).

## What changed in the codebase

The mobile app no longer holds an Anthropic key. All chat / vision /
quest-generation / insight calls now go through a Supabase Edge Function
that authenticates the request via the user's Supabase JWT and forwards
to api.anthropic.com with a server-held key.

Files touched:

- **NEW** `packages/db/supabase/functions/anthropic-proxy/index.ts` — the
  Edge Function. Verifies JWT via Supabase (default), forwards body to
  Anthropic Messages API verbatim, pipes the response (works for
  streaming SSE too).
- **NEW** `apps/native/lib/anthropic.ts` — rewritten as a thin client
  that posts to the Edge Function with the user's `access_token`. Exposes
  `callAnthropic()` + `extractText()` for the rest of the app to use.
- `apps/native/app/chat.tsx` — drops the Anthropic SDK; uses
  `callAnthropic` via the proxy. Streaming path removed (can be added
  back through the proxy as a follow-up).
- `apps/native/app/scan/meal-scanner.tsx` — same pattern.
- `apps/native/lib/quest-generator.ts` — same.
- `apps/native/lib/ai-analysis.ts` — same.
- `apps/native/lib/insights-engine.ts` — same.
- `apps/native/eas.json` — `EXPO_PUBLIC_ANTHROPIC_API_KEY` removed.
- `packages/env/src/native.ts` — `ANTHROPIC_API_KEY` field + default
  removed from the schema.
- `packages/db/supabase/config.toml` — explicit
  `[functions.anthropic-proxy] verify_jwt = true`.

## Required steps before the next build

These can't be done from the codebase. Do them in order.

### 1. Revoke the leaked keys (1 minute)

Open https://console.anthropic.com/settings/keys and revoke:

- `sk-ant-api03-bQPAL0AF...` (the eas.json key)
- `sk-ant-api03-1omv_uXkb...` (the native.ts defaults key)

If they show as already revoked (Anthropic's scanner is usually faster
than humans), that confirms the leak hypothesis.

### 2. Generate a fresh key

Same page, "Create Key", scope it to the Messages API. Copy the value.

### 3. Set it as a Supabase secret (1 minute)

```sh
cd packages/db/supabase
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-<new-key-here>
```

Secrets are scoped to the linked Supabase project and become available
inside the Edge Function as `Deno.env.get("ANTHROPIC_API_KEY")`. They
never appear in any tracked file.

### 4. Deploy the function

```sh
supabase functions deploy anthropic-proxy
```

The function URL will be:
`https://gutftkmzvskuyxlldzkx.supabase.co/functions/v1/anthropic-proxy`

The mobile app already points at that URL via `env.EXPO_PUBLIC_SUPABASE_URL`.

### 5. Verify locally before building

```sh
# Get a user JWT (e.g. from the app's auth flow or supabase dashboard)
TOKEN=<paste user JWT>
curl -X POST https://gutftkmzvskuyxlldzkx.supabase.co/functions/v1/anthropic-proxy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 64,
    "messages": [{"role": "user", "content": "say hi"}]
  }'
```

Expected: `200` with an Anthropic Messages response. Should NOT return
`401 invalid x-api-key` — if it does, the secret wasn't picked up.

### 6. Rebuild + ship

```sh
# Bump the version, then build for whichever profile you ship users on:
cd apps/native
eas build --profile production --platform all
# or
eas build --profile preview --platform android
```

Existing installs will keep hitting the old (leaked, revoked) key path
until users update. Communicate the chat-broken window to users (the
in-app error now reads "You've been signed out. Please sign in again."
which isn't quite right for them — consider a forced-update prompt for
versions older than this build).

## Why streaming was removed

The previous chat.tsx / meal-scanner.tsx used `anthropic.messages.stream`
via the Anthropic SDK on iOS, which called `api.anthropic.com` directly
with the client-held key. Routing that through the proxy is doable
(`stream: true` in the body, parse SSE in the client) but is a separate
diff. The current build uses the non-streaming `messages.create` shape
through the proxy on both platforms; UX impact is that the assistant's
reply lands all at once rather than streaming in.

If streaming is important for UX, the follow-up is:
1. Have the client send `stream: true` in the request body.
2. The proxy already pipes the response stream back (look at the
   `return new Response(upstream.body, ...)` line).
3. Parse the SSE in the client. React Native's fetch supports
   `response.body.getReader()` on iOS; Android Hermes does not, so
   Android would still need the non-streaming path.

## Defense-in-depth follow-ups

- **Rate-limit the function.** Currently anyone with a valid JWT can spam
  it. Add a per-user rate limit (Supabase has hooks for this) or wrap in
  a Cloudflare Worker.
- **Log usage by user.** Insert a row into a `anthropic_usage` table per
  call so you can see who's spending the budget.
- **Sweep the repo for other leaked secrets.** Run `gitleaks detect` or
  `trufflehog filesystem` against the repo. The RevenueCat / Mixpanel /
  Apptrove / Supabase anon keys in eas.json are all client-safe by
  design (they're meant to ship in client bundles, with security enforced
  by RLS or the vendor's own server-side rules) — but verify each one's
  RLS / domain restrictions are actually configured.
- **Move other `process.env.EXPO_PUBLIC_*` secrets behind the proxy too**
  if you ever add server-side LLMs, Stripe keys, etc.
