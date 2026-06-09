// Anthropic Messages API proxy with auth, per-user rate limit, and usage logging.
//
// The mobile app calls this function instead of api.anthropic.com directly.
// ANTHROPIC_API_KEY lives only in this server's env (set via
// `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`) and never in the
// client bundle.
//
// Per-request flow:
//   1. verify_jwt = true in config.toml rejects requests without a valid
//      project-signed JWT before reaching us.
//   2. We extract the user_id from the JWT via supabase.auth.getUser().
//   3. Count this user's anthropic_usage rows in the last RATE_WINDOW
//      seconds. If >= RATE_LIMIT, return 429.
//   4. Forward the body verbatim to Anthropic.
//   5. After Anthropic responds, parse the response, insert a row into
//      anthropic_usage with the token counts, then return the body to
//      the caller. (Streaming responses are buffered so we can log token
//      counts; no caller currently uses streaming.)
//
// Migration: 20260609200224_anthropic_usage.sql creates the table + RLS +
// the anthropic_recent_count() function.
//
// Deploy:
//   supabase functions deploy anthropic-proxy
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const ANTHROPIC_VERSION = "2023-06-01";
const UPSTREAM = "https://api.anthropic.com/v1/messages";

// Per-user rate limit. Configurable via Supabase secrets if needed:
//   supabase secrets set ANTHROPIC_RATE_LIMIT=120
//   supabase secrets set ANTHROPIC_RATE_WINDOW=60
const RATE_LIMIT = Number(Deno.env.get("ANTHROPIC_RATE_LIMIT") ?? "60");
const RATE_WINDOW = Number(Deno.env.get("ANTHROPIC_RATE_WINDOW") ?? "60");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// One service-role client for inserts (bypasses RLS on anthropic_usage).
const admin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type, anthropic-version",
  "access-control-allow-methods": "POST, OPTIONS",
};

function jsonError(status: number, type: string, message: string): Response {
  return new Response(
    JSON.stringify({ type: "error", error: { type, message } }),
    {
      status,
      headers: { "content-type": "application/json", ...CORS_HEADERS },
    },
  );
}

async function getUserIdFromAuthHeader(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  // Use the anon client to verify the JWT and decode the user. We don't
  // store this client globally because each request has its own token.
  const c = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { authorization: authHeader } },
  });
  const { data, error } = await c.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonError(405, "method_not_allowed", `expected POST, got ${req.method}`);
  }
  if (!ANTHROPIC_API_KEY) {
    return jsonError(
      500,
      "config_error",
      "ANTHROPIC_API_KEY not set on the server (run: supabase secrets set ANTHROPIC_API_KEY=...)",
    );
  }

  // 1. Identify the user. verify_jwt has already validated the signature;
  //    we just need the user id for rate-limit + logging.
  const userId = await getUserIdFromAuthHeader(req.headers.get("authorization"));
  // If we can't pin a user (e.g. anon-key smoke test), we still allow the
  // request through so internal tooling works, but we skip rate-limit and
  // log under the special UUID 00000000-0000-0000-0000-000000000000.
  const effectiveUserId = userId ?? "00000000-0000-0000-0000-000000000000";

  // 2. Rate limit (per real user only — skipped for anon-keyed callers).
  if (userId && admin) {
    const { data: recent, error: rateErr } = await admin.rpc(
      "anthropic_recent_count",
      { p_user_id: userId, p_window_seconds: RATE_WINDOW },
    );
    if (!rateErr && typeof recent === "number" && recent >= RATE_LIMIT) {
      return new Response(
        JSON.stringify({
          type: "error",
          error: {
            type: "rate_limit_error",
            message: `You've hit the chat rate limit (${RATE_LIMIT} requests per ${RATE_WINDOW}s). Try again in a moment.`,
          },
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": String(RATE_WINDOW),
            ...CORS_HEADERS,
          },
        },
      );
    }
  }

  const body = await req.text();
  // Parse just to extract model for logging; if the body is malformed,
  // let Anthropic reject it with a proper error so we don't double-up.
  let modelForLog: string | null = null;
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed?.model === "string") modelForLog = parsed.model;
  } catch {
    /* ignore */
  }

  // 3. Forward to Anthropic.
  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body,
    });
  } catch (e) {
    return jsonError(
      502,
      "upstream_fetch_failed",
      `couldn't reach Anthropic: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // 4. Buffer the response so we can log token counts. (No client uses
  //    streaming yet; if/when we add it back, the streaming path should
  //    bypass this buffer and log via the stop_message_delta event.)
  const respText = await upstream.text();
  let respJson: any = null;
  try {
    respJson = JSON.parse(respText);
  } catch {
    /* upstream returned non-JSON, leave respJson null */
  }

  // 5. Log usage. Fire-and-forget — we don't want a logging failure to
  //    fail the user's request.
  if (admin) {
    const usage = respJson?.usage ?? {};
    const requestId = upstream.headers.get("request-id") ?? respJson?.id ?? null;
    admin
      .from("anthropic_usage")
      .insert({
        user_id: effectiveUserId,
        model: modelForLog,
        input_tokens: typeof usage.input_tokens === "number" ? usage.input_tokens : null,
        output_tokens: typeof usage.output_tokens === "number" ? usage.output_tokens : null,
        cache_read_input_tokens:
          typeof usage.cache_read_input_tokens === "number"
            ? usage.cache_read_input_tokens
            : null,
        cache_creation_input_tokens:
          typeof usage.cache_creation_input_tokens === "number"
            ? usage.cache_creation_input_tokens
            : null,
        status: upstream.status,
        request_id: requestId,
        route: "messages",
      })
      .then(({ error }) => {
        if (error) console.error("anthropic_usage insert failed:", error);
      });
  }

  // 6. Return the body to the caller as-is.
  return new Response(respText, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      ...CORS_HEADERS,
    },
  });
});
