"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { resolveIncident } from "@/lib/actions";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { timeAgo, shortDate } from "@/lib/format";

/* ── Types ── */

type Inc = {
  id: string;
  title: string;
  details: string;
  category: string;
  urgency: string;
  status: string;
  reporter_name: string;
  unit_id: string;
  created_at: string;
  messages_count: number;
};

/* ── Constants ── */

const catIcons: Record<string, string> = {
  ascenseur: "ArrowUpDown", fuite: "Droplets", electricite: "Zap", securite: "ShieldAlert",
  proprete: "Trash2", nuisibles: "Bug", nuisance: "Volume2", parking: "Car",
  communes: "Building", jardinier: "Leaf", autre: "CircleEllipsis",
};

const catLabels: Record<string, string> = {
  ascenseur: "Ascenseur", fuite: "Fuite d'eau", electricite: "Électricité", securite: "Sécurité",
  proprete: "Propreté", nuisibles: "Nuisibles", nuisance: "Nuisance sonore", parking: "Parking",
  communes: "Parties communes", jardinier: "Jardin", autre: "Autre",
};

const urgencyLabels: Record<string, string> = { low: "Faible", normal: "Normal", urgent: "Urgent", high: "Urgent" };
const urgencyColors: Record<string, { bg: string; text: string; dot: string }> = {
  low: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
  normal: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  urgent: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  high: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const statusTabs: { key: "all" | "open" | "resolved"; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "open", label: "Non résolus" },
  { key: "resolved", label: "Résolus" },
];

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const PER_PAGE = 15;

/* ── Main ── */

