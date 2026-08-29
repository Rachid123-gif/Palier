"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/syndic/ui";
import { PageHeader } from "@/components/syndic/ui";
import { mad, num, timeAgo, currentPeriod, shortDate, shortName } from "@/lib/format";
import { sendRelance, emitCharges, logDunning, syndicRecordPayment, updateChargeCall, deleteChargeCall, fetchBuildingPayments } from "@/lib/actions";
import { dunningMessage } from "@/lib/whatsapp";
import { longDate } from "@/lib/format";
import { useLang } from "@/lib/LangProvider";
import type { RecouvrementRow, ChargeCall } from "@/lib/syndic";

interface PaymentRecord { id: string; amount: number; method: string; note?: string; created_at: string; charge_id?: string }
interface ReceiptInfo { building: string; residentName: string; lot: string; amount: number; method: string; date: string; receiptId: string; chargeLabel?: string; chargeDueDate?: string }

const PER_PAGE = 15;

export function RecouvrementTable({ rows, building, buildingId, chargeCalls, chargeCategories, relanceMessage }: { rows: RecouvrementRow[]; building: string; buildingId: string; chargeCalls: ChargeCall[]; chargeCategories?: string[] | null; relanceMessage?: string | null }) {
  const { i, lang } = useLang();
  const T = i.syndic.recouvrement;
  const C = i.syndic.common;
  const MONTHS = i.months;
  const METHOD_LABELS: Record<string, string> = T.methods;
  const statusTabs: { key: "all" | "late" | "due" | "partial" | "paid"; label: string }[] = [
    { key: "all", label: T.statusTabs.all },
    { key: "late", label: T.statusTabs.late },
    { key: "due", label: T.statusTabs.due },
    { key: "partial", label: T.statusTabs.partial },
    { key: "paid", label: T.statusTabs.paid },
  ];
  const effectiveChargeCats = chargeCategories?.length ? chargeCategories : T.defaultChargeCats;
  const [localRows, setLocalRows] = useState<RecouvrementRow[]>(rows);
  useEffect(() => { setLocalRows(rows); }, [rows]);
  const [localCalls, setLocalCalls] = useState<ChargeCall[]>(chargeCalls);
  useEffect(() => { setLocalCalls(chargeCalls); }, [chargeCalls]);
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
  const [emitDistribution, setEmitDistribution] = useState<"tantiemes" | "flat">("tantiemes");
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

  function resetEmit() { setEmitLabel(""); setEmitDetail(""); setEmitAmount(""); setEmitCategory(defaultCatValue); setEmitDueDate(""); setEmitDistribution("tantiemes"); }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!showPayment?.chargeId || !payAmount || payPending) return;
    setPayPending(true);
    try {
      const res = await syndicRecordPayment({
        chargeId: showPayment.chargeId,
        buildingId,
        profileId: showPayment.profileId || undefined,
        amount: Number(payAmount),
        method: payMethod,
        note: payNote || undefined,
      });
      setPayPending(false);
      if (res?.error) { flash(res.error === "already_paid" ? T.paymentErrors.alreadyPaid : res.error === "duplicate_payment" ? T.paymentErrors.duplicate : T.paymentErrors.generic); return; }
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
      setLocalRows((prev) => prev.map((r) => r.unitId === showPayment.unitId ? { ...r, paid: r.paid + Number(payAmount), status: (r.paid + Number(payAmount) >= r.amount ? "paid" : "partial") as any } : r));
      setShowPayment(null); setPayAmount(""); setPayMethod("cash"); setPayNote("");
      setReceiptInfo(receipt);
      setPayHistoryLoaded(false);
      flash(T.paymentRecorded);
    } catch { setPayPending(false); flash(C.networkError); }
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
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(T.printTitle)} ${esc(info.receiptId)}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;max-width:420px;margin:40px auto;padding:30px;border:1px solid #ddd;border-radius:8px}
.hd{text-align:center;border-bottom:2px solid #222;padding-bottom:16px;margin-bottom:20px}.hd h1{font-size:18px;letter-spacing:1px}.hd p{color:#666;font-size:13px;margin-top:4px}
.r{display:flex;justify-content:space-between;padding:5px 0;font-size:14px}.r .l{color:#666}.r .v{font-weight:600;direction:ltr}
.amt{font-size:26px;text-align:center;margin:20px 0;padding:16px;background:#f0fdf4;border-radius:10px;color:#16a34a;font-weight:700}
.sep{border-top:1px dashed #ccc;margin:16px 0}.sig{margin-top:36px;text-align:center;color:#999;font-size:12px}.sig p:first-child{margin-bottom:6px}
@media print{body{border:none;margin:0}}</style></head><body>
<div class="hd"><h1>${esc(T.printTitle)}</h1><p dir="ltr">${esc(info.receiptId)}</p></div>
<div class="r"><span class="l">${esc(T.printBuilding)}</span><span class="v">${esc(info.building)}</span></div>
<div class="r"><span class="l">${esc(T.printDate)}</span><span class="v">${esc(info.date)}</span></div>
<div class="sep"></div>
<div class="r"><span class="l">${esc(T.printResident)}</span><span class="v">${esc(info.residentName)}</span></div>
<div class="r"><span class="l">${esc(T.printLot)}</span><span class="v">${esc(info.lot)}</span></div>
${info.chargeLabel ? `<div class="r"><span class="l">${esc(T.printObjet)}</span><span class="v">${esc(info.chargeLabel)}</span></div>` : ""}
${info.chargeDueDate ? `<div class="r"><span class="l">${esc(T.printEcheance)}</span><span class="v">${esc(info.chargeDueDate)}</span></div>` : ""}
<div class="amt" dir="ltr">${new Intl.NumberFormat("fr-MA").format(info.amount)} MAD</div>
<div class="r"><span class="l">${esc(T.printPaymentMode)}</span><span class="v">${esc(METHOD_LABELS[info.method] ?? info.method)}</span></div>
<div class="sig"><p>________________________________</p><p>${esc(T.printSignature)}</p></div>
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
    try { const res = await updateChargeCall({
      buildingId,
      originalLabel: editCall.label,
      originalDueDate: editCall.dueDate,
      label: editLabel || undefined,
      category: editCategory || undefined,
      dueDate: editDueDate || undefined,
    });
    setEditPending(false);
    if (res?.error) flash(T.editError);
    else {
      setLocalCalls((prev) => prev.map((c) => c.label === editCall.label && c.dueDate === editCall.dueDate ? { ...c, label: editLabel || c.label, category: editCategory || c.category, dueDate: editDueDate || c.dueDate } : c));
      flash(T.editSuccess); setEditCall(null);
    }
    } catch { setEditPending(false); flash(C.networkError); }
  }

  async function handleDeleteCall() {
    if (!deleteCallTarget) return;
    setDeletePending(true);
    try {
      const res = await deleteChargeCall(buildingId, deleteCallTarget.label, deleteCallTarget.dueDate);
      setDeletePending(false);
      if (res?.error) flash(T.deleteError);
      else {
        setLocalCalls((prev) => prev.filter((c) => !(c.label === deleteCallTarget.label && c.dueDate === deleteCallTarget.dueDate)));
        flash(T.deleteSuccess); setDeleteCallTarget(null);
      }
    } catch { setDeletePending(false); flash(C.networkError); }
  }

  async function handleEmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emitLabel || !emitAmount || !emitDueDate) return;
    setEmitPending(true);
    try {
      const res = await emitCharges({ buildingId, label: emitLabel, detail: emitDetail, amount: Number(emitAmount), category: emitCategory, dueDate: emitDueDate, distribution: emitDistribution });
      setEmitPending(false);
      if (res?.error) {
        flash(T.emitError);
      } else {
        const amt = Number(emitAmount);
        const totalTantiemes = localRows.reduce((s, r) => s + r.tantiemes, 0);
        const useTantiemes = emitDistribution === "tantiemes" && totalTantiemes > 0;
        const callTotal = useTantiemes ? amt : amt * localRows.length;
        const newCall: ChargeCall = { label: emitLabel, detail: emitDetail || undefined, category: emitCategory, dueDate: emitDueDate, amount: amt, createdAt: new Date().toISOString(), lots: localRows.length, paid: 0, paidAmount: 0, total: callTotal };
        setLocalCalls((prev) => [newCall, ...prev]);
        setLocalRows((prev) => prev.map((r) => {
          const unitAmt = useTantiemes ? Math.round((amt * r.tantiemes / totalTantiemes) * 100) / 100 : amt;
          return { ...r, amount: r.amount + unitAmt, status: "due" as any, dueDate: r.dueDate || emitDueDate };
        }));
        flash(T.emitSuccess(localRows.length)); setShowEmit(false); resetEmit();
      }
    } catch (err) { setEmitPending(false); flash(T.genericError(err instanceof Error ? err.message : T.errorUnknown)); }
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
      r.dueDate ? `• Échéance : ${shortDate(r.dueDate, lang)}` : null,
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
      title: T.reminderTitle(currentPeriod(lang)),
      body: relanceBody(r),
    });
    flash(T.relanceSentInApp);
  }

  async function relanceWhatsApp(r: RecouvrementRow) {
    if (!r.phone) return;
    const remaining = r.amount - r.paid;
    const msg = dunningMessage({
      name: r.ownerName.split(" ")[0],
      amount: r.amount,
      paid: r.paid,
      remaining,
      period: currentPeriod(lang),
      building,
      lot: r.ref,
      dueDate: r.dueDate ? shortDate(r.dueDate, lang) : undefined,
    });
    // Log the dunning in DB
    await logDunning({ buildingId, unitId: r.unitId, channel: "whatsapp", message: msg });
    // Open WhatsApp deeplink
    const digits = r.phone.replace(/[^0-9]/g, "");
    const waDigits = digits.startsWith("0") ? "212" + digits.slice(1) : digits;
    window.open(`https://wa.me/${waDigits}?text=${encodeURIComponent(msg)}`, "_blank");
    flash(T.whatsappOpened);
  }

  async function relanceAll() {
    const targets = filtered.filter((r) => r.status !== "paid" && r.profileId);
    if (targets.length === 0) return;
    setBusy(true);
    await Promise.all(targets.map((r) => sendRelance({
      buildingId,
      unitId: r.unitId,
      profileId: r.profileId!,
      title: T.reminderTitle(currentPeriod(lang)),
      body: relanceBody(r),
    })));
    setBusy(false);
    flash(T.relanceSentCount(targets.length));
  }

  // Years in data
  const years = useMemo(() => {
    const yrs = new Set(localRows.filter((r) => r.dueDate).map((r) => new Date(r.dueDate!).getFullYear().toString()));
    return [...yrs].sort().reverse();
  }, [localRows]);

  const customLabel = periodFilter === "custom"
    ? [periodMonth ? MONTHS[parseInt(periodMonth)]?.slice(0, 4) + "." : "", periodYear].filter(Boolean).join(" ") || T.periods.periode
    : T.periods.periode;

  // Period filtered
  const periodFiltered = useMemo(() => {
    const now = new Date();
    let result = [...localRows];
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
  }, [localRows, periodFilter, periodMonth, periodYear]);

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
    const h = T.csvHeaders;
    const header = `${h.lot},${h.resident},${h.role},${h.telephone},${h.montant},${h.paye},${h.restant},${h.statut},${h.derniereRelance}`;
    const csvRows = filtered.map((r) => {
      const statusLabel = T.statuses[r.status as keyof typeof T.statuses] ?? r.status;
      return `${r.ref},"${r.ownerName.replace(/"/g, '""')}",${r.role === "tenant" ? T.roles.tenant : T.roles.owner},${r.phone},${r.amount},${r.paid},${r.amount - r.paid},${statusLabel},${r.lastDunnedAt ? r.lastDunnedAt.split("T")[0] : ""}`;
    });
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `palier-recouvrement-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    flash(T.csvExported);
  }

  function resetFilters() {
    setPeriodFilter("tout"); setPeriodMonth(""); setPeriodYear("");
    setStatusFilter("all"); setSearch(""); setPage(0);
  }

  return (
    <div>
      <PageHeader
        title={i.syndic.shell.recouvrement}
        subtitle={`${rows.length} ${T.lots} · ${currentPeriod(lang)}`}
      />
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Scale" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">
          {T.legalInfo}
        </p>
      </div>
      {/* View toggle */}
      <div className="no-scrollbar mb-4 flex items-center gap-3 overflow-x-auto border-b border-black/[0.06]">
        {([["suivi", T.tabs.suivi, T.tabs.suiviFull], ["historique", T.tabs.historique, T.tabs.historiqueFull], ["paiements", T.tabs.paiements, T.tabs.paiementsFull]] as const).map(([key, mobileLabel, label]) => (
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
        {([["tout", T.periods.tout], ["mois", T.periods.mois], ["3mois", T.periods.troisMois], ["6mois", T.periods.sixMois]] as const).map(([key, label]) => (
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
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.totalAppele}</p>
          <p dir="ltr" className="text-[22px] font-bold leading-none text-ink">{num(totalDue, false)}<span className="ml-1 text-[12px] font-medium text-ink-soft">MAD</span></p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.encaisse}</p>
          <p dir="ltr" className="text-[22px] font-bold leading-none text-ink">{num(totalPaid, false)}<span className="ml-1 text-[12px] font-medium text-ink-soft">MAD</span></p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.restant}</p>
          <p dir="ltr" className="text-[22px] font-bold leading-none text-ink">{num(totalRemaining, false)}<span className="ml-1 text-[12px] font-medium text-ink-soft">MAD</span></p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.tauxRecouvrement}</p>
          <p dir="ltr" className="text-[22px] font-bold leading-none text-ink">{rate}%</p>
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
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold sm:ml-1.5 sm:text-[11px] ${statusFilter === tab.key ? "bg-palier-50 text-palier-700" : "text-ink-faint"}`}><span dir="ltr">{statusCounts[tab.key]}</span></span>
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
            placeholder={T.searchPlaceholder}
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
            <Icon name="Plus" className="h-3.5 w-3.5" /> {T.emettre}
          </button>
          <button onClick={exportCSV} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-ink transition-colors hover:bg-sand/50">
            <Icon name="Download" className="h-3.5 w-3.5" /> {T.exporter}
          </button>
          {unpaidFiltered > 0 && (
            <button
              onClick={relanceAll}
              disabled={busy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-palier-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-palier-700 disabled:opacity-50"
            >
              <Icon name={busy ? "LoaderCircle" : "Send"} className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
              {T.relancerCount(unpaidFiltered)}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="Search" className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-2 text-[13px] text-ink-soft">{C.noResults}</p>
            <button onClick={resetFilters} className="mt-1 text-[13px] font-medium text-palier-600">
              {C.resetFilters}
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-left text-[13px] lg:table">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="px-3 py-2.5">{T.headers.lot}</th>
                  <th className="px-3 py-2.5">{T.headers.resident}</th>
                  <th className="px-3 py-2.5">{T.headers.montant}</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">{T.headers.echeance}</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">{T.headers.statut}</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">{T.headers.derniereRelance}</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">{T.headers.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {pageRows.map((r) => {
                  const remaining = r.amount - r.paid;
                  const isPaid = r.status === "paid";
                  const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && !isPaid;
                  return (
                    <tr key={r.unitId} className={`transition-colors hover:bg-sand/50 ${isPaid ? "opacity-60" : ""}`}>
                      <td dir="ltr" className="whitespace-nowrap px-3 py-2.5 font-medium text-ink">{r.ref}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: r.avatarColor }}>
                            {r.ownerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-ink">{shortName(r.ownerName)}</p>
                            <p className="text-[11px] text-ink-soft">{r.role === "tenant" ? T.roles.tenant : T.roles.owner}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <p dir="ltr" className="font-medium text-ink">{mad(r.amount, { decimals: false })}</p>
                        {r.status === "partial" && <p dir="ltr" className="text-[11px] text-blue-600">{mad(remaining, { decimals: false })} {T.restantSuffix}</p>}
                      </td>
                      <td className={`whitespace-nowrap px-3 py-2.5 text-[12px] ${isOverdue ? "font-semibold text-red-600" : "text-ink-soft"}`}>
                        {r.dueDate ? shortDate(r.dueDate, lang) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5"><StatusPill status={r.status} /></td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-ink-soft">{r.lastDunnedAt ? timeAgo(r.lastDunnedAt, lang) : "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {!isPaid && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setShowPayment(r); setPayAmount((r.amount - r.paid).toString()); }}
                              disabled={!r.chargeId}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
                            >
                              <Icon name="Banknote" className="h-3 w-3" /> {T.encaisser}
                            </button>
                            <button
                              onClick={() => relance(r)}
                              disabled={!r.profileId}
                              className="inline-flex items-center gap-1 rounded-md bg-palier-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-palier-700 disabled:opacity-40"
                            >
                              <Icon name="Bell" className="h-3 w-3" /> {T.relancer}
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
                        <p className="mt-0.5 text-[11px] text-ink-soft">{T.headers.lot} <span dir="ltr">{r.ref}</span> · {r.role === "tenant" ? T.roles.tenant : T.roles.owner}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px]">
                          <span dir="ltr" className="font-semibold text-ink">{mad(r.amount, { decimals: false })}</span>
                          {r.status === "partial" && <span dir="ltr" className="text-blue-600">{mad(remaining, { decimals: false })} {T.restantSuffix}</span>}
                          {r.dueDate && (
                            <span className={isOverdue ? "font-semibold text-red-600" : "text-ink-soft"}>{shortDate(r.dueDate, lang)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isPaid && (
                      <div className="mt-2 flex items-center gap-1.5 pl-[42px]">
                        <button onClick={() => { setShowPayment(r); setPayAmount((r.amount - r.paid).toString()); }} disabled={!r.chargeId} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40">
                          <Icon name="Banknote" className="h-3 w-3" /> {T.encaisser}
                        </button>
                        <button onClick={() => relance(r)} disabled={!r.profileId} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-palier-600 px-2 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40">
                          <Icon name="Bell" className="h-3 w-3" /> {T.relancer}
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
              <span dir="ltr" className="shrink-0">{safePage * PER_PAGE + 1}–{Math.min((safePage + 1) * PER_PAGE, filtered.length)} / {filtered.length}</span>
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
        const catLabels: Record<string, string> = T.catLabels;
        const histCategories = [...new Set(localCalls.map((c) => c.category))];
        const histYears = [...new Set(localCalls.filter((c) => c.dueDate).map((c) => new Date(c.dueDate).getFullYear().toString()))].sort().reverse();
        const histCustomLabel = histPeriod === "custom"
          ? [histPeriodMonth ? MONTHS[parseInt(histPeriodMonth)]?.slice(0, 4) + "." : "", histPeriodYear].filter(Boolean).join(" ") || T.periods.periode
          : T.periods.periode;
        const filteredCalls = localCalls.filter((c) => {
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
          {([["tout", T.periods.tout], ["mois", T.periods.mois], ["3mois", T.periods.troisMois], ["6mois", T.periods.sixMois]] as const).map(([key, label]) => (
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
              placeholder={T.searchHistPlaceholder}
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
              <option value="all">{T.toutesCategories}</option>
              {histCategories.map((cat) => <option key={cat} value={cat}>{catLabels[cat] ?? cat}</option>)}
            </select>
          )}
          <button onClick={() => setShowEmit(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-palier-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-palier-700">
            <Icon name="Plus" className="h-3.5 w-3.5" /> {T.emettre}
          </button>
          </div>
        </div>

        <p className="mb-3 text-[12px] text-ink-soft">{T.appelCount(filteredCalls.length)}</p>

        {filteredCalls.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.06] bg-cream-card py-12 text-center shadow-card">
            <Icon name="Receipt" className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-2 text-[13px] text-ink-soft">{localCalls.length === 0 ? T.aucunAppelEmis : C.noResults}</p>
            {localCalls.length === 0 ? (
              <button onClick={() => setShowEmit(true)} className="mt-1 text-[13px] font-medium text-palier-600">{T.emettreUnPremierAppel}</button>
            ) : (
              <button onClick={() => { setHistSearch(""); setHistCat("all"); setHistPeriod("tout"); }} className="mt-1 text-[13px] font-medium text-palier-600">{C.resetFilters}</button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
            {/* Desktop table */}
            <table className="hidden w-full text-left text-[13px] lg:table">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-2.5">{T.histHeaders.libelle}</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">{T.histHeaders.categorie}</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">{T.histHeaders.montantParLot}</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">{T.histHeaders.echeance}</th>
                  <th className="px-4 py-2.5 w-[180px]">{T.histHeaders.paiement}</th>
                  <th className="px-4 py-2.5 text-right whitespace-nowrap">{T.histHeaders.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filteredCalls.map((c, idx) => {
                  const paidRate = c.total > 0 ? Math.round((c.paidAmount / c.total) * 100) : 0;
                  return (
                    <tr key={idx} className="transition-colors hover:bg-sand/50">
                      <td className="overflow-hidden px-4 py-2.5">
                        <p className="truncate font-medium text-ink">{c.label}</p>
                        {c.detail && <p className="mt-0.5 truncate text-[11px] text-ink-soft">{c.detail}</p>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">{catLabels[c.category] ?? c.category}</td>
                      <td dir="ltr" className="whitespace-nowrap px-4 py-2.5 font-medium text-ink">{mad(c.amount, { decimals: false })}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">{c.dueDate ? shortDate(c.dueDate, lang) : "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span dir="ltr" className="font-medium text-ink-soft">{paidRate}%</span>
                            <span dir="ltr" className="text-ink-faint">{c.paid}/{c.lots} {T.lots}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-sand/50">
                            <div className="h-full rounded-full bg-palier-600 transition-all" style={{ width: `${paidRate}%` }} />
                          </div>
                          <p dir="ltr" className="text-[10px] text-ink-faint">{mad(c.paidAmount, { decimals: false })} / {mad(c.total, { decimals: false })}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setEditCall(c); setEditLabel(c.label); setEditCategory(c.category); setEditDueDate(c.dueDate); }}
                            className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-white px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:bg-sand/50 hover:text-ink"
                          >
                            <Icon name="Pencil" className="h-3 w-3" /> {C.modify}
                          </button>
                          <button
                            onClick={() => setDeleteCallTarget(c)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Icon name="Trash2" className="h-3 w-3" /> {C.delete}
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
                const paidRate = c.total > 0 ? Math.round((c.paidAmount / c.total) * 100) : 0;
                return (
                  <div key={idx} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-ink">{c.label}</p>
                        {c.detail && <p className="mt-0.5 text-[12px] text-ink-soft">{c.detail}</p>}
                        <p className="mt-0.5 text-[12px] text-ink-soft">{catLabels[c.category] ?? c.category} · {c.dueDate ? shortDate(c.dueDate, lang) : "—"}</p>
                      </div>
                      <p dir="ltr" className="shrink-0 text-[14px] font-semibold text-ink">{mad(c.amount, { decimals: false })}</p>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span dir="ltr" className="font-medium text-ink-soft">{paidRate}% — {mad(c.paidAmount, { decimals: false })} / {mad(c.total, { decimals: false })}</span>
                        <span dir="ltr" className="text-ink-faint">{c.paid}/{c.lots} {T.lots}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-sand/50">
                        <div className="h-full rounded-full bg-palier-600 transition-all" style={{ width: `${paidRate}%` }} />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button onClick={() => { setEditCall(c); setEditLabel(c.label); setEditCategory(c.category); setEditDueDate(c.dueDate); }} className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-white px-2 py-1 text-[11px] font-medium text-ink-soft hover:text-ink">
                          <Icon name="Pencil" className="h-3 w-3" /> {C.modify}
                        </button>
                        <button onClick={() => setDeleteCallTarget(c)} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] font-medium text-red-500 hover:text-red-600">
                          <Icon name="Trash2" className="h-3 w-3" /> {C.delete}
                        </button>
                      </div>
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
                  <h2 className="text-[16px] font-semibold text-ink">{T.periodModal.title}</h2>
                  <p className="text-[12px] text-ink-soft">{T.periodModal.subtitle}</p>
                </div>
              </div>
              <button onClick={() => setHistPeriodOpen(false)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[12px] font-semibold text-ink">{T.periodModal.mois}</p>
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
                  <p className="mb-2 text-[12px] font-semibold text-ink">{T.periodModal.annee}</p>
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
                  {T.periodModal.reinitialiser}
                </button>
                <button
                  onClick={() => { setHistPeriod("custom"); setHistPeriodOpen(false); }}
                  className="flex-1 rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700"
                >
                  {T.periodModal.appliquer}
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
        localRows.forEach((r) => { if (r.chargeId) chargeMap.set(r.chargeId, r); });
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
                placeholder={T.searchPayPlaceholder}
                className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
              />
              {payHistSearch && (
                <button onClick={() => setPayHistSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
                  <Icon name="X" className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="mb-3 text-[12px] text-ink-soft">{T.paiementCount(filteredPayments.length)}</p>

            {payHistoryLoading ? (
              <div className="rounded-2xl border border-black/[0.06] bg-cream-card py-12 text-center shadow-card">
                <Icon name="LoaderCircle" className="mx-auto h-8 w-8 animate-spin text-ink-faint" />
                <p className="mt-2 text-[13px] text-ink-soft">{C.loading}</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="rounded-2xl border border-black/[0.06] bg-cream-card py-12 text-center shadow-card">
                <Icon name="Receipt" className="mx-auto h-8 w-8 text-ink-faint" />
                <p className="mt-2 text-[13px] text-ink-soft">{payHistory.length === 0 ? T.aucunPaiement : C.noResults}</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
                {/* Desktop table */}
                <table className="hidden w-full text-left text-[13px] lg:table">
                  <thead>
                    <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                      <th className="px-3 py-2.5">{T.payHeaders.date}</th>
                      <th className="px-3 py-2.5">{T.payHeaders.resident}</th>
                      <th className="px-3 py-2.5">{T.payHeaders.lot}</th>
                      <th className="px-3 py-2.5">{T.payHeaders.montant}</th>
                      <th className="px-3 py-2.5">{T.payHeaders.mode}</th>
                      <th className="px-3 py-2.5">{T.payHeaders.note}</th>
                      <th className="px-3 py-2.5 text-right">{T.payHeaders.recu}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {filteredPayments.map((p) => {
                      const row = p.charge_id ? chargeMap.get(p.charge_id) : null;
                      return (
                        <tr key={p.id} className="transition-colors hover:bg-sand/50">
                          <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">{longDate(p.created_at, lang)}</td>
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
                          <td dir="ltr" className="whitespace-nowrap px-3 py-2.5 font-medium text-ink">{row?.ref ?? "—"}</td>
                          <td dir="ltr" className="whitespace-nowrap px-3 py-2.5 font-semibold text-emerald-600">{mad(p.amount, { decimals: false })}</td>
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
                              <Icon name="Printer" className="h-3 w-3" /> {T.imprimer}
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
                              <p className="text-[12px] text-ink-soft">{T.payHeaders.lot} <span dir="ltr">{row?.ref ?? "—"}</span> · {longDate(p.created_at, lang)}</p>
                            </div>
                          </div>
                          <p dir="ltr" className="text-[14px] font-semibold text-emerald-600">{mad(p.amount, { decimals: false })}</p>
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
                            <Icon name="Printer" className="h-3 w-3" /> {T.payHeaders.recu}
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
                  <h2 className="text-[16px] font-semibold text-ink">{T.emitModal.title}</h2>
                  <p className="text-[12px] text-ink-soft">{T.emitModal.subtitle(localRows.length)}</p>
                </div>
              </div>
              <button onClick={() => { setShowEmit(false); resetEmit(); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEmit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.emitModal.label}</label>
                <input type="text" value={emitLabel} onChange={(e) => setEmitLabel(e.target.value)} placeholder={T.emitModal.labelPlaceholder} required className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.emitModal.detail}</label>
                <input type="text" value={emitDetail} onChange={(e) => setEmitDetail(e.target.value)} placeholder={T.emitModal.detailPlaceholder} className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.emitModal.distributionLabel}</label>
                <div className="flex gap-1 rounded-lg border border-black/[0.08] p-0.5">
                  <button type="button" onClick={() => setEmitDistribution("tantiemes")} className={`flex-1 rounded-md py-2 text-[12px] font-medium transition-colors ${emitDistribution === "tantiemes" ? "bg-palier-50 text-palier-700" : "text-ink"}`}>
                    {T.emitModal.distributionTantiemes}
                  </button>
                  <button type="button" onClick={() => setEmitDistribution("flat")} className={`flex-1 rounded-md py-2 text-[12px] font-medium transition-colors ${emitDistribution === "flat" ? "bg-palier-50 text-palier-700" : "text-ink"}`}>
                    {T.emitModal.distributionFlat}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{emitDistribution === "tantiemes" ? T.emitModal.montantTotal : T.emitModal.montantParLot}</label>
                  <input type="number" value={emitAmount} onChange={(e) => setEmitAmount(e.target.value)} placeholder={T.emitModal.montantPlaceholder} required className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.emitModal.categorie}</label>
                  <select value={emitCategory} onChange={(e) => setEmitCategory(e.target.value)} className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20">
                    {effectiveChargeCats.map((cat) => (
                      <option key={cat} value={cat.toLowerCase().replace(/\s+/g, "_")}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.emitModal.dateEcheance}</label>
                <input type="date" value={emitDueDate} onChange={(e) => setEmitDueDate(e.target.value)} required className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
              </div>
              <button type="submit" disabled={emitPending} className="w-full rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50">
                {emitPending ? T.emitModal.submitting : T.emitModal.submit}
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
                  <h2 className="text-[16px] font-semibold text-ink">{T.periodModal.title}</h2>
                  <p className="text-[12px] text-ink-soft">{T.periodModal.subtitle}</p>
                </div>
              </div>
              <button onClick={() => setPeriodOpen(false)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[12px] font-semibold text-ink">{T.periodModal.mois}</p>
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
                  <p className="mb-2 text-[12px] font-semibold text-ink">{T.periodModal.annee}</p>
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
                  {T.periodModal.reinitialiser}
                </button>
                <button
                  onClick={() => { setPeriodFilter("custom"); setPeriodOpen(false); setPage(0); }}
                  className="flex-1 rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700"
                >
                  {T.periodModal.appliquer}
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
                  <h2 className="text-[16px] font-semibold text-ink">{T.payModal.title}</h2>
                  <p className="text-[12px] text-ink-soft">{T.headers.lot} <span dir="ltr">{showPayment.ref}</span> · {showPayment.ownerName}</p>
                </div>
              </div>
              <button onClick={() => { setShowPayment(null); setPayAmount(""); setPayMethod("cash"); setPayNote(""); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 rounded-xl bg-black/[0.02] p-3.5 space-y-1.5">
              <div className="flex justify-between text-[13px]"><span className="text-ink-soft">{T.payModal.totalAmount}</span><span dir="ltr" className="font-semibold text-ink">{mad(showPayment.amount, { decimals: false })}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-ink-soft">{T.payModal.alreadyPaid}</span><span dir="ltr" className="font-semibold text-ink">{mad(showPayment.paid, { decimals: false })}</span></div>
              <div className="flex justify-between text-[13px] border-t border-black/[0.06] pt-1.5"><span className="text-ink-soft">{T.payModal.remaining}</span><span dir="ltr" className="font-bold text-emerald-600">{mad(showPayment.amount - showPayment.paid, { decimals: false })}</span></div>
            </div>
            <form onSubmit={handlePayment} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.payModal.amountReceived}</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} min="1" max={showPayment.amount - showPayment.paid} step="0.01" required className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.payModal.paymentMethod}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(["cash", "cheque", "virement", "autre"] as const).map((key) => (
                    <button key={key} type="button" onClick={() => setPayMethod(key)} className={`rounded-xl py-2 text-[13px] font-semibold transition-colors ${payMethod === key ? "bg-emerald-600 text-white" : "border border-black/[0.08] bg-white text-ink hover:bg-sand/50"}`}>
                      {T.methods[key]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.payModal.noteLabel}</label>
                <input type="text" value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder={T.payModal.notePlaceholder} className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20" />
              </div>
              <button type="submit" disabled={payPending || !payAmount || Number(payAmount) <= 0} className="w-full rounded-xl bg-emerald-600 py-2.5 text-[13px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {payPending ? T.payModal.submitting : T.payModal.submit}
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
                  <h2 className="text-[16px] font-semibold text-ink">{T.editModal.title}</h2>
                  <p className="text-[12px] text-ink-soft">{T.editModal.subtitle(editCall.lots)}</p>
                </div>
              </div>
              <button onClick={() => setEditCall(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEditCall} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.editModal.label}</label>
                <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} required className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.emitModal.categorie}</label>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20">
                    {effectiveChargeCats.map((cat) => (
                      <option key={cat} value={cat.toLowerCase().replace(/\s+/g, "_")}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.editModal.dateEcheance}</label>
                  <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} required className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
                </div>
              </div>
              <button type="submit" disabled={editPending} className="w-full rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50">
                {editPending ? T.editModal.submitting : T.editModal.submit}
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
                <h2 className="text-[16px] font-semibold text-ink">{T.deleteModal.title}</h2>
                <p className="text-[12px] text-ink-soft">{deleteCallTarget.label}</p>
              </div>
            </div>
            <p className="mb-5 rounded-xl bg-red-50 p-3 text-[13px] text-red-800">
              {T.deleteModal.warning(deleteCallTarget.lots)}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCallTarget(null)} className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50">
                {C.cancel}
              </button>
              <button onClick={handleDeleteCall} disabled={deletePending} className="flex-1 rounded-xl bg-red-600 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deletePending ? T.deleteModal.submitting : T.deleteModal.submit}
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
                  <Icon name="CircleCheck" className="h-5 w-5 text-emerald-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">{T.receiptModal.title}</h2>
                  <p dir="ltr" className="text-[12px] text-ink-soft">{receiptInfo.receiptId}</p>
                </div>
              </div>
              <button onClick={() => setReceiptInfo(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-xl border border-black/[0.06] bg-white p-4 space-y-2.5">
              <div className="flex justify-between text-[13px]"><span className="text-ink-soft">{T.receiptModal.building}</span><span className="font-medium text-ink">{receiptInfo.building}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-ink-soft">{T.receiptModal.resident}</span><span className="font-medium text-ink">{receiptInfo.residentName}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-ink-soft">{T.receiptModal.lot}</span><span dir="ltr" className="font-medium text-ink">{receiptInfo.lot}</span></div>
              {receiptInfo.chargeLabel && <div className="flex justify-between text-[13px]"><span className="text-ink-soft">{T.receiptModal.objet}</span><span className="font-medium text-ink">{receiptInfo.chargeLabel}</span></div>}
              {receiptInfo.chargeDueDate && <div className="flex justify-between text-[13px]"><span className="text-ink-soft">{T.receiptModal.echeance}</span><span className="font-medium text-ink">{receiptInfo.chargeDueDate}</span></div>}
              <div className="border-t border-black/[0.06] pt-2.5 flex justify-between text-[13px]"><span className="text-ink-soft">{T.receiptModal.mode}</span><span className="font-medium text-ink">{METHOD_LABELS[receiptInfo.method] ?? receiptInfo.method}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-ink-soft">{T.receiptModal.date}</span><span className="font-medium text-ink">{receiptInfo.date}</span></div>
              <div className="text-center pt-2">
                <p dir="ltr" className="text-[22px] font-bold text-emerald-600">{mad(receiptInfo.amount, { decimals: false })}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setReceiptInfo(null)} className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50">
                {C.close}
              </button>
              <button onClick={() => printReceipt(receiptInfo)} className="flex-1 rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 inline-flex items-center justify-center gap-1.5">
                <Icon name="Printer" className="h-3.5 w-3.5" /> {T.receiptModal.printReceipt}
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
