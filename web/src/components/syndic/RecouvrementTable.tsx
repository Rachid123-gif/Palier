"use client";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/syndic/ui";
import { mad, num, timeAgo, currentPeriod, shortDate, shortName } from "@/lib/format";
import { sendRelance, emitCharges, logDunning, syndicRecordPayment, updateChargeCall, deleteChargeCall, fetchBuildingPayments } from "@/lib/actions";
import { dunningMessage } from "@/lib/whatsapp";
import { longDate } from "@/lib/format";
import type { RecouvrementRow, ChargeCall } from "@/lib/syndic";

interface PaymentRecord { id: string; amount: number; method: string; note?: string; created_at: string; charge_id?: string }
interface ReceiptInfo { building: string; residentName: string; lot: string; amount: number; method: string; date: string; receiptId: string; chargeLabel?: string; chargeDueDate?: string }

const METHOD_LABELS: Record<string, string> = { cash: "Espèces", cheque: "Chèque", virement: "Virement", autre: "Autre" };

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
  const [view, setView] = useState<"suivi" | "historique" | "paiements">("suivi");
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

  // Payment modal
  const [showPayment, setShowPayment] = useState<RecouvrementRow | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"cash" | "cheque" | "virement" | "autre">("cash");
  const [payNote, setPayNote] = useState("");
  const [payPending, setPayPending] = useState(false);
  // Payment history tab
  const [payHistory, setPayHistory] = useState<PaymentRecord[]>([]);
  const [payHistoryLoaded, setPayHistoryLoaded] = useState(false);
  const [payHistoryLoading, setPayHistoryLoading] = useState(false);
  const [payHistSearch, setPayHistSearch] = useState("");
  // Receipt
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo | null>(null);
  // Edit charge call modal
  const [editCall, setEditCall] = useState<ChargeCall | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPending, setEditPending] = useState(false);
  // Delete charge call confirm
  const [deleteCallTarget, setDeleteCallTarget] = useState<ChargeCall | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  function resetEmit() { setEmitLabel(""); setEmitDetail(""); setEmitAmount(""); setEmitCategory(defaultCatValue); setEmitDueDate(""); }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!showPayment?.chargeId || !payAmount || payPending) return;
    setPayPending(true);
    const res = await syndicRecordPayment({
      chargeId: showPayment.chargeId,
      buildingId,
      profileId: showPayment.profileId || undefined,
      amount: Number(payAmount),
      method: payMethod,
      note: payNote || undefined,
    });
    setPayPending(false);
    if (res?.error) { flash(res.error === "already_paid" ? "Déjà payé" : res.error === "duplicate_payment" ? "Paiement déjà enregistré" : "Erreur lors de l'enregistrement"); return; }
    // Prepare receipt
    const receipt: ReceiptInfo = {
      building,
      residentName: showPayment.ownerName,
      lot: showPayment.ref,
      amount: Number(payAmount),
      method: payMethod,
      date: new Date().toLocaleDateString("fr-MA", { day: "2-digit", month: "long", year: "numeric" }),
      receiptId: res.paymentId ? `P-${res.paymentId.slice(0, 8).toUpperCase()}` : `P-${Date.now()}`,
      chargeLabel: res.chargeLabel,
      chargeDueDate: res.chargeDueDate,
    };
    setShowPayment(null); setPayAmount(""); setPayMethod("cash"); setPayNote("");
    setReceiptInfo(receipt);
    setPayHistoryLoaded(false); // force reload on next tab visit
    flash("Paiement enregistré");
    router.refresh();
  }

  async function loadPayHistory() {
    if (payHistoryLoaded) return;
    setPayHistoryLoading(true);
    const data = await fetchBuildingPayments(buildingId);
    setPayHistory(data as PaymentRecord[]);
    setPayHistoryLoaded(true);
    setPayHistoryLoading(false);
  }

  function printReceipt(info: ReceiptInfo) {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reçu ${info.receiptId}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;max-width:420px;margin:40px auto;padding:30px;border:1px solid #ddd;border-radius:8px}
.hd{text-align:center;border-bottom:2px solid #222;padding-bottom:16px;margin-bottom:20px}.hd h1{font-size:18px;letter-spacing:1px}.hd p{color:#666;font-size:13px;margin-top:4px}
.r{display:flex;justify-content:space-between;padding:5px 0;font-size:14px}.r .l{color:#666}.r .v{font-weight:600}
.amt{font-size:26px;text-align:center;margin:20px 0;padding:16px;background:#f0fdf4;border-radius:10px;color:#16a34a;font-weight:700}
.sep{border-top:1px dashed #ccc;margin:16px 0}.sig{margin-top:36px;text-align:center;color:#999;font-size:12px}.sig p:first-child{margin-bottom:6px}
@media print{body{border:none;margin:0}}</style></head><body>
<div class="hd"><h1>REÇU DE PAIEMENT</h1><p>${info.receiptId}</p></div>
<div class="r"><span class="l">Immeuble</span><span class="v">${info.building}</span></div>
<div class="r"><span class="l">Date</span><span class="v">${info.date}</span></div>
<div class="sep"></div>
<div class="r"><span class="l">Résident</span><span class="v">${info.residentName}</span></div>
<div class="r"><span class="l">Lot</span><span class="v">${info.lot}</span></div>
${info.chargeLabel ? `<div class="r"><span class="l">Objet</span><span class="v">${info.chargeLabel}</span></div>` : ""}
${info.chargeDueDate ? `<div class="r"><span class="l">Échéance</span><span class="v">${info.chargeDueDate}</span></div>` : ""}
<div class="amt">${new Intl.NumberFormat("fr-MA").format(info.amount)} MAD</div>
<div class="r"><span class="l">Mode de paiement</span><span class="v">${METHOD_LABELS[info.method] ?? info.method}</span></div>
<div class="sig"><p>________________________________</p><p>Signature du syndic</p></div>
</body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }

  async function handleEditCall(e: React.FormEvent) {
    e.preventDefault();
    if (!editCall) return;
    setEditPending(true);
    const res = await updateChargeCall({
      buildingId,
      originalLabel: editCall.label,
      originalDueDate: editCall.dueDate,
      label: editLabel || undefined,
      category: editCategory || undefined,
      dueDate: editDueDate || undefined,
    });
    setEditPending(false);
    if (res?.error) flash("Erreur lors de la modification");
    else { flash("Appel modifié"); setEditCall(null); router.refresh(); }
  }

  async function handleDeleteCall() {
    if (!deleteCallTarget) return;
    setDeletePending(true);
    const res = await deleteChargeCall(buildingId, deleteCallTarget.label, deleteCallTarget.dueDate);
    setDeletePending(false);
    if (res?.error) flash("Erreur lors de la suppression");
    else { flash("Appel supprimé"); setDeleteCallTarget(null); router.refresh(); }
  }

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
    const parts = [
      `Bonjour ${r.ownerName.split(" ")[0]},`,
      `Votre cotisation pour ${building} (Lot ${r.ref}) reste en attente.`,
      `• Montant dû : ${r.amount.toLocaleString("fr-MA")} MAD`,
      r.paid > 0 ? `• Déjà payé : ${r.paid.toLocaleString("fr-MA")} MAD` : null,
      r.paid > 0 ? `• Reste à régler : ${remaining.toLocaleString("fr-MA")} MAD` : null,
      r.dueDate ? `• Échéance : ${shortDate(r.dueDate)}` : null,
      `Merci de régulariser votre situation.`,
    ];
    return parts.filter(Boolean).join("\n");
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
      amount: r.amount,
      paid: r.paid,
      remaining,
      period: currentPeriod(),
      building,
      lot: r.ref,
      dueDate: r.dueDate ? shortDate(r.dueDate) : undefined,
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
        {([["suivi", "Suivi", "Suivi des paiements"], ["historique", "Appels", "Historique des appels"], ["paiements", "Paiements", "Historique des paiements"]] as const).map(([key, mobileLabel, label]) => (
          <button
            key={key}
            onClick={() => { setView(key); if (key === "paiements") loadPayHistory(); }}
            className={`relative whitespace-nowrap pb-2.5 text-[13px] font-semibold transition-colors ${view === key ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
          >
            <span className="sm:hidden">{mobileLabel}</span>
            <span className="hidden sm:inline">{label}</span>
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
      <div className="no-scrollbar mb-3 flex items-center gap-2 overflow-x-auto border-b border-black/[0.06] sm:gap-3">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(0); }}
            className={`relative whitespace-nowrap pb-2.5 text-[12px] font-semibold transition-colors sm:text-[13px] ${statusFilter === tab.key ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
          >
            {tab.label}
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold sm:ml-1.5 sm:text-[11px] ${statusFilter === tab.key ? "bg-palier-50 text-palier-700" : "text-ink-faint"}`}>{statusCounts[tab.key]}</span>
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
      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
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
            <table className="hidden w-full text-left text-[13px] lg:table">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="px-3 py-2.5">Lot</th>
                  <th className="px-3 py-2.5">Résident</th>
                  <th className="px-3 py-2.5">Montant</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Échéance</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Statut</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Dernière relance</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {pageRows.map((r) => {
                  const remaining = r.amount - r.paid;
                  const isPaid = r.status === "paid";
                  const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && !isPaid;
                  return (
                    <tr key={r.unitId} className={`transition-colors hover:bg-sand/50 ${isPaid ? "opacity-60" : ""}`}>
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium text-ink">{r.ref}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: r.avatarColor }}>
                            {r.ownerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-ink">{shortName(r.ownerName)}</p>
                            <p className="text-[11px] text-ink-soft">{r.role === "tenant" ? "Locataire" : "Propriétaire"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <p className="font-medium text-ink">{mad(r.amount, { decimals: false })}</p>
                        {r.status === "partial" && <p className="text-[11px] text-blue-600">{mad(remaining, { decimals: false })} restant</p>}
                      </td>
                      <td className={`whitespace-nowrap px-3 py-2.5 text-[12px] ${isOverdue ? "font-semibold text-red-600" : "text-ink-soft"}`}>
                        {r.dueDate ? shortDate(r.dueDate) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5"><StatusPill status={r.status} /></td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-ink-soft">{r.lastDunnedAt ? timeAgo(r.lastDunnedAt) : "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {!isPaid && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setShowPayment(r); setPayAmount((r.amount - r.paid).toString()); }}
                              disabled={!r.chargeId}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
                            >
                              <Icon name="Banknote" className="h-3 w-3" /> Encaisser
                            </button>
                            <button
                              onClick={() => relance(r)}
                              disabled={!r.profileId}
                              className="inline-flex items-center gap-1 rounded-md bg-palier-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-palier-700 disabled:opacity-40"
                            >
                              <Icon name="Bell" className="h-3 w-3" /> Relancer
                            </button>
                            <button
                              onClick={() => relanceWhatsApp(r)}
                              disabled={!r.phone}
                              className="inline-flex items-center gap-1 rounded-md bg-[#25D366] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#1da851] disabled:opacity-40"
                            >
                              <Icon name="MessageCircle" className="h-3 w-3" /> WhatsApp
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-black/[0.04] lg:hidden">
              {pageRows.map((r) => {
                const remaining = r.amount - r.paid;
                const isPaid = r.status === "paid";
                const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && !isPaid;
                return (
                  <div key={r.unitId} className={`p-3 ${isPaid ? "opacity-60" : ""}`}>
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: r.avatarColor }}>
                        {r.ownerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[13px] font-semibold text-ink">{shortName(r.ownerName)}</p>
                          <StatusPill status={r.status} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink-soft">Lot {r.ref} · {r.role === "tenant" ? "Locataire" : "Propriétaire"}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px]">
                          <span className="font-semibold text-ink">{mad(r.amount, { decimals: false })}</span>
                          {r.status === "partial" && <span className="text-blue-600">{mad(remaining, { decimals: false })} restant</span>}
                          {r.dueDate && (
                            <span className={isOverdue ? "font-semibold text-red-600" : "text-ink-soft"}>{shortDate(r.dueDate)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isPaid && (
                      <div className="mt-2 flex items-center gap-1.5 pl-[42px]">
                        <button onClick={() => { setShowPayment(r); setPayAmount((r.amount - r.paid).toString()); }} disabled={!r.chargeId} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40">
                          <Icon name="Banknote" className="h-3 w-3" /> Encaisser
                        </button>
                        <button onClick={() => relance(r)} disabled={!r.profileId} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-palier-600 px-2 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40">
                          <Icon name="Bell" className="h-3 w-3" /> Relancer
                        </button>
                        <button onClick={() => relanceWhatsApp(r)} disabled={!r.phone} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40">
                          <Icon name="MessageCircle" className="h-3 w-3" /> WA
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center gap-2 border-t border-black/[0.06] px-4 py-2.5 text-[12px] text-ink-soft sm:flex-row sm:justify-between">
              <span className="shrink-0">{safePage * PER_PAGE + 1}–{Math.min((safePage + 1) * PER_PAGE, filtered.length)} sur {filtered.length}</span>
              {pages > 1 && (
                <div className="flex flex-wrap justify-center gap-1">
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
      ) : view === "historique" ? (
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
            <table className="hidden w-full text-left text-[13px] lg:table">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-2.5">Libellé</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">Catégorie</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">Montant / lot</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">Échéance</th>
                  <th className="px-4 py-2.5 w-[140px]">Paiement</th>
                  <th className="px-4 py-2.5 text-right whitespace-nowrap">Actions</th>
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
                      <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">{catLabels[c.category] ?? c.category}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium text-ink">{mad(c.amount, { decimals: false })}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">{c.dueDate ? shortDate(c.dueDate) : "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-sand/50">
                            <div className="h-full rounded-full bg-palier-600" style={{ width: `${paidRate}%` }} />
                          </div>
                          <span className="text-[11px] font-medium text-ink-soft">{c.paid}/{c.lots}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setEditCall(c); setEditLabel(c.label); setEditCategory(c.category); setEditDueDate(c.dueDate); }}
                            className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-white px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:bg-sand/50 hover:text-ink"
                          >
                            <Icon name="Pencil" className="h-3 w-3" /> Modifier
                          </button>
                          <button
                            onClick={() => setDeleteCallTarget(c)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Icon name="Trash2" className="h-3 w-3" /> Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-black/[0.04] lg:hidden">
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
                      <button onClick={() => { setEditCall(c); setEditLabel(c.label); setEditCategory(c.category); setEditDueDate(c.dueDate); }} className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-white px-2 py-1 text-[11px] font-medium text-ink-soft hover:text-ink">
                        <Icon name="Pencil" className="h-3 w-3" /> Modifier
                      </button>
                      <button onClick={() => setDeleteCallTarget(c)} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] font-medium text-red-500 hover:text-red-600">
                        <Icon name="Trash2" className="h-3 w-3" /> Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      {/* Hist period picker modal */}
      {histPeriodOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setHistPeriodOpen(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
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
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
      ) : view === "paiements" ? (() => {
        const chargeMap = new Map<string, RecouvrementRow>();
        rows.forEach((r) => { if (r.chargeId) chargeMap.set(r.chargeId, r); });
        const filteredPayments = payHistSearch.trim()
          ? payHistory.filter((p) => {
              const row = p.charge_id ? chargeMap.get(p.charge_id) : null;
              const q = payHistSearch.toLowerCase();
              return row?.ownerName.toLowerCase().includes(q) || row?.ref.toLowerCase().includes(q) || (p.note?.toLowerCase().includes(q));
            })
          : payHistory;
        return (
          <div>
            <div className="mb-3 relative">
              <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                value={payHistSearch}
                onChange={(e) => setPayHistSearch(e.target.value)}
                placeholder="Rechercher par nom, lot ou note…"
                className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
              />
              {payHistSearch && (
                <button onClick={() => setPayHistSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
                  <Icon name="X" className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="mb-3 text-[12px] text-ink-soft">{filteredPayments.length} paiement{filteredPayments.length > 1 ? "s" : ""}</p>

            {payHistoryLoading ? (
              <div className="rounded-2xl border border-black/[0.06] bg-cream-card py-12 text-center shadow-card">
                <Icon name="LoaderCircle" className="mx-auto h-8 w-8 animate-spin text-ink-faint" />
                <p className="mt-2 text-[13px] text-ink-soft">Chargement…</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="rounded-2xl border border-black/[0.06] bg-cream-card py-12 text-center shadow-card">
                <Icon name="Receipt" className="mx-auto h-8 w-8 text-ink-faint" />
                <p className="mt-2 text-[13px] text-ink-soft">{payHistory.length === 0 ? "Aucun paiement enregistré" : "Aucun résultat"}</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
                {/* Desktop table */}
                <table className="hidden w-full text-left text-[13px] lg:table">
                  <thead>
                    <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Résident</th>
                      <th className="px-3 py-2.5">Lot</th>
                      <th className="px-3 py-2.5">Montant</th>
                      <th className="px-3 py-2.5">Mode</th>
                      <th className="px-3 py-2.5">Note</th>
                      <th className="px-3 py-2.5 text-right">Reçu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {filteredPayments.map((p) => {
                      const row = p.charge_id ? chargeMap.get(p.charge_id) : null;
                      return (
                        <tr key={p.id} className="transition-colors hover:bg-sand/50">
                          <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">{longDate(p.created_at)}</td>
                          <td className="px-3 py-2.5">
                            {row ? (
                              <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: row.avatarColor }}>
                                  {row.ownerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                                </span>
                                <span className="text-ink">{shortName(row.ownerName)}</span>
                              </div>
                            ) : <span className="text-ink-soft">—</span>}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-medium text-ink">{row?.ref ?? "—"}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-emerald-600">{mad(p.amount, { decimals: false })}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">{METHOD_LABELS[p.method] ?? p.method}</td>
                          <td className="px-3 py-2.5 text-[12px] text-ink-soft max-w-[200px] truncate">{p.note || "—"}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right">
                            <button
                              onClick={() => printReceipt({
                                building,
                                residentName: row?.ownerName ?? "—",
                                lot: row?.ref ?? "—",
                                amount: p.amount,
                                method: p.method,
                                date: new Date(p.created_at).toLocaleDateString("fr-MA", { day: "2-digit", month: "long", year: "numeric" }),
                                receiptId: `P-${p.id.slice(0, 8).toUpperCase()}`,
                              })}
                              className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-white px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:bg-sand/50 hover:text-ink"
                            >
                              <Icon name="Printer" className="h-3 w-3" /> Imprimer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile cards */}
                <div className="divide-y divide-black/[0.04] lg:hidden">
                  {filteredPayments.map((p) => {
                    const row = p.charge_id ? chargeMap.get(p.charge_id) : null;
                    return (
                      <div key={p.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {row && (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: row.avatarColor }}>
                                {row.ownerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                              </span>
                            )}
                            <div>
                              <p className="text-[14px] font-medium text-ink">{row ? shortName(row.ownerName) : "—"}</p>
                              <p className="text-[12px] text-ink-soft">Lot {row?.ref ?? "—"} · {longDate(p.created_at)}</p>
                            </div>
                          </div>
                          <p className="text-[14px] font-semibold text-emerald-600">{mad(p.amount, { decimals: false })}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[12px] text-ink-soft">
                            <span>{METHOD_LABELS[p.method] ?? p.method}</span>
                            {p.note && <span className="italic">· {p.note}</span>}
                          </div>
                          <button
                            onClick={() => printReceipt({
                              building,
                              residentName: row?.ownerName ?? "—",
                              lot: row?.ref ?? "—",
                              amount: p.amount,
                              method: p.method,
                              date: new Date(p.created_at).toLocaleDateString("fr-MA", { day: "2-digit", month: "long", year: "numeric" }),
                              receiptId: `P-${p.id.slice(0, 8).toUpperCase()}`,
                            })}
                            className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-white px-2 py-1 text-[11px] font-medium text-ink-soft hover:text-ink"
                          >
                            <Icon name="Printer" className="h-3 w-3" /> Reçu
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })() : null}

      {/* Emit charges modal */}
      {showEmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => { setShowEmit(false); resetEmit(); }}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setPeriodOpen(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
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
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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

      {/* Payment modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => { setShowPayment(null); setPayAmount(""); setPayMethod("cash"); setPayNote(""); }}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <Icon name="Banknote" className="h-5 w-5 text-emerald-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">Enregistrer un paiement</h2>
                  <p className="text-[12px] text-ink-soft">Lot {showPayment.ref} · {showPayment.ownerName}</p>
                </div>
              </div>
              <button onClick={() => { setShowPayment(null); setPayAmount(""); setPayMethod("cash"); setPayNote(""); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 rounded-xl bg-black/[0.02] p-3.5 space-y-1.5">
              <div className="flex justify-between text-[13px]"><span className="text-ink-soft">Montant total</span><span className="font-semibold text-ink">{mad(showPayment.amount, { decimals: false })}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-ink-soft">Déjà payé</span><span className="font-semibold text-ink">{mad(showPayment.paid, { decimals: false })}</span></div>
              <div className="flex justify-between text-[13px] border-t border-black/[0.06] pt-1.5"><span className="text-ink-soft">Reste à payer</span><span className="font-bold text-emerald-600">{mad(showPayment.amount - showPayment.paid, { decimals: false })}</span></div>
            </div>
            <form onSubmit={handlePayment} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Montant reçu (MAD)</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} min="1" max={showPayment.amount - showPayment.paid} step="0.01" required className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Mode de paiement</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([["cash", "Espèces"], ["cheque", "Chèque"], ["virement", "Virement"], ["autre", "Autre"]] as const).map(([key, label]) => (
                    <button key={key} type="button" onClick={() => setPayMethod(key)} className={`rounded-xl py-2 text-[13px] font-semibold transition-colors ${payMethod === key ? "bg-emerald-600 text-white" : "border border-black/[0.08] bg-white text-ink hover:bg-sand/50"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Note (optionnel)</label>
                <input type="text" value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Ex : chèque n°12345, reçu en main propre…" className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20" />
              </div>
              <button type="submit" disabled={payPending || !payAmount || Number(payAmount) <= 0} className="w-full rounded-xl bg-emerald-600 py-2.5 text-[13px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {payPending ? "Enregistrement…" : "Enregistrer le paiement"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit charge call modal */}
      {editCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setEditCall(null)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                  <Icon name="Pencil" className="h-5 w-5 text-palier-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">Modifier l&apos;appel</h2>
                  <p className="text-[12px] text-ink-soft">Modification appliquée à {editCall.lots} lot{editCall.lots > 1 ? "s" : ""}</p>
                </div>
              </div>
              <button onClick={() => setEditCall(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEditCall} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Libellé</label>
                <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} required className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Catégorie</label>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20">
                    {effectiveChargeCats.map((cat) => (
                      <option key={cat} value={cat.toLowerCase().replace(/\s+/g, "_")}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Date d&apos;échéance</label>
                  <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} required className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
                </div>
              </div>
              <button type="submit" disabled={editPending} className="w-full rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50">
                {editPending ? "Modification…" : "Enregistrer les modifications"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete charge call confirmation */}
      {deleteCallTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setDeleteCallTarget(null)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <Icon name="Trash2" className="h-5 w-5 text-red-600" />
              </span>
              <div>
                <h2 className="text-[16px] font-semibold text-ink">Supprimer l&apos;appel</h2>
                <p className="text-[12px] text-ink-soft">{deleteCallTarget.label}</p>
              </div>
            </div>
            <p className="mb-5 rounded-xl bg-red-50 p-3 text-[13px] text-red-800">
              Cette action supprimera les charges de <strong>{deleteCallTarget.lots} lot{deleteCallTarget.lots > 1 ? "s" : ""}</strong> pour cet appel. Les paiements déjà enregistrés seront également supprimés. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCallTarget(null)} className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50">
                Annuler
              </button>
              <button onClick={handleDeleteCall} disabled={deletePending} className="flex-1 rounded-xl bg-red-600 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deletePending ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt modal (after payment success) */}
      {receiptInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setReceiptInfo(null)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <Icon name="CheckCircle" className="h-5 w-5 text-emerald-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">Paiement enregistré</h2>
                  <p className="text-[12px] text-ink-soft">{receiptInfo.receiptId}</p>
                </div>
              </div>
              <button onClick={() => setReceiptInfo(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-xl border border-black/[0.06] bg-white p-4 space-y-2.5">
              <div className="flex justify-between text-[13px]"><span className="text-ink-soft">Immeuble</span><span className="font-medium text-ink">{receiptInfo.building}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-ink-soft">Résident</span><span className="font-medium text-ink">{receiptInfo.residentName}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-ink-soft">Lot</span><span className="font-medium text-ink">{receiptInfo.lot}</span></div>
              {receiptInfo.chargeLabel && <div className="flex justify-between text-[13px]"><span className="text-ink-soft">Objet</span><span className="font-medium text-ink">{receiptInfo.chargeLabel}</span></div>}
              {receiptInfo.chargeDueDate && <div className="flex justify-between text-[13px]"><span className="text-ink-soft">Échéance</span><span className="font-medium text-ink">{receiptInfo.chargeDueDate}</span></div>}
              <div className="border-t border-black/[0.06] pt-2.5 flex justify-between text-[13px]"><span className="text-ink-soft">Mode</span><span className="font-medium text-ink">{METHOD_LABELS[receiptInfo.method] ?? receiptInfo.method}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-ink-soft">Date</span><span className="font-medium text-ink">{receiptInfo.date}</span></div>
              <div className="text-center pt-2">
                <p className="text-[22px] font-bold text-emerald-600">{mad(receiptInfo.amount, { decimals: false })}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setReceiptInfo(null)} className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50">
                Fermer
              </button>
              <button onClick={() => printReceipt(receiptInfo)} className="flex-1 rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 inline-flex items-center justify-center gap-1.5">
                <Icon name="Printer" className="h-3.5 w-3.5" /> Imprimer le reçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-[rise_0.25s_ease] rounded-lg bg-palier-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">{toast}</div>}
    </div>
  );
}
