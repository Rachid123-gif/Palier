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
  if (data.role !== selectedRole)
    return { ok: false, error: "wrong_role" };

  let profileId: string | null = null;
  let unitId: string | null = null;

  if (data.used_by) {
    // Code linked to a profile
    profileId = data.used_by;
    const { data: mem } = await supabaseAdmin
      .from("memberships")
      .select("unit_id")
      .eq("profile_id", profileId)
      .eq("building_id", data.building_id)
      .single();
    unitId = mem?.unit_id ?? null;
  } else {
    // Code without profile link — reject for both roles.
    return { ok: false, error: "code_not_linked" };
  }

  // Track last login (does not block reuse)
  await supabaseAdmin
    .from("access_codes")
    .update({ used_at: new Date().toISOString() })
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

/* ─── Register syndic (self-service) ─── */

export async function registerSyndic(input: {
  fullName: string;
  phone: string;
  buildingName: string;
  city: string;
  lotsCount: number;
}): Promise<{ ok: true; accessCode: string } | { ok: false; error: string }> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const rl = checkRateLimit(`register:${ip}`, RATE_LIMITS.login);
  if (!rl.ok) return { ok: false, error: "too_many_attempts" };

  const name = input.fullName.trim();
  const phone = input.phone.trim();
  const buildingName = input.buildingName.trim();
  const city = input.city.trim();
  const lots = Math.max(1, Math.min(500, input.lotsCount));

  if (!name || !phone || !buildingName || !city) {
    return { ok: false, error: "missing_fields" };
  }

  // Validate phone format (Moroccan: 06/07/05 + 8 digits)
  const phoneClean = phone.replace(/\s+/g, "");
  if (!/^0[5-7]\d{8}$/.test(phoneClean)) {
    return { ok: false, error: "invalid_phone" };
  }

  // Validate lots
  if (lots < 2) {
    return { ok: false, error: "invalid_lots" };
  }

  // Check if phone already registered as syndic
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("phone", phoneClean)
    .single();

  if (existingProfile) {
    const { data: existingMembership } = await supabaseAdmin
      .from("memberships")
      .select("id")
      .eq("profile_id", existingProfile.id)
      .eq("role", "syndic")
      .eq("status", "active")
      .single();

    if (existingMembership) {
      return { ok: false, error: "phone_already_registered" };
    }
  }

  // 1. Create building
  const { data: building, error: bErr } = await supabaseAdmin
    .from("buildings")
    .insert({
      name: buildingName,
      address: "",
      city,
      lots_count: lots,
      syndic_name: name,
      syndic_phone: phoneClean,
      balance: 0,
      payment_rate: 0,
    })
    .select("id")
    .single();
  if (bErr || !building) return { ok: false, error: "creation_failed" };

  // 2. Create profile
  const { data: profile, error: pErr } = await supabaseAdmin
    .from("profiles")
    .insert({ full_name: name, phone: phoneClean })
    .select("id")
    .single();
  if (pErr || !profile) return { ok: false, error: "creation_failed" };

  // 3. Create membership
  await supabaseAdmin.from("memberships").insert({
    profile_id: profile.id,
    building_id: building.id,
    role: "syndic",
    status: "active",
  });

  // 4. Generate access code (best-effort — table may not exist yet)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SYN-";
  for (let j = 0; j < 5; j++) code += chars[Math.floor(Math.random() * chars.length)];

  await supabaseAdmin.from("access_codes").insert({
    building_id: building.id,
    code,
    role: "syndic",
    label: `Syndic — ${name}`,
    used_by: profile.id,
    used_at: new Date().toISOString(),
  }).then(() => {}, () => {});

  // 5. Set session cookie (auto-login)
  const session: SessionData = {
    profileId: profile.id,
    buildingId: building.id,
    unitId: null,
    role: "syndic",
  };
  const cookieStore = await cookies();
  const token = await encodeSession(session);
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

  return { ok: true, accessCode: code };
}

/* ─── Recover syndic access (forgot code) — OTP flow ─── */

// In-memory OTP store (production: use Redis or DB)
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number; profileId: string; buildingId: string; unitId: string | null }>();

// Clean expired OTPs periodically
function cleanExpiredOtps() {
  const now = Date.now();
  for (const [key, val] of otpStore) {
    if (val.expiresAt < now) otpStore.delete(key);
  }
}

/** Step 1: Request OTP — validates phone, generates code */
export async function requestRecoveryOtp(
  phone: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const rl = checkRateLimit(`recover:${ip}`, RATE_LIMITS.login);
  if (!rl.ok) return { ok: false, error: "too_many_attempts" };

  const cleaned = phone.trim().replace(/\s+/g, "");
  if (!cleaned) return { ok: false, error: "missing_phone" };

  // Find profile by phone
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("phone", cleaned)
    .single();
  if (!profile) return { ok: false, error: "not_found" };

  // Check syndic membership
  const { data: membership } = await supabaseAdmin
    .from("memberships")
    .select("building_id, unit_id")
    .eq("profile_id", profile.id)
    .eq("role", "syndic")
    .eq("status", "active")
    .limit(1)
    .single();
  if (!membership) return { ok: false, error: "not_found" };

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));

  // Store OTP (expires in 5 minutes, max 3 verification attempts)
  cleanExpiredOtps();
  otpStore.set(cleaned, {
    code: otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
    profileId: profile.id,
    buildingId: membership.building_id,
    unitId: membership.unit_id,
  });

  // TODO: Send OTP via SMS (Twilio, Infobip, etc.)
  // await sendSMS(cleaned, `Votre code Palier : ${otp}`);
  // For dev: log to console
  console.log(`[PALIER OTP] ${cleaned} → ${otp}`);

  return { ok: true };
}

/** Step 2: Verify OTP — checks code and creates session */
export async function verifyRecoveryOtp(
  phone: string,
  otpCode: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const rl = checkRateLimit(`otp-verify:${ip}`, RATE_LIMITS.login);
  if (!rl.ok) return { ok: false, error: "too_many_attempts" };

  const cleaned = phone.trim().replace(/\s+/g, "");
  const entry = otpStore.get(cleaned);

  if (!entry) return { ok: false, error: "otp_expired" };

  // Check expiry
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(cleaned);
    return { ok: false, error: "otp_expired" };
  }

  // Check attempts
  entry.attempts++;
  if (entry.attempts > 3) {
    otpStore.delete(cleaned);
    return { ok: false, error: "too_many_attempts" };
  }

  // Verify code
  if (otpCode.trim() !== entry.code) {
    return { ok: false, error: "otp_invalid" };
  }

  // OTP valid — create session
  otpStore.delete(cleaned);

  const session: SessionData = {
    profileId: entry.profileId,
    buildingId: entry.buildingId,
    unitId: entry.unitId,
    role: "syndic",
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
