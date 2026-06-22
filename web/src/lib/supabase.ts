import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Client Supabase (lecture publique en MVP, à passer en sessions auth ensuite). */
export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

export const DEMO_BUILDING_ID = "00000000-0000-0000-0000-0000000000b1";
export const DEMO_PROFILE_ID = "00000000-0000-0000-0000-0000000000a1";
export const DEMO_UNIT_ID = "00000000-0000-0000-0000-0000000000c1";
