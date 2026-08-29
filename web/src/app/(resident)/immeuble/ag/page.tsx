"use client";
import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/primitives";
import { Toast } from "@/components/ui/Sheet";
import { longDate, shortDate, daysUntil } from "@/lib/format";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";
import { castVote, fetchMyVotes } from "@/lib/actions";

export default function AgScreen() {
  const { building, assembly, assemblies, profileId, currentUser } = useData();
  const { lang, i, isAr } = useLang();
  const T = i.ag;
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [toast, setToast] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isInactive = currentUser.membershipStatus === "inactive";

  useEffect(() => {
    if (!assembly || !profileId) return;
    fetchMyVotes(assembly.id, profileId).then((votes) => {
      const map: Record<string, string> = {};
      for (const v of votes) map[v.vote_id] = v.choice;
      setChoice(map);
    });
  }, [assembly, profileId]);

  // Past assemblies (exclude the current/upcoming one)
  const pastAssemblies = assemblies.filter((a) => {
    if (assembly && a.id === assembly.id) return false;
    return new Date(a.date) < new Date();
  });

  const days = assembly ? daysUntil(assembly.date) : 0;
  const isPast = assembly ? days === 0 && new Date(assembly.date) < new Date() : false;

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
        {/* ═══ Current / upcoming assembly ═══ */}
        {assembly ? (
          <>
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
                {isInactive && (
                  <div className="mb-3 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <Icon name="TriangleAlert" className="h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-[12px] font-medium text-amber-800">{i.desactive.titre} — {i.desactive.desc}</p>
                  </div>
                )}
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
                            disabled={isPending || isInactive}
                            onClick={() => {
                              if (!profileId) return;
                              setChoice((c) => ({ ...c, [v.id]: o }));
                              setToast(true);
                              startTransition(() => {
                                castVote({ assemblyId: assembly.id, voteId: v.id, profileId, choice: o });
                              });
                            }}
                            className={`tap flex w-full items-center justify-between rounded-2xl border p-3 ${active ? "border-palier-500 bg-palier-50" : "border-black/5 bg-white"} ${isPending || isInactive ? "cursor-not-allowed opacity-50" : ""}`}
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
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-2xl bg-palier-50 p-3.5">
              <Icon name="CalendarDays" className="h-5 w-5 shrink-0 text-palier-600" />
              <p className="text-[12.5px] font-medium text-palier-800">{T.infoVide}</p>
            </div>
            {pastAssemblies.length === 0 && (
              <div className="card flex items-center gap-3 p-4">
                <Icon name="CalendarX" className="h-5 w-5 text-ink-faint" />
                <p className="text-[13px] text-ink-soft">{T.aucune}</p>
              </div>
            )}
          </>
        )}

        {/* ═══ Past assemblies history ═══ */}
        {pastAssemblies.length > 0 && (
          <div>
            <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">{T.historique}</h2>
            <div className="space-y-2">
              {pastAssemblies.map((ag) => (
                <div key={ag.id} className="card flex items-center gap-3 p-3.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0e4fb]">
                    <Icon name="Vote" className="h-5 w-5 text-[#7a4ea8]" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-ink">{T.agOrdinaire} {building.name}</p>
                    <p className="text-[12px] text-ink-soft">{shortDate(ag.date, lang)} · {ag.place}</p>
                  </div>
                  {ag.pvUrl && (
                    <a href={ag.pvUrl} target="_blank" rel="noopener noreferrer" className="tap flex items-center gap-1.5 rounded-full bg-palier-50 px-3 py-1.5 text-[11px] font-semibold text-palier-700">
                      <Icon name="Download" className="h-3.5 w-3.5" /> {T.telechargerPV}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Toast open={toast} onClose={() => setToast(false)} title={T.voteEnregistre} body={T.voteBody} />
    </div>
  );
}
