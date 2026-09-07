import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/* ═══════════════════════════════════════════════════════════════
   CRON — Auto-relance quotidienne
   Envoie automatiquement des rappels in-app aux résidents en retard,
   selon les paramètres configurés par chaque syndic.
   ═══════════════════════════════════════════════════════════════ */

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

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets CRON_SECRET, fallback to INTERNAL_API_SECRET)
  const cronSecret = process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!cronSecret || !token || !timingSafeEqual(cronSecret, token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let totalSent = 0;
  let totalBuildings = 0;

  try {
    // 1. Find all buildings with auto_relance_enabled
    const { data: settings } = await supabaseAdmin
      .from("building_settings")
      .select("building_id, auto_relance_enabled, auto_relance_delay_days, auto_relance_frequency_days, relance_message")
      .eq("auto_relance_enabled", true);

    if (!settings?.length) {
      return NextResponse.json({ ok: true, buildings: 0, sent: 0 });
    }

    for (const s of settings) {
      const buildingId = s.building_id;
      const delayDays = s.auto_relance_delay_days ?? 3;
      const frequencyDays = s.auto_relance_frequency_days ?? 7;
      const customMessage = s.relance_message;

      // 2. Get building info
      const { data: building } = await supabaseAdmin
        .from("buildings")
        .select("name")
        .eq("id", buildingId)
        .single();
      if (!building) continue;

      // 3. Get overdue charges (status != paid, due_date passed + delay)
      const cutoffDate = new Date(now.getTime() - delayDays * 86400000).toISOString().slice(0, 10);

      const { data: charges } = await supabaseAdmin
        .from("charges")
        .select("id, unit_id, amount, paid, due_date, label")
        .eq("building_id", buildingId)
        .neq("status", "paid")
        .lte("due_date", cutoffDate);

      if (!charges?.length) continue;

      // 4. Get latest dunning log per unit to check frequency
      const unitIds = [...new Set(charges.map((c: any) => c.unit_id))];
      const { data: dunningLogs } = await supabaseAdmin
        .from("dunning_logs")
        .select("unit_id, sent_at")
        .eq("building_id", buildingId)
        .in("unit_id", unitIds)
        .order("sent_at", { ascending: false });

      const lastDunnedByUnit = new Map<string, string>();
      for (const d of (dunningLogs ?? [])) {
        if (!lastDunnedByUnit.has(d.unit_id)) {
          lastDunnedByUnit.set(d.unit_id, d.sent_at);
        }
      }

      // 5. Get memberships + profiles for these units
      const { data: memberships } = await supabaseAdmin
        .from("memberships")
        .select("unit_id, profile_id, role")
        .eq("building_id", buildingId)
        .in("unit_id", unitIds);

      const profileIds = [...new Set((memberships ?? []).map((m: any) => m.profile_id).filter(Boolean))];
      const { data: profiles } = profileIds.length > 0
        ? await supabaseAdmin.from("profiles").select("id, full_name, phone").in("id", profileIds)
        : { data: [] };

      const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));

      // 6. For each unit with overdue charges, check if we should send a reminder
      const frequencyCutoff = new Date(now.getTime() - frequencyDays * 86400000).toISOString();

      for (const unitId of unitIds) {
        const lastDunned = lastDunnedByUnit.get(unitId);
        if (lastDunned && lastDunned > frequencyCutoff) {
          continue; // Already reminded recently
        }

        const unitCharges = charges.filter((c: any) => c.unit_id === unitId);
        const totalDue = unitCharges.reduce((s: number, c: any) => s + Number(c.amount), 0);
        const totalPaid = unitCharges.reduce((s: number, c: any) => s + Number(c.paid), 0);
        const remaining = totalDue - totalPaid;
        if (remaining <= 0) continue;

        // Find the primary member for this unit
        const mem = (memberships ?? []).find((m: any) => m.unit_id === unitId);
        if (!mem?.profile_id) continue;

        const profile = profileById.get(mem.profile_id);
        if (!profile) continue;

        // Get unit ref
        const { data: unit } = await supabaseAdmin
          .from("units")
          .select("ref")
          .eq("id", unitId)
          .single();

        const unitRef = unit?.ref ?? "—";
        const firstName = (profile.full_name ?? "").split(" ")[0] || "Résident";
        const dueDate = unitCharges[0]?.due_date ?? "";

        // Build the message
        const body = customMessage
          ? customMessage
          : `Bonjour ${firstName}, votre cotisation pour ${building.name} (Lot ${unitRef}) reste en attente. Montant dû : ${totalDue} MAD. Déjà payé : ${totalPaid} MAD. Reste à régler : ${remaining} MAD. Merci de régulariser votre situation.`;

        const title = `Rappel de cotisation — ${unitCharges[0]?.label ?? building.name}`;

        // 7. Send in-app notification
        await supabaseAdmin.from("notifications").insert({
          profile_id: mem.profile_id,
          title,
          body,
          kind: "charge",
          read: false,
        });

        // 8. Log dunning
        await supabaseAdmin.from("dunning_logs").insert({
          building_id: buildingId,
          unit_id: unitId,
          channel: "app",
          message: body,
        });

        // 9. Send push notification (via internal API)
        try {
          const pushUrl = new URL("/api/push/send", request.url);
          await fetch(pushUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
            },
            body: JSON.stringify({
              profileIds: [mem.profile_id],
              title,
              body,
            }),
          });
        } catch {
          // Push failure is non-blocking
        }

        totalSent++;
      }

      totalBuildings++;
    }

    return NextResponse.json({ ok: true, buildings: totalBuildings, sent: totalSent });
  } catch (err) {
    console.error("[auto-relance] Error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
