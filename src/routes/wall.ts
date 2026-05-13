/**
 * GET /api/wall
 *
 * Aggregate SDR counts since 5 Jan 2024 (the door-plug anchor date).
 * Powers the WALL grid on the front page.
 *
 * Response:
 *   {
 *     since: '2024-01-05',
 *     today: 'YYYY-MM-DD',
 *     total: number,
 *     max: number,           // 737 MAX subset
 *     severe: number,
 *     elevated: number,
 *     noted: number,
 *   }
 */
import type { Context } from "hono";
import type { Env } from "../env";

const DOOR_PLUG_DATE = "2024-01-05T00:00:00Z";

export async function handleWall(c: Context<{ Bindings: Env }>) {
  const today = new Date().toISOString().slice(0, 10);

  const totalRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM events WHERE type = 'sdr' AND filed_at >= ?`,
  )
    .bind(DOOR_PLUG_DATE)
    .first<{ n: number }>();

  const maxRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM events
     WHERE type = 'sdr' AND filed_at >= ?
       AND aircraft_type IN ('737-7', '737-8', '737-9', '737-10')`,
  )
    .bind(DOOR_PLUG_DATE)
    .first<{ n: number }>();

  const sevRows = await c.env.DB.prepare(
    `SELECT severity, COUNT(*) AS n FROM events
     WHERE type = 'sdr' AND filed_at >= ?
     GROUP BY severity`,
  )
    .bind(DOOR_PLUG_DATE)
    .all<{ severity: string | null; n: number }>();

  const sev: Record<string, number> = { severe: 0, elevated: 0, noted: 0 };
  for (const row of sevRows.results) {
    if (row.severity && row.severity in sev) sev[row.severity] = row.n;
  }

  return c.json(
    {
      since: "2024-01-05",
      today,
      total: totalRow?.n ?? 0,
      max: maxRow?.n ?? 0,
      severe: sev.severe,
      elevated: sev.elevated,
      noted: sev.noted,
    },
    200,
    { "Cache-Control": "public, max-age=3600" },
  );
}
