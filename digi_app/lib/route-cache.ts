// In-memory route-level cache for API GET responses.
// TTL-based expiry, keyed by a string (e.g. "dashboard:PM:1:2").
// ponytail: in-memory Map, single-process. Switch to Redis if multi-instance.

const cache = new Map<string, { data: unknown; timestamp: number }>();
const DEFAULT_TTL = 30_000; // 30 seconds

export function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp >= DEFAULT_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) cache.delete(key);
  }
}
