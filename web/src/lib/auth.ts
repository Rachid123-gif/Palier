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
import { sendSMS } from "./sms";

/* ─── Constant-time string comparison ─── */

function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.length !== bufB.length) return false;
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

/* ─── Crypto-safe random code generation ─── */

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(prefix: string, length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return prefix + Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

function generateOtp(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => String(b % 10)).join("");
}

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
  const rl = await checkRateLimit(`login:${ip}`, RATE_LIMITS.login);
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
      .select("unit_id, status")
      .eq("profile_id", profileId)
      .eq("building_id", data.building_id)
      .single();

    if (!mem || mem.status === "inactive") {
      return { ok: false, error: "code_not_found" };
    }

    unitId = mem.unit_id ?? null;
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

/* ─── Register syndic (OTP-verified, two-phase) ─── */

/** Phase 1: Validate inputs, check duplicates, send OTP */
export async function requestSyndicRegistrationOtp(input: {
  fullName: string;
  phone: string;
  buildingName: string;
  city: string;
  lotsCount: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const rl = await checkRateLimit(`register:${ip}`, RATE_LIMITS.login);
  if (!rl.ok) return { ok: false, error: "too_many_attempts" };

  const name = input.fullName.trim();
  const phone = input.phone.trim();
  const buildingName = input.buildingName.trim();
  const city = input.city.trim();
  const lots = Math.max(1, Math.min(500, input.lotsCount));

  if (!name || !phone || !buildingName || !city) {
    return { ok: false, error: "missing_fields" };
  }

  const phoneClean = phone.replace(/\s+/g, "");
  if (!/^0[5-7]\d{8}$/.test(phoneClean)) {
    return { ok: false, error: "invalid_phone" };
  }

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

  // Generate OTP (fixed in test mode)
  const otp = process.env.SKIP_SMS === "1" ? "123456" : generateOtp();

  // Clean old OTPs for this phone
  await supabaseAdmin.from("otp_codes").delete().eq("phone", phoneClean);

  // Store OTP (expires in 5 minutes)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await supabaseAdmin.from("otp_codes").insert({
    phone: phoneClean,
    code: otp,
    expires_at: expiresAt,
  });

  // Send SMS
  try {
    await sendSMS(phoneClean, `Votre code Palier : ${otp}`);
  } catch {
    await supabaseAdmin.from("otp_codes").delete().eq("phone", phoneClean);
    return { ok: false, error: "sms_failed" };
  }

  return { ok: true };
}

