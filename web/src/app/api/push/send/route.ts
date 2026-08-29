import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase-server";
import { SESSION_COOKIE_NAME, decodeSession } from "@/lib/session";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Configure VAPID — set these env vars in production
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:contact@palier.ma";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

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

export async function POST(request: NextRequest) {
  try {
    // Auth: accept internal server-to-server calls OR authenticated syndic sessions
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const requestSecret = request.headers.get("x-internal-secret");
    const isInternal = internalSecret && requestSecret && timingSafeEqual(internalSecret, requestSecret);

    let syndicBuildingId: string | null = null;

    if (!isInternal) {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      const session = token ? await decodeSession(token) : null;
      if (!session || session.role !== "syndic") {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      syndicBuildingId = session.buildingId;

      // Rate limit push sends per building
      const rl = await checkRateLimit(`push-send:${syndicBuildingId}`, RATE_LIMITS.push);
      if (!rl.ok) {
        return NextResponse.json({ error: "rate_limited" }, { status: 429 });
      }
    }

    const { profileIds, title, body, url } = await request.json();
    if (!profileIds?.length || !title) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // Building-level authorization: verify all target profiles belong to syndic's building
    if (syndicBuildingId) {
      const { data: memberships } = await supabaseAdmin
        .from("memberships")
        .select("profile_id")
        .eq("building_id", syndicBuildingId)
        .in("profile_id", profileIds);

      const authorizedIds = new Set((memberships ?? []).map((m: any) => m.profile_id));
      const unauthorized = profileIds.filter((id: string) => !authorizedIds.has(id));
      if (unauthorized.length > 0) {
        return NextResponse.json({ error: "forbidden", detail: "profile_ids outside your building" }, { status: 403 });
      }
    }

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      // VAPID not configured — skip push, not an error
      return NextResponse.json({ ok: true, sent: 0, note: "vapid_not_configured" });
    }

    // Fetch subscriptions for these profiles
    const { data: subs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .in("profile_id", profileIds);

    if (!subs?.length) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const payload = JSON.stringify({ title, body, icon: "/icon.svg", url: url ?? "/" });

    let sent = 0;
    const expired: string[] = [];

    await Promise.allSettled(
      subs.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          sent++;
        } catch (err: any) {
          // 410 Gone or 404 — subscription expired, clean up
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            expired.push(sub.id);
          }
        }
      })
    );

    // Clean expired subscriptions
    if (expired.length > 0) {
      await supabaseAdmin.from("push_subscriptions").delete().in("id", expired);
    }

    return NextResponse.json({ ok: true, sent });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
