"use client";
import { useState } from "react";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { NotificationsBell } from "@/components/resident/NotificationsBell";
import { Icon } from "@/components/ui/Icon";
import { mad, num, shortDate } from "@/lib/format";
import { Sheet } from "@/components/ui/Sheet";
import { useData } from "@/lib/DataProvider";

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const LEDGER_LIMIT = 6;

export default function ImmeubleScreen() {
  const { building, buildingKpis, ledger, incidents } = useData();
  const [ledgerCount, setLedgerCount] = useState(LEDGER_LIMIT);

  const openIncidents = incidents.filter((i) => i.status !== "resolved");
  const [statsPeriod, setStatsPeriod] = useState<"mois" | "3mois" | "6mois" | "tout">("tout");
  const [movPeriod, setMovPeriod] = useState<"mois" | "3mois" | "6mois" | "tout" | "custom">("tout");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodMonth, setPeriodMonth] = useState<string>("");
  const [periodYear, setPeriodYear] = useState<string>("");

  const now = new Date();
  function filterByPeriod(entries: typeof ledger, p: string, custom = false) {
    if (p === "tout") return entries;
    if (p === "custom" || custom) {
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
    ? [periodMonth ? MONTHS[parseInt(periodMonth)] : "", periodYear].filter(Boolean).join(" ") || "Période"
    : "Période";

  const statsLedger = filterByPeriod(ledger, statsPeriod);
  const periodIn = statsLedger.filter((l) => l.type === "in").reduce((s, l) => s + l.amount, 0);
  const periodOut = statsLedger.filter((l) => l.type === "out").reduce((s, l) => s + l.amount, 0);

  const filteredLedger = filterByPeriod(ledger, movPeriod);

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />

      {/* Header */}
      <header className="flex items-start justify-between px-5 pb-2 pt-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-palier-100">
            <Icon name="Building2" className="h-6 w-6 text-palier-600" />
          </span>
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-ink">{building.name}</h1>
            <p className="text-[13px] text-ink-soft">{building.address} · {building.lots} lots</p>
          </div>
        </div>
        <NotificationsBell />
      </header>

      <div className="space-y-5 px-4 pt-1">

        {/* ═══════ Raccourcis ═══════ */}
        <div className="space-y-2">
          <Link href="/immeuble/signaler" className="tap card flex items-center gap-3 p-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-soft">
              <Icon name="Wrench" className="h-5 w-5 text-danger" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-ink">Incidents</p>
              {openIncidents.length > 0 ? (
                <p className="text-[12px] font-medium text-danger">{openIncidents.length} signalement{openIncidents.length > 1 ? "s" : ""} en cours</p>
              ) : (
                <p className="text-[12px] text-ink-faint">Aucun problème signalé</p>
              )}
            </div>
            <Icon name="ChevronRight" className="h-4 w-4 text-ink-faint" />
          </Link>
          <Link href="/immeuble/documents" className="tap card flex items-center gap-3 p-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-soft">
              <Icon name="FolderOpen" className="h-5 w-5 text-warning" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-ink">Documents</p>
              <p className="text-[12px] text-ink-faint">PV, contrats, règlement</p>
            </div>
            <Icon name="ChevronRight" className="h-4 w-4 text-ink-faint" />
          </Link>
          <Link href="/immeuble/ag" className="tap card flex items-center gap-3 p-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0e4fb]">
              <Icon name="Vote" className="h-5 w-5 text-[#7a4ea8]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-ink">Assemblée générale</p>
              <p className="text-[12px] text-ink-faint">Ordre du jour et votes</p>
            </div>
            <Icon name="ChevronRight" className="h-4 w-4 text-ink-faint" />
          </Link>
        </div>

        {/* ═══════ Transparence financière ═══════ */}
        <div className="flex items-center gap-2 px-1">
          <Icon name="ShieldCheck" className="h-5 w-5 text-palier-600" />
          <h2 className="text-[17px] font-bold tracking-tight text-ink">Transparence financière</h2>
        </div>

        {/* Solde principal */}
        <div className="bg-hero relative overflow-hidden rounded-3xl p-5 text-white shadow-hero">
          <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative">
            <p className="text-[13px] font-medium text-white/70">Solde de la caisse</p>
            <div className="mt-2 flex items-end gap-1.5">
              <span className="text-[40px] font-bold leading-none tracking-tight">
                {buildingKpis.balance < 0 && "−"}{num(Math.abs(buildingKpis.balance), false)}
              </span>
              <span className="mb-1.5 text-sm font-semibold text-white/70">MAD</span>
            </div>
            {buildingKpis.balance < 0 && (
              <p className="mt-1 text-[13px] font-medium text-white/80">La copropriété est en déficit</p>
            )}
          </div>
        </div>

        {/* ═══════ Résumé ═══════ */}
        <div className="card space-y-4 p-4">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {([
              { key: "tout", label: "Tout" },
              { key: "mois", label: "Ce mois" },
              { key: "3mois", label: "3 mois" },
              { key: "6mois", label: "6 mois" },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setStatsPeriod(f.key)}
                className={`tap shrink-0 rounded-full px-3.5 py-2 text-[12px] font-semibold ${
                  statsPeriod === f.key
                    ? "bg-palier-600 text-white"
                    : "border border-palier-100 bg-white text-ink-soft"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-black/5 bg-white p-3">
              <p className="text-[11px] font-medium text-ink-faint">Encaissé</p>
              <p className="mt-1 text-[17px] font-bold text-success">+{num(periodIn, false)}</p>
              <p className="text-[10px] text-ink-faint">MAD</p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white p-3">
              <p className="text-[11px] font-medium text-ink-faint">Dépensé</p>
              <p className="mt-1 text-[17px] font-bold text-ink">−{num(periodOut, false)}</p>
              <p className="text-[10px] text-ink-faint">MAD</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-ink-soft">Charges payées par les résidents</span>
              <span className="font-bold text-ink">{buildingKpis.paymentRate}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand">
              <div className="h-full rounded-full bg-success" style={{ width: `${buildingKpis.paymentRate}%` }} />
            </div>
          </div>
        </div>

        {/* ═══════ Mouvements ═══════ */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[17px] font-bold tracking-tight text-ink">Mouvements</h2>
            <p className="text-[12px] text-ink-faint">{filteredLedger.length} opération{filteredLedger.length > 1 ? "s" : ""}</p>
          </div>

          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
            {([
              { key: "tout", label: "Tout" },
              { key: "mois", label: "Ce mois" },
              { key: "3mois", label: "3 mois" },
              { key: "6mois", label: "6 mois" },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => { setMovPeriod(f.key); setLedgerCount(LEDGER_LIMIT); }}
                className={`tap shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold ${
                  movPeriod === f.key
                    ? "bg-palier-600 text-white"
                    : "border border-palier-100 bg-white text-ink-soft"
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => setPeriodOpen(true)}
              className={`tap flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold ${
                movPeriod === "custom"
                  ? "bg-palier-600 text-white"
                  : "border border-palier-100 bg-white text-ink-soft"
              }`}
            >
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
                    <p className="text-[11px] text-ink-faint">{shortDate(l.date)} · {l.category}</p>
                  </div>
                  <p className={`text-[13px] font-bold ${l.type === "in" ? "text-success" : "text-ink"}`}>
                    {l.type === "in" ? "+" : "−"}{num(l.amount, false)} <span className="text-[10px] font-semibold text-ink-faint">MAD</span>
                  </p>
                </div>
              ))}

              {filteredLedger.length > ledgerCount && (
                <button
                  onClick={() => setLedgerCount((v) => v + 6)}
                  className="tap flex w-full items-center justify-center gap-1.5 rounded-full border border-palier-100 bg-white py-2.5 text-[13px] font-semibold text-palier-700"
                >
                  Voir plus ({filteredLedger.length - ledgerCount} restant{filteredLedger.length - ledgerCount > 1 ? "s" : ""})
                  <Icon name="ChevronDown" className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="card flex items-center gap-3 p-4">
              <Icon name="Clock" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">Aucun mouvement sur cette période</p>
            </div>
          )}
        </div>

        {/* ═══════ Syndic ═══════ */}
        {building.syndic && (
          <div className="card flex items-center gap-3 p-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-palier-600 text-sm font-bold text-white">
              {building.syndic.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-ink-faint">Syndic</p>
              <p className="text-sm font-bold text-ink">{building.syndic}</p>
            </div>
          </div>
        )}

        <p className="px-1 text-center text-[11px] text-ink-faint">
          Toutes les opérations sont signées et horodatées.
        </p>

        <div className="h-4" />
      </div>

      {/* Sheet période */}
      <Sheet open={periodOpen} onClose={() => setPeriodOpen(false)} title="Filtrer par période">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink-soft">Mois</p>
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  onClick={() => setPeriodMonth(periodMonth === i.toString() ? "" : i.toString())}
                  className={`tap rounded-xl py-2.5 text-[13px] font-semibold ${
                    periodMonth === i.toString()
                      ? "bg-palier-600 text-white"
                      : "border border-palier-100 bg-white text-ink-soft"
                  }`}
                >
                  {m.slice(0, 4)}.
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink-soft">Année</p>
            <div className="flex gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setPeriodYear(periodYear === y ? "" : y)}
                  className={`tap rounded-xl px-5 py-2.5 text-[13px] font-semibold ${
                    periodYear === y
                      ? "bg-palier-600 text-white"
                      : "border border-palier-100 bg-white text-ink-soft"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setPeriodMonth(""); setPeriodYear(""); setMovPeriod("tout"); setPeriodOpen(false); }}
              className="tap flex-1 rounded-full border border-palier-100 bg-white py-3 text-[13px] font-semibold text-ink-soft"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => { setMovPeriod("custom"); setLedgerCount(LEDGER_LIMIT); setPeriodOpen(false); }}
              className="tap flex-1 rounded-full bg-palier-600 py-3 text-[13px] font-semibold text-white"
            >
              Appliquer
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