/** Phase 2: Verify OTP and complete syndic registration */
export async function completeSyndicRegistration(input: {
  fullName: string;
  phone: string;
  buildingName: string;
  city: string;
  lotsCount: number;
  syndicUnit?: string;
  otp: string;
}): Promise<{ ok: true; accessCode: string } | { ok: false; error: string }> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const rl = await checkRateLimit(`register:${ip}`, RATE_LIMITS.login);
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

  // ── Verify OTP ──
  const { data: entry } = await supabaseAdmin
    .from("otp_codes")
    .select("id, code, attempts, expires_at")
    .eq("phone", phoneClean)
    .single();

  if (!entry) return { ok: false, error: "otp_expired" };

  if (new Date(entry.expires_at) < new Date()) {
    await supabaseAdmin.from("otp_codes").delete().eq("id", entry.id);
    return { ok: false, error: "otp_expired" };
  }

  // Atomic increment + check: only increment if attempts < 3
  const { data: updated, error: incErr } = await supabaseAdmin
    .from("otp_codes")
    .update({ attempts: entry.attempts + 1 })
    .eq("id", entry.id)
    .lt("attempts", 3)
    .select("attempts")
    .single();

  if (!updated || incErr) {
    await supabaseAdmin.from("otp_codes").delete().eq("id", entry.id);
    return { ok: false, error: "too_many_attempts" };
  }

  // Constant-time comparison
  const otpTrimmed = input.otp.trim();
  if (otpTrimmed.length !== entry.code.length || !timingSafeEqual(otpTrimmed, entry.code)) {
    return { ok: false, error: "otp_invalid" };
  }

  // OTP valid — clean up
  await supabaseAdmin.from("otp_codes").delete().eq("id", entry.id);

  // ── Proceed with registration ──

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

  // 2. Reuse existing profile or create new one
  let profileId: string;
  if (existingProfile) {
    profileId = existingProfile.id;
    // Update name if needed
    await supabaseAdmin.from("profiles").update({ full_name: name }).eq("id", profileId);
  } else {
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .insert({ full_name: name, phone: phoneClean })
      .select("id")
      .single();
    if (pErr || !profile) return { ok: false, error: "creation_failed" };
    profileId = profile.id;
  }

  // 3. Create syndic unit (lot) if provided
  let syndicUnitId: string | null = null;
  if (input.syndicUnit) {
    const { data: unitData } = await supabaseAdmin
      .from("units")
      .insert({ building_id: building.id, ref: input.syndicUnit.toUpperCase() })
      .select("id")
      .single();
    syndicUnitId = unitData?.id ?? null;
  }

  // 3b. Create membership
  await supabaseAdmin.from("memberships").insert({
    profile_id: profileId,
    building_id: building.id,
    unit_id: syndicUnitId,
    role: "syndic",
    status: "active",
  });

  // 3b. Create default building settings
  const { error: settingsErr } = await supabaseAdmin.from("building_settings").insert({
    building_id: building.id,
    syndic_phone: phoneClean,
  });
  if (settingsErr) {
    console.error("[completeSyndicRegistration] building_settings insert failed:", settingsErr);
  }

  // 4. Generate access code with retry on collision
  let code = generateCode("SYN-", 6);

  const { error: codeErr } = await supabaseAdmin.from("access_codes").insert({
    building_id: building.id,
    code,
    role: "syndic",
    label: `Syndic — ${name}`,
    used_by: profileId,
    used_at: new Date().toISOString(),
  });

  if (codeErr) {
    console.error("[completeSyndicRegistration] access_codes insert failed:", codeErr);
    // Try once more with a different code
    const retryCode = generateCode("SYN-", 6);
    const { error: retryErr } = await supabaseAdmin.from("access_codes").insert({
      building_id: building.id,
      code: retryCode,
      role: "syndic",
      label: `Syndic — ${name}`,
      used_by: profileId,
      used_at: new Date().toISOString(),
    });
    if (retryErr) {
      return { ok: false, error: "creation_failed" };
    }
    code = retryCode;
  }

  // 5. Set session cookie (auto-login)
  const session: SessionData = {
    profileId,
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

/** Step 1: Request OTP — validates phone, generates code, stores in DB */
export async function requestRecoveryOtp(
  phone: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const rl = await checkRateLimit(`recover:${ip}`, RATE_LIMITS.login);
  if (!rl.ok) return { ok: false, error: "too_many_attempts" };

  const cleaned = phone.trim().replace(/\s+/g, "");
  if (!cleaned) return { ok: false, error: "invalid_request" };

  // Validate phone format
  if (!/^0[5-7]\d{8}$/.test(cleaned)) {
    return { ok: false, error: "invalid_request" };
  }

  // Find profile by phone
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("phone", cleaned)
    .single();
  if (!profile) return { ok: false, error: "invalid_request" };

  // Check syndic membership
  const { data: membership } = await supabaseAdmin
    .from("memberships")
    .select("building_id, unit_id")
    .eq("profile_id", profile.id)
    .eq("role", "syndic")
    .eq("status", "active")
    .limit(1)
    .single();
  if (!membership) return { ok: false, error: "invalid_request" };

  // Generate 6-digit OTP (fixed in test mode)
  const otp = process.env.SKIP_SMS === "1" ? "123456" : generateOtp();

  // Clean old OTPs for this phone
  await supabaseAdmin.from("otp_codes").delete().eq("phone", cleaned);

  // Store OTP in database (expires in 5 minutes)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await supabaseAdmin.from("otp_codes").insert({
    phone: cleaned,
    code: otp,
    profile_id: profile.id,
    building_id: membership.building_id,
    unit_id: membership.unit_id ?? null,
    expires_at: expiresAt,
  });

  // Send OTP via SMS
  try {
    await sendSMS(cleaned, `Votre code Palier : ${otp}`);
  } catch {
    await supabaseAdmin.from("otp_codes").delete().eq("phone", cleaned);
    return { ok: false, error: "sms_failed" };
  }

  return { ok: true };
}

