/**
 * CORS for the public API.
 *
 * In production only boeingwatch.org may call /api/* in a way that
 * exposes credentials. Local dev allows http://localhost:8080 and
 * http://127.0.0.1:8080 so wrangler dev keeps working.
 *
 * The /admin/* routes are NOT CORS-exposed — they require ADMIN_TOKEN
 * and should be called server-to-server.
 */
const ALLOWED_ORIGINS = new Set([
  "https://boeingwatch.org",
  "https://www.boeingwatch.org",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);

export function corsHeaders(origin: string | null | undefined): HeadersInit {
  const ok = origin && ALLOWED_ORIGINS.has(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : "https://boeingwatch.org",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
