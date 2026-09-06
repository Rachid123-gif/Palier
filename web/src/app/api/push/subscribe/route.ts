import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { SESSION_COOKIE_NAME, decodeSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await decodeSession(token) : null;
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // Rate limit
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = await checkRateLimit(`push:${ip}`, RATE_LIMITS.push);
    if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

    const { profileId, subscription } = await request.json();
    if (!profileId || typeof profileId !== "string" || !subscription || typeof subscription !== "object") {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // Validate push subscription keys are present and are strings with size limits
    if (
      typeof subscription.endpoint !== "string" || subscription.endpoint.length > 512 ||
      typeof subscription.keys?.p256dh !== "string" || subscription.keys.p256dh.length > 255 ||
      typeof subscription.keys?.auth !== "string" || subscription.keys.auth.length > 255
    ) {
      return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
    }

    // Verify profileId matches session
    if (session.profileId !== profileId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Upsert subscription (one per profile + endpoint)
    const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
      {
        profile_id: profileId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh ?? "",
        auth: subscription.keys?.auth ?? "",
        created_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,endpoint" }
    );

    if (error) {
      console.error("[push/subscribe] Upsert error:", error);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/subscribe] Error:", err);
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await decodeSession(token) : null;
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { profileId, endpoint } = await request.json();
    if (!profileId || !endpoint) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    if (session.profileId !== profileId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    await supabaseAdmin.from("push_subscriptions").delete().eq("profile_id", profileId).eq("endpoint", endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/subscribe DELETE] Error:", err);
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}
