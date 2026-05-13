/**
 * Thin KV wrapper for proxy/cache layer on /api/counts and /api/stock.
 *
 * Each entry stores the upstream JSON response with an explicit TTL. On
 * cache miss we call the fetcher, write the result, and return it. We
 * never serve a stale entry — if KV expires it, the next request pays
 * the upstream roundtrip.
 */
export type Cached<T> = { value: T; written_at: number };

/** Read a value from KV. Returns `null` if missing or malformed. */
export async function cacheGet<T>(
  kv: KVNamespace,
  key: string,
): Promise<Cached<T> | null> {
  const raw = await kv.get(key, "json");
  if (!raw) return null;
  return raw as Cached<T>;
}

/** Write a value to KV with a TTL in seconds. */
export async function cachePut<T>(
  kv: KVNamespace,
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  const payload: Cached<T> = { value, written_at: Date.now() };
  await kv.put(key, JSON.stringify(payload), {
    expirationTtl: Math.max(60, ttlSeconds),
  });
}

/**
 * Read-through cache. Calls `fetcher` only on miss; the returned value
 * is the fresh upstream payload (KV TTL governs eviction).
 */
export async function readThrough<T>(
  kv: KVNamespace,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = await cacheGet<T>(kv, key);
  if (hit) return hit.value;
  const fresh = await fetcher();
  await cachePut(kv, key, fresh, ttlSeconds);
  return fresh;
}
