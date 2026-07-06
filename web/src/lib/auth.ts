"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "./supabase";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  encodeSession,
  decodeSession,
  type SessionData,
} from "./session";

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
  const upper = code.trim().toUpperCase();
  if (!upper) return { ok: false, error: "code_not_found" };

  const { data } = await supabase
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
    const { data: mem } = await supabase
      .from("memberships")
      .select("unit_id")
      .eq("profile_id", profileId)
      .eq("building_id", data.building_id)
      .single();
    unitId = mem?.unit_id ?? null;
  } else if (selectedRole === "resident") {
    // Legacy code without profile link — find first active membership
    const { data: mem } = await supabase
      .from("memberships")
      .select("profile_id, unit_id")
      .eq("building_id", data.building_id)
      .eq("status", "active")
      .limit(1)
      .single();
    profileId = mem?.profile_id ?? null;
    unitId = mem?.unit_id ?? null;
  }

  // Mark code as used
  await supabase
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
  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(session), SESSION_COOKIE_OPTIONS);

  return { ok: true };
}

/* ─── Logout ─── */

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
