"use client";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/syndic/ui";
import { mad, num, timeAgo, currentPeriod, shortDate } from "@/lib/format";
import { sendRelance } from "@/lib/actions";
import type { RecouvrementRow } from "@/lib/syndic";

const statusTabs: { key: "all" | "late" | "due" | "partial" | "paid"; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "late", label: "En retard" },
  { key: "due", label: "À payer" },
  { key: "partial", label: "Partiels" },
  { key: "paid", label: "Payés" },
];

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const PER_PAGE = 15;

export function RecouvrementTable({ rows, building }: { rows: RecouvrementRow[]; building: string }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<"tout" | "mois" | "3mois" | "6mois" | "custom">("tout");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodMonth, setPeriodMonth] = useState("");
  const [periodYear, setPeriodYear] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "late" | "due" | "partial" | "paid">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  function relanceBody(r: RecouvrementRow) {
    const remaining = r.amount - r.paid;
    return `Votre cotisation de ${remaining.toLocaleString("fr-MA")} MAD pour ${currentPeriod()} à ${building} est en attente. Merci de régulariser votre situation.`;
  }

  async function relance(r: RecouvrementRow) {
    if (!r.profileId) return;
    await sendRelance({
      unitId: r.unitId,
      profileId: r.profileId,
      title: `Rappel de cotisation — ${currentPeriod()}`,
      body: relanceBody(r),
    });
    flash("Relance envoyée");
    router.refresh();
  }

  async function relanceAll() {
    const targets = filtered.filter((r) => r.status !== "paid" && r.profileId);
    if (targets.length === 0) return;
    setBusy(true);
    await Promise.all(targets.map((r) => sendRelance({
      unitId: r.unitId,
      profileId: r.profileId!,
      title: `Rappel de cotisation — ${currentPeriod()}`,
      body: relanceBody(r),
    })));
    setBusy(false);
    flash(`${targets.length} résidents relancés`);
    router.refresh();
  }

  // Years in data
  const years = useMemo(() => {
    const yrs = new Set(rows.filter((r) => r.dueDate).map((r) => new Date(r.dueDate!).getFullYear().toString()));
    return [...yrs].sort().reverse();
  }, [rows]);

  const customLabel = periodFilter === "custom"
    ? [periodMonth ? MONTHS[parseInt(periodMonth)]?.slice(0, 4) + "." : "", periodYear].filter(Boolean).join(" ") || "Période"
    : "Période";

  // Period filtered
  const periodFiltered = useMemo(() => {
    const now = new Date();
    let result = [...rows];
    if (periodFilter === "custom") {
      result = result.filter((r) => {
        if (!r.dueDate) return true;
        const d = new Date(r.dueDate);
        const matchYear = !periodYear || d.getFullYear().toString() === periodYear;
        const matchMonth = !periodMonth || d.getMonth().toString() === periodMonth;
        return matchYear && matchMonth;
      });
    } else if (periodFilter !== "tout") {
      const ago = new Date(now);
      if (periodFilter === "mois") ago.setMonth(ago.getMonth() - 1);
      else if (periodFilter === "3mois") ago.setMonth(ago.getMonth() - 3);
      else ago.setMonth(ago.getMonth() - 6);
      result = result.filter((r) => !r.dueDate || new Date(r.dueDate) >= ago);
    }
    return result;
  }, [rows, periodFilter, periodMonth, periodYear]);

  // KPIs (follow period)
  const totalDue = periodFiltered.reduce((s, r) => s + r.amount, 0);
  const totalPaid = periodFiltered.reduce((s, r) => s + r.paid, 0);
  const totalRemaining = totalDue - totalPaid;
  const rate = totalDue ? Math.round((totalPaid / totalDue) * 100) : 0;

  const statusCounts = useMemo(() => ({
    all: periodFiltered.length,
    late: periodFiltered.filter((r) => r.status === "late").length,
    due: periodFiltered.filter((r) => r.status === "due").length,
    partial: periodFiltered.filter((r) => r.status === "partial").length,
    paid: periodFiltered.filter((r) => r.status === "paid").length,
  }), [periodFiltered]);

  // Full filtering (period + status + search)
  const filtered = useMemo(() => {
    let result = [...periodFiltered];
    if (statusFilter !== "all") result = result.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.ownerName.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q) || r.phone.includes(q));
    }
    return result;
  }, [periodFiltered, statusFilter, search]);

  const unpaidFiltered = filtered.filter((r) => r.status !== "paid").length;
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages - 1);
  const pageRows = filtered.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  function exportCSV() {
    const header = "Lot,Résident,Rôle,Téléphone,Montant,Payé,Restant,Statut,Dernière relance";
    const csvRows = filtered.map((r) => {
      const statusLabel = r.status === "paid" ? "Payé" : r.status === "partial" ? "Partiel" : r.status === "late" ? "En retard" : "À payer";
      return `${r.ref},"${r.ownerName.replace(/"/g, '""')}",${r.role === "tenant" ? "Locataire" : "Propriétaire"},${r.phone},${r.amount},${r.paid},${r.amount - r.paid},${statusLabel},${r.lastDunnedAt ? r.lastDunnedAt.split("T")[0] : ""}`;
    });
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `palier-recouvrement-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    flash("Export CSV téléchargé");
  }

  function resetFilters() {
    setPeriodFilter("tout"); setPeriodMonth(""); setPeriodYear("");
    setStatusFilter("all"); setSearch(""); setPage(0);
  }

  return (
    <div>
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
      <div className="mb-4 grid grid-cols-4 gap-3">
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Total appelé</p>
          <p className="text-[22px] font-bold leading-none text-ink">{num(totalDue, false)}<span className="ml-1 text-[12px] font-medium text-ink-soft">MAD</span></p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Encaissé</p>
          <p className="text-[22px] font-bold leading-none text-ink">{num(totalPaid, false)}<span className="ml-1 text-[12px] font-medium text-ink-soft">MAD</span></p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Restant</p>
          <p className="text-[22px] font-bold leading-none text-ink">{num(totalRemaining, false)}<span className="ml-1 text-[12px] font-medium text-ink-soft">MAD</span></p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Taux de recouvrement</p>
          <p className="text-[22px] font-bold leading-none text-ink">{rate}%</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="mb-3 flex items-center gap-3 border-b border-black/[0.06]">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(0); }}
            className={`relative pb-2.5 text-[13px] font-semibold transition-colors ${statusFilter === tab.key ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
          >
            {tab.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${statusFilter === tab.key ? "bg-palier-50 text-palier-700" : "text-ink-faint"}`}>{statusCounts[tab.key]}</span>
            {statusFilter === tab.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Rechercher par nom, lot ou téléphone…"
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(0); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
              <Icon name="X" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-ink transition-colors hover:bg-sand/50">
          <Icon name="Download" className="h-3.5 w-3.5" /> Exporter
        </button>
        {unpaidFiltered > 0 && (
          <button
            onClick={relanceAll}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-palier-700 disabled:opacity-50"
          >
            <Icon name={busy ? "LoaderCircle" : "Send"} className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
            Relancer ({unpaidFiltered})
          </button>
        )}
      </div>

      {/* Info note */}
      <div className="mb-3 flex items-center gap-2 rounded-xl bg-palier-50 px-3.5 py-2.5">
        <Icon name="Info" className="h-4 w-4 shrink-0 text-palier-600" />
        <p className="text-[12px] text-palier-700">Relancer un résident lui enverra un rappel de paiement directement dans son application Palier.</p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="Search" className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-2 text-[13px] text-ink-soft">Aucun résultat</p>
            <button onClick={resetFilters} className="mt-1 text-[13px] font-medium text-palier-600">
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <table className="w-full table-fixed text-left text-[13px]">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="w-[9%] px-4 py-2.5">Lot</th>
                  <th className="w-[20%] px-4 py-2.5">Résident</th>
                  <th className="w-[15%] px-4 py-2.5">Montant</th>
                  <th className="w-[10%] px-4 py-2.5">Échéance</th>
                  <th className="w-[10%] px-4 py-2.5">Statut</th>
                  <th className="w-[13%] px-4 py-2.5">Dernière relance</th>
                  <th className="w-[23%] px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {pageRows.map((r) => {
                  const remaining = r.amount - r.paid;
                  const isPaid = r.status === "paid";
                  const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && !isPaid;
                  return (
                    <tr key={r.unitId} className={`transition-colors hover:bg-sand/50 ${isPaid ? "opacity-60" : ""}`}>
                      <td className="px-4 py-2.5 font-medium text-ink">{r.ref}</td>
                      <td className="overflow-hidden px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: r.avatarColor }}>
                            {r.ownerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-ink">{r.ownerName}</p>
                            <p className="text-[11px] text-ink-soft">{r.role === "tenant" ? "Locataire" : "Propriétaire"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-ink">{mad(r.amount, { decimals: false })}</p>
                        {r.status === "partial" && <p className="text-[11px] text-blue-600">{mad(remaining, { decimals: false })} restant</p>}
                      </td>
                      <td className={`px-4 py-2.5 text-[12px] ${isOverdue ? "font-semibold text-red-600" : "text-ink-soft"}`}>
                        {r.dueDate ? shortDate(r.dueDate) : "—"}
                      </td>
                      <td className="px-4 py-2.5"><StatusPill status={r.status} /></td>
                      <td className="px-4 py-2.5 text-[12px] text-ink-soft">{r.lastDunnedAt ? timeAgo(r.lastDunnedAt) : "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPaid ? (
                            <span className="text-[11px] font-medium text-ink-faint">À jour</span>
                          ) : (
                            <button
                              onClick={() => relance(r)}
                              disabled={!r.profileId}
                              className="rounded-md bg-palier-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-palier-700 disabled:opacity-40"
                            >
                              Relancer
                            </button>
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

      {/* Period picker modal */}
      {periodOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setPeriodOpen(false)}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-[rise_0.25s_ease] rounded-lg bg-palier-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">{toast}</div>}
    </div>
  );
}
