"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/syndic/ui";
import { Toast } from "@/components/ui/Sheet";
import { mad, timeAgo } from "@/lib/format";
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
    return dunningMessage({ name: r.ownerName.split(" ")[0], amount: r.amount - r.paid, period: "Juin 2026", building });
  }

  function relance(r: RecouvrementRow, channel: "push" | "sms" | "whatsapp") {
    logDunning({ unitId: r.unitId, channel, message: msg(r) }).then(() => router.refresh());
    if (channel === "push") setToast({ title: "Notification envoyée", body: `${r.ownerName} a reçu une notification push de rappel.` });
  }

  async function relanceAll() {
    setBusy(true);
    await Promise.all(unpaid.map((r) => logDunning({ unitId: r.unitId, channel: "whatsapp", message: msg(r) })));
    setBusy(false);
    setToast({ title: "Relances envoyées", body: `${unpaid.length} résidents relancés (WhatsApp + push). Suivi mis à jour.` });
    router.refresh();
  }

  return (
    <div>
      {/* Barre d'action */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-danger-soft"><Icon name="AlertCircle" className="h-5 w-5 text-danger" /></span>
          <div>
            <p className="text-[15px] font-bold text-ink">{mad(due, { decimals: false })} à recouvrer</p>
            <p className="text-[12px] text-ink-soft">{unpaid.length} lots impayés sur {rows.length}</p>
          </div>
        </div>
        <button
          onClick={relanceAll}
          disabled={busy || unpaid.length === 0}
          className="tap inline-flex items-center gap-2 rounded-full bg-palier-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Icon name={busy ? "LoaderCircle" : "Send"} className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          Relancer tous les impayés
        </button>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black/5 text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-3 font-semibold">Lot</th>
              <th className="px-4 py-3 font-semibold">Résident</th>
              <th className="px-4 py-3 font-semibold">Montant</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold">Dernière relance</th>
              <th className="px-4 py-3 text-right font-semibold">Relance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((r) => {
              const remaining = r.amount - r.paid;
              return (
                <tr key={r.unitId} className="text-[13.5px] hover:bg-[#faf8f3]">
                  <td className="px-4 py-3 font-semibold text-ink">{r.ref}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: r.avatarColor }}>
                        {r.ownerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                      <div>
                        <p className="font-medium text-ink">{r.ownerName}</p>
                        <p className="text-[11px] text-ink-faint">{r.role === "tenant" ? "Locataire" : "Propriétaire"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{mad(r.amount, { decimals: false })}</p>
                    {r.status === "partial" && <p className="text-[11px] text-info">{mad(remaining, { decimals: false })} restant</p>}
                  </td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 text-[12px] text-ink-soft">{r.lastDunnedAt ? timeAgo(r.lastDunnedAt) : "—"}</td>
                  <td className="px-4 py-3">
                    {r.status === "paid" ? (
                      <span className="flex items-center justify-end gap-1 text-[12px] font-semibold text-success"><Icon name="CircleCheck" className="h-4 w-4" /> À jour</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <a href={whatsappLink(r.phone, msg(r))} target="_blank" rel="noopener" onClick={() => relance(r, "whatsapp")} title="WhatsApp"
                          className="tap flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366] text-white"><Icon name="MessageCircle" className="h-4 w-4" /></a>
                        <a href={telLink(r.phone)} onClick={() => relance(r, "sms")} title="Appeler / SMS"
                          className="tap flex h-8 w-8 items-center justify-center rounded-lg bg-info-soft text-info"><Icon name="Phone" className="h-4 w-4" /></a>
                        <button onClick={() => relance(r, "push")} title="Notification push"
                          className="tap flex h-8 w-8 items-center justify-center rounded-lg bg-palier-100 text-palier-600"><Icon name="Bell" className="h-4 w-4" /></button>
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