/** Step 2: Verify OTP — checks code in DB, regenerates access code, creates session */
export async function verifyRecoveryOtp(
  phone: string,
  otpCode: string,
): Promise<{ ok: true; accessCode: string } | { ok: false; error: string }> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const rl = await checkRateLimit(`otp-verify:${ip}`, RATE_LIMITS.login);
  if (!rl.ok) return { ok: false, error: "too_many_attempts" };

  const cleaned = phone.trim().replace(/\s+/g, "");

  // Find OTP entry in database
  const { data: entry } = await supabaseAdmin
    .from("otp_codes")
    .select("id, code, profile_id, building_id, unit_id, attempts, expires_at")
    .eq("phone", cleaned)
    .single();

  if (!entry) return { ok: false, error: "otp_expired" };

  // Check expiry
  if (new Date(entry.expires_at) < new Date()) {
    await supabaseAdmin.from("otp_codes").delete().eq("id", entry.id);
    return { ok: false, error: "otp_expired" };
  }

  // Atomic increment + check: only increment if attempts < 3
  const { data: updated, error: incErr } = await supabaseAdmin
    .from("otp_codes")
    .update({ attempts: entry.attempts + 1 })
    .eq("id", entry.id)
    .lt("attempts", 3)
    .select("attempts")
    .single();

  if (!updated || incErr) {
    // Either attempts >= 3 or DB error
    await supabaseAdmin.from("otp_codes").delete().eq("id", entry.id);
    return { ok: false, error: "too_many_attempts" };
  }

  // Constant-time comparison
  const otpTrimmed = otpCode.trim();
  if (otpTrimmed.length !== entry.code.length || !timingSafeEqual(otpTrimmed, entry.code)) {
    return { ok: false, error: "otp_invalid" };
  }

  // OTP valid — clean up
  await supabaseAdmin.from("otp_codes").delete().eq("id", entry.id);

  // Generate new access code (crypto-safe) with retry on collision
  let newCode = generateCode("SYN-", 6);

  // Deactivate old codes and insert new one
  await supabaseAdmin
    .from("access_codes")
    .delete()
    .eq("building_id", entry.building_id)
    .eq("used_by", entry.profile_id)
    .eq("role", "syndic");

  const { error: codeErr } = await supabaseAdmin.from("access_codes").insert({
    building_id: entry.building_id,
    code: newCode,
    role: "syndic",
    label: "Syndic",
    used_by: entry.profile_id,
    used_at: new Date().toISOString(),
  });

  if (codeErr) {
    console.error("[verifyRecoveryOtp] access_codes insert failed:", codeErr);
    // Try once more with a different code
    const retryCode = generateCode("SYN-", 6);
    const { error: retryErr } = await supabaseAdmin.from("access_codes").insert({
      building_id: entry.building_id,
      code: retryCode,
      role: "syndic",
      label: "Syndic",
      used_by: entry.profile_id,
      used_at: new Date().toISOString(),
    });
    if (retryErr) {
      return { ok: false, error: "creation_failed" };
    }
    newCode = retryCode;
  }

  // Create session
  const session: SessionData = {
    profileId: entry.profile_id,
    buildingId: entry.building_id,
    unitId: entry.unit_id,
    role: "syndic",
  };
  const cookieStore = await cookies();
  const token = await encodeSession(session);
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

  return { ok: true, accessCode: newCode };
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

/* ═══════════════════════════════════════════════════════════════
   BETA GATE — accès anticipé
   ═══════════════════════════════════════════════════════════════ */

const BETA_COOKIE = "palier_beta";

export async function validateBetaCode(
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const betaEnabled = !!process.env.BETA_ACCESS_CODE;
  if (!betaEnabled) {
    const cookieStore = await cookies();
    cookieStore.set(BETA_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: "lax" });
    return { ok: true };
  }

  const upper = code.trim().toUpperCase();
  if (!upper) return { ok: false, error: "invalid_code" };

  const { data: invite, error: dbErr } = await supabaseAdmin
    .from("beta_invites")
    .select("id, used_at")
    .eq("code", upper)
    .single();

  if (dbErr) {
    console.error("[validateBetaCode] Supabase error:", dbErr.message, dbErr.code, "code:", upper);
  }

  if (!invite) return { ok: false, error: "invalid_code" };

  const cookieStore = await cookies();
  cookieStore.set(BETA_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: "lax" });
  return { ok: true };
}

/** Generate unique beta invite codes (admin only) */
export async function generateBetaInvites(
  count: number,
): Promise<{ codes: string[] }> {
  const generated: string[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let i = 0; i < Math.min(count, 50); i++) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    let code = "BETA-";
    for (let j = 0; j < 8; j++) {
      code += chars[bytes[j] % chars.length];
    }

    const { error } = await supabaseAdmin.from("beta_invites").insert({ code });
    if (!error) generated.push(code);
  }

  return { codes: generated };
}

/** List all beta invites (admin only) */
export async function listBetaInvites(): Promise<
  { id: string; code: string; usedAt: string | null; createdAt: string }[]
> {
  const { data } = await supabaseAdmin
    .from("beta_invites")
    .select("id, code, used_at, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    usedAt: r.used_at,
    createdAt: r.created_at,
  }));
}
