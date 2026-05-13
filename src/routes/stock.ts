/**
 * GET /api/stock
 *
 * Proxies Yahoo Finance for The Boeing Company (NYSE: BA). KV-cached
 * for 60 seconds.
 *
 * We hit Yahoo's quote API directly. If Yahoo changes the endpoint or
 * starts requiring auth, this is the file to update.
 */
import type { Context } from "hono";
import { readThrough } from "../lib/cache";
import type { Env } from "../env";

type StockPayload = {
  fetched_at: string;
  symbol: "BA";
  price: number;
  prev: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;
  currency: string;
};

type YahooResult = {
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  currency?: string;
};
type YahooResponse = {
  quoteResponse?: { result?: YahooResult[]; error?: unknown };
};

async function fetchFromUpstream(): Promise<StockPayload> {
  const url = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=BA";
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Boeing-Watch/1.0)" },
  });
  if (!resp.ok) throw new Error(`yahoo upstream ${resp.status}`);
  const body = (await resp.json()) as YahooResponse;
  const q = body.quoteResponse?.result?.[0];
  if (!q) throw new Error("yahoo: empty result");
  return {
    fetched_at: new Date().toISOString(),
    symbol: "BA",
    price: q.regularMarketPrice ?? 0,
    prev: q.regularMarketPreviousClose ?? 0,
    open: q.regularMarketOpen ?? 0,
    high: q.regularMarketDayHigh ?? 0,
    low: q.regularMarketDayLow ?? 0,
    volume: q.regularMarketVolume ?? 0,
    marketCap: q.marketCap ?? 0,
    currency: q.currency ?? "USD",
  };
}

export async function handleStock(c: Context<{ Bindings: Env }>) {
  try {
    const payload = await readThrough(
      c.env.CACHE,
      "stock:BA:v1",
      60,
      fetchFromUpstream,
    );
    return c.json(payload, 200, {
      "Cache-Control": "public, max-age=60",
    });
  } catch (err) {
    return c.json(
      { error: "upstream_unavailable", detail: String(err) },
      503,
      { "Cache-Control": "no-store" },
    );
  }
}
