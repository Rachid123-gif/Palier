"use client";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { createLedgerEntry, updateLedgerEntry, deleteLedgerEntry } from "@/lib/actions";
import { num, shortDate } from "@/lib/format";

interface Entry {
  id: string;
  type: "in" | "out";
  label: string;
  amount: number;
  entry_date: string;
  category: string;
  signed: boolean;
}

const DEFAULT_EXPENSE_CATEGORIES = ["Maintenance", "Personnel", "Fluides", "Fournitures", "Travaux", "Charges", "Assurance", "Autre"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const PER_PAGE = 15;

export function TransparenceView({
  ledger,
  balance,
  buildingId,
  expenseCategories,
}: {
  ledger: Entry[];
  balance: number;
  buildingId: string;
  expenseCategories?: string[] | null;
}) {
  const CATEGORIES = expenseCategories?.length ? expenseCategories : DEFAULT_EXPENSE_CATEGORIES;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "in" | "out">("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<"tout" | "mois" | "3mois" | "6mois" | "custom">("tout");
  const [page, setPage] = useState(0);

  // Custom period
  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodMonth, setPeriodMonth] = useState("");
  const [periodYear, setPeriodYear] = useState("");

  // Modals
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [form, setForm] = useState({ type: "out" as "in" | "out", label: "", amount: "", category: "Maintenance", date: new Date().toISOString().split("T")[0] });
  const [editTarget, setEditTarget] = useState<Entry | null>(null);
  const [toast, setToast] = useState("");
  const [formError, setFormError] = useState("");

  // Categories present in data
  const usedCategories = useMemo(() => {
    const cats = new Set(ledger.map((l) => l.category));
    return [...cats].sort();
  }, [ledger]);

  // Years present in data
  const years = useMemo(() => {
    return [...new Set(ledger.map((l) => new Date(l.entry_date).getFullYear().toString()))].sort().reverse();
  }, [ledger]);

  const customLabel = periodFilter === "custom"
    ? [periodMonth ? MONTHS[parseInt(periodMonth)]?.slice(0, 4) + "." : "", periodYear].filter(Boolean).join(" ") || "Période"
    : "Période";

  // Period-filtered entries (used for KPI cards)
  const periodFiltered = useMemo(() => {
    const now = new Date();
    let rows = [...ledger];
    if (periodFilter === "custom") {
      rows = rows.filter((l) => {
        const d = new Date(l.entry_date);
        const matchYear = !periodYear || d.getFullYear().toString() === periodYear;
        const matchMonth = !periodMonth || d.getMonth().toString() === periodMonth;
        return matchYear && matchMonth;
      });
    } else if (periodFilter !== "tout") {
      const ago = new Date(now);
      if (periodFilter === "mois") { ago.setMonth(ago.getMonth() - 1); }
      else if (periodFilter === "3mois") { ago.setMonth(ago.getMonth() - 3); }
      else { ago.setMonth(ago.getMonth() - 6); }
      rows = rows.filter((l) => new Date(l.entry_date) >= ago);
    }
    return rows;
  }, [ledger, periodFilter, periodMonth, periodYear]);

  // KPI stats (follow period)
  const totalIn = periodFiltered.filter((l) => l.type === "in").reduce((s, l) => s + Number(l.amount), 0);
  const totalOut = periodFiltered.filter((l) => l.type === "out").reduce((s, l) => s + Number(l.amount), 0);
  const periodBalance = totalIn - totalOut;

  // Full filtering (period + type + category + search → table)
  const filtered = useMemo(() => {
    let rows = [...periodFiltered];
    if (typeFilter !== "all") rows = rows.filter((l) => l.type === typeFilter);
    if (catFilter !== "all") rows = rows.filter((l) => l.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((l) => l.label.toLowerCase().includes(q) || l.category.toLowerCase().includes(q));
    }
    return rows.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
  }, [periodFiltered, typeFilter, catFilter, search]);

  // Filtered stats (for summary bar)
  const filteredIn = filtered.filter((l) => l.type === "in").reduce((s, l) => s + Number(l.amount), 0);
  const filteredOut = filtered.filter((l) => l.type === "out").reduce((s, l) => s + Number(l.amount), 0);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages - 1);
  const rows = filtered.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }
  function resetFilters() { setSearch(""); setTypeFilter("all"); setCatFilter("all"); setPeriodFilter("tout"); setPeriodMonth(""); setPeriodYear(""); setPage(0); }

  // Add
  function openAdd() {
    setForm({ type: "out", label: "", amount: "", category: "Maintenance", date: new Date().toISOString().split("T")[0] });
    setFormError("");
    setModal("add");
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.label.trim() || !form.amount) return;
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) { setFormError("Le montant doit être supérieur à 0."); return; }
    startTransition(async () => {
      const res = await createLedgerEntry({ buildingId, type: form.type, label: form.label.trim(), amount, category: form.category, date: form.date });
      if (res.error) { setFormError("Erreur lors de l'enregistrement. Réessayez."); }
      else { flash("Opération enregistrée"); setModal(null); router.refresh(); }
    });
  }

  // Edit
  function openEdit(entry: Entry) {
    setEditTarget(entry);
    setForm({
      type: entry.type,
      label: entry.label,
      amount: String(entry.amount),
      category: entry.category,
      date: entry.entry_date,
    });
    setFormError("");
    setModal("edit");
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!editTarget || !form.label.trim() || !form.amount) return;
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) { setFormError("Le montant doit être supérieur à 0."); return; }
    startTransition(async () => {
      const res = await updateLedgerEntry(editTarget.id, { type: form.type, label: form.label.trim(), amount, category: form.category, date: form.date });
      if (res.error) { setFormError("Erreur lors de la modification. Réessayez."); }
      else { flash("Opération modifiée"); setModal(null); router.refresh(); }
    });
  }

  // Delete
  function openDelete(entry: Entry) { setEditTarget(entry); setModal("delete"); }

  function handleDelete() {
    if (!editTarget) return;
    startTransition(async () => {
      await deleteLedgerEntry(editTarget.id);
      flash("Opération supprimée");
      setModal(null);
      router.refresh();
    });
  }

  // Export CSV
  function exportCSV() {
    const header = "Date,Type,Libellé,Catégorie,Montant (MAD)";
    const csvRows = filtered.map((l) =>
      `${l.entry_date},${l.type === "in" ? "Encaissement" : "Dépense"},"${l.label.replace(/"/g, '""')}",${l.category},${l.type === "in" ? "+" : "-"}${l.amount}`
    );
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `palier-journal-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    flash("Export CSV téléchargé");
  }

  return (
    <div>
      <PageHeader
        title="Transparence"
        subtitle="Journal de caisse — visible par les résidents"
        action={
          <div className="flex gap-2">
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-sand/50">
              <Icon name="Download" className="h-3.5 w-3.5" /> Exporter
            </button>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-palier-700">
              <Icon name="Plus" className="h-3.5 w-3.5" /> Enregistrer
            </button>
          </div>
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">
          Le journal de caisse est visible par les résidents dans leur application. Toutes les entrées et sorties enregistrées ici apparaissent dans la section « Mon immeuble » du résident.
        </p>
      </div>

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

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
              <Icon name="ArrowDownLeft" className="h-4 w-4 text-emerald-700" />
            </span>
            <p className="text-[12px] font-semibold text-ink">Total entrées</p>
          </div>
          <p className="text-[24px] font-bold leading-none text-ink" dir="ltr">+{num(totalIn, false)}</p>
          <p className="mt-1.5 text-[12px] font-medium text-ink-soft">MAD</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100">
              <Icon name="ArrowUpRight" className="h-4 w-4 text-red-600" />
            </span>
            <p className="text-[12px] font-semibold text-ink">Total sorties</p>
          </div>
          <p className="text-[24px] font-bold leading-none text-ink" dir="ltr">−{num(totalOut, false)}</p>
          <p className="mt-1.5 text-[12px] font-medium text-ink-soft">MAD</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-palier-100">
              <Icon name="Wallet" className="h-4 w-4 text-palier-600" />
            </span>
            <p className="text-[12px] font-semibold text-ink">Solde</p>
          </div>
          <p className="text-[24px] font-bold leading-none text-ink" dir="ltr">
            {periodBalance < 0 && "−"}{num(Math.abs(periodBalance), false)}
          </p>
          <p className="mt-1.5 text-[12px] font-medium text-ink-soft">
            {periodBalance >= 0 ? "MAD" : "MAD · avancé par le syndic"}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-3 space-y-2">
        <div className="relative">
          <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Rechercher…"
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(0); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
              <Icon name="X" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-black/[0.08] bg-white p-0.5">
            {([["all", "Tout"], ["in", "Entrées"], ["out", "Sorties"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setTypeFilter(key); setPage(0); }}
                className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors ${typeFilter === key ? "bg-palier-50 text-palier-700" : "text-ink hover:bg-sand/50"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {usedCategories.length > 1 && (
            <select
              value={catFilter}
              onChange={(e) => { setCatFilter(e.target.value); setPage(0); }}
              className="h-9 flex-1 rounded-lg border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20 md:flex-none"
            >
              <option value="all">Toutes catégories</option>
              {usedCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </div>


      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="FileText" className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-2 text-[13px] text-ink-soft">Aucune opération trouvée</p>
            <button onClick={resetFilters} className="mt-1 text-[13px] font-medium text-palier-600">
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-left text-[13px] md:table">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Libellé</th>
                  <th className="px-4 py-2.5">Catégorie</th>
                  <th className="px-4 py-2.5 text-right">Montant</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {rows.map((l) => (
                  <tr key={l.id} className="transition-colors hover:bg-sand/50">
                    <td className="px-4 py-2.5 text-ink-soft">{shortDate(l.entry_date)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${l.type === "in" ? "bg-emerald-50" : "bg-red-50"}`}>
                          <Icon name={l.type === "in" ? "ArrowDownLeft" : "ArrowUpRight"} className={`h-3.5 w-3.5 ${l.type === "in" ? "text-emerald-600" : "text-red-500"}`} />
                        </span>
                        <span className="font-medium text-ink">{l.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-md bg-sand/60 px-2 py-0.5 text-[11px] font-medium text-ink-soft">{l.category}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-semibold ${l.type === "in" ? "text-emerald-600" : "text-ink"}`} dir="ltr">
                        {l.type === "in" ? "+" : "−"}{num(Number(l.amount), false)} <span className="text-[10px] font-medium text-ink-soft">MAD</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => openEdit(l)} className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-blue-50 hover:text-blue-600" title="Modifier">
                          <Icon name="Pencil" className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => openDelete(l)} className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-500" title="Supprimer">
                          <Icon name="Trash2" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-black/[0.04] md:hidden">
              {rows.map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-4">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${l.type === "in" ? "bg-emerald-50" : "bg-red-50"}`}>
                    <Icon name={l.type === "in" ? "ArrowDownLeft" : "ArrowUpRight"} className={`h-4 w-4 ${l.type === "in" ? "text-emerald-600" : "text-red-500"}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-ink">{l.label}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-soft">
                      <span>{shortDate(l.entry_date)}</span>
                      <span className="rounded-md bg-sand/60 px-1.5 py-0.5 text-[10px] font-medium">{l.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[14px] font-semibold ${l.type === "in" ? "text-emerald-600" : "text-ink"}`} dir="ltr">
                      {l.type === "in" ? "+" : "−"}{num(Number(l.amount), false)}
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-0.5">
                      <button onClick={() => openEdit(l)} className="rounded-md p-1 text-ink-faint hover:text-blue-600"><Icon name="Pencil" className="h-3.5 w-3.5" /></button>
                      <button onClick={() => openDelete(l)} className="rounded-md p-1 text-ink-faint hover:text-red-500"><Icon name="Trash2" className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer: pagination + totals */}
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


      {/* ── Modal: Ajouter / Modifier ── */}
      {(modal === "add" || modal === "edit") && (
        <Overlay onClose={() => setModal(null)}>
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${modal === "add" ? "bg-palier-100" : "bg-blue-100"}`}>
                <Icon name={modal === "add" ? "Plus" : "Pencil"} className={`h-5 w-5 ${modal === "add" ? "text-palier-600" : "text-blue-600"}`} />
              </span>
              <div>
                <h2 className="text-[16px] font-semibold text-ink">{modal === "add" ? "Nouvelle opération" : "Modifier l'opération"}</h2>
                <p className="text-[12px] text-ink-soft">{modal === "add" ? "Enregistrer une entrée ou sortie de caisse" : "Modifier les détails de cette opération"}</p>
              </div>
            </div>
            <button onClick={() => setModal(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
              <Icon name="X" className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={modal === "add" ? handleAdd : handleEdit} className="space-y-4">
            {formError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                <Icon name="AlertTriangle" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <p className="text-[12px] font-medium text-red-800">{formError}</p>
              </div>
            )}

            {/* Type toggle */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink">Type d&apos;opération</label>
              <div className="flex gap-1 rounded-lg border border-black/[0.08] p-0.5">
                <button type="button" onClick={() => setForm({ ...form, type: "out" })} className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2.5 text-[13px] font-medium transition-colors ${form.type === "out" ? "bg-red-50 text-red-700" : "text-ink"}`}>
                  <Icon name="ArrowUpRight" className="h-3.5 w-3.5" /> Dépense
                </button>
                <button type="button" onClick={() => setForm({ ...form, type: "in" })} className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2.5 text-[13px] font-medium transition-colors ${form.type === "in" ? "bg-emerald-50 text-emerald-700" : "text-ink"}`}>
                  <Icon name="ArrowDownLeft" className="h-3.5 w-3.5" /> Encaissement
                </button>
              </div>
            </div>

            {/* Libellé */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink">Libellé</label>
              <input
                value={form.label}
                onChange={(e) => { setForm({ ...form, label: e.target.value }); setFormError(""); }}
                placeholder="Ex: Nettoyage parties communes, Cotisations mars…"
                required
                className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
              />
            </div>

            {/* Montant + Catégorie */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink">Montant (MAD)</label>
                <input
                  value={form.amount}
                  onChange={(e) => { setForm({ ...form, amount: e.target.value.replace(/[^0-9.]/g, "") }); setFormError(""); }}
                  placeholder="1 500"
                  inputMode="decimal"
                  required
                  className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink">Catégorie</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
              />
            </div>

            <button type="submit" disabled={isPending} className="w-full rounded-xl bg-palier-600 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-palier-700 disabled:opacity-50">
              {isPending ? "Enregistrement…" : modal === "add" ? "Signer et enregistrer" : "Enregistrer les modifications"}
            </button>
          </form>
        </Overlay>
      )}

      {/* ── Modal: Supprimer ── */}
      {modal === "delete" && editTarget && (
        <Overlay onClose={() => setModal(null)}>
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <Icon name="Trash2" className="h-5 w-5 text-red-600" />
              </span>
              <div>
                <h2 className="text-[16px] font-semibold text-ink">Supprimer cette opération</h2>
                <p className="text-[12px] text-ink-soft">Cette action est irréversible</p>
              </div>
            </div>
            <button onClick={() => setModal(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
              <Icon name="X" className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${editTarget.type === "in" ? "bg-emerald-50" : "bg-red-50"}`}>
              <Icon name={editTarget.type === "in" ? "ArrowDownLeft" : "ArrowUpRight"} className={`h-4 w-4 ${editTarget.type === "in" ? "text-emerald-600" : "text-red-500"}`} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-ink">{editTarget.label}</p>
              <p className="text-[12px] text-ink-soft">{shortDate(editTarget.entry_date)} · {editTarget.category}</p>
            </div>
            <p className={`text-[14px] font-bold ${editTarget.type === "in" ? "text-emerald-600" : "text-ink"}`} dir="ltr">
              {editTarget.type === "in" ? "+" : "−"}{num(Number(editTarget.amount), false)} MAD
            </p>
          </div>

          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
            <Icon name="AlertTriangle" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <p className="text-[12px] text-ink">
              Cette opération sera définitivement supprimée du journal. Les résidents ne la verront plus dans la transparence.
            </p>
          </div>

          <div className="mt-5 flex gap-2">
            <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50">
              Annuler
            </button>
            <button onClick={handleDelete} disabled={isPending} className="flex-1 rounded-xl bg-red-600 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {isPending ? "Suppression…" : "Supprimer définitivement"}
            </button>
          </div>
        </Overlay>
      )}

      {/* ── Modal: Période personnalisée ── */}
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
            {/* Mois */}
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

            {/* Année */}
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

            {/* Actions */}
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
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-[rise_0.25s_ease] rounded-lg bg-palier-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
