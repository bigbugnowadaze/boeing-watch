/**
 * Worker bindings declared in wrangler.jsonc.
 *
 * Run `npm run types` after editing wrangler.jsonc to keep the generated
 * `worker-configuration.d.ts` in sync if you prefer that workflow; this
 * file is the hand-maintained source of truth.
 */
export type Env = {
  /** Cloudflare Static Assets binding (handles GET / and the four pages). */
  ASSETS: Fetcher;

  /** D1 database — see db/schema.sql. */
  DB: D1Database;

  /** KV namespace used as the proxy cache for /api/counts and /api/stock. */
  CACHE: KVNamespace;

  /** Anthropic API key. Set with: wrangler secret put ANTHROPIC_API_KEY */
  ANTHROPIC_API_KEY?: string;

  /**
   * Shared secret used to authenticate admin endpoints
   * (/admin/sdr/ingest, manual cron triggers). Set with:
   *   wrangler secret put ADMIN_TOKEN
   */
  ADMIN_TOKEN?: string;
};
