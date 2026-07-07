import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Server-only Supabase client.
 * Uses service_role key (bypasses RLS) when available,
 * falls back to anon key for development.
 *
 * NEVER import this in client components — it's for server actions,
 * API routes, and server components only.
 */
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NODE_ENV === "production") {
  console.warn(
    "[SECURITY] SUPABASE_SERVICE_ROLE_KEY not set — using anon key. " +
    "Set SUPABASE_SERVICE_ROLE_KEY in production for proper security."
  );
}

export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
