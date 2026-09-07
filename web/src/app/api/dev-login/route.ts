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

  const role = req.nextUrl.searchParams.get("role") as "resident" | "syndic" | "admin" | null;
  if (role !== "resident" && role !== "syndic" && role !== "admin") {
    return NextResponse.json(
      { error: "Pass ?role=resident, ?role=syndic, or ?role=admin" },
      { status: 400 },
    );
  }

  // Use real UUIDs from the database for dev login
  const DEV_ACCOUNTS = {
    syndic: {
      profileId: "d2ec9a6f-467b-4dd8-a3c7-ed986dcb124e",
      buildingId: "cf91105e-753c-4c2b-a821-8a9235154e43",
      unitId: null,
    },
    resident: {
      profileId: "eab18530-659e-4f53-b2d0-0dfe27da7992",
      buildingId: "cf91105e-753c-4c2b-a821-8a9235154e43",
      unitId: "d28f9612-c171-4f17-95f9-c13336b42635",
    },
  };

  if (role === "admin") {
    const session: SessionData = {
      profileId: null,
      buildingId: "admin",
      unitId: null,
      role: "admin",
    };
    const token = await encodeSession(session);
    const res = NextResponse.redirect(new URL("/admin", req.url));
    res.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    res.cookies.set("palier_beta", "1", { path: "/", maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: "lax" });
    return res;
  }

  const account = DEV_ACCOUNTS[role];
  const session: SessionData = {
    profileId: account.profileId,
    buildingId: account.buildingId,
    unitId: account.unitId,
    role,
  };

  const token = await encodeSession(session);
  const res = NextResponse.redirect(
    new URL(role === "syndic" ? "/syndic" : "/", req.url),
  );
  res.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  // Also set beta cookie to bypass beta gate in dev
  res.cookies.set("palier_beta", "1", { path: "/", maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: "lax" });
  return res;
}
