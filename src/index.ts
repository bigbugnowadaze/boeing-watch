/**
 * Boeing Watch — unified Cloudflare Worker
 *
 *   /                    → static assets (public/)
 *   /methodology …       → static assets
 *   /api/counts          → live 737 MAX flight count (KV-cached 30s)
 *   /api/stock           → BA share price (KV-cached 60s)
 *   /api/wire            → events list from D1
 *   /api/wire/:id        → single event from D1
 *   /api/wall            → SDR aggregate counts from D1
 *   /api/corrections     → corrections log from D1
 *   /api/sdr.csv         → open-data export (CC BY 4.0)
 *   /api/sdr.json        → open-data export (CC BY 4.0)
 *   /admin/sdr/ingest    → POST batch of raw SDRs (auth: ADMIN_TOKEN)
 *   /admin/health        → GET infrastructure health probe (auth: ADMIN_TOKEN)
 *
 * Scheduled (cron):
 *   0 *      * * *      → SDR Beat Reporter (TODO: wire to FAA fetcher)
 */
import { Hono } from "hono";

import type { Env } from "./env";
import { corsHeaders } from "./lib/cors";

import { handleCounts } from "./routes/counts";
import { handleStock } from "./routes/stock";
import { handleWireList, handleWireDetail } from "./routes/wire";
import { handleWall } from "./routes/wall";
import { handleCorrections } from "./routes/corrections";
import { handleSdrCsv, handleSdrJson } from "./routes/exports";
import {
  processSdrBatch,
  type RawSdr,
} from "./agents/sdr-beat-reporter";

const app = new Hono<{ Bindings: Env }>();

// ─── CORS / health ────────────────────────────────────────────────
app.options("/api/*", (c) =>
  new Response(null, { status: 204, headers: corsHeaders(c.req.header("Origin")) }),
);
app.use("/api/*", async (c, next) => {
  await next();
  const cors = corsHeaders(c.req.header("Origin"));
  for (const [k, v] of Object.entries(cors)) c.res.headers.set(k, v);
});

// ─── Public API (read-only) ────────────────────────────────────────
app.get("/api/counts", handleCounts);
app.get("/api/stock", handleStock);
app.get("/api/wire", handleWireList);
app.get("/api/wire/:id", handleWireDetail);
app.get("/api/wall", handleWall);
app.get("/api/corrections", handleCorrections);
app.get("/api/sdr.csv", handleSdrCsv);
app.get("/api/sdr.json", handleSdrJson);

// ─── Admin (auth: Authorization: Bearer <ADMIN_TOKEN>) ────────────
function requireAdmin(c: { req: { header: (k: string) => string | undefined }; env: Env }): Response | null {
  const expected = c.env.ADMIN_TOKEN;
  if (!expected) {
    return new Response("admin token not configured", { status: 503 });
  }
  const got = c.req.header("Authorization") ?? "";
  if (got !== `Bearer ${expected}`) {
    return new Response("unauthorized", { status: 401 });
  }
  return null;
}

app.get("/admin/health", async (c) => {
  const fail = requireAdmin(c);
  if (fail) return fail;
  // Cheap roundtrip against every binding so we know what's wired up.
  const checks: Record<string, string> = {};
  try {
    const r = await c.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    checks.d1 = r?.ok === 1 ? "ok" : "unexpected";
  } catch (e) {
    checks.d1 = `error: ${String(e)}`;
  }
  try {
    await c.env.CACHE.put("__health", "ok", { expirationTtl: 60 });
    const v = await c.env.CACHE.get("__health");
    checks.kv = v === "ok" ? "ok" : "unexpected";
  } catch (e) {
    checks.kv = `error: ${String(e)}`;
  }
  checks.anthropic_key = c.env.ANTHROPIC_API_KEY ? "present" : "missing";
  return c.json({ checks, ts: new Date().toISOString() });
});

/**
 * POST /admin/sdr/ingest
 * Body: { sdrs: RawSdr[] }
 *
 * Invoked manually (or by an external fetcher Worker) to push a batch
 * of raw FAA SDRs through the SDR Beat Reporter pipeline. Synchronous
 * for now — the LLM call sequence runs inline. For batches > ~20 SDRs
 * the cron-triggered fetcher should chunk and dispatch via a queue.
 */
app.post("/admin/sdr/ingest", async (c) => {
  const fail = requireAdmin(c);
  if (fail) return fail;
  let body: { sdrs?: unknown };
  try {
    body = await c.req.json<{ sdrs?: unknown }>();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (!Array.isArray(body.sdrs)) {
    return c.json({ error: "sdrs must be an array" }, 400);
  }
  const sdrs = body.sdrs as RawSdr[];
  const result = await processSdrBatch(sdrs, c.env);
  return c.json(result);
});

// ─── Everything else → static assets ───────────────────────────────
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

// ─── Scheduled handlers ────────────────────────────────────────────
async function runSdrBeatReporter(env: Env): Promise<void> {
  // Stage-2-B: replace this stub with the FAA-SDR fetcher that pulls
  // the previous hour of SDRs out of R2 (or directly from the FAA
  // download endpoint once we have one) and hands them off to
  // processSdrBatch. For Stage-2-A the cron only logs that it fired.
  console.log(
    `[cron] sdr-beat-reporter fired at ${new Date().toISOString()} — fetcher stub (no SDRs processed)`,
  );
  // Sanity probe — verify D1 reachable, but do not mutate.
  await env.DB.prepare("SELECT 1").first();
}

export default {
  fetch: app.fetch,

  async scheduled(
    event: ScheduledController,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    switch (event.cron) {
      case "5 * * * *":
        await runSdrBeatReporter(env);
        break;
      default:
        console.log(`[cron] unrecognized schedule: ${event.cron}`);
    }
  },
} satisfies ExportedHandler<Env>;
