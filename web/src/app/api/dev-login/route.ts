/**
 * DEV-ONLY: Set a session cookie without touching Supabase.
 * Usage:
 *   /api/dev-login?role=syndic
 *   /api/dev-login?role=resident
 *
 * This route is disabled in production (returns 404).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  encodeSession,
  type SessionData,
} from "@/lib/session";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const role = req.nextUrl.searchParams.get("role") as "resident" | "syndic" | null;
  if (role !== "resident" && role !== "syndic") {
    return NextResponse.json(
      { error: "Pass ?role=resident or ?role=syndic" },
      { status: 400 },
    );
  }

  const session: SessionData = {
    profileId: "00000000-0000-0000-0000-0000000000a1",
    buildingId: "00000000-0000-0000-0000-0000000000b1",
    unitId: role === "resident" ? "00000000-0000-0000-0000-0000000000c1" : null,
    role,
  };

  const token = await encodeSession(session);
  const res = NextResponse.redirect(
    new URL(role === "syndic" ? "/syndic" : "/", req.url),
  );
  res.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  return res;
}
