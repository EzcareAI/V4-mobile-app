// Anthropic Messages API proxy with Supabase auth gating.
//
// The mobile app calls this function instead of api.anthropic.com directly.
// The ANTHROPIC_API_KEY lives only in this server's env (set via
// `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`) — never in the
// client bundle.
//
// Supabase Edge Functions verify the JWT in the Authorization header by
// default (config.toml -> [functions.<name>].verify_jwt), so unauthenticated
// requests are rejected before reaching this handler.
//
// Body is forwarded verbatim to Anthropic, so the client can keep using the
// same Messages-API shape (model, system, messages, max_tokens, stream).
// Streaming responses (SSE) are piped through as a stream; non-streaming
// responses pass through as JSON.
//
// Deploy:
//   supabase functions deploy anthropic-proxy
//
// Local test:
//   supabase functions serve anthropic-proxy --no-verify-jwt
//   curl -X POST http://localhost:54321/functions/v1/anthropic-proxy \
//     -H 'authorization: Bearer <user_jwt>' \
//     -H 'content-type: application/json' \
//     -d '{"model":"claude-haiku-4-5-20251001","max_tokens":256,"messages":[{"role":"user","content":"hi"}]}'
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const ANTHROPIC_VERSION = "2023-06-01";
const UPSTREAM = "https://api.anthropic.com/v1/messages";

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

  // Pass the body straight through. We do NOT parse + re-serialize because
  // image base64 payloads can be large and round-tripping them through
  // JSON.parse / JSON.stringify wastes CPU. Anthropic validates the body
  // on their side anyway.
  const body = await req.text();

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

  // Pipe the response stream back so SSE / streaming responses just work
  // without buffering. content-type is preserved (application/json vs
  // text/event-stream).
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      ...CORS_HEADERS,
    },
  });
});
