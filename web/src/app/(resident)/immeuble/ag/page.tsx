"use client";
import { useState } from "react";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/primitives";
import { Toast } from "@/components/ui/Sheet";
import { longDate, daysUntil } from "@/lib/format";
import { useData } from "@/lib/DataProvider";

/* Données AG — à remplacer par une table Supabase en v2 */
const AG_DATE = "2026-09-15";
const AG_TIME = "18h30";
const AG_PLACE = "Hall de la résidence";

const agenda = [
  { n: 1, t: "Approbation des comptes 2025", d: "Présentation du bilan et quitus au syndic." },
  { n: 2, t: "Vote du budget 2026", d: "Charges courantes et provisions." },
  { n: 3, t: "Rénovation du hall d'entrée", d: "Devis : 78 000 MAD — 3 prestataires." },
  { n: 4, t: "Questions diverses", d: "Points soulevés par les copropriétaires." },
];

const votes = [
  { id: "v1", q: "Approuver le devis de rénovation du hall (78 000 MAD) ?", options: ["Pour", "Contre", "Abstention"], closesAt: AG_DATE },
];

export default function AgScreen() {
  const { building } = useData();
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [toast, setToast] = useState(false);
  const days = daysUntil(AG_DATE);
  const isPast = days === 0 && new Date(AG_DATE) < new Date();

  return (
    <div className="animate-[fade_0.4s_ease] pb-4">
      <StatusBar />
      <header className="flex items-center gap-3 px-5 pb-2 pt-3">
        <Link href="/immeuble" className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
          <Icon name="ChevronLeft" className="h-5 w-5" />
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight text-ink">Assemblée générale</h1>
      </header>

      <div className="space-y-5 px-4 pt-1">
        {/* Hero AG */}
        <div className="bg-hero relative overflow-hidden rounded-3xl p-5 text-white shadow-hero">
          <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative z-10">
            {!isPast && <Badge tone="gold">Dans {days} jour{days > 1 ? "s" : ""}</Badge>}
            {isPast && <Badge tone="neutral">Terminée</Badge>}
            <h2 className="mt-2 text-[22px] font-bold">AG ordinaire — {building.name}</h2>
            <p className="mt-1 text-[13px] text-white/80">{longDate(AG_DATE)} · {AG_TIME} · {AG_PLACE}</p>
          </div>
        </div>

        {/* Ordre du jour */}
        <div>
          <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">Ordre du jour</h2>
          <div className="card divide-y divide-black/5 p-0">
            {agenda.map((a) => (
              <div key={a.n} className="flex gap-3 p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-palier-100 text-[13px] font-bold text-palier-700">{a.n}</span>
                <div>
                  <p className="text-[14px] font-bold text-ink">{a.t}</p>
                  <p className="text-[12px] text-ink-soft">{a.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Votes ouverts */}
        {!isPast && (
          <div>
            <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">Votes ouverts</h2>
            {votes.map((v) => (
              <div key={v.id} className="card p-4">
                <p className="text-[14px] font-bold text-ink">{v.q}</p>
                <p className="mt-1 text-[12px] text-ink-faint">Vote pondéré par les tantièmes · clôture le {longDate(v.closesAt)}</p>
                <div className="mt-3 space-y-2">
                  {v.options.map((o) => {
                    const active = choice[v.id] === o;
                    return (
                      <button
                        key={o}
                        onClick={() => { setChoice((c) => ({ ...c, [v.id]: o })); setToast(true); }}
                        className={`tap flex w-full items-center justify-between rounded-2xl border p-3 ${active ? "border-palier-500 bg-palier-50" : "border-black/5 bg-white"}`}
                      >
                        <span className="text-[14px] font-semibold text-ink">{o}</span>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? "border-palier-600 bg-palier-600" : "border-ink-faint/40"}`}>
                          {active && <Icon name="Check" className="h-3 w-3 text-white" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast open={toast} onClose={() => setToast(false)} title="Vote enregistré" body="Votre voix est prise en compte (pondérée par vos tantièmes). Modifiable jusqu'à la clôture." />
    </div>
  );
}
