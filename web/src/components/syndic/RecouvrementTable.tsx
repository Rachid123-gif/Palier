"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/syndic/ui";
import { Toast } from "@/components/ui/Sheet";
import { mad, timeAgo, currentPeriod } from "@/lib/format";
import { whatsappLink, telLink, dunningMessage } from "@/lib/whatsapp";
import { logDunning } from "@/lib/actions";
import type { RecouvrementRow } from "@/lib/syndic";

export function RecouvrementTable({ rows, building }: { rows: RecouvrementRow[]; building: string }) {
  const router = useRouter();
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const unpaid = rows.filter((r) => r.status !== "paid");
  const due = rows.reduce((s, r) => s + (r.amount - r.paid), 0);

  function msg(r: RecouvrementRow) {
    return dunningMessage({ name: r.ownerName.split(" ")[0], amount: r.amount - r.paid, period: currentPeriod(), building });
  }

  function relance(r: RecouvrementRow, channel: "push" | "sms" | "whatsapp") {
    logDunning({ unitId: r.unitId, channel, message: msg(r) }).then(() => router.refresh());
    if (channel === "push") setToast({ title: "Notification envoyée", body: `${r.ownerName} a reçu un rappel.` });
  }

  async function relanceAll() {
    setBusy(true);
    await Promise.all(unpaid.map((r) => logDunning({ unitId: r.unitId, channel: "whatsapp", message: msg(r) })));
    setBusy(false);
    setToast({ title: "Relances envoyées", body: `${unpaid.length} résidents relancés.` });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
        <div>
          <p className="text-[14px] font-semibold text-ink">{mad(due, { decimals: false })} à recouvrer</p>
          <p className="text-[12px] text-ink-soft">{unpaid.length} impayés sur {rows.length} lots</p>
        </div>
        <button
          onClick={relanceAll}
          disabled={busy || unpaid.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700 disabled:opacity-50"
        >
          <Icon name={busy ? "LoaderCircle" : "Send"} className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
          Relancer tous les impayés
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-2.5">Lot</th>
              <th className="px-4 py-2.5">Résident</th>
              <th className="px-4 py-2.5">Montant</th>
              <th className="px-4 py-2.5">Statut</th>
              <th className="px-4 py-2.5">Dernière relance</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {rows.map((r) => {
              const remaining = r.amount - r.paid;
              return (
                <tr key={r.unitId} className="transition-colors hover:bg-sand/50">
                  <td className="px-4 py-2.5 font-medium text-ink">{r.ref}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: r.avatarColor }}>
                        {r.ownerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                      <div>
                        <p className="text-ink">{r.ownerName}</p>
                        <p className="text-[11px] text-ink-soft">{r.role === "tenant" ? "Locataire" : "Propriétaire"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-ink">{mad(r.amount, { decimals: false })}</p>
                    {r.status === "partial" && <p className="text-[11px] text-blue-600">{mad(remaining, { decimals: false })} restant</p>}
                  </td>
                  <td className="px-4 py-2.5"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-2.5 text-[12px] text-ink-soft">{r.lastDunnedAt ? timeAgo(r.lastDunnedAt) : "—"}</td>
                  <td className="px-4 py-2.5">
                    {r.status === "paid" ? (
                      <span className="flex items-center justify-end gap-1 text-[12px] font-medium text-emerald-600">À jour</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <a href={whatsappLink(r.phone, msg(r))} target="_blank" rel="noopener" onClick={() => relance(r, "whatsapp")}
                          className="rounded-md p-1.5 text-ink-faint hover:bg-emerald-50 hover:text-emerald-600" title="WhatsApp">
                          <Icon name="MessageCircle" className="h-3.5 w-3.5" />
                        </a>
                        <a href={telLink(r.phone)} onClick={() => relance(r, "sms")}
                          className="rounded-md p-1.5 text-ink-faint hover:bg-blue-50 hover:text-blue-600" title="Appeler">
                          <Icon name="Phone" className="h-3.5 w-3.5" />
                        </a>
                        <button onClick={() => relance(r, "push")}
                          className="rounded-md p-1.5 text-ink-faint hover:bg-palier-50 hover:text-ink" title="Notification">
                          <Icon name="Bell" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {toast && <Toast open onClose={() => setToast(null)} title={toast.title} body={toast.body} />}
    </div>
  );
}
