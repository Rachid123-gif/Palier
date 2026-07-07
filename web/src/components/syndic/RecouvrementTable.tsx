"use client";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/syndic/ui";
import { mad, num, timeAgo, currentPeriod, shortDate } from "@/lib/format";
import { sendRelance, emitCharges, logDunning } from "@/lib/actions";
import { dunningMessage } from "@/lib/whatsapp";
import type { RecouvrementRow, ChargeCall } from "@/lib/syndic";

const statusTabs: { key: "all" | "late" | "due" | "partial" | "paid"; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "late", label: "En retard" },
  { key: "due", label: "À payer" },
  { key: "partial", label: "Partiels" },
  { key: "paid", label: "Payés" },
];

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const PER_PAGE = 15;

const DEFAULT_CHARGE_CATS = ["Charges courantes", "Travaux", "Fonds de réserve"];

export function RecouvrementTable({ rows, building, buildingId, chargeCalls, chargeCategories, relanceMessage }: { rows: RecouvrementRow[]; building: string; buildingId: string; chargeCalls: ChargeCall[]; chargeCategories?: string[] | null; relanceMessage?: string | null }) {
  const effectiveChargeCats = chargeCategories?.length ? chargeCategories : DEFAULT_CHARGE_CATS;
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Emit charges modal
  const [showEmit, setShowEmit] = useState(false);
  const [emitPending, setEmitPending] = useState(false);
  const [emitLabel, setEmitLabel] = useState("");
  const [emitDetail, setEmitDetail] = useState("");
  const [emitAmount, setEmitAmount] = useState("");
  const defaultCatValue = (effectiveChargeCats[0] ?? "courantes").toLowerCase().replace(/\s+/g, "_");
  const [emitCategory, setEmitCategory] = useState(defaultCatValue);
  const [emitDueDate, setEmitDueDate] = useState("");
  const [periodFilter, setPeriodFilter] = useState<"tout" | "mois" | "3mois" | "6mois" | "custom">("tout");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodMonth, setPeriodMonth] = useState("");
  const [periodYear, setPeriodYear] = useState("");
  const [view, setView] = useState<"suivi" | "historique">("suivi");
  const [statusFilter, setStatusFilter] = useState<"all" | "late" | "due" | "partial" | "paid">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  // Historique filters
  const [histSearch, setHistSearch] = useState("");
  const [histCat, setHistCat] = useState("all");
  const [histPeriod, setHistPeriod] = useState<"tout" | "mois" | "3mois" | "6mois" | "custom">("tout");
  const [histPeriodOpen, setHistPeriodOpen] = useState(false);
  const [histPeriodMonth, setHistPeriodMonth] = useState("");
  const [histPeriodYear, setHistPeriodYear] = useState("");

  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  function resetEmit() { setEmitLabel(""); setEmitDetail(""); setEmitAmount(""); setEmitCategory(defaultCatValue); setEmitDueDate(""); }

  async function handleEmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emitLabel || !emitAmount || !emitDueDate) return;
    setEmitPending(true);
    const res = await emitCharges({ buildingId, label: emitLabel, detail: emitDetail, amount: Number(emitAmount), category: emitCategory, dueDate: emitDueDate });
    setEmitPending(false);
    if (res?.error) { flash("Erreur lors de l'émission"); }
    else { flash(`Appel émis pour ${rows.length} lots`); setShowEmit(false); resetEmit(); router.refresh(); }
  }

  function relanceBody(r: RecouvrementRow) {
    if (relanceMessage) return relanceMessage;
    const remaining = r.amount - r.paid;
    return `Votre cotisation de ${remaining.toLocaleString("fr-MA")} MAD pour ${currentPeriod()} à ${building} est en attente. Merci de régulariser votre situation.`;
  }

  async function relance(r: RecouvrementRow) {
    if (!r.profileId) return;
    await sendRelance({
      buildingId,
      unitId: r.unitId,
      profileId: r.profileId,
      title: `Rappel de cotisation — ${currentPeriod()}`,
      body: relanceBody(r),
    });
    flash("Relance envoyée (in-app)");
    router.refresh();
  }

  async function relanceWhatsApp(r: RecouvrementRow) {
    if (!r.phone) return;
    const remaining = r.amount - r.paid;
    const msg = dunningMessage({
      name: r.ownerName.split(" ")[0],
      amount: remaining,
      period: currentPeriod(),
      building,
    });
    // Log the dunning in DB
    await logDunning({ buildingId, unitId: r.unitId, channel: "whatsapp", message: msg });
    // Open WhatsApp deeplink
    const digits = r.phone.replace(/[^0-9]/g, "");
    const waDigits = digits.startsWith("0") ? "212" + digits.slice(1) : digits;
    window.open(`https://wa.me/${waDigits}?text=${encodeURIComponent(msg)}`, "_blank");
    flash("WhatsApp ouvert");
    router.refresh();
  }

  async function relanceAll() {
    const targets = filtered.filter((r) => r.status !== "paid" && r.profileId);
    if (targets.length === 0) return;
    setBusy(true);
    await Promise.all(targets.map((r) => sendRelance({
      buildingId,
      unitId: r.unitId,
      profileId: r.profileId!,
      title: `Rappel de cotisation — ${currentPeriod()}`,
      body: relanceBody(r),
    })));
    setBusy(false);
    flash(`${targets.length} résidents relancés (in-app)`);
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
      {/* View toggle */}
      <div className="no-scrollbar mb-4 flex items-center gap-3 overflow-x-auto border-b border-black/[0.06]">
        {([["suivi", "Suivi des paiements"], ["historique", "Historique des appels"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`relative whitespace-nowrap pb-2.5 text-[13px] font-semibold transition-colors ${view === key ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
          >
            {label}
            {view === key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
          </button>
        ))}
      </div>

      {view === "suivi" ? (
      <>
      {/* Period filters */}
      <div className="no-scrollbar mb-4 flex items-center gap-3 overflow-x-auto border-b border-black/[0.06]">
        {([["tout", "Tout"], ["mois", "Ce mois"], ["3mois", "3 mois"], ["6mois", "6 mois"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setPeriodFilter(key); setPeriodMonth(""); setPeriodYear(""); setPage(0); }}
            className={`relative whitespace-nowrap pb-2.5 text-[13px] font-semibold transition-colors ${periodFilter === key ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
          >
            {label}
            {periodFilter === key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
          </button>
        ))}
        <button
          onClick={() => setPeriodOpen(true)}
          className={`relative flex whitespace-nowrap items-center gap-1.5 pb-2.5 text-[13px] font-semibold transition-colors ${periodFilter === "custom" ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
        >
          <Icon name="CalendarDays" className="h-3.5 w-3.5" />
          {customLabel}
          {periodFilter === "custom" && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
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
      <div className="no-scrollbar mb-3 flex items-center gap-3 overflow-x-auto border-b border-black/[0.06]">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(0); }}
            className={`relative whitespace-nowrap pb-2.5 text-[13px] font-semibold transition-colors ${statusFilter === tab.key ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
          >
            {tab.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${statusFilter === tab.key ? "bg-palier-50 text-palier-700" : "text-ink-faint"}`}>{statusCounts[tab.key]}</span>
            {statusFilter === tab.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-3 space-y-2">
        <div className="relative">
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
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <button onClick={() => setShowEmit(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-ink transition-colors hover:bg-sand/50">
            <Icon name="Plus" className="h-3.5 w-3.5" /> Émettre
          </button>
          <button onClick={exportCSV} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-ink transition-colors hover:bg-sand/50">
            <Icon name="Download" className="h-3.5 w-3.5" /> Exporter
          </button>
          {unpaidFiltered > 0 && (
            <button
              onClick={relanceAll}
              disabled={busy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-palier-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-palier-700 disabled:opacity-50"
            >
              <Icon name={busy ? "LoaderCircle" : "Send"} className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
              Relancer ({unpaidFiltered})
            </button>
          )}
        </div>
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
            {/* Desktop table */}
            <table className="hidden w-full table-fixed text-left text-[13px] md:table">
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
                            <>
                              <button
                                onClick={() => relance(r)}
                                disabled={!r.profileId}
                                className="rounded-md bg-palier-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-palier-700 disabled:opacity-40"
                                title="Relance in-app"
                              >
                                <Icon name="Bell" className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => relanceWhatsApp(r)}
                                disabled={!r.phone}
                                className="rounded-md bg-[#25D366] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#1da851] disabled:opacity-40"
                                title="Relance WhatsApp"
                              >
                                <Icon name="MessageCircle" className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-black/[0.04] md:hidden">
              {pageRows.map((r) => {
                const remaining = r.amount - r.paid;
                const isPaid = r.status === "paid";
                const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && !isPaid;
                return (
                  <div key={r.unitId} className={`p-4 ${isPaid ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: r.avatarColor }}>
                        {r.ownerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-medium text-ink">{r.ownerName}</p>
                          <StatusPill status={r.status} />
                        </div>
                        <p className="mt-0.5 text-[12px] text-ink-soft">Lot {r.ref} · {r.role === "tenant" ? "Locataire" : "Propriétaire"}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[12px]">
                        <span className="font-medium text-ink">{mad(r.amount, { decimals: false })}</span>
                        {r.status === "partial" && <span className="text-blue-600">{mad(remaining, { decimals: false })} restant</span>}
                        {r.dueDate && (
                          <span className={isOverdue ? "font-semibold text-red-600" : "text-ink-soft"}>{shortDate(r.dueDate)}</span>
                        )}
                      </div>
                      {!isPaid && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => relance(r)} disabled={!r.profileId} className="rounded-md bg-palier-600 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-40" title="In-app">
                            <Icon name="Bell" className="h-3 w-3" />
                          </button>
                          <button onClick={() => relanceWhatsApp(r)} disabled={!r.phone} className="rounded-md bg-[#25D366] px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-40" title="WhatsApp">
                            <Icon name="MessageCircle" className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

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

      </>
      ) : (
      /* Historique des appels */
      (() => {
        const catLabels: Record<string, string> = { courantes: "Courantes", travaux: "Travaux", provision: "Provision", regularisation: "Régularisation" };
        const histCategories = [...new Set(chargeCalls.map((c) => c.category))];
        const histYears = [...new Set(chargeCalls.filter((c) => c.dueDate).map((c) => new Date(c.dueDate).getFullYear().toString()))].sort().reverse();
        const histCustomLabel = histPeriod === "custom"
          ? [histPeriodMonth ? MONTHS[parseInt(histPeriodMonth)]?.slice(0, 4) + "." : "", histPeriodYear].filter(Boolean).join(" ") || "Période"
          : "Période";
        const filteredCalls = chargeCalls.filter((c) => {
          if (histCat !== "all" && c.category !== histCat) return false;
          if (histSearch.trim()) {
            const q = histSearch.toLowerCase();
            if (!c.label.toLowerCase().includes(q)) return false;
          }
          if (histPeriod === "custom" && c.dueDate) {
            const d = new Date(c.dueDate);
            if (histPeriodYear && d.getFullYear().toString() !== histPeriodYear) return false;
            if (histPeriodMonth && d.getMonth().toString() !== histPeriodMonth) return false;
          } else if (histPeriod !== "tout" && c.dueDate) {
            const now = new Date();
            const ago = new Date(now);
            if (histPeriod === "mois") ago.setMonth(ago.getMonth() - 1);
            else if (histPeriod === "3mois") ago.setMonth(ago.getMonth() - 3);
            else if (histPeriod === "6mois") ago.setMonth(ago.getMonth() - 6);
            if (new Date(c.dueDate) < ago) return false;
          }
          return true;
        });
        return (
      <div>
        {/* Period tabs */}
        <div className="no-scrollbar mb-4 flex items-center gap-3 overflow-x-auto border-b border-black/[0.06]">
          {([["tout", "Tout"], ["mois", "Ce mois"], ["3mois", "3 mois"], ["6mois", "6 mois"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setHistPeriod(key); setHistPeriodMonth(""); setHistPeriodYear(""); }}
              className={`relative whitespace-nowrap pb-2.5 text-[13px] font-semibold transition-colors ${histPeriod === key ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
            >
              {label}
              {histPeriod === key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
            </button>
          ))}
          <button
            onClick={() => setHistPeriodOpen(true)}
            className={`relative flex whitespace-nowrap items-center gap-1.5 pb-2.5 text-[13px] font-semibold transition-colors ${histPeriod === "custom" ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
          >
            <Icon name="CalendarDays" className="h-3.5 w-3.5" />
            {histCustomLabel}
            {histPeriod === "custom" && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
          </button>
        </div>

        {/* Toolbar */}
        <div className="mb-3 space-y-2">
          <div className="relative">
            <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={histSearch}
              onChange={(e) => setHistSearch(e.target.value)}
              placeholder="Rechercher…"
              className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
            />
            {histSearch && (
              <button onClick={() => setHistSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
                <Icon name="X" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
          {histCategories.length > 1 && (
            <select
              value={histCat}
              onChange={(e) => setHistCat(e.target.value)}
              className="h-9 flex-1 rounded-lg border border-black/[0.08] bg-white px-3 text-[12px] font-medium text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20 md:flex-none"
            >
              <option value="all">Toutes catégories</option>
              {histCategories.map((cat) => <option key={cat} value={cat}>{catLabels[cat] ?? cat}</option>)}
            </select>
          )}
          <button onClick={() => setShowEmit(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-palier-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-palier-700">
            <Icon name="Plus" className="h-3.5 w-3.5" /> Émettre
          </button>
          </div>
        </div>

        <p className="mb-3 text-[12px] text-ink-soft">{filteredCalls.length} appel{filteredCalls.length > 1 ? "s" : ""}</p>

        {filteredCalls.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.06] bg-cream-card py-12 text-center shadow-card">
            <Icon name="Receipt" className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-2 text-[13px] text-ink-soft">{chargeCalls.length === 0 ? "Aucun appel de fonds émis" : "Aucun résultat"}</p>
            {chargeCalls.length === 0 ? (
              <button onClick={() => setShowEmit(true)} className="mt-1 text-[13px] font-medium text-palier-600">Émettre un premier appel</button>
            ) : (
              <button onClick={() => { setHistSearch(""); setHistCat("all"); setHistPeriod("tout"); }} className="mt-1 text-[13px] font-medium text-palier-600">Réinitialiser les filtres</button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
            {/* Desktop table */}
            <table className="hidden w-full table-fixed text-left text-[13px] md:table">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="w-[30%] px-4 py-2.5">Libellé</th>
                  <th className="w-[15%] px-4 py-2.5">Catégorie</th>
                  <th className="w-[15%] px-4 py-2.5">Montant / lot</th>
                  <th className="w-[15%] px-4 py-2.5">Échéance</th>
                  <th className="w-[25%] px-4 py-2.5">Paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filteredCalls.map((c, idx) => {
                  const paidRate = c.lots > 0 ? Math.round((c.paid / c.lots) * 100) : 0;
                  return (
                    <tr key={idx} className="transition-colors hover:bg-sand/50">
                      <td className="overflow-hidden px-4 py-2.5">
                        <p className="truncate font-medium text-ink">{c.label}</p>
                      </td>
                      <td className="px-4 py-2.5 text-ink-soft">{catLabels[c.category] ?? c.category}</td>
                      <td className="px-4 py-2.5 font-medium text-ink">{mad(c.amount, { decimals: false })}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{c.dueDate ? shortDate(c.dueDate) : "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand/50">
                            <div className="h-full rounded-full bg-palier-600" style={{ width: `${paidRate}%` }} />
                          </div>
                          <span className="text-[11px] font-medium text-ink-soft">{c.paid}/{c.lots}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-black/[0.04] md:hidden">
              {filteredCalls.map((c, idx) => {
                const paidRate = c.lots > 0 ? Math.round((c.paid / c.lots) * 100) : 0;
                return (
                  <div key={idx} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-ink">{c.label}</p>
                        <p className="mt-0.5 text-[12px] text-ink-soft">{catLabels[c.category] ?? c.category} · {c.dueDate ? shortDate(c.dueDate) : "—"}</p>
                      </div>
                      <p className="shrink-0 text-[14px] font-semibold text-ink">{mad(c.amount, { decimals: false })}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand/50">
                        <div className="h-full rounded-full bg-palier-600" style={{ width: `${paidRate}%` }} />
                      </div>
                      <span className="text-[11px] font-medium text-ink-soft">{c.paid}/{c.lots}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      {/* Hist period picker modal */}
      {histPeriodOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setHistPeriodOpen(false)}>
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
              <button onClick={() => setHistPeriodOpen(false)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
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
                      onClick={() => setHistPeriodMonth(histPeriodMonth === idx.toString() ? "" : idx.toString())}
                      className={`rounded-xl py-2.5 text-[13px] font-semibold transition-colors ${histPeriodMonth === idx.toString() ? "bg-palier-600 text-white" : "border border-black/[0.08] bg-white text-ink hover:bg-sand/50"}`}
                    >
                      {m.slice(0, 4)}.
                    </button>
                  ))}
                </div>
              </div>
              {histYears.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-ink">Année</p>
                  <div className="flex flex-wrap gap-2">
                    {histYears.map((y) => (
                      <button
                        key={y}
                        onClick={() => setHistPeriodYear(histPeriodYear === y ? "" : y)}
                        className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors ${histPeriodYear === y ? "bg-palier-600 text-white" : "border border-black/[0.08] bg-white text-ink hover:bg-sand/50"}`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setHistPeriodMonth(""); setHistPeriodYear(""); setHistPeriod("tout"); setHistPeriodOpen(false); }}
                  className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => { setHistPeriod("custom"); setHistPeriodOpen(false); }}
                  className="flex-1 rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
        );
      })()
      )}

      {/* Emit charges modal */}
      {showEmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setShowEmit(false); resetEmit(); }}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                  <Icon name="Receipt" className="h-5 w-5 text-palier-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">Émettre un appel de fonds</h2>
                  <p className="text-[12px] text-ink-soft">L&apos;appel sera envoyé à {rows.length} lots</p>
                </div>
              </div>
              <button onClick={() => { setShowEmit(false); resetEmit(); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEmit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Libellé</label>
                <input type="text" value={emitLabel} onChange={(e) => setEmitLabel(e.target.value)} placeholder="Charges courantes Juillet 2026" required className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Détail</label>
                <input type="text" value={emitDetail} onChange={(e) => setEmitDetail(e.target.value)} placeholder="Syndic + ascenseur + nettoyage" className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Montant / lot (MAD)</label>
                  <input type="number" value={emitAmount} onChange={(e) => setEmitAmount(e.target.value)} placeholder="500" required className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Catégorie</label>
                  <select value={emitCategory} onChange={(e) => setEmitCategory(e.target.value)} className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20">
                    {effectiveChargeCats.map((cat) => (
                      <option key={cat} value={cat.toLowerCase().replace(/\s+/g, "_")}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Date d&apos;échéance</label>
                <input type="date" value={emitDueDate} onChange={(e) => setEmitDueDate(e.target.value)} required className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
              </div>
              <button type="submit" disabled={emitPending} className="w-full rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50">
                {emitPending ? "Émission…" : "Émettre l'appel"}
              </button>
            </form>
          </div>
        </div>
      )}

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
