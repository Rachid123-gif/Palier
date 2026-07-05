"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, KpiCard } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { longDate } from "@/lib/format";
import { createAssembly } from "@/lib/actions";

type Assembly = {
  date: string;
  agenda: ({ n: number; t: string; d: string } | string)[];
  votes: { q: string; pour: number; contre: number; abst: number }[];
  quorum: number;
} | null;

type AgendaItem = { n: number; t: string; d: string };

export function AgView({ assembly, buildingId }: { assembly: Assembly; buildingId: string }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [place, setPlace] = useState("");
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([{ n: 1, t: "", d: "" }]);

  function addItem() { setAgendaItems((p) => [...p, { n: p.length + 1, t: "", d: "" }]); }
  function removeItem(i: number) { setAgendaItems((p) => p.filter((_, j) => j !== i).map((item, j) => ({ ...item, n: j + 1 }))); }
  function updateItem(i: number, f: "t" | "d", v: string) { setAgendaItems((p) => p.map((item, j) => (j === i ? { ...item, [f]: v } : item))); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !place || agendaItems.some((a) => !a.t)) return;
    setSaving(true);
    await createAssembly({ buildingId, date, time, place, agenda: agendaItems });
    setShowModal(false); setSaving(false); router.refresh();
  }

  function openModal() { setDate(""); setTime("18:00"); setPlace(""); setAgendaItems([{ n: 1, t: "", d: "" }]); setShowModal(true); }

  const inputCls = "h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20";

  const actionBtn = (
    <button onClick={openModal} className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700">
      <Icon name="Plus" className="h-3.5 w-3.5" /> Convoquer une AG
    </button>
  );

  const modal = showModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowModal(false)}>
      <div className="w-full max-w-md rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-ink">Convoquer une AG</h2>
          <button onClick={() => setShowModal(false)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink"><Icon name="X" className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Date</label><input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></div>
            <div><label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Heure</label><input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} /></div>
          </div>
          <div><label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Lieu</label><input type="text" required placeholder="Hall de l'immeuble" value={place} onChange={(e) => setPlace(e.target.value)} className={inputCls} /></div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[12px] font-medium text-ink-soft">Ordre du jour</span>
              <button type="button" onClick={addItem} className="text-[12px] font-medium text-palier-600">+ Ajouter</button>
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {agendaItems.map((item, i) => (
                <div key={i} className="rounded-lg border border-black/[0.06] p-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-ink-soft">Point {item.n}</span>
                    {agendaItems.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-ink-faint hover:text-red-500"><Icon name="Trash2" className="h-3 w-3" /></button>}
                  </div>
                  <input type="text" required placeholder="Titre" value={item.t} onChange={(e) => updateItem(i, "t", e.target.value)} className={`mb-1 ${inputCls}`} />
                  <input type="text" placeholder="Description (optionnel)" value={item.d} onChange={(e) => updateItem(i, "d", e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-palier-600 py-2.5 text-[13px] font-medium text-white hover:bg-palier-700 disabled:opacity-50">
            {saving ? "Envoi…" : "Convoquer l'AG"}
          </button>
        </form>
      </div>
    </div>
  );

  if (!assembly) {
    return (
      <div>
        <PageHeader title="Assemblées & votes" subtitle="AG, quorum et votes" action={actionBtn} />
        <Card><p className="py-6 text-center text-[13px] text-ink-soft">Aucune AG programmée</p></Card>
        {modal}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Assemblées & votes" subtitle="AG, quorum et votes" action={actionBtn} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="Prochaine AG" value={longDate(assembly.date)} />
        <KpiCard label="Quorum" value={`${assembly.quorum}%`} hint="présents + pouvoirs" />
        <KpiCard label="Votes ouverts" value={String(assembly.votes.length)} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {assembly.agenda.length > 0 && (
          <Card>
            <h2 className="mb-3 text-[14px] font-semibold text-ink">Ordre du jour</h2>
            <ol className="space-y-2">
              {assembly.agenda.map((a: { n?: number; t?: string; d?: string } | string, i: number) => {
                const lbl = typeof a === "string" ? a : a.t ?? "";
                const desc = typeof a === "string" ? "" : a.d ?? "";
                return (
                  <li key={i} className="flex gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-palier-50 text-[11px] font-medium text-ink-soft">
                      {typeof a === "object" && a.n ? a.n : i + 1}
                    </span>
                    <div>
                      <p className="text-[13px] text-ink">{lbl}</p>
                      {desc && <p className="text-[12px] text-ink-soft">{desc}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}

        {assembly.votes.length > 0 && (
          <Card>
            <h2 className="mb-3 text-[14px] font-semibold text-ink">Résultats des votes</h2>
            <div className="space-y-4">
              {assembly.votes.map((v, i) => (
                <div key={i}>
                  <p className="mb-1.5 text-[13px] font-medium text-ink">{v.q}</p>
                  <div className="flex h-2 overflow-hidden rounded-full bg-sand/50">
                    <div style={{ width: `${v.pour}%` }} className="bg-emerald-500" />
                    <div style={{ width: `${v.contre}%` }} className="bg-red-400" />
                    <div style={{ width: `${v.abst}%` }} className="bg-gray-300" />
                  </div>
                  <div className="mt-1 flex gap-3 text-[11px] text-ink-soft">
                    <span className="text-emerald-600">Pour {v.pour}%</span>
                    <span className="text-red-500">Contre {v.contre}%</span>
                    <span>Abst. {v.abst}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
      {modal}
    </div>
  );
}
