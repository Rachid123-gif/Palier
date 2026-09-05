"use server";

import { cookies, headers } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  encodeSession,
  decodeSession,
  type SessionData,
} from "./session";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";
import { sendSMS } from "./sms";
import { supabaseAdmin } from "./supabase-server";

/** Constant-time string comparison to prevent timing attacks */
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

function generateOtp(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => String(b % 10)).join("");
}

/**
 * Admin login — Step 1: validate secret key, send OTP to admin phone.
 * Requires PLATFORM_ADMIN_SECRET + ADMIN_PHONE env vars.
 */
export async function adminLogin(
  secret: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const rl = await checkRateLimit(`admin-login:${ip}`, RATE_LIMITS.login);
  if (!rl.ok) return { ok: false, error: "too_many_attempts" };

  const expected = process.env.PLATFORM_ADMIN_SECRET;
  if (!expected) return { ok: false, error: "not_configured" };

  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) return { ok: false, error: "not_configured" };

  if (!timingSafeEqual(secret.trim(), expected)) {
    return { ok: false, error: "invalid_secret" };
  }

  // Secret valid → generate OTP and send to admin phone
  if (process.env.SKIP_SMS === "1" && process.env.NODE_ENV === "production") {
    throw new Error("SKIP_SMS must not be set in production");
  }
  const otp = process.env.SKIP_SMS === "1" ? "123456" : generateOtp();

  // Clean old admin OTPs
  await supabaseAdmin.from("otp_codes").delete().eq("phone", adminPhone);

  // Store OTP (expires in 3 minutes — shorter for admin)
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();
  await supabaseAdmin.from("otp_codes").insert({
    phone: adminPhone,
    code: otp,
    expires_at: expiresAt,
  });

  // Send SMS
  try {
    await sendSMS(adminPhone, `Palier Admin — code : ${otp}`);
  } catch {
    await supabaseAdmin.from("otp_codes").delete().eq("phone", adminPhone);
    return { ok: false, error: "sms_failed" };
  }

  return { ok: true };
}

/**
 * Admin login — Step 2: verify OTP, create session.
 */
export async function adminVerifyOtp(
  otpCode: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const rl = await checkRateLimit(`admin-otp:${ip}`, RATE_LIMITS.login);
  if (!rl.ok) return { ok: false, error: "too_many_attempts" };

  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) return { ok: false, error: "not_configured" };

  // Find OTP entry
  const { data: entry } = await supabaseAdmin
    .from("otp_codes")
    .select("id, code, attempts, expires_at")
    .eq("phone", adminPhone)
    .single();

  if (!entry) return { ok: false, error: "otp_expired" };

  // Check expiry
  if (new Date(entry.expires_at) < new Date()) {
    await supabaseAdmin.from("otp_codes").delete().eq("id", entry.id);
    return { ok: false, error: "otp_expired" };
  }

  // Atomic increment + check
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
  const otpTrimmed = otpCode.trim();
  if (otpTrimmed.length !== entry.code.length || !timingSafeEqual(otpTrimmed, entry.code)) {
    return { ok: false, error: "otp_invalid" };
  }

  // OTP valid — clean up
  await supabaseAdmin.from("otp_codes").delete().eq("id", entry.id);

  // Create admin session
  const session: SessionData = {
    profileId: null,
    buildingId: "admin",
    unitId: null,
    role: "admin",
  };

  const cookieStore = await cookies();
  const token = await encodeSession(session);
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

  return { ok: true };
}

export async function getAdminSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await decodeSession(token);
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function requireAdminSession(): Promise<SessionData> {
  const session = await getAdminSession();
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
    throw new Error("redirect");
  }
  return session;
}
