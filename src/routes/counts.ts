/**
 * GET /api/counts
 *
 * Proxies api.airplanes.live for the live count of 737 MAX aircraft in
 * the sky. KV-cached for 30 seconds.
 *
 * Response shape:
 *   {
 *     fetched_at: ISO8601,
 *     count: number,
 *     aircraft: [{ c, r, t, o, a, s, h, la, lo }, ...]
 *   }
 *
 * This is the same shape the embedded front-page snapshot uses, so the
 * client-side code can read either source interchangeably.
 */
import type { Context } from "hono";
import { readThrough } from "../lib/cache";
import { resolveOperator } from "../lib/operators";
import type { Env } from "../env";

type AirplanesLiveAircraft = {
  flight?: string;
  r?: string;
  t?: string;
  alt_baro?: number;
  gs?: number;
  track?: number;
  lat?: number;
  lon?: number;
};
type AirplanesLiveResponse = { ac?: AirplanesLiveAircraft[] };

type CleanedAircraft = {
  c: string; r: string; t: string; o: string;
  a: number; s: number; h: number; la: number; lo: number;
};
type CountsPayload = {
  fetched_at: string;
  count: number;
  aircraft: CleanedAircraft[];
};

async function fetchFromUpstream(): Promise<CountsPayload> {
  const [r8, r9] = await Promise.all([
    fetch("https://api.airplanes.live/v2/type/B38M"),
    fetch("https://api.airplanes.live/v2/type/B39M"),
  ]);
  if (!r8.ok || !r9.ok) {
    throw new Error(`airplanes.live upstream ${r8.status}/${r9.status}`);
  }
  const [d8, d9] = await Promise.all([
    r8.json() as Promise<AirplanesLiveResponse>,
    r9.json() as Promise<AirplanesLiveResponse>,
  ]);

  const all: AirplanesLiveAircraft[] = [
    ...(d8.ac ?? []),
    ...(d9.ac ?? []),
  ];

  const cleaned: CleanedAircraft[] = all
    .map((a) => {
      const callsign = (a.flight ?? "").trim() || a.r || "UNK";
      return {
        c: callsign,
        r: a.r ?? "",
        t: a.t ?? "",
        o: resolveOperator(callsign.slice(0, 3)),
        a: Math.round(a.alt_baro ?? 0),
        s: Math.round(a.gs ?? 0),
        h: Math.round(a.track ?? 0),
        la: a.lat ? Number(a.lat.toFixed(2)) : 0,
        lo: a.lon ? Number(a.lon.toFixed(2)) : 0,
      };
    })
    .filter((a) => a.a > 1000)
    .sort((x, y) => x.c.localeCompare(y.c));

  return {
    fetched_at: new Date().toISOString(),
    count: cleaned.length,
    aircraft: cleaned,
  };
}

export async function handleCounts(c: Context<{ Bindings: Env }>) {
  try {
    const payload = await readThrough(
      c.env.CACHE,
      "counts:v1",
      30,
      fetchFromUpstream,
    );
    return c.json(payload, 200, {
      "Cache-Control": "public, max-age=30",
    });
  } catch (err) {
    return c.json(
      { error: "upstream_unavailable", detail: String(err) },
      503,
      { "Cache-Control": "no-store" },
    );
  }
}
