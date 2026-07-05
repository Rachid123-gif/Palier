"use client";
import { useState } from "react";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/primitives";
import { Toast } from "@/components/ui/Sheet";
import { longDate, daysUntil } from "@/lib/format";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";

export default function AgScreen() {
  const { building, assembly } = useData();
  const { lang, i, isAr } = useLang();
  const T = i.ag;
  const [choice, setChoice] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem("palier_ag_votes");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [toast, setToast] = useState(false);

  if (!assembly) {
    return (
      <div className="animate-[fade_0.4s_ease] pb-4">
        <StatusBar />
        <header className="flex items-center gap-3 px-5 pb-2 pt-3">
          <Link href="/immeuble" className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
            <Icon name={isAr ? "ChevronRight" : "ChevronLeft"} className="h-5 w-5" />
          </Link>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">{T.title}</h1>
        </header>
        <div className="space-y-4 px-4 pt-1">
          <div className="flex items-center gap-3 rounded-2xl bg-palier-50 p-3.5">
            <Icon name="CalendarDays" className="h-5 w-5 shrink-0 text-palier-600" />
            <p className="text-[12.5px] font-medium text-palier-800">{T.infoVide}</p>
          </div>
          <div className="card flex items-center gap-3 p-4">
            <Icon name="CalendarX" className="h-5 w-5 text-ink-faint" />
            <p className="text-[13px] text-ink-soft">{T.aucune}</p>
          </div>
        </div>
      </div>
    );
  }

  const days = daysUntil(assembly.date);
  const isPast = days === 0 && new Date(assembly.date) < new Date();

  return (
    <div className="animate-[fade_0.4s_ease] pb-4">
      <StatusBar />
      <header className="flex items-center gap-3 px-5 pb-2 pt-3">
        <Link href="/immeuble" className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
          <Icon name={isAr ? "ChevronRight" : "ChevronLeft"} className="h-5 w-5" />
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight text-ink">{T.title}</h1>
      </header>

      <div className="space-y-5 px-4 pt-1">
        <div className="bg-hero relative overflow-hidden rounded-3xl p-5 text-white shadow-hero">
          <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative z-10">
            {!isPast && <Badge tone="gold">{T.dans(days)}</Badge>}
            {isPast && <Badge tone="neutral">{T.terminee}</Badge>}
            <h2 className="mt-2 text-[22px] font-bold">{T.agOrdinaire} {building.name}</h2>
            <p className="mt-1 text-[13px] text-white/80">{longDate(assembly.date, lang)} · {assembly.time} · {assembly.place}</p>
          </div>
        </div>

        {assembly.agenda.length > 0 && (
          <div>
            <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">{T.ordreDuJour}</h2>
            <div className="card divide-y divide-black/5 p-0">
              {assembly.agenda.map((a) => (
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
        )}

        {!isPast && assembly.votes.length > 0 && (
          <div>
            <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">{T.votesOuverts}</h2>
            {assembly.votes.map((v) => (
              <div key={v.id} className="card p-4">
                <p className="text-[14px] font-bold text-ink">{v.q}</p>
                <p className="mt-1 text-[12px] text-ink-faint">{T.votePondere} {longDate(v.closesAt, lang)}</p>
                <div className="mt-3 space-y-2">
                  {v.options.map((o) => {
                    const active = choice[v.id] === o;
                    return (
                      <button
                        key={o}
                        onClick={() => { setChoice((c) => { const next = { ...c, [v.id]: o }; localStorage.setItem("palier_ag_votes", JSON.stringify(next)); return next; }); setToast(true); }}
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

      <Toast open={toast} onClose={() => setToast(false)} title={T.voteEnregistre} body={T.voteBody} />
    </div>
  );
}
