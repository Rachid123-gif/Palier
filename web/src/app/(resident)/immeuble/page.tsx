"use client";
import { useState } from "react";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { NotificationsBell } from "@/components/resident/NotificationsBell";
import { Icon } from "@/components/ui/Icon";
import { mad, num, shortDate } from "@/lib/format";
import { Sheet } from "@/components/ui/Sheet";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";

const LEDGER_LIMIT = 3;

export default function ImmeubleScreen() {
  const { building, buildingKpis, ledger, incidents, gardien, welcomeMessage, insurancePolicies, mandate, coproprieteRule, budgetSummary, urgentWorks } = useData();
  const { lang, i, isAr } = useLang();
  const T = i.immeuble;
  const [ledgerCount, setLedgerCount] = useState(LEDGER_LIMIT);

  const openIncidents = incidents.filter((inc) => inc.status !== "resolved");
  const [statsPeriod, setStatsPeriod] = useState<"mois" | "3mois" | "6mois" | "tout">("tout");
  const [movPeriod, setMovPeriod] = useState<"mois" | "3mois" | "6mois" | "tout" | "custom">("tout");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodMonth, setPeriodMonth] = useState<string>("");
  const [periodYear, setPeriodYear] = useState<string>("");

  const now = new Date();
  function filterByPeriod(entries: typeof ledger, p: string) {
    if (p === "tout") return entries;
    if (p === "custom") {
      return entries.filter((l) => {
        const d = new Date(l.date);
        const matchYear = !periodYear || d.getFullYear().toString() === periodYear;
        const matchMonth = !periodMonth || d.getMonth().toString() === periodMonth;
        return matchYear && matchMonth;
      });
    }
    return entries.filter((l) => {
      const d = new Date(l.date);
      if (p === "mois") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      const ago = new Date(now);
      ago.setMonth(ago.getMonth() - (p === "3mois" ? 3 : 6));
      return d >= ago;
    });
  }

  const years = [...new Set(ledger.map((l) => new Date(l.date).getFullYear().toString()))].sort().reverse();

  const customLabel = movPeriod === "custom"
    ? [periodMonth ? i.months[parseInt(periodMonth)] : "", periodYear].filter(Boolean).join(" ") || T.periode
    : T.periode;

  const statsLedger = filterByPeriod(ledger, statsPeriod);
  const periodIn = statsLedger.filter((l) => l.type === "in").reduce((s, l) => s + l.amount, 0);
  const periodOut = statsLedger.filter((l) => l.type === "out").reduce((s, l) => s + l.amount, 0);
  const filteredLedger = filterByPeriod(ledger, movPeriod);

  const periodFilters = [
    { key: "tout" as const, label: T.tout },
    { key: "mois" as const, label: T.ceMois },
    { key: "3mois" as const, label: T.troisMois },
    { key: "6mois" as const, label: T.sixMois },
  ];

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />

      <header className="flex items-start justify-between px-5 pb-2 pt-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-palier-100">
            <Icon name="Building2" className="h-6 w-6 text-palier-600" />
          </span>
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-ink">{building.name}</h1>
            <p className="text-[13px] text-ink-soft">{building.address} · {building.lots} {i.home.lots}</p>
          </div>
        </div>
        <NotificationsBell />
      </header>

      <div className="space-y-5 px-4 pt-1">

        {/* ═══════ Transparence financière ═══════ */}
        <div className="flex items-center gap-2 px-1">
          <Icon name="ShieldCheck" className="h-5 w-5 text-palier-600" />
          <h2 className="text-[17px] font-bold tracking-tight text-ink">{T.transparenceFinanciere}</h2>
        </div>

        <div className="bg-hero relative overflow-hidden rounded-3xl p-5 text-white shadow-hero">
          <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative">
            <p className="text-[13px] font-medium text-white/70">{T.soldeCaisse}</p>
            <div className="mt-2">
              <span className="inline-flex items-end gap-1.5" dir="ltr">
                <span className="text-[40px] font-bold leading-none tracking-tight">
                  {buildingKpis.balance < 0 && "−"}{num(Math.abs(buildingKpis.balance), false)}
                </span>
                <span className="mb-1.5 text-sm font-semibold text-white/70">MAD</span>
              </span>
            </div>
            {buildingKpis.balance < 0 && (
              <p className="mt-1 text-[13px] font-medium text-white/80">{T.coproEnDeficit}</p>
            )}
          </div>
        </div>

        <div className="card space-y-4 p-4">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {periodFilters.map((f) => (
              <button key={f.key} onClick={() => setStatsPeriod(f.key)}
                className={`tap shrink-0 rounded-full px-3.5 py-2 text-[12px] font-semibold ${statsPeriod === f.key ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-black/5 bg-white p-3">
              <p className="text-[11px] font-medium text-ink-faint">{T.encaisse}</p>
              <p className="mt-1 text-[17px] font-bold text-success" dir="ltr">+{num(periodIn, false)}</p>
              <p className="text-[10px] text-ink-faint">MAD</p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white p-3">
              <p className="text-[11px] font-medium text-ink-faint">{T.depense}</p>
              <p className="mt-1 text-[17px] font-bold text-ink" dir="ltr">−{num(periodOut, false)}</p>
              <p className="text-[10px] text-ink-faint">MAD</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-ink-soft">{T.chargesPayees}</span>
              <span className="font-bold text-ink">{Math.max(0, Math.min(100, buildingKpis.paymentRate))}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand">
              <div className="h-full rounded-full bg-success" style={{ width: `${Math.max(0, Math.min(100, buildingKpis.paymentRate))}%` }} />
            </div>
          </div>
        </div>

        {/* ═══════ Incidents, AG, Documents ═══════ */}
        <div className="space-y-2">
          <Link href="/immeuble/signaler" className="tap card flex items-center gap-3 p-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-soft">
              <Icon name="Wrench" className="h-5 w-5 text-danger" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-ink">{T.incidents}</p>
              {openIncidents.length > 0 ? (
                <p className="text-[12px] font-medium text-danger">{T.signalementsEnCours(openIncidents.length)}</p>
              ) : (
                <p className="text-[12px] text-ink-faint">{T.aucunProbleme}</p>
              )}
            </div>
            <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-4 w-4 text-ink-faint" />
          </Link>
          <Link href="/immeuble/ag" className="tap card flex items-center gap-3 p-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0e4fb]">
              <Icon name="Vote" className="h-5 w-5 text-[#7a4ea8]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-ink">{T.ag}</p>
              <p className="text-[12px] text-ink-faint">{T.agSub}</p>
            </div>
            <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-4 w-4 text-ink-faint" />
          </Link>
          <Link href="/immeuble/documents" className="tap card flex items-center gap-3 p-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-soft">
              <Icon name="FolderOpen" className="h-5 w-5 text-warning" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-ink">{T.documents}</p>
              <p className="text-[12px] text-ink-faint">{T.documentsSub}</p>
            </div>
            <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-4 w-4 text-ink-faint" />
          </Link>
        </div>

        <hr className="border-palier-100" />

        {/* ═══════ Mouvements ═══════ */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[17px] font-bold tracking-tight text-ink">{T.mouvements}</h2>
            <p className="text-[12px] text-ink-faint">{T.operations(filteredLedger.length)}</p>
          </div>

          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
            {periodFilters.map((f) => (
              <button key={f.key} onClick={() => { setMovPeriod(f.key); setLedgerCount(LEDGER_LIMIT); }}
                className={`tap shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold ${movPeriod === f.key ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}>
                {f.label}
              </button>
            ))}
            <button onClick={() => setPeriodOpen(true)}
              className={`tap flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold ${movPeriod === "custom" ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}>
              <Icon name="CalendarDays" className="h-3.5 w-3.5" />
              {customLabel}
            </button>
          </div>

          {filteredLedger.length > 0 ? (
            <div className="space-y-2">
              {filteredLedger.slice(0, ledgerCount).map((l) => (
                <div key={l.id} className="card flex items-center gap-3 p-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full ${l.type === "in" ? "bg-success-soft" : "bg-sand"}`}>
                    <Icon name={l.type === "in" ? "ArrowDownLeft" : "ArrowUpRight"} className={`h-4 w-4 ${l.type === "in" ? "text-success" : "text-ink-soft"}`} strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{l.label}</p>
                    <p className="text-[11px] text-ink-faint">{shortDate(l.date, lang)} · {l.category}</p>
                  </div>
                  <p className={`text-[13px] font-bold ${l.type === "in" ? "text-success" : "text-ink"}`} dir="ltr">
                    {l.type === "in" ? "+" : "−"}{num(l.amount, false)} <span className="text-[10px] font-semibold text-ink-faint">MAD</span>
                  </p>
                </div>
              ))}

              {filteredLedger.length > ledgerCount && (
                <button onClick={() => setLedgerCount(filteredLedger.length)}
                  className="tap flex w-full items-center justify-center gap-1.5 rounded-full border border-palier-100 bg-white py-2.5 text-[13px] font-semibold text-palier-700">
                  {T.voirPlus(filteredLedger.length - ledgerCount)}
                  <Icon name="ChevronDown" className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="card flex items-center gap-3 p-4">
              <Icon name="Clock" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">{T.aucunMouvement}</p>
            </div>
          )}
        </div>

        {building.syndic && (
          <div className="card flex items-center gap-3 p-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-palier-600 text-sm font-bold text-white">
              {building.syndic.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-ink-faint">{T.syndic}</p>
              <p className="text-sm font-bold text-ink">{building.syndic}</p>
            </div>
          </div>
        )}

        {/* ═══════ Infos immeuble (gardien, assurance, etc.) ═══════ */}
        {(gardien || welcomeMessage || insurancePolicies.length > 0 || mandate || coproprieteRule || budgetSummary || urgentWorks.length > 0) && (
          <>
            <hr className="border-palier-100" />

            {welcomeMessage && (
              <div className="flex items-start gap-3 rounded-2xl bg-palier-50 p-4">
                <Icon name="Info" className="mt-0.5 h-5 w-5 shrink-0 text-palier-600" />
                <p className="text-[13px] leading-snug text-palier-800">{welcomeMessage}</p>
              </div>
            )}

            {gardien && (
              <div className="card space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <Icon name="UserCheck" className="h-4 w-4 text-palier-600" />
                  <h3 className="text-[14px] font-bold text-ink">{T.gardien}</h3>
                </div>
                <p className="text-[13px] font-semibold text-ink">{gardien.name}</p>
                {gardien.phone && (
                  <a href={`tel:${gardien.phone}`} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-palier-600">
                    <Icon name="Phone" className="h-3.5 w-3.5" /> {gardien.phone}
                  </a>
                )}
                {gardien.horaires && Object.keys(gardien.horaires).length > 0 && (
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{T.horaires}</p>
                    <div className="space-y-0.5">
                      {Object.entries(gardien.horaires).map(([day, h]) => (
                        <div key={day} className="flex items-center justify-between text-[12px]">
                          <span className="text-ink-soft capitalize">{day}</span>
                          <span className="font-medium text-ink">{h.repos ? T.repos : `${h.de} – ${h.a}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {gardien.taches && gardien.taches.length > 0 && (
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{T.taches}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {gardien.taches.map((t) => (
                        <span key={t} className="rounded-full bg-palier-50 px-2.5 py-1 text-[11px] font-medium text-palier-700">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {insurancePolicies.length > 0 && (
              <div className="card space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <Icon name="Shield" className="h-4 w-4 text-palier-600" />
                  <h3 className="text-[14px] font-bold text-ink">{T.assurance}</h3>
                </div>
                {insurancePolicies.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[13px]">
                    <div>
                      <p className="font-medium text-ink">{p.insurer}</p>
                      <p className="text-[11px] text-ink-faint">{p.coverageType}</p>
                    </div>
                    <p className="text-[11px] text-ink-soft">{T.jusquAu} {shortDate(p.endDate, lang)}</p>
                  </div>
                ))}
              </div>
            )}

            {coproprieteRule && (
              <div className="card space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <Icon name="Scale" className="h-4 w-4 text-palier-600" />
                  <h3 className="text-[14px] font-bold text-ink">{T.reglement}</h3>
                </div>
                <p className="text-[13px] font-medium text-ink">{coproprieteRule.title}</p>
                {coproprieteRule.adoptedAt && (
                  <p className="text-[11px] text-ink-faint">{T.adopte} {shortDate(coproprieteRule.adoptedAt, lang)}</p>
                )}
                {coproprieteRule.fileUrl && (
                  <a href={coproprieteRule.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-palier-600">
                    <Icon name="ExternalLink" className="h-3.5 w-3.5" /> {T.voirDocument}
                  </a>
                )}
              </div>
            )}

            {mandate && (
              <div className="card space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <Icon name="Award" className="h-4 w-4 text-palier-600" />
                  <h3 className="text-[14px] font-bold text-ink">{T.mandatSyndic}</h3>
                </div>
                <p className="text-[13px] font-medium text-ink">{mandate.syndicName}</p>
                <div className="flex gap-4 text-[11px] text-ink-soft">
                  <span>{T.elu} {shortDate(mandate.electedAt, lang)}</span>
                  <span>{T.echeance} {shortDate(mandate.mandateEnd, lang)}</span>
                </div>
              </div>
            )}

            {budgetSummary && (
              <div className="card space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="Calculator" className="h-4 w-4 text-palier-600" />
                    <h3 className="text-[14px] font-bold text-ink">{T.budget} {budgetSummary.fiscalYear}</h3>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{T.budgetApprouve}</span>
                </div>
                <p className="text-[20px] font-bold text-ink" dir="ltr">{num(budgetSummary.totalAmount, false)} <span className="text-[12px] font-semibold text-ink-faint">MAD</span></p>
                {budgetSummary.lines.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{T.depenses}</p>
                    <div className="space-y-1.5">
                      {budgetSummary.lines.slice(0, 5).map((l, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[12px]">
                          <span className="text-ink-soft">{l.label}</span>
                          <div className="flex gap-3">
                            <span className="text-ink-faint">{T.prevu}: {num(l.amountBudgeted, false)}</span>
                            <span className="font-medium text-ink">{T.reel}: {num(l.amountActual, false)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {urgentWorks.length > 0 && (
              <div className="card space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <Icon name="Hammer" className="h-4 w-4 text-palier-600" />
                  <h3 className="text-[14px] font-bold text-ink">{T.travauxUrgents}</h3>
                </div>
                {urgentWorks.map((w) => {
                  const statusCls = w.status === "completed" ? "bg-emerald-50 text-emerald-700"
                    : w.status === "in_progress" ? "bg-amber-50 text-amber-700"
                    : w.status === "approved" ? "bg-blue-50 text-blue-700"
                    : "bg-red-50 text-red-700";
                  const statusLabel = w.status === "completed" ? T.travauxTermine
                    : w.status === "in_progress" ? T.travauxEnCours
                    : w.status === "approved" ? T.travauxApprouve
                    : T.travauxDeclare;
                  return (
                    <div key={w.id} className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink">{w.title}</p>
                        {w.description && <p className="mt-0.5 text-[11px] text-ink-faint">{w.description}</p>}
                        {w.estimatedCost != null && <p className="mt-0.5 text-[11px] text-ink-soft" dir="ltr">~{num(w.estimatedCost, false)} MAD</p>}
                      </div>
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusCls}`}>{statusLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <p className="px-1 text-center text-[11px] text-ink-faint">{T.opsSignees}</p>

        <div className="h-4" />
      </div>

      <Sheet open={periodOpen} onClose={() => setPeriodOpen(false)} title={T.filtrerPeriode}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink-soft">{T.moisLabel}</p>
            <div className="grid grid-cols-3 gap-2">
              {i.months.map((m, idx) => (
                <button key={m} onClick={() => setPeriodMonth(periodMonth === idx.toString() ? "" : idx.toString())}
                  className={`tap rounded-xl py-2.5 text-[13px] font-semibold ${periodMonth === idx.toString() ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}>
                  {m.slice(0, 4)}.
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink-soft">{T.anneeLabel}</p>
            <div className="flex gap-2">
              {years.map((y) => (
                <button key={y} onClick={() => setPeriodYear(periodYear === y ? "" : y)}
                  className={`tap rounded-xl px-5 py-2.5 text-[13px] font-semibold ${periodYear === y ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}>
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setPeriodMonth(""); setPeriodYear(""); setMovPeriod("tout"); setPeriodOpen(false); }}
              className="tap flex-1 rounded-full border border-palier-100 bg-white py-3 text-[13px] font-semibold text-ink-soft">{T.reinitialiser}</button>
            <button onClick={() => { setMovPeriod("custom"); setLedgerCount(LEDGER_LIMIT); setPeriodOpen(false); }}
              className="tap flex-1 rounded-full bg-palier-600 py-3 text-[13px] font-semibold text-white">{T.appliquer}</button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
