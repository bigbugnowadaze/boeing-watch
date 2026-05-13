/**
 * GET /api/wire        — list events in reverse-chronological order
 * GET /api/wire/:id    — single event by primary key
 *
 * Query params on /api/wire:
 *   limit    — page size, default 50, max 500
 *   before   — ISO 8601; return events filed before this instant
 *   type     — filter by event.type (sdr, anniversary, stock, ...)
 *   severity — filter by event.severity (severe, elevated, noted)
 */
import type { Context } from "hono";
import type { Env } from "../env";

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 50;

type EventRow = {
  id: string;
  type: string;
  filed_at: string;
  severity: string | null;
  narrative: string;
  source_url: string | null;
  operator: string | null;
  aircraft_type: string | null;
  registration: string | null;
  raw_jasc_code: string | null;
};

export async function handleWireList(c: Context<{ Bindings: Env }>) {
  const url = new URL(c.req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT),
  );
  const before = url.searchParams.get("before");
  const type = url.searchParams.get("type");
  const severity = url.searchParams.get("severity");

  const conditions: string[] = [];
  const binds: (string | number)[] = [];
  if (before) {
    conditions.push("filed_at < ?");
    binds.push(before);
  }
  if (type) {
    conditions.push("type = ?");
    binds.push(type);
  }
  if (severity) {
    conditions.push("severity = ?");
    binds.push(severity);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT id, type, filed_at, severity, narrative, source_url,
           operator, aircraft_type, registration, raw_jasc_code
    FROM events
    ${where}
    ORDER BY filed_at DESC
    LIMIT ?
  `;
  binds.push(limit);

  const { results } = await c.env.DB.prepare(sql)
    .bind(...binds)
    .all<EventRow>();

  return c.json(
    {
      count: results.length,
      limit,
      events: results,
    },
    200,
    { "Cache-Control": "public, max-age=300" },
  );
}

export async function handleWireDetail(c: Context<{ Bindings: Env }>) {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "missing_id" }, 400);

  const row = await c.env.DB.prepare(
    `SELECT id, type, filed_at, severity, narrative, source_url, raw_data,
            operator, aircraft_type, registration, raw_jasc_code, created_at
     FROM events WHERE id = ?`,
  )
    .bind(id)
    .first<EventRow & { raw_data: string | null; created_at: string }>();

  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json(row, 200, { "Cache-Control": "public, max-age=3600" });
}