export function IncidentsBoard({ incidents, openCount }: { incidents: Inc[]; openCount: number }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  // Period filter
  const [periodFilter, setPeriodFilter] = useState<"tout" | "mois" | "3mois" | "6mois" | "custom">("tout");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodMonth, setPeriodMonth] = useState("");
  const [periodYear, setPeriodYear] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Detail modal
  const [selected, setSelected] = useState<Inc | null>(null);

  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);
  const handleResolve = useCallback(async (id: string) => { await resolveIncident(id); flash("Incident marqué comme résolu"); router.refresh(); }, [router, flash]);

  // Years present in data
  const years = useMemo(() => {
    return [...new Set(incidents.map((i) => new Date(i.created_at).getFullYear().toString()))].sort().reverse();
  }, [incidents]);

  const customLabel = periodFilter === "custom"
    ? [periodMonth ? MONTHS[parseInt(periodMonth)]?.slice(0, 4) + "." : "", periodYear].filter(Boolean).join(" ") || "Période"
    : "Période";

  // Period-filtered (for KPIs)
  const periodFiltered = useMemo(() => {
    const now = new Date();
    let rows = [...incidents];
    if (periodFilter === "custom") {
      rows = rows.filter((i) => {
        const d = new Date(i.created_at);
        const matchYear = !periodYear || d.getFullYear().toString() === periodYear;
        const matchMonth = !periodMonth || d.getMonth().toString() === periodMonth;
        return matchYear && matchMonth;
      });
    } else if (periodFilter !== "tout") {
      const ago = new Date(now);
      if (periodFilter === "mois") ago.setMonth(ago.getMonth() - 1);
      else if (periodFilter === "3mois") ago.setMonth(ago.getMonth() - 3);
      else ago.setMonth(ago.getMonth() - 6);
      rows = rows.filter((i) => new Date(i.created_at) >= ago);
    }
    return rows;
  }, [incidents, periodFilter, periodMonth, periodYear]);

  // KPIs (follow period)
  const nonResolved = periodFiltered.filter((i) => i.status !== "resolved").length;
  const resolvedInc = periodFiltered.filter((i) => i.status === "resolved").length;
  const urgentOpen = periodFiltered.filter((i) => i.status !== "resolved" && (i.urgency === "urgent" || i.urgency === "high")).length;

  // Categories present in data
  const usedCategories = useMemo(() => {
    const cats = new Set(incidents.map((i) => i.category).filter(Boolean));
    return [...cats].sort();
  }, [incidents]);

  // Full filtering (period + status + urgency + category + search)
  const filtered = useMemo(() => {
    let rows = [...periodFiltered];
    if (statusFilter === "open") rows = rows.filter((i) => i.status !== "resolved");
    else if (statusFilter === "resolved") rows = rows.filter((i) => i.status === "resolved");
    if (urgencyFilter !== "all") rows = rows.filter((i) => i.urgency === urgencyFilter);
    if (catFilter !== "all") rows = rows.filter((i) => i.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((i) => i.title.toLowerCase().includes(q) || i.details?.toLowerCase().includes(q) || i.reporter_name?.toLowerCase().includes(q));
    }
    return rows.sort((a, b) => {
      const sa = a.status === "resolved" ? 1 : 0;
      const sb = b.status === "resolved" ? 1 : 0;
      if (sa !== sb) return sa - sb;
      const urgOrder: Record<string, number> = { urgent: 0, high: 0, normal: 1, low: 2 };
      const ua = urgOrder[a.urgency] ?? 2;
      const ub = urgOrder[b.urgency] ?? 2;
      if (ua !== ub) return ua - ub;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [periodFiltered, statusFilter, urgencyFilter, catFilter, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages - 1);
  const rows = filtered.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  function resetFilters() { setStatusFilter("all"); setUrgencyFilter("all"); setCatFilter("all"); setSearch(""); setPeriodFilter("tout"); setPeriodMonth(""); setPeriodYear(""); setPage(0); }

  function exportCSV() {
    const header = "Date,Titre,Catégorie,Urgence,Statut,Signalé par";
    const csvRows = filtered.map((i) =>
      `${i.created_at.split("T")[0]},"${i.title.replace(/"/g, '""')}",${catLabels[i.category] ?? i.category},${urgencyLabels[i.urgency] ?? i.urgency},${i.status === "resolved" ? "Résolu" : "Ouvert"},"${(i.reporter_name ?? "").replace(/"/g, '""')}"`
    );
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `palier-incidents-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    flash("Export CSV téléchargé");
  }

  return (
    <div>
      <PageHeader
        title="Incidents"
        subtitle={`${incidents.length} signalements · ${openCount} non résolus`}
        action={
          <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-sand/50">
            <Icon name="Download" className="h-3.5 w-3.5" /> Exporter
          </button>
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">
          Les résidents signalent les incidents depuis leur application. Lorsque vous résolvez un incident ici, le statut est mis à jour dans l&apos;application du résident.
        </p>
      </div>

      {/* Period filters */}
      <div className="mb-4 flex items-center gap-3 border-b border-black/[0.06]">
        {([["tout", "Tout"], ["mois", "Ce mois"], ["3mois", "3 mois"], ["6mois", "6 mois"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setPeriodFilter(key); setPeriodMonth(""); setPeriodYear(""); setPage(0); }}
            className={`relative pb-2.5 text-[13px] font-semibold transition-colors ${periodFilter === key ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
          >
            {label}
            {periodFilter === key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
          </button>
        ))}
        <button
          onClick={() => setPeriodOpen(true)}
          className={`relative flex items-center gap-1.5 pb-2.5 text-[13px] font-semibold transition-colors ${periodFilter === "custom" ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
        >
          <Icon name="CalendarDays" className="h-3.5 w-3.5" />
          {customLabel}
          {periodFilter === "custom" && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Non résolus</p>
          <p className="text-[28px] font-bold leading-none text-ink">{nonResolved}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Résolus</p>
          <p className="text-[28px] font-bold leading-none text-ink">{resolvedInc}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Urgents</p>
          <p className="text-[28px] font-bold leading-none text-ink">{urgentOpen}</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="mb-3 flex items-center gap-3 border-b border-black/[0.06]">
        {statusTabs.map((tab) => {
          const count = tab.key === "all"
            ? periodFiltered.length
            : tab.key === "open"
              ? periodFiltered.filter((i) => i.status !== "resolved").length
              : periodFiltered.filter((i) => i.status === "resolved").length;
          return (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(0); }}
              className={`relative pb-2.5 text-[13px] font-semibold transition-colors ${statusFilter === tab.key ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
            >
              {tab.label}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${statusFilter === tab.key ? "bg-palier-50 text-palier-700" : "text-ink-faint"}`}>{count}</span>
              {statusFilter === tab.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Rechercher par titre, détails ou signaleur…"
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(0); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
              <Icon name="X" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={urgencyFilter}
          onChange={(e) => { setUrgencyFilter(e.target.value); setPage(0); }}
          className="h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
        >
          <option value="all">Toutes urgences</option>
          <option value="urgent">Urgent</option>
          <option value="normal">Normal</option>
          <option value="low">Faible</option>
        </select>
        {usedCategories.length > 1 && (
          <select
            value={catFilter}
            onChange={(e) => { setCatFilter(e.target.value); setPage(0); }}
            className="h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          >
            <option value="all">Toutes catégories</option>
            {usedCategories.map((c) => <option key={c} value={c}>{catLabels[c] ?? c}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="Search" className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-2 text-[13px] text-ink-soft">Aucun incident trouvé</p>
            <button onClick={resetFilters} className="mt-1 text-[13px] font-medium text-palier-600">
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <table className="w-full table-fixed text-left text-[13px]">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="w-[40%] px-4 py-2.5">Incident</th>
                  <th className="w-[10%] px-4 py-2.5">Statut</th>
                  <th className="w-[14%] px-4 py-2.5">Signalé par</th>
                  <th className="w-[10%] px-4 py-2.5">Date</th>
                  <th className="w-[26%] px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {rows.map((inc) => {
                  const urg = urgencyColors[inc.urgency] ?? urgencyColors.normal;
                  const isResolved = inc.status === "resolved";
                  return (
                    <tr key={inc.id} className={`transition-colors hover:bg-sand/50 ${isResolved ? "opacity-60" : ""}`}>
                      <td className="overflow-hidden px-4 py-2.5">
                        <button onClick={() => setSelected(inc)} className="block w-full text-left">
                          <p className="truncate font-medium text-ink hover:text-palier-700 hover:underline">{inc.title}</p>
                          <p className="mt-0.5 truncate text-[11px] text-ink-soft">{catLabels[inc.category] ?? inc.category}{inc.details ? ` · ${inc.details}` : ""}</p>
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        {isResolved ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <Icon name="Check" className="h-3 w-3" />
                            Résolu
                          </span>
                        ) : (
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${urg.bg} ${urg.text}`}>
                            {urgencyLabels[inc.urgency] ?? inc.urgency}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-ink-soft">{inc.reporter_name}</td>
                      <td className="px-4 py-2.5 text-[12px] text-ink-soft">{shortDate(inc.created_at)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setSelected(inc)} className="rounded-md px-2 py-1 text-[11px] font-semibold text-ink-soft transition-colors hover:bg-palier-50 hover:text-palier-700">
                            Détails
                          </button>
                          {!isResolved && (
                            <ResolveBtn id={inc.id} onResolve={handleResolve} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-black/[0.06] px-4 py-2.5 text-[12px] text-ink-soft">
              <span>{safePage * PER_PAGE + 1}–{Math.min((safePage + 1) * PER_PAGE, filtered.length)} sur {filtered.length}</span>
              {pages > 1 && (
                <div className="flex gap-1">
                  <button onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0} className="rounded-md px-2 py-1 hover:bg-palier-50 disabled:opacity-30">
                    <Icon name="ChevronLeft" className="h-3.5 w-3.5" />
                  </button>
                  {Array.from({ length: pages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i)} className={`rounded-md px-2 py-1 font-medium ${i === safePage ? "bg-palier-50 text-palier-700" : "text-ink-soft hover:bg-palier-50"}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage(Math.min(pages - 1, safePage + 1))} disabled={safePage >= pages - 1} className="rounded-md px-2 py-1 hover:bg-palier-50 disabled:opacity-30">
                    <Icon name="ChevronRight" className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Detail modal ── */}
      {selected && (
        <DetailModal
          incident={selected}
          onClose={() => setSelected(null)}
          onResolve={handleResolve}
        />
      )}

      {/* ── Custom period modal ── */}
      {periodOpen && (
        <Overlay onClose={() => setPeriodOpen(false)}>
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                <Icon name="CalendarDays" className="h-5 w-5 text-palier-600" />
              </span>
              <div>
                <h2 className="text-[16px] font-semibold text-ink">Filtrer par période</h2>
                <p className="text-[12px] text-ink-soft">Sélectionnez un mois et/ou une année</p>
              </div>
            </div>
            <button onClick={() => setPeriodOpen(false)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
              <Icon name="X" className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[12px] font-semibold text-ink">Mois</p>
              <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((m, idx) => (
                  <button
                    key={m}
                    onClick={() => setPeriodMonth(periodMonth === idx.toString() ? "" : idx.toString())}
                    className={`rounded-xl py-2.5 text-[13px] font-semibold transition-colors ${periodMonth === idx.toString() ? "bg-palier-600 text-white" : "border border-black/[0.08] bg-white text-ink hover:bg-sand/50"}`}
                  >
                    {m.slice(0, 4)}.
                  </button>
                ))}
              </div>
            </div>

            {years.length > 0 && (
              <div>
                <p className="mb-2 text-[12px] font-semibold text-ink">Année</p>
                <div className="flex flex-wrap gap-2">
                  {years.map((y) => (
                    <button
                      key={y}
                      onClick={() => setPeriodYear(periodYear === y ? "" : y)}
                      className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors ${periodYear === y ? "bg-palier-600 text-white" : "border border-black/[0.08] bg-white text-ink hover:bg-sand/50"}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setPeriodMonth(""); setPeriodYear(""); setPeriodFilter("tout"); setPeriodOpen(false); setPage(0); }}
                className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => { setPeriodFilter("custom"); setPeriodOpen(false); setPage(0); }}
                className="flex-1 rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700"
              >
                Appliquer
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Toast */}
      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-[rise_0.25s_ease] rounded-lg bg-palier-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">{toast}</div>}
    </div>
  );
}

/* ── Sub-components ── */

function ResolveBtn({ id, onResolve }: { id: string; onResolve: (id: string) => void }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => onResolve(id))}
      className="rounded-md bg-palier-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-palier-700 disabled:opacity-50"
    >
      {pending ? "…" : "Marquer résolu"}
    </button>
  );
}

function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function DetailModal({ incident, onClose, onResolve }: {
  incident: Inc; onClose: () => void; onResolve: (id: string) => void;
}) {
  const [rp, startR] = useTransition();
  const urg = urgencyColors[incident.urgency] ?? urgencyColors.normal;
  const isResolved = incident.status === "resolved";

  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold text-ink">{incident.title}</h2>
          <p className="mt-0.5 text-[12px] text-ink-soft">{catLabels[incident.category] ?? incident.category}</p>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
          <Icon name="X" className="h-4 w-4" />
        </button>
      </div>

      {/* Urgency badge */}
      <div className="mb-4 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${urg.bg} ${urg.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${urg.dot}`} />
          {urgencyLabels[incident.urgency] ?? incident.urgency}
        </span>
        {isResolved && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Résolu</span>}
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft">Description</p>
          <p className="text-[13px] leading-relaxed text-ink">{incident.details || "Aucun détail fourni."}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-black/10 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Signalé par</p>
            <p className="mt-1 text-[13px] font-medium text-ink">{incident.reporter_name}</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Date</p>
            <p className="mt-1 text-[13px] font-medium text-ink">{shortDate(incident.created_at)}</p>
            <p className="text-[11px] text-ink-soft">{timeAgo(incident.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isResolved && (
        <button
          disabled={rp}
          onClick={() => startR(async () => { await onResolve(incident.id); onClose(); })}
          className="mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          <Icon name="CircleCheck" className="h-4 w-4" />
          {rp ? "…" : "Marquer comme résolu"}
        </button>
      )}

      {isResolved && (
        <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
          <Icon name="CircleCheck" className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-[12px] font-medium text-emerald-800">Cet incident a été résolu</p>
        </div>
      )}
    </Overlay>
  );
}
