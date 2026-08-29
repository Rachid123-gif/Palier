/**
 * Database-based rate limiter for API routes and login.
 * Uses the `rate_limits` table in Supabase instead of an in-memory Map,
 * so it works correctly on Vercel serverless where each invocation
 * gets a fresh process with no shared state.
 */

import { supabaseAdmin } from "./supabase-server";

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
 *
 * Uses the `rate_limits` table (key, count, reset_at) for persistence
 * across serverless invocations.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  // Fire-and-forget cleanup of expired entries
  supabaseAdmin
    .from("rate_limits")
    .delete()
    .lt("reset_at", new Date().toISOString())
    .then();

  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowSec * 1000);

  // Upsert a new window if none exists or expired, starting at count = 1
  await supabaseAdmin
    .from("rate_limits")
    .upsert(
      { key, count: 1, reset_at: resetAt.toISOString() },
      { onConflict: "key", ignoreDuplicates: true },
    );

  // Atomically increment and return the new count in one operation.
  // The `.lt("reset_at", ...)` guard is omitted — instead we reset expired
  // entries above. The update uses .eq("key") which is indexed.
  // Fetch current state, then do conditional increment.
  const { data: current } = await supabaseAdmin
    .from("rate_limits")
    .select("count, reset_at")
    .eq("key", key)
    .single();

  if (!current) return { ok: true };

  // Expired — reset the window
  if (new Date(current.reset_at) < now) {
    await supabaseAdmin
      .from("rate_limits")
      .update({ count: 1, reset_at: resetAt.toISOString() })
      .eq("key", key)
      .lt("reset_at", now.toISOString()); // only reset if still expired (avoids race)
    return { ok: true };
  }

  // Already at or over the limit
  if (current.count >= config.max) {
    const expiresAt = new Date(current.reset_at).getTime();
    const retryAfterSec = Math.ceil((expiresAt - now.getTime()) / 1000);
    return { ok: false, retryAfterSec: Math.max(retryAfterSec, 1) };
  }

  // Under the limit — increment only if count hasn't changed (optimistic lock)
  const { data: updated } = await supabaseAdmin
    .from("rate_limits")
    .update({ count: current.count + 1 })
    .eq("key", key)
    .eq("count", current.count) // optimistic concurrency: only if unchanged
    .select("count")
    .single();

  // If the update didn't match (concurrent increment), re-check
  if (!updated) {
    const { data: recheck } = await supabaseAdmin
      .from("rate_limits")
      .select("count, reset_at")
      .eq("key", key)
      .single();
    if (recheck && recheck.count >= config.max) {
      const expiresAt = new Date(recheck.reset_at).getTime();
      const retryAfterSec = Math.ceil((expiresAt - now.getTime()) / 1000);
      return { ok: false, retryAfterSec: Math.max(retryAfterSec, 1) };
    }
  }

  return { ok: true };
}
