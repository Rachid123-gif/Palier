"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { emitCharges } from "@/lib/actions";
import { PageHeader, KpiCard, Card } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { num } from "@/lib/format";

type Kpis = {
  lots: number; residents: number; collected: number; expected: number;
  rate: number; outstanding: number; balance: number; openIncidents: number;
  lateCount: number; partialCount: number;
};

type RecouvrementRow = {
  unitId: string; ref: string; floor: number | null; ownerName: string;
  avatarColor: string; role: string; phone: string; amount: number;
  paid: number; status: "due" | "partial" | "paid" | "late"; lastDunnedAt: string | null;
};

export function ChargesView({ kpis: k, recouvrement, buildingId }: {
  kpis: Kpis; recouvrement: RecouvrementRow[]; buildingId: string;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("courantes");
  const [dueDate, setDueDate] = useState("");

  const byStatus = {
    paid: recouvrement.filter((r) => r.status === "paid").length,
    partial: recouvrement.filter((r) => r.status === "partial").length,
    due: recouvrement.filter((r) => r.status === "due").length,
    late: recouvrement.filter((r) => r.status === "late").length,
  };

  function reset() { setLabel(""); setDetail(""); setAmount(""); setCategory("courantes"); setDueDate(""); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label || !amount || !dueDate) return;
    startTransition(async () => {
      const res = await emitCharges({ buildingId, label, detail, amount: Number(amount), category, dueDate });
      if (res?.error) { setToast("Erreur lors de l'émission"); }
      else { setToast(`Appel émis pour ${k.lots} lots`); setShowModal(false); reset(); router.refresh(); }
    });
  }

  const inputCls = "h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20";

  return (
    <div>
      <PageHeader title="Charges & appels" subtitle="Émission et suivi des charges" action={
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700">
          <Icon name="Plus" className="h-3.5 w-3.5" /> Émettre un appel
        </button>
      } />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Appelé" value={num(k.expected, false)} unit="MAD" />
        <KpiCard label="Encaissé" value={num(k.collected, false)} unit="MAD" />
        <KpiCard label="En attente" value={num(k.outstanding, false)} unit="MAD" />
        <KpiCard label="Taux" value={`${k.rate}%`} />
      </div>

      <Card className="mt-5">
        <h2 className="mb-2 text-[14px] font-semibold text-ink">Répartition</h2>
        <div className="flex gap-3 text-[12px]">
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">{byStatus.paid} payés</span>
          <span className="rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-700">{byStatus.partial} partiels</span>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-700">{byStatus.due} à payer</span>
          <span className="rounded-md bg-red-50 px-2 py-0.5 font-medium text-red-700">{byStatus.late} en retard</span>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setShowModal(false); reset(); }}>
          <div className="w-full max-w-md rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-ink">Émettre un appel de fonds</h2>
              <button onClick={() => { setShowModal(false); reset(); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink"><Icon name="X" className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Label</label><input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Charges courantes Juillet 2026" required className={inputCls} /></div>
              <div><label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Détail</label><input type="text" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Syndic + ascenseur + nettoyage" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Montant / lot</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" required className={inputCls} /></div>
                <div><label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Catégorie</label><select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}><option value="courantes">Courantes</option><option value="travaux">Travaux</option><option value="provision">Provision</option><option value="regularisation">Régularisation</option></select></div>
              </div>
              <div><label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Échéance</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className={inputCls} /></div>
              <button type="submit" disabled={pending} className="w-full rounded-lg bg-palier-600 py-2.5 text-[13px] font-medium text-white hover:bg-palier-700 disabled:opacity-50">
                {pending ? "Émission…" : "Émettre l'appel"}
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-[rise_0.25s_ease] rounded-lg bg-palier-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">{toast}</div>}
    </div>
  );
}
