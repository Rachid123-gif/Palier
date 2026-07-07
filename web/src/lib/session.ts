/**
 * Session management via signed JWT httpOnly cookies.
 * Uses `jose` for Edge-compatible JWT signing/verification.
 */

import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "palier_session";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export interface SessionData {
  profileId: string | null;
  buildingId: string;
  unitId: string | null;
  role: "resident" | "syndic";
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

/**
 * Derive a signing key from the SESSION_SECRET env var.
 * In production, SESSION_SECRET MUST be set — the app will refuse to start otherwise.
 */
function getSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[FATAL] SESSION_SECRET env var is not set. Cannot run in production without it.");
    }
    return new TextEncoder().encode("palier-dev-secret-DO-NOT-USE-IN-PROD");
  }
  return new TextEncoder().encode(raw);
}

export async function encodeSession(data: SessionData): Promise<string> {
  return new SignJWT(data as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

export async function decodeSession(value: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(value, getSecret());
    if (!payload.buildingId || !payload.role) return null;
    return {
      profileId: (payload.profileId as string) ?? null,
      buildingId: payload.buildingId as string,
      unitId: (payload.unitId as string) ?? null,
      role: payload.role as "resident" | "syndic",
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: MAX_AGE,
  path: "/",
};
