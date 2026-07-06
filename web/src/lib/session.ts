/**
 * Session management via signed httpOnly cookies.
 * Works in both Edge (middleware) and Node.js (server components/actions).
 */

const COOKIE_NAME = "palier_session";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export interface SessionData {
  profileId: string | null;
  buildingId: string;
  unitId: string | null;
  role: "resident" | "syndic";
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

export function encodeSession(data: SessionData): string {
  return btoa(JSON.stringify(data));
}

export function decodeSession(value: string): SessionData | null {
  try {
    const parsed = JSON.parse(atob(value));
    if (!parsed.buildingId || !parsed.role) return null;
    return parsed;
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
