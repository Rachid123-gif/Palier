"use server";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  encodeSession,
  decodeSession,
  type SessionData,
} from "./session";

/** Constant-time string comparison to prevent timing attacks */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

/**
 * Admin login — validates against PLATFORM_ADMIN_SECRET env var.
 * This is a simple secret-based auth, not tied to the profiles table.
 */
export async function adminLogin(
  secret: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const expected = process.env.PLATFORM_ADMIN_SECRET;
  if (!expected) {
    return { ok: false, error: "not_configured" };
  }

  if (!timingSafeEqual(secret.trim(), expected)) {
    return { ok: false, error: "invalid_secret" };
  }

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
    // redirect() throws — this line is never reached
    throw new Error("redirect");
  }
  return session;
}
