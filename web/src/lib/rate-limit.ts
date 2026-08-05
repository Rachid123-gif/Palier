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

  // Try to fetch the existing entry
  const { data: existing } = await supabaseAdmin
    .from("rate_limits")
    .select("count, reset_at")
    .eq("key", key)
    .maybeSingle();

  // No entry or expired — start a new window with count = 1
  if (!existing || new Date(existing.reset_at) < now) {
    await supabaseAdmin
      .from("rate_limits")
      .upsert(
        { key, count: 1, reset_at: resetAt.toISOString() },
        { onConflict: "key" },
      );
    return { ok: true };
  }

  // Entry exists and still within window — check the count
  if (existing.count >= config.max) {
    const expiresAt = new Date(existing.reset_at).getTime();
    const retryAfterSec = Math.ceil((expiresAt - now.getTime()) / 1000);
    return { ok: false, retryAfterSec: Math.max(retryAfterSec, 1) };
  }

  // Under the limit — increment
  await supabaseAdmin
    .from("rate_limits")
    .update({ count: existing.count + 1 })
    .eq("key", key);

  return { ok: true };
}
