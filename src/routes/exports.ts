/**
 * GET /api/sdr.csv  — every SDR event as CSV (CC BY 4.0)
 * GET /api/sdr.json — same data as JSON (CC BY 4.0)
 *
 * Both endpoints are the canonical open-data dump referenced in
 * /methodology §09. Cached at the edge for 1 hour.
 */
import type { Context } from "hono";
import type { Env } from "../env";

type SdrExportRow = {
  id: string;
  filed_at: string;
  severity: string | null;
  operator: string | null;
  aircraft_type: string | null;
  registration: string | null;
  narrative: string;
  source_url: string | null;
  raw_jasc_code: string | null;
};

const EXPORT_HEADERS = [
  "id",
  "filed_at",
  "severity",
  "operator",
  "aircraft_type",
  "registration",
  "narrative",
  "source_url",
  "raw_jasc_code",
] as const;

async function loadAllSdrs(env: Env): Promise<SdrExportRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, filed_at, severity, operator, aircraft_type, registration,
            narrative, source_url, raw_jasc_code
     FROM events
     WHERE type = 'sdr'
     ORDER BY filed_at ASC`,
  ).all<SdrExportRow>();
  return results;
}

function escapeCsvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function handleSdrCsv(c: Context<{ Bindings: Env }>) {
  const rows = await loadAllSdrs(c.env);
  const lines: string[] = [EXPORT_HEADERS.join(",")];
  for (const r of rows) {
    lines.push(
      EXPORT_HEADERS.map((h) => escapeCsvCell(r[h])).join(","),
    );
  }
  return new Response(lines.join("\n") + "\n", {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="boeing-watch-sdr.csv"',
      "Cache-Control": "public, max-age=3600",
      "X-License": "CC-BY-4.0",
    },
  });
}

export async function handleSdrJson(c: Context<{ Bindings: Env }>) {
  const rows = await loadAllSdrs(c.env);
  return c.json(
    {
      license: "CC-BY-4.0",
      attribution:
        "Boeing Watch (boeingwatch.org), Harrow Lab. Licensed CC BY 4.0.",
      generated_at: new Date().toISOString(),
      count: rows.length,
      events: rows,
    },
    200,
    {
      "Cache-Control": "public, max-age=3600",
      "X-License": "CC-BY-4.0",
    },
  );
}
