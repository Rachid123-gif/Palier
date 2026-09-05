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
  const maxLen = Math.max(a.length, b.length);
  const bufA = encoder.encode(a.padEnd(maxLen, "\0"));
  const bufB = encoder.encode(b.padEnd(maxLen, "\0"));
  let result = a.length ^ b.length;
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

  // ── Code found in access_codes → normal login ──
  if (data) {
    if (data.role !== selectedRole)
      return { ok: false, error: "wrong_role" };

    let profileId: string | null = null;
    let unitId: string | null = null;

    if (data.used_by) {
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
      return { ok: false, error: "code_not_linked" };
    }

    await supabaseAdmin
      .from("access_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", data.id);

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

  // ── Code not in access_codes → check registration_requests (approved syndic) ──
  if (selectedRole === "syndic") {
    const { data: req } = await supabaseAdmin
      .from("registration_requests")
      .select("*")
      .eq("access_code", upper)
      .eq("status", "approved")
      .single();

    if (req) {
      const result = await activateApprovedRequest(req);
      if (!result.ok) return { ok: false, error: result.error };

      const session: SessionData = {
        profileId: result.profileId,
        buildingId: result.buildingId,
        unitId: result.unitId,
        role: "syndic",
      };

      const cookieStore = await cookies();
      const token = await encodeSession(session);
      cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

      return { ok: true };
    }
  }

  return { ok: false, error: "code_not_found" };
}

/** Create building + profile + access code from an approved registration request */
async function activateApprovedRequest(
  req: { id: string; full_name: string; phone: string; building_name: string; city: string; lots_count: number; syndic_unit: string | null; access_code: string },
): Promise<{ ok: true; profileId: string; buildingId: string; unitId: string | null } | { ok: false; error: string }> {
  // 1. Create building
  const { data: building, error: bErr } = await supabaseAdmin
    .from("buildings")
    .insert({
      name: req.building_name,
      address: "",
      city: req.city,
      lots_count: req.lots_count,
      syndic_name: req.full_name,
      syndic_phone: req.phone,
      balance: 0,
      payment_rate: 0,
    })
    .select("id")
    .single();
  if (bErr || !building) return { ok: false, error: "creation_failed" };

  // 2. Create or reuse profile
  let profileId: string;
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("phone", req.phone)
    .single();

  if (existingProfile) {
    profileId = existingProfile.id;
    await supabaseAdmin.from("profiles").update({ full_name: req.full_name }).eq("id", profileId);
  } else {
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .insert({ full_name: req.full_name, phone: req.phone })
      .select("id")
      .single();
    if (pErr || !profile) return { ok: false, error: "creation_failed" };
    profileId = profile.id;
  }

  // 3. Create syndic unit if provided
  let syndicUnitId: string | null = null;
  if (req.syndic_unit) {
    const { data: unitData } = await supabaseAdmin
      .from("units")
      .insert({ building_id: building.id, ref: req.syndic_unit.toUpperCase() })
      .select("id")
      .single();
    syndicUnitId = unitData?.id ?? null;
  }

  // 4. Create membership
  await supabaseAdmin.from("memberships").insert({
    profile_id: profileId,
    building_id: building.id,
    unit_id: syndicUnitId,
    role: "syndic",
    status: "active",
  });

  // 5. Create building settings
  await supabaseAdmin.from("building_settings").insert({
    building_id: building.id,
    syndic_phone: req.phone,
  });

  // 6. Move access code to access_codes table (permanent)
  await supabaseAdmin.from("access_codes").insert({
    building_id: building.id,
    code: req.access_code,
    role: "syndic",
    label: `Syndic — ${req.full_name}`,
    used_by: profileId,
    used_at: new Date().toISOString(),
  });

  // 7. Mark request as completed
  await supabaseAdmin
    .from("registration_requests")
    .update({ status: "completed" })
    .eq("id", req.id);

  return { ok: true, profileId, buildingId: building.id, unitId: syndicUnitId };
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

  // Generate OTP (fixed in test mode — NEVER in production)
  if (process.env.SKIP_SMS === "1" && process.env.NODE_ENV === "production") {
    throw new Error("SKIP_SMS must not be set in production");
  }
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

/** Phase 2: Verify OTP and save registration request (pending approval) */
export async function completeSyndicRegistration(input: {
  fullName: string;
  phone: string;
  buildingName: string;
  city: string;
  lotsCount: number;
  syndicUnit?: string;
  otp: string;
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

  const otpTrimmed = input.otp.trim();
  if (otpTrimmed.length !== entry.code.length || !timingSafeEqual(otpTrimmed, entry.code)) {
    return { ok: false, error: "otp_invalid" };
  }

  // OTP valid — clean up
  await supabaseAdmin.from("otp_codes").delete().eq("id", entry.id);

  // ── Check for duplicate phone ──
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

  // ── Check for duplicate pending request ──
  const { data: existingRequest } = await supabaseAdmin
    .from("registration_requests")
    .select("id")
    .eq("phone", phoneClean)
    .eq("status", "pending")
    .single();

  if (existingRequest) {
    return { ok: false, error: "request_already_pending" };
  }

  // ── Save pending registration request ──
  const { error: insertErr } = await supabaseAdmin
    .from("registration_requests")
    .insert({
      full_name: name,
      phone: phoneClean,
      building_name: buildingName,
      city,
      lots_count: lots,
      syndic_unit: input.syndicUnit?.trim() || null,
    });

  if (insertErr) {
    console.error("[completeSyndicRegistration] insert failed:", insertErr);
    return { ok: false, error: "creation_failed" };
  }

  return { ok: true };
}

/* ─── Admin: approve / reject registration requests ─── */

export async function listRegistrationRequests(): Promise<
  { id: string; fullName: string; phone: string; buildingName: string; city: string; lotsCount: number; syndicUnit: string | null; status: string; betaCode: string | null; accessCode: string | null; createdAt: string }[]
> {
  const { requireAdminSession } = await import("./admin-auth");
  await requireAdminSession();

  const { data } = await supabaseAdmin
    .from("registration_requests")
    .select("id, full_name, phone, building_name, city, lots_count, syndic_unit, status, beta_code, access_code, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    fullName: r.full_name,
    phone: r.phone,
    buildingName: r.building_name,
    city: r.city,
    lotsCount: r.lots_count,
    syndicUnit: r.syndic_unit,
    status: r.status,
    betaCode: r.beta_code,
    accessCode: r.access_code,
    createdAt: r.created_at,
  }));
}

