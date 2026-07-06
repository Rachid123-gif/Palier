"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { mad } from "@/lib/format";
import {
  createBudget,
  updateBudgetStatus,
  addBudgetLine,
  deleteBudgetLine,
  deleteBudget,
} from "@/lib/actions";
import type { Budget, BudgetLine } from "@/lib/types";
import type { SyndicData } from "@/lib/syndic";

const CATEGORIES = ["Personnel", "Maintenance", "Fluides", "Assurance", "Gestion", "Travaux", "Autre"];

const STATUS_LABELS: Record<Budget["status"], string> = {
  draft: "Brouillon",
  vote: "En vote",
  approved: "Approuv\u00e9",
  closed: "Cl\u00f4tur\u00e9",
};

const STATUS_COLORS: Record<Budget["status"], string> = {
  draft: "bg-amber-50 text-amber-700",
  vote: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  closed: "bg-gray-100 text-gray-600",
};

const STATUS_FLOW: Budget["status"][] = ["draft", "vote", "approved", "closed"];

function nextStatus(current: Budget["status"]): Budget["status"] | null {
  const idx = STATUS_FLOW.indexOf(current);
  return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
}

function nextStatusLabel(current: Budget["status"]): string | null {
  const ns = nextStatus(current);
  if (!ns) return null;
  const map: Record<string, string> = {
    vote: "Soumettre au vote",
    approved: "Approuver",
    closed: "Cl\u00f4turer",
  };
  return map[ns] ?? null;
}

type EmptyLine = { label: string; category: string; amountBudgeted: string; accountCode: string };

