"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { KpiCard, Card, StatusPill } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { num, mad, timeAgo, shortDate } from "@/lib/format";
import type { SyndicData } from "@/lib/syndic";
import type { InsurancePolicy, SyndicMandate, Budget } from "@/lib/types";

/* ═══ Period filter ═══ */

type Period = "month" | "quarter" | "year" | "all" | "custom";

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: "month", label: "Ce mois" },
  { key: "quarter", label: "Ce trimestre" },
  { key: "year", label: "Cette année" },
  { key: "all", label: "Tout" },
  { key: "custom", label: "Personnalisé" },
];

function defaultPeriodRange(period: Exclude<Period, "custom">): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const to = "9999-12-31";
  switch (period) {
    case "month":
      return { from: `${y}-${String(m + 1).padStart(2, "0")}-01`, to };
    case "quarter": {
      const qStart = Math.floor(m / 3) * 3;
      return { from: `${y}-${String(qStart + 1).padStart(2, "0")}-01`, to };
    }
    case "year":
      return { from: `${y}-01-01`, to };
    case "all":
      return { from: "2000-01-01", to };
  }
}

function periodLabel(period: Period, customFrom?: string, customTo?: string): string {
  const now = new Date();
  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  switch (period) {
    case "month":
      return `${months[now.getMonth()]} ${now.getFullYear()}`;
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3) + 1;
      return `T${q} ${now.getFullYear()}`;
    }
    case "year":
      return `${now.getFullYear()}`;
    case "all":
      return "Toutes périodes";
    case "custom": {
      if (customFrom && customTo) {
        const f = new Date(customFrom);
        const t = new Date(customTo);
        const fmt = (d: Date) => `${d.getDate()} ${months[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
        return `${fmt(f)} → ${fmt(t)}`;
      }
      return "Période personnalisée";
    }
  }
}

/* ═══ Types ═══ */

interface DashboardProps {
  data: SyndicData;
}

/* ═══ Component ═══ */

export function DashboardView({ data: d }: DashboardProps) {
  const [period, setPeriod] = useState<Period>("month");
  const today = new Date().toISOString().slice(0, 10);
  const [customFrom, setCustomFrom] = useState(() => {
    const d2 = new Date();
    d2.setMonth(d2.getMonth() - 1);
    return d2.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState(today);
  const k = d.kpis;

  const { from, to: rangeTo } = period === "custom"
    ? { from: customFrom, to: customTo }
    : defaultPeriodRange(period);

  /* ── Ledger filtered by period ── */
  const ledgerInPeriod = useMemo(
    () => d.ledger.filter((e: any) => {
      const dt = e.entry_date ?? e.date;
      return dt >= from && dt <= rangeTo;
    }),
    [d.ledger, from, rangeTo],
  );
  const totalIn = useMemo(
    () => ledgerInPeriod.filter((e: any) => e.type === "in").reduce((s: number, e: any) => s + Number(e.amount), 0),
    [ledgerInPeriod],
  );
  const totalOut = useMemo(
    () => ledgerInPeriod.filter((e: any) => e.type === "out").reduce((s: number, e: any) => s + Number(e.amount), 0),
    [ledgerInPeriod],
  );

  /* ── Incidents filtered by period ── */
  const incidentsInPeriod = useMemo(
    () => d.incidents.filter((i: any) => {
      const dt = (i.created_at ?? "").slice(0, 10);
      return dt >= from && dt <= rangeTo;
    }),
    [d.incidents, from, rangeTo],
  );
  const newIncidents = incidentsInPeriod.length;
  const resolvedInPeriod = incidentsInPeriod.filter((i: any) => i.status === "resolved").length;

  /* ── Recouvrement ── */
  const counts = useMemo(() => ({
    paid: d.recouvrement.filter((r) => r.status === "paid").length,
    partial: d.recouvrement.filter((r) => r.status === "partial").length,
    due: d.recouvrement.filter((r) => r.status === "due").length,
    late: d.recouvrement.filter((r) => r.status === "late").length,
  }), [d.recouvrement]);

  const seg = [
    { key: "paid", label: "Payé", n: counts.paid, color: "#059669" },
    { key: "partial", label: "Partiel", n: counts.partial, color: "#2563eb" },
    { key: "due", label: "À payer", n: counts.due, color: "#d97706" },
    { key: "late", label: "En retard", n: counts.late, color: "#dc2626" },
  ];
  const total = d.recouvrement.length || 1;

  /* ── Late residents ── */
  const lateResidents = useMemo(
    () => d.recouvrement
      .filter((r) => r.status === "late")
      .sort((a, b) => (b.amount - b.paid) - (a.amount - a.paid))
      .slice(0, 5),
    [d.recouvrement],
  );

  /* ── Budget execution ── */
  const currentBudget = d.budgets.find((b) => b.fiscalYear === new Date().getFullYear());
  const budgetTotal = currentBudget?.totalAmount ?? 0;
  const budgetSpent = totalOut;
  const budgetPct = budgetTotal > 0 ? Math.min(Math.round((budgetSpent / budgetTotal) * 100), 999) : 0;

  /* ── Top expense categories for the period ── */
  const topCategories = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of ledgerInPeriod.filter((e: any) => e.type === "out")) {
      const cat = (e as any).category || "Autre";
      map.set(cat, (map.get(cat) ?? 0) + Number((e as any).amount));
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amount]) => ({ cat, amount, pct: totalOut > 0 ? Math.round((amount / totalOut) * 100) : 0 }));
  }, [ledgerInPeriod, totalOut]);

  /* ── Next assembly ── */
  const nextAssembly = d.assemblies
    .filter((a) => a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  /* ── Recent items (filtered by period) ── */
  const docsInPeriod = useMemo(
    () => d.documents.filter((doc) => {
      const dt = (doc.date ?? "").slice(0, 10);
      return dt >= from && dt <= rangeTo;
    }),
    [d.documents, from, rangeTo],
  );
  const postsInPeriod = useMemo(
    () => d.posts.filter((p: any) => {
      const dt = (p.created_at ?? "").slice(0, 10);
      return dt >= from && dt <= rangeTo;
    }),
    [d.posts, from, rangeTo],
  );

  /* ── Monthly trend (last 6 months) ── */
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months: { label: string; inAmt: number; outAmt: number }[] = [];
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    for (let i = 5; i >= 0; i--) {
      const d2 = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, "0")}`;
      const label = monthNames[d2.getMonth()];
      const inAmt = d.ledger
        .filter((e: any) => e.type === "in" && (e.entry_date ?? e.date ?? "").startsWith(key))
        .reduce((s: number, e: any) => s + Number(e.amount), 0);
      const outAmt = d.ledger
        .filter((e: any) => e.type === "out" && (e.entry_date ?? e.date ?? "").startsWith(key))
        .reduce((s: number, e: any) => s + Number(e.amount), 0);
      months.push({ label, inAmt, outAmt });
    }
    return months;
  }, [d.ledger]);

  const maxTrend = Math.max(...monthlyTrend.map((m) => Math.max(m.inAmt, m.outAmt)), 1);

  /* ── Alerts ── */
  const alerts = useMemo(() => {
    const list: { icon: string; label: string; href: string; tone: "red" | "amber" }[] = [];
    const expiringPolicies = d.insurancePolicies.filter((p: InsurancePolicy) => {
      const daysLeft = Math.ceil((new Date(p.endDate).getTime() - Date.now()) / 86400000);
      return daysLeft <= p.renewalAlertDays;
    });
    if (expiringPolicies.length > 0) list.push({ icon: "Shield", label: `Assurance: ${expiringPolicies.length} police${expiringPolicies.length > 1 ? "s" : ""} à renouveler`, href: "/syndic/assurance", tone: "amber" });

    if (d.mandate) {
      const daysLeft = Math.ceil((new Date((d.mandate as SyndicMandate).mandateEnd).getTime() - Date.now()) / 86400000);
      if (daysLeft <= 0) list.push({ icon: "Award", label: "Mandat syndic expiré", href: "/syndic/mandat", tone: "red" });
      else if (daysLeft <= 90) list.push({ icon: "Award", label: `Mandat syndic expire dans ${daysLeft}j`, href: "/syndic/mandat", tone: "amber" });
    } else {
      list.push({ icon: "Award", label: "Aucun mandat syndic enregistré", href: "/syndic/mandat", tone: "amber" });
    }

    if (k.prescriptionAlerts > 0) list.push({ icon: "Clock", label: `${k.prescriptionAlerts} créance${k.prescriptionAlerts > 1 ? "s" : ""} proche${k.prescriptionAlerts > 1 ? "s" : ""} de la prescription (5 ans)`, href: "/syndic/recouvrement", tone: "red" });
    if (!d.coproprieteRule) list.push({ icon: "Scale", label: "Règlement de copropriété non enregistré", href: "/syndic/reglement", tone: "amber" });

    const pendingWorks = d.urgentWorks.filter((w) => w.status !== "completed").length;
    if (pendingWorks > 0) list.push({ icon: "Hammer", label: `${pendingWorks} travaux urgent${pendingWorks > 1 ? "s" : ""} en cours`, href: "/syndic/travaux-urgents", tone: "amber" });

    return list;
  }, [d.insurancePolicies, d.mandate, d.coproprieteRule, d.urgentWorks, k.prescriptionAlerts]);

  /* ── Active residents ── */
  const activeResidents = d.residents.filter((r) => r.status === "active").length;

  const iconBox = "flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04]";
  const iconCls = "h-4 w-4 text-ink-soft";
  const smallIconBox = "flex h-7 w-7 items-center justify-center rounded-lg bg-black/[0.04]";
  const smallIconCls = "h-3.5 w-3.5 text-ink-soft";

  return (
    <div>
      {/* ═══ Header with period filter ═══ */}
      <div className="mb-4 flex flex-col gap-3 md:mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight text-ink md:text-[22px]">Tableau de bord</h1>
            <p className="mt-0.5 text-[13px] text-ink-soft">{d.building.name} · {periodLabel(period, customFrom, customTo)}</p>
          </div>
        </div>
        {/* Period filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-lg border border-black/[0.08] bg-white p-0.5">
            {PERIOD_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setPeriod(t.key)}
                className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                  period === t.key
                    ? "bg-palier-600 text-white"
                    : "text-ink-soft hover:bg-sand/50 hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 rounded-lg border border-black/[0.08] bg-white px-2.5 text-[12px] text-ink outline-none focus:border-palier-400 focus:ring-1 focus:ring-palier-400"
              />
              <span className="text-[12px] text-ink-faint">→</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 rounded-lg border border-black/[0.08] bg-white px-2.5 text-[12px] text-ink outline-none focus:border-palier-400 focus:ring-1 focus:ring-palier-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* ═══ Alertes conformité (top, prominent) ═══ */}
      {alerts.length > 0 && (
        <div className="mb-5 space-y-2">
          {alerts.map((a, i) => (
            <Link key={i} href={a.href} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-sand/50 ${a.tone === "red" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
              <Icon name={a.icon} className={`h-4 w-4 ${a.tone === "red" ? "text-red-600" : "text-amber-600"}`} />
              <span className={`flex-1 text-[13px] font-medium ${a.tone === "red" ? "text-red-800" : "text-amber-800"}`}>{a.label}</span>
              <Icon name="ChevronRight" className={`h-3.5 w-3.5 ${a.tone === "red" ? "text-red-400" : "text-amber-400"}`} />
            </Link>
          ))}
        </div>
      )}

      {/* ═══ KPIs ═══ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard label="Taux de recouvrement" value={`${k.rate}%`} hint={`${counts.paid} lots à jour sur ${k.lots}`} />
        <KpiCard label="Encaissé" value={num(k.collected, false)} unit="MAD" hint={`sur ${num(k.expected, false)} appelés`} />
        <KpiCard label="Reste à recouvrer" value={num(k.outstanding, false)} unit="MAD" hint={`${k.lateCount} en retard`} />
        <KpiCard label="Solde de caisse" value={num(k.balance, false)} unit="MAD" />
        <KpiCard
          label="Budget exécuté"
          value={budgetTotal > 0 ? `${budgetPct}%` : "—"}
          hint={budgetTotal > 0 ? `${num(budgetSpent, false)} / ${num(budgetTotal, false)} MAD` : "Aucun budget"}
        />
        <KpiCard label="Incidents ouverts" value={`${k.openIncidents}`} hint={resolvedInPeriod > 0 ? `${resolvedInPeriod} résolu${resolvedInPeriod > 1 ? "s" : ""} sur la période` : "à traiter"} />
      </div>

      {/* ═══ Row 2: Flux financier + Recouvrement ═══ */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Flux financier (revenus vs dépenses) */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-ink">Journal de caisse — {periodLabel(period, customFrom, customTo)}</h2>
            <Link href="/syndic/transparence" className="text-[13px] font-medium text-palier-600 hover:underline">Journal</Link>
          </div>

          {/* Summary */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-[11px] font-medium text-emerald-700">Encaissements</p>
              <p className="mt-1 text-[16px] font-bold text-emerald-700">{num(totalIn, false)}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3">
              <p className="text-[11px] font-medium text-red-700">Dépenses</p>
              <p className="mt-1 text-[16px] font-bold text-red-700">{num(totalOut, false)}</p>
            </div>
            <div className={`rounded-xl p-3 ${totalIn - totalOut >= 0 ? "bg-blue-50" : "bg-amber-50"}`}>
              <p className={`text-[11px] font-medium ${totalIn - totalOut >= 0 ? "text-blue-700" : "text-amber-700"}`}>Solde période</p>
              <p className={`mt-1 text-[16px] font-bold ${totalIn - totalOut >= 0 ? "text-blue-700" : "text-amber-700"}`}>
                {totalIn - totalOut >= 0 ? "+" : ""}{num(totalIn - totalOut, false)}
              </p>
            </div>
          </div>

          {/* 6-month trend bars */}
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Tendance 6 mois</p>
          <div className="flex items-end gap-2">
            {monthlyTrend.map((m, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full gap-0.5" style={{ height: 60 }}>
                  <div className="flex-1 flex flex-col justify-end">
                    <div
                      className="w-full rounded-t bg-emerald-400"
                      style={{ height: `${Math.max((m.inAmt / maxTrend) * 100, m.inAmt > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <div
                      className="w-full rounded-t bg-red-400"
                      style={{ height: `${Math.max((m.outAmt / maxTrend) * 100, m.outAmt > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-ink-faint">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-[11px] text-ink-soft">Encaissements</span></div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /><span className="text-[11px] text-ink-soft">Dépenses</span></div>
          </div>
        </Card>

        {/* Recouvrement */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-ink">Recouvrement</h2>
            <Link href="/syndic/recouvrement" className="text-[13px] font-medium text-palier-600 hover:underline">Détail</Link>
          </div>

          {/* Bar */}
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-sand/50">
            {seg.map((s) => s.n > 0 && (
              <div key={s.key} className="transition-all" style={{ width: `${(s.n / total) * 100}%`, backgroundColor: s.color }} />
            ))}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            {seg.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[12px] text-ink-soft">{s.label}</span>
                <span className="text-[13px] font-semibold text-ink">{s.n}</span>
              </div>
            ))}
          </div>

          {/* Late residents */}
          {lateResidents.length > 0 && (
            <div className="mt-4 border-t border-black/[0.06] pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Top impayés</p>
              <div className="space-y-2">
                {lateResidents.map((r) => (
                  <div key={r.unitId} className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-[10px] font-semibold text-ink-soft">
                      {r.ownerName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-ink">{r.ownerName}</p>
                      <p className="text-[11px] text-ink-faint">Lot {r.ref}</p>
                    </div>
                    <span className="text-[12px] font-semibold text-red-600">{mad(r.amount - r.paid, { decimals: false })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ═══ Row 3: Budget + Résumé ═══ */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Budget execution by category */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-ink">
              Dépenses par catégorie — {periodLabel(period, customFrom, customTo)}
            </h2>
            <Link href="/syndic/budget" className="text-[13px] font-medium text-palier-600 hover:underline">Budget</Link>
          </div>
          {topCategories.length > 0 ? (
            <div className="space-y-3">
              {topCategories.map((c) => (
                <div key={c.cat}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-ink">{c.cat}</span>
                    <span className="text-[12px] font-semibold text-ink">{mad(c.amount, { decimals: false })} <span className="text-ink-faint font-normal">({c.pct}%)</span></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-sand/50">
                    <div className="h-full rounded-full bg-palier-600 transition-all" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4">
              <Icon name="BookOpen" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">Aucune dépense sur la période</p>
            </div>
          )}
        </Card>

        {/* Résumé + Actions rapides */}
        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 text-[14px] font-semibold text-ink">Résumé</h2>
            <div className="space-y-3">
              {[
                { icon: "Building2", label: "Lots", value: k.lots, hint: `${activeResidents} résidents actifs` },
                { icon: "TriangleAlert", label: "Incidents", value: `${k.openIncidents}`, hint: newIncidents > 0 ? `${newIncidents} nouveau${newIncidents > 1 ? "x" : ""} sur la période` : "aucun nouveau" },
                { icon: "FileText", label: "Documents", value: docsInPeriod.length, hint: `${d.documents.length} au total` },
                { icon: "Calendar", label: "Prochaine AG", value: nextAssembly ? shortDate(nextAssembly.date) : "—", hint: nextAssembly ? `${nextAssembly.agenda.length} point${nextAssembly.agenda.length > 1 ? "s" : ""}` : "aucune prévue" },
                { icon: "Users", label: "Voisinage", value: postsInPeriod.length, hint: `publication${postsInPeriod.length > 1 ? "s" : ""} sur la période` },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={iconBox}><Icon name={m.icon} className={iconCls} /></div>
                    <div>
                      <p className="text-[13px] font-medium text-ink">{m.label}</p>
                      <p className="text-[11px] text-ink-faint">{m.hint}</p>
                    </div>
                  </div>
                  <span className="text-[16px] font-bold text-ink">{m.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-[14px] font-semibold text-ink">Actions rapides</h2>
            <div className="space-y-1">
              {[
                { href: "/syndic/recouvrement", label: "Émettre un appel de fonds", icon: "ReceiptText" },
                { href: "/syndic/incidents", label: "Traiter les incidents", icon: "Wrench" },
                { href: "/syndic/transparence", label: "Saisir une opération", icon: "BookOpen" },
                { href: "/syndic/documents", label: "Ajouter un document", icon: "Upload" },
                { href: "/syndic/ag", label: "Convoquer une assemblée", icon: "Calendar" },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-sand/50 hover:text-ink"
                >
                  <Icon name={a.icon} className="h-4 w-4 text-ink-soft" strokeWidth={1.8} />
                  <span className="flex-1">{a.label}</span>
                  <Icon name="ChevronRight" className="h-3.5 w-3.5 text-ink-faint" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ═══ Row 4: Incidents + Dépenses récentes ═══ */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Incidents sur la période */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={smallIconBox}><Icon name="TriangleAlert" className={smallIconCls} /></div>
              <h2 className="text-[14px] font-semibold text-ink">Incidents · {periodLabel(period, customFrom, customTo)}</h2>
            </div>
            <Link href="/syndic/incidents" className="text-[13px] font-medium text-palier-600 hover:underline">Tout voir</Link>
          </div>
          {incidentsInPeriod.length > 0 ? (
            <div className="divide-y divide-black/[0.04]">
              {incidentsInPeriod.slice(0, 5).map((i: any) => (
                <div key={i.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{i.title}</p>
                    <p className="text-[11px] text-ink-faint">{i.reporter_name} · {timeAgo(i.created_at)}</p>
                  </div>
                  {(i.urgency === "urgent" || i.urgency === "high") && (
                    <span className="shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">Urgent</span>
                  )}
                  <StatusPill status={i.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4">
              <Icon name="CheckCircle" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">Aucun incident sur cette période</p>
            </div>
          )}
        </Card>

        {/* Opérations sur la période */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={smallIconBox}><Icon name="BookOpen" className={smallIconCls} /></div>
              <h2 className="text-[14px] font-semibold text-ink">Opérations · {periodLabel(period, customFrom, customTo)}</h2>
            </div>
            <Link href="/syndic/transparence" className="text-[13px] font-medium text-palier-600 hover:underline">Journal</Link>
          </div>
          {ledgerInPeriod.length > 0 ? (
            <div className="divide-y divide-black/[0.04]">
              {ledgerInPeriod.slice(0, 5).map((e: any) => (
                <div key={e.id} className="flex items-center gap-3 py-2.5">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${e.type === "in" ? "bg-emerald-50" : "bg-red-50"}`}>
                    <Icon name={e.type === "in" ? "ArrowDownLeft" : "ArrowUpRight"} className={`h-3.5 w-3.5 ${e.type === "in" ? "text-emerald-600" : "text-red-500"}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{e.label}</p>
                    <p className="text-[11px] text-ink-faint">{e.category} · {shortDate(e.entry_date ?? e.date)}</p>
                  </div>
                  <span className={`shrink-0 text-[13px] font-semibold ${e.type === "in" ? "text-emerald-600" : "text-ink"}`}>
                    {e.type === "in" ? "+" : "−"}{mad(e.amount, { decimals: false })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4">
              <Icon name="BookOpen" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">Aucune opération sur cette période</p>
            </div>
          )}
        </Card>
      </div>

      {/* ═══ Row 5: Prochaine AG + Derniers documents ═══ */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Prochaine assemblée */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={smallIconBox}><Icon name="Calendar" className={smallIconCls} /></div>
              <h2 className="text-[14px] font-semibold text-ink">Prochaine assemblée</h2>
            </div>
            <Link href="/syndic/ag" className="text-[13px] font-medium text-palier-600 hover:underline">Toutes les AG</Link>
          </div>
          {nextAssembly ? (
            <div className="rounded-xl bg-black/[0.02] p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-palier-600 text-white">
                  <span className="text-[16px] font-bold leading-none">{new Date(nextAssembly.date).getDate()}</span>
                  <span className="text-[10px] font-medium uppercase">{new Date(nextAssembly.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink">Assemblée générale</p>
                  <p className="text-[12px] text-ink-soft">{nextAssembly.time} · {nextAssembly.place}</p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">{nextAssembly.agenda.length} point{nextAssembly.agenda.length > 1 ? "s" : ""} à l&apos;ordre du jour</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4">
              <Icon name="Calendar" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">Aucune assemblée prévue</p>
            </div>
          )}
        </Card>

        {/* Derniers documents */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={smallIconBox}><Icon name="FileText" className={smallIconCls} /></div>
              <h2 className="text-[14px] font-semibold text-ink">Documents · {periodLabel(period, customFrom, customTo)}</h2>
            </div>
            <Link href="/syndic/documents" className="text-[13px] font-medium text-palier-600 hover:underline">Tous</Link>
          </div>
          {docsInPeriod.length > 0 ? (
            <div className="divide-y divide-black/[0.04]">
              {docsInPeriod.slice(0, 5).map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04]">
                    <Icon name="FileText" className="h-4 w-4 text-ink-soft" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{doc.title}</p>
                    <p className="text-[11px] text-ink-faint">{shortDate(doc.date)} · {doc.size || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4">
              <Icon name="FileText" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">Aucun document sur cette période</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
