import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// TEMPORARY debug endpoint — remove after testing
export async function GET() {
  try {
    // Test 1: Can we connect to Supabase at all?
    const { data: allCodes, error: listErr } = await supabaseAdmin
      .from("beta_invites")
      .select("id, code, used_at")
      .limit(10);

    // Test 2: Specific lookup for PALIER2026
    const { data: specific, error: specificErr } = await supabaseAdmin
      .from("beta_invites")
      .select("id, code, used_at")
      .eq("code", "PALIER2026")
      .single();

    return NextResponse.json({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + "...",
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      betaEnabled: !!process.env.BETA_ACCESS_CODE,
      allCodes: listErr ? { error: listErr.message, code: listErr.code } : allCodes,
      specificLookup: specificErr
        ? { error: specificErr.message, code: specificErr.code }
        : specific,
    });
  } catch (e: any) {
    return NextResponse.json({ crash: e.message }, { status: 500 });
  }
}
