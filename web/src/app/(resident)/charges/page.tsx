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
import type { Charge } from "@/lib/types";

const statusMap = {
  due: { tone: "warning" as const, label: "À payer" },
  late: { tone: "danger" as const, label: "En retard" },
  partial: { tone: "info" as const, label: "Partiel" },
  paid: { tone: "success" as const, label: "Payé" },
};

const catIcon: Record<string, string> = {
  courantes: "Building2", travaux: "HardHat", provision: "PiggyBank", regularisation: "Droplets",
};

export default function ChargesScreen() {
  const { charges, chargesHistory } = useData();
  const [receiptCharge, setReceiptCharge] = useState<Charge | null>(null);
  const [filter, setFilter] = useState<string>("tout");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodMonth, setPeriodMonth] = useState<string>("");
  const [periodYear, setPeriodYear] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(5);

  const total = charges.reduce((s, c) => s + (c.amount - c.paid), 0);

  // Extraire les années et mois disponibles dans l'historique
  const years = [...new Set(chargesHistory.map((c) => new Date(c.dueDate).getFullYear().toString()))].sort().reverse();
  const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

  // Filtrer l'historique par période
  const now = new Date();
  const filteredHistory = chargesHistory.filter((c) => {
    if (filter === "tout") return true;
    const d = new Date(c.dueDate);
    if (filter === "mois") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (filter === "3mois") {
      const ago = new Date(now);
      ago.setMonth(ago.getMonth() - 3);
      return d >= ago;
    }
    if (filter === "6mois") {
      const ago = new Date(now);
      ago.setMonth(ago.getMonth() - 6);
      return d >= ago;
    }
    if (filter === "custom") {
      const matchYear = !periodYear || d.getFullYear().toString() === periodYear;
      const matchMonth = !periodMonth || d.getMonth().toString() === periodMonth;
      return matchYear && matchMonth;
    }
    return true;
  });

  const customLabel = filter === "custom"
    ? [periodMonth ? MONTHS[parseInt(periodMonth)] : "", periodYear].filter(Boolean).join(" ") || "Période"
    : "Période";

  const quickFilters = [
    { key: "tout", label: "Tout" },
    { key: "mois", label: "Ce mois" },
    { key: "3mois", label: "3 mois" },
    { key: "6mois", label: "6 mois" },
  ];

  function applyPeriod() {
    setFilter("custom");
    setPeriodOpen(false);
  }

  function resetPeriod() {
    setPeriodMonth("");
    setPeriodYear("");
    setFilter("tout");
    setPeriodOpen(false);
  }

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />
      <ScreenHeader title="Mes charges" />

      <div className="space-y-5 px-4">

        {/* ═══════ État : à jour ou total à régler ═══════ */}
        {charges.length === 0 ? (
          <div className="flex items-center gap-3 rounded-3xl border border-success/20 bg-success-soft p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
              <Icon name="CircleCheck" className="h-6 w-6 text-success" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[17px] font-bold text-ink">Vous êtes à jour</p>
              <p className="text-[13px] text-ink-soft">Aucune charge en attente</p>
            </div>
          </div>
        ) : (
          <div className="bg-paywall relative overflow-hidden rounded-3xl p-5 text-white shadow-hero">
            <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/5" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                <Icon name="House" className="h-3.5 w-3.5" /> À payer maintenant
              </span>
              <div className="mt-3 flex items-end gap-1.5">
                <span className="text-[44px] font-bold leading-none tracking-tight">{num(total)}</span>
                <span className="mb-1.5 text-sm font-semibold opacity-80">MAD</span>
              </div>
              <p className="mt-1 text-[13px] opacity-80">
                {charges.length} charge{charges.length > 1 ? "s" : ""} non payée{charges.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* ═══════ Charges en attente ═══════ */}
        {charges.length > 0 && (
          <div>
            <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">À régler</h2>
            <div className="space-y-3">
              {charges.map((c) => (
                <ChargeCard key={c.id} c={c} />
              ))}
            </div>
          </div>
        )}

        {/* ═══════ Historique ═══════ */}
        <div>
          <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">Historique</h2>

          {/* Filtres par période */}
          {chargesHistory.length > 0 && (
            <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
              {quickFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`tap shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold ${
                    filter === f.key
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
                  filter === "custom"
                    ? "bg-palier-600 text-white"
                    : "border border-palier-100 bg-white text-ink-soft"
                }`}
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
                    <ChargeCard key={c.id} c={c} onReceipt={() => setReceiptCharge(c)} />
                  ))}
                </div>
                {filter === "tout" && filteredHistory.length > visibleCount && (
                  <button
                    onClick={() => setVisibleCount((v) => v + 5)}
                    className="tap mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-palier-100 bg-white py-2.5 text-[13px] font-semibold text-palier-700"
                  >
                    Voir plus ({filteredHistory.length - visibleCount} de plus)
                    <Icon name="ChevronDown" className="h-4 w-4" />
                  </button>
                )}
              </>
            ) : (
              <div className="card flex items-center gap-3 p-4">
                <Icon name="Search" className="h-5 w-5 text-ink-faint" />
                <p className="text-[13px] text-ink-soft">Aucune charge sur cette période</p>
              </div>
            )
          ) : (
            <div className="card flex items-center gap-3 p-4">
              <Icon name="Clock" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">Aucun paiement pour le moment</p>
            </div>
          )}
        </div>

        {/* ═══════ Transparence ═══════ */}
        <Link href="/immeuble" className="tap block">
          <div className="flex items-center gap-3 rounded-2xl border border-palier-100 bg-palier-50 p-3.5">
            <Icon name="ShieldCheck" className="h-6 w-6 shrink-0 text-palier-600" />
            <p className="flex-1 text-[12.5px] font-medium text-palier-800">
              Suivez où va l&apos;argent dans <b>Transparence financière</b>
            </p>
            <Icon name="ChevronRight" className="h-4 w-4 text-palier-600" />
          </div>
        </Link>

        {/* Spacer bottom nav */}
        <div className="h-4" />
      </div>

      {/* ═══════ Sheet période ═══════ */}
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
              onClick={resetPeriod}
              className="tap flex-1 rounded-full border border-palier-100 bg-white py-3 text-[13px] font-semibold text-ink-soft"
            >
              Réinitialiser
            </button>
            <button
              onClick={applyPeriod}
              className="tap flex-1 rounded-full bg-palier-600 py-3 text-[13px] font-semibold text-white"
            >
              Appliquer
            </button>
          </div>
        </div>
      </Sheet>

      {/* ═══════ Sheet reçu ═══════ */}
      <Sheet open={!!receiptCharge} onClose={() => setReceiptCharge(null)} title="Reçu de paiement">
        {receiptCharge && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4">
              <div className="mb-3 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft">
                  <Icon name="CircleCheck" className="h-7 w-7 text-success" strokeWidth={2.2} />
                </span>
              </div>
              <p className="text-center text-[13px] font-semibold text-success">Paiement confirmé</p>

              <div className="mt-4 space-y-2">
                {[
                  ["Charge", receiptCharge.label],
                  ["Détail", receiptCharge.detail],
                  ["Période", receiptCharge.period],
                  ["Montant", mad(receiptCharge.amount)],
                  ["Statut", "Payé"],
                ].map(([k, v]) => (
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
                Ce reçu est enregistré dans le système Palier
              </p>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

/* ───────── Carte de charge ───────── */
function ChargeCard({ c, onReceipt }: { c: Charge; onReceipt?: () => void }) {
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
            <Badge tone={st.tone}>{st.label}</Badge>
            <span className="truncate text-[11px] text-ink-faint">
              {c.period} · {shortDate(c.dueDate)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[15px] font-bold text-ink">{num(c.amount)}</p>
          <p className="text-[10px] font-semibold text-ink-faint">MAD</p>
        </div>
      </div>
      {isPaid && onReceipt && (
        <button
          onClick={onReceipt}
          className="tap mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-palier-100 bg-white py-2 text-[13px] font-semibold text-palier-700"
        >
          <Icon name="FileText" className="h-4 w-4" /> Voir le reçu
        </button>
      )}
    </div>
  );
}