export function BudgetView({
  budgets,
  buildingId,
  units,
  kpis,
}: {
  budgets: Budget[];
  buildingId: string;
  units: SyndicData["units"];
  kpis: SyndicData["kpis"];
}) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Budget | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Budget | null>(null);

  // Search / filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Budget["status"]>("all");

  // Create form state
  const [saving, setSaving] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(() => new Date().getFullYear());
  const [reserveFund, setReserveFund] = useState("");
  const [lines, setLines] = useState<EmptyLine[]>([
    { label: "", category: "Maintenance", amountBudgeted: "", accountCode: "" },
  ]);

  // Detail state
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);
  const [newLine, setNewLine] = useState<EmptyLine>({ label: "", category: "Maintenance", amountBudgeted: "", accountCode: "" });

  // ── KPIs ──
  const currentYear = new Date().getFullYear();
  const currentBudget = budgets.find((b) => b.fiscalYear === currentYear);
  const budgetTotal = currentBudget?.totalAmount ?? 0;
  const reserveAmount = currentBudget?.reserveFundAmount ?? 0;
  const budgetStatus = currentBudget?.status ?? null;
  const accountingTier = kpis ? "Tier 1" : "Tier 1"; // always available from building

  // ── Filtering ──
  const statusTabs: { key: "all" | Budget["status"]; label: string }[] = [
    { key: "all", label: "Tout" },
    { key: "draft", label: "Brouillon" },
    { key: "vote", label: "En vote" },
    { key: "approved", label: "Approuv\u00e9" },
    { key: "closed", label: "Cl\u00f4tur\u00e9" },
  ];

  const counts = useMemo(() => ({
    all: budgets.length,
    draft: budgets.filter((b) => b.status === "draft").length,
    vote: budgets.filter((b) => b.status === "vote").length,
    approved: budgets.filter((b) => b.status === "approved").length,
    closed: budgets.filter((b) => b.status === "closed").length,
  }), [budgets]);

  const filtered = useMemo(() => {
    let result = [...budgets];
    if (statusFilter !== "all") result = result.filter((b) => b.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) =>
        b.fiscalYear.toString().includes(q) ||
        b.lines.some((l) => l.label.toLowerCase().includes(q) || l.category.toLowerCase().includes(q))
      );
    }
    return result;
  }, [budgets, statusFilter, search]);

  // ── Create form helpers ──
  function resetCreate() {
    setFiscalYear(new Date().getFullYear());
    setReserveFund("");
    setLines([{ label: "", category: "Maintenance", amountBudgeted: "", accountCode: "" }]);
  }

  function addFormLine() {
    setLines((p) => [...p, { label: "", category: "Maintenance", amountBudgeted: "", accountCode: "" }]);
  }

  function removeFormLine(i: number) {
    setLines((p) => p.filter((_, j) => j !== i));
  }

  function updateFormLine(i: number, field: keyof EmptyLine, value: string) {
    setLines((p) => p.map((line, j) => (j === i ? { ...line, [field]: value } : line)));
  }

  const formTotal = useMemo(() => {
    const linesTotal = lines.reduce((s, l) => s + (Number(l.amountBudgeted) || 0), 0);
    return linesTotal + (Number(reserveFund) || 0);
  }, [lines, reserveFund]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const validLines = lines.filter((l) => l.label.trim() && Number(l.amountBudgeted) > 0);
    if (validLines.length === 0) return;
    setSaving(true);
    const res = await createBudget({
      buildingId,
      fiscalYear,
      lines: validLines.map((l) => ({
        label: l.label.trim(),
        category: l.category,
        amountBudgeted: Number(l.amountBudgeted),
        accountCode: l.accountCode.trim() || undefined,
      })),
      reserveFundAmount: Number(reserveFund) || 0,
    });
    setSaving(false);
    if ("error" in res && res.error) {
      flash("Erreur : " + res.error);
      return;
    }
    setShowCreate(false);
    resetCreate();
    flash("Budget cr\u00e9\u00e9");
    router.refresh();
  }

  // ── Detail actions ──
  async function handleStatusChange(budget: Budget) {
    const ns = nextStatus(budget.status);
    if (!ns) return;
    setActionLoading(true);
    await updateBudgetStatus(budget.id, ns);
    setActionLoading(false);
    setSelected(null);
    flash(`Statut mis \u00e0 jour : ${STATUS_LABELS[ns]}`);
    router.refresh();
  }

  async function handleAddLine(budgetId: string) {
    if (!newLine.label.trim() || !Number(newLine.amountBudgeted)) return;
    setActionLoading(true);
    await addBudgetLine(budgetId, {
      label: newLine.label.trim(),
      category: newLine.category,
      amountBudgeted: Number(newLine.amountBudgeted),
      accountCode: newLine.accountCode.trim() || undefined,
    });
    setActionLoading(false);
    setShowAddLine(false);
    setNewLine({ label: "", category: "Maintenance", amountBudgeted: "", accountCode: "" });
    flash("Ligne ajout\u00e9e");
    router.refresh();
  }

  async function handleDeleteLine(lineId: string) {
    setActionLoading(true);
    await deleteBudgetLine(lineId);
    setActionLoading(false);
    flash("Ligne supprim\u00e9e");
    router.refresh();
  }

  async function handleDeleteBudget() {
    if (!showDeleteConfirm) return;
    setActionLoading(true);
    await deleteBudget(showDeleteConfirm.id);
    setActionLoading(false);
    setShowDeleteConfirm(null);
    setSelected(null);
    flash("Budget supprim\u00e9");
    router.refresh();
  }

  // ── Year options for create form ──
  const yearOptions = useMemo(() => {
    const y = currentYear;
    return [y - 1, y, y + 1, y + 2];
  }, [currentYear]);

  const inputCls = "h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20";

  return (
    <div>
      <PageHeader
        title="Budget pr\u00e9visionnel"
        subtitle={`${budgets.length} budget${budgets.length > 1 ? "s" : ""}${currentBudget ? ` \u00b7 ${currentYear} : ${STATUS_LABELS[currentBudget.status]}` : ""}`}
        action={
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700">
            <Icon name="Plus" className="h-3.5 w-3.5" /> Nouveau budget
          </button>
        }
      />

      {/* Legal info banner */}
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Scale" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">
          Conform\u00e9ment au D\u00e9cret 2.23.700, le budget pr\u00e9visionnel doit \u00eatre vot\u00e9 en assembl\u00e9e g\u00e9n\u00e9rale.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Budget {currentYear}</p>
          <p className="text-[22px] font-bold leading-none text-ink">{mad(budgetTotal, { decimals: false })}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Fonds de r\u00e9serve</p>
          <p className="text-[22px] font-bold leading-none text-ink">{mad(reserveAmount, { decimals: false })}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Statut budget</p>
          <p className="text-[16px] font-bold leading-none text-ink">
            {budgetStatus ? (
              <span className={`inline-block rounded-md px-2 py-0.5 text-[13px] font-semibold ${STATUS_COLORS[budgetStatus]}`}>
                {STATUS_LABELS[budgetStatus]}
              </span>
            ) : "\u2014"}
          </p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Niveau comptable</p>
          <p className="text-[16px] font-bold leading-none text-ink">{accountingTier}</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="no-scrollbar mb-3 flex items-center gap-3 overflow-x-auto border-b border-black/[0.06]">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`relative whitespace-nowrap pb-2.5 text-[13px] font-semibold transition-colors ${statusFilter === tab.key ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
          >
            {tab.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${statusFilter === tab.key ? "bg-palier-50 text-palier-700" : "text-ink-faint"}`}>
              {counts[tab.key]}
            </span>
            {statusFilter === tab.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-3">
        <div className="relative">
          <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par ann\u00e9e ou poste..."
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
              <Icon name="X" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Budget list */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="Wallet" className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-2 text-[13px] text-ink-soft">{budgets.length === 0 ? "Aucun budget cr\u00e9\u00e9" : "Aucun r\u00e9sultat"}</p>
            {budgets.length === 0 ? (
              <button onClick={() => setShowCreate(true)} className="mt-1 text-[13px] font-medium text-palier-600">Cr\u00e9er un budget</button>
            ) : (
              <button onClick={() => { setStatusFilter("all"); setSearch(""); }} className="mt-1 text-[13px] font-medium text-palier-600">R\u00e9initialiser les filtres</button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full table-fixed text-left text-[13px] md:table">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="w-[18%] px-4 py-2.5">Exercice</th>
                  <th className="w-[18%] px-4 py-2.5">Statut</th>
                  <th className="w-[20%] px-4 py-2.5">Montant total</th>
                  <th className="w-[20%] px-4 py-2.5">Fonds de r\u00e9serve</th>
                  <th className="w-[12%] px-4 py-2.5">Lignes</th>
                  <th className="w-[12%] px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filtered.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-sand/50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{b.fiscalYear}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink">{mad(b.totalAmount, { decimals: false })}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{mad(b.reserveFundAmount, { decimals: false })}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{b.lines.length} poste{b.lines.length > 1 ? "s" : ""}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => setSelected(b)} className="text-[11px] font-semibold text-palier-600 hover:underline">
                        D\u00e9tails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-black/[0.04] md:hidden">
              {filtered.map((b) => (
                <div key={b.id} className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-medium text-ink">Exercice {b.fiscalYear}</p>
                      <p className="mt-0.5 text-[12px] text-ink-soft">{b.lines.length} poste{b.lines.length > 1 ? "s" : ""}</p>
                    </div>
                    <span className={`shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </div>
                  <div className="mb-2.5 flex items-center gap-3 text-[12px] text-ink-soft">
                    <span>Total : {mad(b.totalAmount, { decimals: false })}</span>
                    <span>R\u00e9serve : {mad(b.reserveFundAmount, { decimals: false })}</span>
                  </div>
                  <button onClick={() => setSelected(b)} className="text-[12px] font-semibold text-palier-600">D\u00e9tails</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ═══ Detail modal ═══ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setSelected(null); setShowAddLine(false); }}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-[16px] font-semibold text-ink">Budget {selected.fiscalYear}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[selected.status]}`}>
                    {STATUS_LABELS[selected.status]}
                  </span>
                  <span className="text-[12px] text-ink-soft">Total : {mad(selected.totalAmount)}</span>
                  {selected.approvedAt && (
                    <span className="text-[11px] text-ink-faint">Approuv\u00e9 le {new Date(selected.approvedAt).toLocaleDateString("fr-FR")}</span>
                  )}
                </div>
              </div>
              <button onClick={() => { setSelected(null); setShowAddLine(false); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>

            {/* Lines table */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-ink">Lignes budg\u00e9taires</h3>
                {selected.status === "draft" && (
                  <button onClick={() => setShowAddLine(true)} className="text-[12px] font-medium text-palier-600">+ Ajouter un poste</button>
                )}
              </div>

              {selected.lines.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-ink-soft">Aucun poste budg\u00e9taire</p>
              ) : (
                <div className="space-y-2">
                  {selected.lines.map((line) => {
                    const pct = line.amountBudgeted > 0
                      ? Math.min(100, Math.round((line.amountActual / line.amountBudgeted) * 100))
                      : 0;
                    const overBudget = line.amountActual > line.amountBudgeted;
                    return (
                      <div key={line.id} className="rounded-lg border border-black/[0.06] p-3">
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[13px] font-medium text-ink">{line.label}</p>
                            <span className="mt-0.5 inline-block rounded-md bg-sand/80 px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">
                              {line.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-[13px] font-semibold text-ink">{mad(line.amountBudgeted)}</p>
                              <p className={`text-[11px] ${overBudget ? "font-semibold text-red-500" : "text-ink-soft"}`}>
                                R\u00e9alis\u00e9 : {mad(line.amountActual)}
                              </p>
                            </div>
                            {selected.status === "draft" && (
                              <button onClick={() => handleDeleteLine(line.id)} className="text-ink-faint hover:text-red-500">
                                <Icon name="Trash2" className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand/50">
                            <div
                              style={{ width: `${Math.min(pct, 100)}%` }}
                              className={`h-full rounded-full transition-all ${overBudget ? "bg-red-400" : pct > 80 ? "bg-amber-400" : "bg-emerald-500"}`}
                            />
                          </div>
                          <span className={`text-[11px] font-semibold ${overBudget ? "text-red-500" : "text-ink-soft"}`}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reserve fund */}
              {selected.reserveFundAmount > 0 && (
                <div className="mt-3 rounded-lg border border-black/[0.06] bg-palier-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="Shield" className="h-4 w-4 text-palier-600" />
                      <p className="text-[13px] font-medium text-ink">Fonds de r\u00e9serve</p>
                    </div>
                    <p className="text-[13px] font-semibold text-ink">{mad(selected.reserveFundAmount)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Add line inline form */}
            {showAddLine && selected.status === "draft" && (
              <div className="mb-4 rounded-lg border border-palier-200 bg-white p-3">
                <p className="mb-2 text-[12px] font-semibold text-ink-soft">Nouveau poste</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Libell\u00e9"
                    value={newLine.label}
                    onChange={(e) => setNewLine({ ...newLine, label: e.target.value })}
                    className={inputCls}
                  />
                  <select
                    value={newLine.category}
                    onChange={(e) => setNewLine({ ...newLine, category: e.target.value })}
                    className={inputCls}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="number"
                    placeholder="Montant (MAD)"
                    min="0"
                    value={newLine.amountBudgeted}
                    onChange={(e) => setNewLine({ ...newLine, amountBudgeted: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="text"
                    placeholder="Code comptable (optionnel)"
                    value={newLine.accountCode}
                    onChange={(e) => setNewLine({ ...newLine, accountCode: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleAddLine(selected.id)}
                    disabled={actionLoading || !newLine.label.trim() || !Number(newLine.amountBudgeted)}
                    className="rounded-lg bg-palier-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50"
                  >
                    {actionLoading ? "Ajout..." : "Ajouter"}
                  </button>
                  <button onClick={() => setShowAddLine(false)} className="rounded-lg border border-black/[0.08] px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-sand/50">
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {nextStatusLabel(selected.status) && (
                <button
                  onClick={() => handleStatusChange(selected)}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50"
                >
                  {actionLoading ? "Mise \u00e0 jour..." : nextStatusLabel(selected.status)}
                </button>
              )}
              {selected.status === "draft" && (
                <button
                  onClick={() => setShowDeleteConfirm(selected)}
                  className="rounded-xl border border-red-200 px-4 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Create budget modal ═══ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setShowCreate(false); resetCreate(); }}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                  <Icon name="Wallet" className="h-5 w-5 text-palier-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">Nouveau budget pr\u00e9visionnel</h2>
                  <p className="text-[12px] text-ink-soft">D\u00e9finir les postes et montants pr\u00e9visionnels</p>
                </div>
              </div>
              <button onClick={() => { setShowCreate(false); resetCreate(); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Fiscal year */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Exercice fiscal</label>
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(Number(e.target.value))}
                  className={inputCls}
                >
                  {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Budget lines */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-ink-soft">Postes budg\u00e9taires</span>
                  <button type="button" onClick={addFormLine} className="text-[12px] font-medium text-palier-600">+ Ajouter</button>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {lines.map((line, i) => (
                    <div key={i} className="rounded-lg border border-black/[0.06] p-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-ink-soft">Poste {i + 1}</span>
                        {lines.length > 1 && (
                          <button type="button" onClick={() => removeFormLine(i)} className="text-ink-faint hover:text-red-500">
                            <Icon name="Trash2" className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Libell\u00e9 (ex : Entretien parties communes)"
                        value={line.label}
                        onChange={(e) => updateFormLine(i, "label", e.target.value)}
                        className={`mb-1 ${inputCls}`}
                      />
                      <div className="grid grid-cols-2 gap-1">
                        <select
                          value={line.category}
                          onChange={(e) => updateFormLine(i, "category", e.target.value)}
                          className={inputCls}
                        >
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="Montant (MAD)"
                          value={line.amountBudgeted}
                          onChange={(e) => updateFormLine(i, "amountBudgeted", e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reserve fund */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Fonds de r\u00e9serve (MAD)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={reserveFund}
                  onChange={(e) => setReserveFund(e.target.value)}
                  className={inputCls}
                />
                <p className="mt-1 text-[11px] text-ink-faint">Minimum 5% du budget total recommand\u00e9 par la loi 18-00</p>
              </div>

              {/* Total preview */}
              <div className="rounded-lg border border-black/[0.06] bg-white p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-ink-soft">Total pr\u00e9visionnel</p>
                  <p className="text-[16px] font-bold text-ink">{mad(formTotal, { decimals: false })}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || lines.every((l) => !l.label.trim() || !Number(l.amountBudgeted))}
                className="w-full rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50"
              >
                {saving ? "Cr\u00e9ation..." : "Cr\u00e9er le budget"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Delete confirmation ═══ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[16px] font-semibold text-ink">Supprimer ce budget ?</h2>
            <p className="mt-1 text-[13px] text-ink-soft">
              Le budget de l&apos;exercice {showDeleteConfirm.fiscalYear} et toutes ses lignes seront d\u00e9finitivement supprim\u00e9s.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50">
                Non, garder
              </button>
              <button onClick={handleDeleteBudget} disabled={actionLoading} className="flex-1 rounded-xl bg-red-600 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {actionLoading ? "Suppression..." : "Oui, supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-[rise_0.25s_ease] rounded-lg bg-palier-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
