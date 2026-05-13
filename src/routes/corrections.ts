/**
 * GET /api/corrections
 *
 * Public corrections log. Append-only. The /corrections page on the
 * front-end renders against this.
 */
import type { Context } from "hono";
import type { Env } from "../env";

type CorrectionRow = {
  id: number;
  date: string;
  event_id: string | null;
  field: string | null;
  old_content: string | null;
  new_content: string;
  reason: string;
  source_url: string | null;
  created_at: string;
};

export async function handleCorrections(c: Context<{ Bindings: Env }>) {
  const { results } = await c.env.DB.prepare(
    `SELECT id, date, event_id, field, old_content, new_content,
            reason, source_url, created_at
     FROM corrections
     ORDER BY date DESC, id DESC
     LIMIT 500`,
  ).all<CorrectionRow>();

  return c.json(
    {
      count: results.length,
      corrections: results,
    },
    200,
    { "Cache-Control": "public, max-age=300" },
  );
}
