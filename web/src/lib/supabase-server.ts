import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url) {
  throw new Error("[FATAL] NEXT_PUBLIC_SUPABASE_URL is not set.");
}

/**
 * Server-only Supabase client.
 * Uses service_role key (bypasses RLS) when available,
 * falls back to anon key for development.
 *
 * NEVER import this in client components — it's for server actions,
 * API routes, and server components only.
 */
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  if (process.env.NODE_ENV === "production" && typeof window === "undefined" && !process.env.NEXT_PHASE) {
    // Runtime-only check: crash if service role key is missing in actual production runtime
    // (NEXT_PHASE is set during build, so we skip the check at build time)
    throw new Error(
      "[FATAL] SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "This is required in production for proper security."
    );
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn("[DEV] SUPABASE_SERVICE_ROLE_KEY not set — using anon key.");
  }
}

const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
