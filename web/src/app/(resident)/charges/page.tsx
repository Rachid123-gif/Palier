"use client";
import { useState } from "react";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { ScreenHeader } from "@/components/resident/ScreenHeader";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { mad, num, shortDate } from "@/lib/format";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";
import type { Charge } from "@/lib/types";

const catIcon: Record<string, string> = {
  courantes: "Building2", travaux: "HardHat", provision: "PiggyBank", regularisation: "Droplets",
};

export default function ChargesScreen() {
  const { charges, chargesHistory } = useData();
  const { lang, i, isAr } = useLang();
  const T = i.charges;
  const [receiptCharge, setReceiptCharge] = useState<Charge | null>(null);
  const [filter, setFilter] = useState<string>("tout");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodMonth, setPeriodMonth] = useState<string>("");
  const [periodYear, setPeriodYear] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(5);

  const total = charges.reduce((s, c) => s + (c.amount - c.paid), 0);

  const years = [...new Set(chargesHistory.map((c) => new Date(c.dueDate).getFullYear().toString()))].sort().reverse();

  const now = new Date();
  const filteredHistory = chargesHistory.filter((c) => {
    if (filter === "tout") return true;
    const d = new Date(c.dueDate);
    if (filter === "mois") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (filter === "3mois") { const ago = new Date(now); ago.setMonth(ago.getMonth() - 3); return d >= ago; }
    if (filter === "6mois") { const ago = new Date(now); ago.setMonth(ago.getMonth() - 6); return d >= ago; }
    if (filter === "custom") {
      const matchYear = !periodYear || d.getFullYear().toString() === periodYear;
      const matchMonth = !periodMonth || d.getMonth().toString() === periodMonth;
      return matchYear && matchMonth;
    }
    return true;
  });

  const customLabel = filter === "custom"
    ? [periodMonth ? i.months[parseInt(periodMonth)] : "", periodYear].filter(Boolean).join(" ") || T.periode
    : T.periode;

  const quickFilters = [
    { key: "tout", label: T.tout },
    { key: "mois", label: T.ceMois },
    { key: "3mois", label: T.troisMois },
    { key: "6mois", label: T.sixMois },
  ];

  const statusMap: Record<string, { tone: "warning" | "danger" | "info" | "success"; label: string }> = {
    due: { tone: "warning", label: T.aPayer },
    late: { tone: "danger", label: T.enRetard },
    partial: { tone: "info", label: T.partiel },
    paid: { tone: "success", label: T.paye },
  };

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />
      <ScreenHeader title={T.title} />

      <div className="space-y-5 px-4">

        {charges.length === 0 ? (
          <div className="flex items-center gap-3 rounded-3xl border border-success/20 bg-success-soft p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
              <Icon name="CircleCheck" className="h-6 w-6 text-success" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[17px] font-bold text-ink">{T.vousEtesAJour}</p>
              <p className="text-[13px] text-ink-soft">{T.aucuneCharge}</p>
            </div>
          </div>
        ) : (
          <div className="bg-paywall relative overflow-hidden rounded-3xl p-5 text-white shadow-hero">
            <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/5" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                <Icon name="House" className="h-3.5 w-3.5" /> {T.aPayerMaintenant}
              </span>
              <div className="mt-3">
                <span className="inline-flex items-end gap-1.5" dir="ltr">
                  <span className="text-[44px] font-bold leading-none tracking-tight">{num(total)}</span>
                  <span className="mb-1.5 text-sm font-semibold opacity-80">MAD</span>
                </span>
              </div>
              <p className="mt-1 text-[13px] opacity-80">{T.chargeNonPayee(charges.length)}</p>
            </div>
          </div>
        )}

        {charges.length > 0 && (
          <div>
            <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">{T.aRegler}</h2>
            <div className="space-y-3">
              {charges.map((c) => (
                <ChargeCard key={c.id} c={c} statusMap={statusMap} lang={lang} isAr={isAr} T={T} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">{T.historique}</h2>

          {chargesHistory.length > 0 && (
            <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
              {quickFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`tap shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold ${filter === f.key ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}
                >
                  {f.label}
                </button>
              ))}
              <button
                onClick={() => setPeriodOpen(true)}
                className={`tap flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold ${filter === "custom" ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}
              >
                <Icon name="CalendarDays" className="h-3.5 w-3.5" />
                {customLabel}
              </button>
            </div>
          )}

          {chargesHistory.length > 0 ? (
            filteredHistory.length > 0 ? (
              <>
                <div className="space-y-3">
                  {(filter === "tout" ? filteredHistory.slice(0, visibleCount) : filteredHistory).map((c) => (
                    <ChargeCard key={c.id} c={c} statusMap={statusMap} lang={lang} isAr={isAr} T={T} onReceipt={() => setReceiptCharge(c)} />
                  ))}
                </div>
                {filter === "tout" && filteredHistory.length > visibleCount && (
                  <button
                    onClick={() => setVisibleCount((v) => v + 5)}
                    className="tap mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-palier-100 bg-white py-2.5 text-[13px] font-semibold text-palier-700"
                  >
                    {T.voirPlus(filteredHistory.length - visibleCount)}
                    <Icon name="ChevronDown" className="h-4 w-4" />
                  </button>
                )}
              </>
            ) : (
              <div className="card flex items-center gap-3 p-4">
                <Icon name="CalendarX" className="h-5 w-5 text-ink-faint" />
                <p className="text-[13px] text-ink-soft">{T.aucunePeriode}</p>
              </div>
            )
          ) : (
            <div className="card flex items-center gap-3 p-4">
              <Icon name="Clock" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">{T.aucunPaiement}</p>
            </div>
          )}
        </div>

        <Link href="/immeuble" className="tap block">
          <div className="flex items-center gap-3 rounded-2xl border border-palier-100 bg-palier-50 p-3.5">
            <Icon name="ShieldCheck" className="h-6 w-6 shrink-0 text-palier-600" />
            <p className="flex-1 text-[12.5px] font-medium text-palier-800">
              {T.suivezTransparence} <b>{T.transparenceFinanciere}</b>
            </p>
            <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-4 w-4 text-palier-600" />
          </div>
        </Link>

        <div className="h-4" />
      </div>

      {/* Sheet période */}
      <Sheet open={periodOpen} onClose={() => setPeriodOpen(false)} title={T.filtrerPeriode}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink-soft">{T.mois}</p>
            <div className="grid grid-cols-3 gap-2">
              {i.months.map((m, idx) => (
                <button
                  key={m}
                  onClick={() => setPeriodMonth(periodMonth === idx.toString() ? "" : idx.toString())}
                  className={`tap rounded-xl py-2.5 text-[13px] font-semibold ${periodMonth === idx.toString() ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}
                >
                  {m.slice(0, 4)}.
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink-soft">{T.annee}</p>
            <div className="flex gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setPeriodYear(periodYear === y ? "" : y)}
                  className={`tap rounded-xl px-5 py-2.5 text-[13px] font-semibold ${periodYear === y ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setPeriodMonth(""); setPeriodYear(""); setFilter("tout"); setPeriodOpen(false); }} className="tap flex-1 rounded-full border border-palier-100 bg-white py-3 text-[13px] font-semibold text-ink-soft">{T.reinitialiser}</button>
            <button onClick={() => { setFilter("custom"); setPeriodOpen(false); }} className="tap flex-1 rounded-full bg-palier-600 py-3 text-[13px] font-semibold text-white">{T.appliquer}</button>
          </div>
        </div>
      </Sheet>

      {/* Sheet reçu */}
      <Sheet open={!!receiptCharge} onClose={() => setReceiptCharge(null)} title={T.recuPaiement}>
        {receiptCharge && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4">
              <div className="mb-3 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft">
                  <Icon name="CircleCheck" className="h-7 w-7 text-success" strokeWidth={2.2} />
                </span>
              </div>
              <p className="text-center text-[13px] font-semibold text-success">{T.paiementConfirme}</p>
              <div className="mt-4 space-y-2">
                {([
                  [T.charge, receiptCharge.label],
                  [T.detail, receiptCharge.detail],
                  [T.periode, receiptCharge.period],
                  [T.montant, mad(receiptCharge.amount)],
                  [T.statut, T.paye],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-soft">{k}</span>
                    <span className="font-semibold text-ink">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-palier-100 bg-palier-50 p-3 text-center">
              <p className="text-[12px] text-palier-700">
                <Icon name="ShieldCheck" className="mr-1 inline h-3.5 w-3.5" />
                {T.recuEnregistre}
              </p>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

/* ───────── Carte de charge ───────── */
function ChargeCard({ c, statusMap, lang, isAr, T, onReceipt }: {
  c: Charge;
  statusMap: Record<string, { tone: "warning" | "danger" | "info" | "success"; label: string }>;
  lang: "fr" | "ar";
  isAr: boolean;
  T: Record<string, unknown>;
  onReceipt?: () => void;
}) {
  const st = statusMap[c.status];
  const isPaid = c.status === "paid";

  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isPaid ? "bg-success-soft" : "bg-sand"}`}>
          <Icon
            name={isPaid ? "CircleCheck" : (catIcon[c.category] ?? "ReceiptText")}
            className={`h-5 w-5 ${isPaid ? "text-success" : "text-palier-600"}`}
            strokeWidth={2.2}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-ink">{c.label}</p>
          <p className="truncate text-[12px] text-ink-soft">{c.detail}</p>
          <div className="mt-1 flex items-center gap-2">
            {c.status === "late" && <Badge tone="danger">{st?.label}</Badge>}
            <span className="truncate text-[11px] text-ink-faint">
              {c.period} · {shortDate(c.dueDate, lang)}
            </span>
          </div>
        </div>
        <div className={isAr ? "text-left" : "text-right"}>
          {isPaid ? (
            <p className="text-[15px] font-bold text-ink" dir="ltr">{num(c.amount)}</p>
          ) : (
            <>
              <p className="text-[15px] font-bold text-ink" dir="ltr">{num(c.amount - c.paid)}</p>
              {c.paid > 0 && <p className="text-[10px] text-ink-faint" dir="ltr">{T.sur as string} {num(c.amount)}</p>}
            </>
          )}
          <p className="text-[10px] font-semibold text-ink-faint">MAD</p>
        </div>
      </div>
      {isPaid && onReceipt && (
        <button
          onClick={onReceipt}
          className="tap mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-palier-100 bg-white py-2 text-[13px] font-semibold text-palier-700"
        >
          <Icon name="FileText" className="h-4 w-4" /> {T.voirRecu as string}
        </button>
      )}
    </div>
  );
}