export async function approveSyndicRequest(
  requestId: string,
): Promise<{ ok: true; betaCode: string; accessCode: string } | { ok: false; error: string }> {
  const { requireAdminSession } = await import("./admin-auth");
  await requireAdminSession();

  const { data: req } = await supabaseAdmin
    .from("registration_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .single();

  if (!req) return { ok: false, error: "not_found" };

  // Generate both codes (no account creation yet)
  const betaCode = generateCode("BETA-", 8);
  const accessCode = generateCode("SYN-", 6);

  // Save beta code in beta_invites
  await supabaseAdmin.from("beta_invites").insert({
    code: betaCode,
    building_name: req.building_name,
    city: req.city,
  });

  // Store codes in the request + mark as approved
  await supabaseAdmin
    .from("registration_requests")
    .update({
      status: "approved",
      beta_code: betaCode,
      access_code: accessCode,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  // Send SMS with both codes
  try {
    await sendSMS(
      req.phone,
      `Palier — accès approuvé !\nCode beta : ${betaCode}\nCode d'accès : ${accessCode}\nConnectez-vous sur palier.ma`,
    );
  } catch (e) {
    console.error("[approveSyndicRequest] SMS failed:", e);
  }

  return { ok: true, betaCode, accessCode };
}

export async function rejectSyndicRequest(
  requestId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { requireAdminSession } = await import("./admin-auth");
  await requireAdminSession();

  const { error } = await supabaseAdmin
    .from("registration_requests")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) return { ok: false, error: "update_failed" };
  return { ok: true };
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

  // Generate 6-digit OTP (fixed in test mode — NEVER in production)
  if (process.env.SKIP_SMS === "1" && process.env.NODE_ENV === "production") {
    throw new Error("SKIP_SMS must not be set in production");
  }
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

  // Mark first usage (for admin tracking), but allow reuse by the same person
  if (!invite.used_at) {
    await supabaseAdmin
      .from("beta_invites")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invite.id);
  }

  const cookieStore = await cookies();
  cookieStore.set(BETA_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: "lax" });
  return { ok: true };
}

/** Generate a beta invite code linked to a building (admin only) */
export async function generateBetaInvite(
  buildingName: string,
  city: string,
): Promise<{ code: string } | { error: string }> {
  const { requireAdminSession } = await import("./admin-auth");
  await requireAdminSession();

  const name = buildingName.trim();
  const c = city.trim();
  if (!name || !c) return { error: "missing_fields" };

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = "BETA-";
  for (let j = 0; j < 8; j++) {
    code += chars[bytes[j] % chars.length];
  }

  const { error } = await supabaseAdmin.from("beta_invites").insert({
    code,
    building_name: name,
    city: c,
  });
  if (error) return { error: "generation_failed" };
  return { code };
}

/** List all beta invites (admin only) */
export async function listBetaInvites(): Promise<
  { id: string; code: string; buildingName: string; city: string; usedAt: string | null; createdAt: string }[]
> {
  const { requireAdminSession } = await import("./admin-auth");
  await requireAdminSession();
  const { data } = await supabaseAdmin
    .from("beta_invites")
    .select("id, code, building_name, city, used_at, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    buildingName: r.building_name ?? "",
    city: r.city ?? "",
    usedAt: r.used_at,
    createdAt: r.created_at,
  }));
}
