"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "./supabase-server";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  encodeSession,
  decodeSession,
  type SessionData,
} from "./session";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";

/* ─── Read session (server components + actions) ─── */

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) redirect("/bienvenue");
  return session;
}

export async function requireSyndicSession(): Promise<SessionData> {
  const session = await requireSession();
  if (session.role !== "syndic") redirect("/");
  return session;
}

/* ─── Login: validate access code + create session ─── */

export async function loginWithCode(
  code: string,
  selectedRole: "resident" | "syndic",
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Rate limit login attempts by IP
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const rl = checkRateLimit(`login:${ip}`, RATE_LIMITS.login);
  if (!rl.ok) return { ok: false, error: "too_many_attempts" };

  const upper = code.trim().toUpperCase();
  if (!upper) return { ok: false, error: "code_not_found" };

  const { data } = await supabaseAdmin
    .from("access_codes")
    .select("*")
    .eq("code", upper)
    .single();

  if (!data) return { ok: false, error: "code_not_found" };
  if (data.used_at) return { ok: false, error: "code_already_used" };
  if (data.role !== selectedRole)
    return { ok: false, error: "wrong_role" };

  let profileId: string | null = null;
  let unitId: string | null = null;

  if (data.used_by) {
    // Code pre-linked to a profile (created by addResident)
    profileId = data.used_by;
    const { data: mem } = await supabaseAdmin
      .from("memberships")
      .select("unit_id")
      .eq("profile_id", profileId)
      .eq("building_id", data.building_id)
      .single();
    unitId = mem?.unit_id ?? null;
  } else if (selectedRole === "resident") {
    // Legacy code without profile link — reject for security.
    // Codes must be pre-linked to a profile via addResident().
    return { ok: false, error: "code_not_linked" };
  }

  // Mark code as used
  await supabaseAdmin
    .from("access_codes")
    .update({ used_at: new Date().toISOString(), used_by: profileId })
    .eq("id", data.id);

  // Set session cookie
  const session: SessionData = {
    profileId,
    buildingId: data.building_id,
    unitId,
    role: selectedRole,
  };

  const cookieStore = await cookies();
  const token = await encodeSession(session);
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

  return { ok: true };
}

/* ─── Switch building (multi-immeuble) ─── */

export async function switchBuilding(buildingId: string) {
  const session = await getSession();
  if (!session || !session.profileId) throw new Error("unauthorized");

  const { data: membership } = await supabaseAdmin
    .from("memberships")
    .select("unit_id, role")
    .eq("profile_id", session.profileId)
    .eq("building_id", buildingId)
    .eq("status", "active")
    .single();

  if (!membership) throw new Error("forbidden");

  const newSession: SessionData = {
    profileId: session.profileId,
    buildingId,
    unitId: membership.unit_id,
    role: membership.role as "resident" | "syndic",
  };

  const cookieStore = await cookies();
  const token = await encodeSession(newSession);
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
}

/* ─── Logout ─── */

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
