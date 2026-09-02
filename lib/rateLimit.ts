import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Per-IP rate limiting for /api/chat, with two interchangeable back ends
// selected automatically at module load:
//
//  1. Distributed (preferred) — active when UPSTASH_REDIS_REST_URL /
//     UPSTASH_REDIS_REST_TOKEN are set (the Upstash Redis integration on the
//     Vercel Marketplace injects both). State lives in Redis, so the limit
//     holds ACROSS every serverless instance. Two limiters run, both keyed
//     by IP; a request is blocked if EITHER denies it:
//       - sliding window, 20 requests / 60 s  — parity with the in-memory
//         path below; curbs bursty abuse.
//       - fixed window,  100 requests / day   — fences the *shared*,
//         account-level Gemini free-tier quota (~1,500 req/day). Without a
//         cross-instance daily cap, one abuser fanned out over many
//         instances could drain that quota and break chat for real
//         visitors. See DAILY_MAX_REQUESTS.
//     Redis errors FAIL OPEN (allow the request): a Redis outage must not
//     take the chat down on a personal site.
//
//  2. In-memory fallback — used when those env vars are absent (local dev,
//     tests, CI). Single-instance sliding-window Map with LRU-style
//     eviction so a burst of unique IPs cannot grow memory unboundedly.
//     Zero setup, zero new env vars. Per-instance state only, so on Vercel
//     it under-counts abuse spread across concurrent instances — acceptable
//     as a fallback, which is why the Redis path exists.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const MAX_ENTRIES = 1_000;

// Per-IP hard daily cap for the distributed limiter. Kept well under the
// shared Gemini free-tier daily quota (~1,500 requests/day) so that no
// single IP — even fanned out across serverless instances — can exhaust
// the account-level quota and break chat for everyone else. Tune here.
const DAILY_MAX_REQUESTS = 100;

type Entry = {
  count: number;
  windowStart: number;
};

const store = new Map<string, Entry>();

function isRateLimitedInMemory(ip: string): boolean {
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

// Distributed limiters, built once at module load (singletons — never per
// request). `null` when Redis is not configured, which selects the
// in-memory fallback above.
const redisLimiters = (() => {
  // The Upstash Redis integration on the Vercel Marketplace injects the REST
  // credentials under the `UPSTASH_REDIS_KV_REST_API_*` names; a manually
  // configured Upstash database uses the shorter `UPSTASH_REDIS_REST_*` names.
  // Accept either so the distributed limiter activates in both setups.
  const url =
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.UPSTASH_REDIS_KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });

  return {
    // "20 requests / 60 s" — mirrors MAX_REQUESTS / WINDOW_MS.
    minute: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "60 s"),
      prefix: "rl:chat:min",
      analytics: false, // extra Redis commands; not needed here.
      ephemeralCache: new Map<string, number>(), // short-circuit repeat denials
    }),
    day: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(DAILY_MAX_REQUESTS, "1 d"),
      prefix: "rl:chat:day",
      analytics: false,
      ephemeralCache: new Map<string, number>(),
    }),
  };
})();

/**
 * Returns `true` when the request from `ip` should be blocked (HTTP 429).
 *
 * Uses the distributed Redis limiters when configured, otherwise the
 * in-memory fallback. Redis failures fail open (resolve `false`) so a
 * Redis outage cannot take down the chat.
 */
export async function isRateLimited(ip: string): Promise<boolean> {
  if (!redisLimiters) return isRateLimitedInMemory(ip);

  try {
    const [minute, day] = await Promise.all([
      redisLimiters.minute.limit(ip),
      redisLimiters.day.limit(ip),
    ]);
    return !minute.success || !day.success;
  } catch (err) {
    // Fail open: a Redis outage must not break chat on a personal site.
    console.error("rateLimit: Redis limiter error, allowing request", err);
    return false;
  }
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}
