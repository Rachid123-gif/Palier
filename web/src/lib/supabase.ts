import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Client Supabase partagé (anon key, pas de session persistée côté client). */
export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
