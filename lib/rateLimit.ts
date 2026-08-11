type Entry = {
  count: number;
  windowStart: number;
};

// In-memory sliding-window rate limiter keyed by IP.
// Note: on Vercel this is per-function-instance state. Sufficient to curb
// casual abuse on a personal site; for hard guarantees across instances,
// swap for Upstash Redis (see README). Uses an LRU-style eviction so a
// burst of unique IPs cannot grow memory unboundedly.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const MAX_ENTRIES = 1_000;

const store = new Map<string, Entry>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    if (store.size >= MAX_ENTRIES) {
      // Evict the oldest entry.
      const oldest = store.keys().next().value;
      if (oldest !== undefined) store.delete(oldest);
    }
    store.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= MAX_REQUESTS) return true;
  entry.count += 1;
  return false;
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}