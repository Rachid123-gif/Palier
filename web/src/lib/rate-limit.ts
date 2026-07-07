/**
 * Simple in-memory rate limiter for API routes and login.
 * Uses a sliding window approach. Resets on server restart.
 * For production, replace with Redis-based limiter.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Max requests per window */
  max: number;
  /** Window duration in seconds */
  windowSec: number;
}

export const RATE_LIMITS = {
  login: { max: 5, windowSec: 60 },         // 5 login attempts per minute
  api: { max: 30, windowSec: 60 },           // 30 API calls per minute
  push: { max: 10, windowSec: 60 },          // 10 push subscriptions per minute
} as const;

/**
 * Check rate limit for a given key (usually IP + route).
 * Returns { ok: true } if allowed, { ok: false, retryAfterSec } if blocked.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowSec * 1000 });
    return { ok: true };
  }

  if (entry.count >= config.max) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { ok: false, retryAfterSec };
  }

  entry.count++;
  return { ok: true };
}
