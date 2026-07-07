"use client";
import { useState } from "react";
import { PageHeader, Card } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import {
  ACCOUNT_CLASSES,
  PLAN_COMPTABLE,
  ANNEXES,
  getAccountingTier,
  getRequiredAnnexes,
  type AccountingTier,
} from "@/lib/comptabilite";
import type { Budget, UrgentWork } from "@/lib/types";
import type { RecouvrementRow } from "@/lib/syndic";
import type { LedgerInput } from "@/lib/annexes";
import {
  prepareA4, prepareA5, prepareA9, prepareA10,
  prepareA11, prepareA12,
  prepareAnnexe11 as prepareAnnexe11Simpl,
  prepareAnnexe12 as prepareAnnexe12Simpl,
  prepareAnnexe13_1, prepareAnnexe13_2,
  prepareA13CSV,
} from "@/lib/annexes";
import {
  generateAnnexe3PDF, generateAnnexe4PDF, generateAnnexe5PDF,
  generateAnnexe6PDF, generateAnnexe7PDF, generateAnnexe10PDF,
  generateAnnexe11PDF, generateAnnexe12PDF,
  generateAnnexe13_1PDF, generateAnnexe13_2PDF,
} from "@/lib/pdf-annexes";
import { downloadPDF } from "@/lib/pdf";

interface Props {
  building: { name: string; annualBudget: number; accountingTier: string };
  ledger: any[];
  budgets: Budget[];
  recouvrement: RecouvrementRow[];
  kpis: { collected: number; expected: number; outstanding: number; balance: number };
  urgentWorks: UrgentWork[];
}

export default function ComptabiliteView({ building, ledger, budgets, recouvrement, kpis, urgentWorks }: Props) {
  const [tab, setTab] = useState<"plan" | "annexes" | "journal">("plan");
  const tier = getAccountingTier(building.annualBudget) as AccountingTier;
  const requiredAnnexes = getRequiredAnnexes(tier);

  const tierLabel = tier === "tier1" ? "≤ 200 000 MAD" : tier === "tier2" ? "200 000 – 500 000 MAD" : "≥ 500 000 MAD";
  const tierName = tier === "tier1" ? "Petit" : tier === "tier2" ? "Moyen" : "Grand";

  // Compute journal from ledger
  const journal = ledger
    .sort((a: any, b: any) => (b.entry_date ?? b.date ?? "").localeCompare(a.entry_date ?? a.date ?? ""))
    .slice(0, 50);

  // Compute annexe data
  const totalExpenses = ledger.filter((e: any) => e.type === "out" || e.type === "expense").reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
  const totalIncome = ledger.filter((e: any) => e.type === "in" || e.type === "income").reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);

  // Convert ledger to LedgerInput format for annexes
  const ledgerInputs: LedgerInput[] = ledger.map((e: any) => ({
    type: (e.type === "income" ? "in" : e.type === "expense" ? "out" : e.type) as "in" | "out",
    label: e.label ?? "",
    amount: Number(e.amount ?? 0),
    category: e.category ?? "",
    date: e.entry_date ?? e.date ?? "",
  }));

  const fiscalYear = new Date().getFullYear();
  const currentBudget = budgets.find((b) => b.fiscalYear === fiscalYear) ?? budgets[0];

  function exportAnnexe(annexeId: string) {
    const name = building.name;
    const fy = fiscalYear;
    const fname = (id: string) => `Annexe_${id}_${name.replace(/\s+/g, "_")}_${fy}.pdf`;

    switch (annexeId) {
      // Grand — Annexes 3 à 10
      case "3": {
        // Annexe 3 = État de la situation financière (bilan actif/passif)
        const { actif, passif } = prepareA11(ledgerInputs, kpis.balance, kpis.outstanding);
        downloadPDF(generateAnnexe3PDF(actif, passif, name, fy), fname("3"));
        break;
      }
      case "4": {
        // Annexe 4 = Compte de gestion général (produits & charges)
        const { charges, produits, resultat } = prepareA12(ledgerInputs);
        downloadPDF(generateAnnexe4PDF(charges, produits, resultat, name, fy), fname("4"));
        break;
      }
      case "5": {
        // Annexe 5 = Comparaison budgétaire
        const { rows, totalBudgeted, totalActual, totalEcart } = prepareA5(currentBudget);
        downloadPDF(generateAnnexe5PDF(rows, totalBudgeted, totalActual, totalEcart, name, fy), fname("5"));
        break;
      }
      case "6": {
        // Annexe 6 = Travaux non courants
        const { rows, totalBudget, totalDepense } = prepareA10(urgentWorks);
        downloadPDF(generateAnnexe6PDF(rows, totalBudget, totalDepense, name, fy), fname("6"));
        break;
      }
      case "7": {
        // Annexe 7 = Suivi du fonds de réserve
        const { rows, solde } = prepareA9(ledgerInputs);
        downloadPDF(generateAnnexe7PDF(rows, solde, name, fy), fname("7"));
        break;
      }
      // Annexes 8 (emprunts) et 9 (immobilisations) — pas de données encore
      case "10": {
        // Annexe 10 = Suivi des contributions copropriétaires
        const { rows, total } = prepareA4(recouvrement);
        downloadPDF(generateAnnexe10PDF(rows, total, name, fy), fname("10"));
        break;
      }
      // Moyen — Annexes 11, 12
      case "11": {
        // Annexe 11 = États simplifiés
        const { situation, gestion, totalActif } = prepareAnnexe11Simpl(ledgerInputs, kpis.balance, kpis.outstanding);
        downloadPDF(generateAnnexe11PDF(situation, gestion, totalActif, name, fy), fname("11"));
        break;
      }
      case "12": {
        // Annexe 12 = Revenus et budgets simplifiés
        const { rows, totalBudgeted, totalActual, totalEcart } = prepareAnnexe12Simpl(currentBudget, ledgerInputs);
        downloadPDF(generateAnnexe12PDF(rows, totalBudgeted, totalActual, totalEcart, name, fy), fname("12"));
        break;
      }
      // Petit — Annexes 13-1, 13-2
      case "13-1": {
        const { rows, totalActif } = prepareAnnexe13_1(ledgerInputs, kpis.balance, kpis.outstanding);
        downloadPDF(generateAnnexe13_1PDF(rows, totalActif, name, fy), fname("13-1"));
        break;
      }
      case "13-2": {
        const { rows } = prepareAnnexe13_2(ledgerInputs, currentBudget);
        downloadPDF(generateAnnexe13_2PDF(rows, name, fy), fname("13-2"));
        break;
      }
    }
  }

  // Determine which annexes have enough data to export
  function canExport(annexeId: string): boolean {
    switch (annexeId) {
      case "3": return ledger.length > 0;                          // Bilan
      case "4": return ledger.length > 0;                          // Compte de gestion
      case "5": return !!currentBudget && currentBudget.lines.length > 0; // Budget
      case "6": return urgentWorks.length > 0;                     // Travaux
      case "7": return ledgerInputs.some((e) => {                  // Fonds de réserve
        const n = e.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return n.includes("reserve") || n.includes("fonds");
      });
      case "8": return false;  // Emprunts — pas de données
      case "9": return false;  // Immobilisations — pas de données
      case "10": return recouvrement.length > 0;                   // Contributions
      case "11": return ledger.length > 0;                         // États simplifiés
      case "12": return ledger.length > 0 || (!!currentBudget && currentBudget.lines.length > 0);
      case "13-1": return true;                                    // Toujours (4 lignes)
      case "13-2": return ledger.length > 0;                       // Revenus simplifiés
      default: return false;
    }
  }

  const tabs = [
    { key: "plan" as const, label: "Plan comptable", icon: "BookOpen" },
    { key: "annexes" as const, label: `Annexes (${requiredAnnexes.length})`, icon: "FileText" },
    { key: "journal" as const, label: "Journal", icon: "List" },
  ];

  return (
    <div>
      <PageHeader
        title="Comptabilité"
        subtitle={`Décret 2.23.700 · Régime ${tierName} (${tierLabel})`}
      />

      {/* Tier info banner */}
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <Icon name="Info" className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div className="text-[13px] text-blue-800">
          <p className="font-semibold">Régime {tierName} — Décret n° 2.23.700</p>
          <p className="mt-0.5 text-blue-700">
            Budget annuel {tierLabel}. Vous devez produire {requiredAnnexes.length} annexe{requiredAnnexes.length > 1 ? "s" : ""} comptables obligatoires.
            {tier === "tier3" && " Un commissaire aux comptes est requis au-delà de 1 000 000 MAD."}
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total recettes", value: totalIncome, icon: "TrendingUp" },
          { label: "Total dépenses", value: totalExpenses, icon: "TrendingDown" },
          { label: "Solde trésorerie", value: kpis.balance, icon: "Wallet" },
          { label: "Impayés", value: kpis.outstanding, icon: "AlertTriangle" },
        ].map((k) => (
          <Card key={k.label} className="!p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04]">
                <Icon name={k.icon} className="h-4 w-4 text-ink-soft" />
              </div>
              <div>
                <p className="text-[11px] text-ink-faint">{k.label}</p>
                <p className="text-[16px] font-bold text-ink">{Math.round(k.value).toLocaleString("fr-FR")} <span className="text-[11px] font-normal text-ink-soft">MAD</span></p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-sand/50 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              tab === t.key ? "bg-cream-card text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            )}
          >
            <Icon name={t.icon} className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Plan comptable */}
      {tab === "plan" && (
        <Card>
          <h2 className="mb-4 text-[14px] font-semibold text-ink">Plan comptable — 7 classes</h2>
          <div className="space-y-4">
            {ACCOUNT_CLASSES.map((cls) => {
              const accounts = PLAN_COMPTABLE.filter((a) => a.class === cls.class);
              return (
                <div key={cls.class}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold text-white" style={{ backgroundColor: cls.color }}>
                      {cls.class}
                    </span>
                    <span className="text-[13px] font-semibold text-ink">{cls.name}</span>
                    <span className="text-[11px] text-ink-faint">({accounts.length} comptes)</span>
                  </div>
                  <div className="ml-8 space-y-0.5">
                    {accounts.map((a) => (
                      <div key={a.code} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-sand/50">
                        <span className="w-12 font-mono text-[12px] font-semibold text-ink-soft">{a.code}</span>
                        <span className="text-[13px] text-ink">{a.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Annexes */}
      {tab === "annexes" && (
        <div className="space-y-3">
          {ANNEXES.map((annexe) => {
            const required = requiredAnnexes.some((a) => a.id === annexe.id);
            const exportable = canExport(annexe.id);
            return (
              <Card key={annexe.id} className={cn(!required && "opacity-40")}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
                    required ? "bg-palier-100 text-palier-700" : "bg-black/[0.04] text-ink-faint"
                  )}>
                    {annexe.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-ink">{annexe.label}</p>
                      {required ? (
                        <span className="rounded-md bg-palier-50 px-1.5 py-0.5 text-[10px] font-semibold text-palier-700">Obligatoire</span>
                      ) : (
                        <span className="rounded-md bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-ink-faint">Non requis</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink-soft">{annexe.description}</p>
                    <p className="mt-1 text-[11px] text-ink-faint">
                      Régimes : {annexe.tiers.map((t) => t === "tier1" ? "Petit" : t === "tier2" ? "Moyen" : "Grand").join(", ")}
                    </p>
                    {/* Export button */}
                    {required && exportable && (
                      <button
                        onClick={() => exportAnnexe(annexe.id)}
                        className="tap mt-2 inline-flex items-center gap-1.5 rounded-lg border border-palier-200 bg-palier-50 px-3 py-1.5 text-[11px] font-semibold text-palier-700 transition-colors hover:bg-palier-100"
                      >
                        <Icon name="Download" className="h-3.5 w-3.5" />
                        Exporter PDF
                      </button>
                    )}
                    {required && !exportable && annexe.id !== "8" && annexe.id !== "9" && (
                      <p className="mt-1.5 text-[11px] text-amber-600">Pas de données disponibles</p>
                    )}
                    {(annexe.id === "8" || annexe.id === "9") && required && (
                      <p className="mt-1.5 text-[11px] text-ink-faint">Bientôt disponible</p>
                    )}
                  </div>
                  {required && (
                    <div className="flex items-center gap-1 text-ink-faint">
                      {exportable ? (
                        <Icon name="CheckCircle" className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Icon name="Circle" className="h-4 w-4 text-ink-faint" />
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {/* CSV export for auditor */}
          {tier === "tier3" && ledger.length > 0 && (
            <Card className="border-dashed border-blue-200 bg-blue-50/30">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[11px] font-bold text-blue-700">
                  CSV
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">Export pour commissaire aux comptes</p>
                  <p className="mt-0.5 text-[12px] text-ink-soft">Fichier CSV de toutes les écritures pour transmission à l&apos;auditeur externe</p>
                  <button
                    onClick={() => {
                      const csv = prepareA13CSV(ledgerInputs, building.name, fiscalYear);
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Export_CAC_${building.name.replace(/\s+/g, "_")}_${fiscalYear}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="tap mt-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <Icon name="FileSpreadsheet" className="h-3.5 w-3.5" />
                    Exporter CSV
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Journal des opérations */}
      {tab === "journal" && (
        <Card>
          <h2 className="mb-3 text-[14px] font-semibold text-ink">Journal des opérations</h2>
          {journal.length > 0 ? (
            <div className="divide-y divide-black/[0.04]">
              {journal.map((e: any) => (
                <div key={e.id} className="flex items-center gap-3 py-2.5">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    (e.type === "in" || e.type === "income") ? "bg-emerald-50" : "bg-red-50"
                  )}>
                    <Icon
                      name={(e.type === "in" || e.type === "income") ? "ArrowDownLeft" : "ArrowUpRight"}
                      className={cn("h-4 w-4", (e.type === "in" || e.type === "income") ? "text-emerald-600" : "text-red-600")}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{e.label}</p>
                    <p className="text-[11px] text-ink-faint">
                      {e.account_code && <span className="font-mono">{e.account_code} · </span>}
                      {e.category} · {e.entry_date ?? e.date}
                    </p>
                  </div>
                  <span className={cn(
                    "shrink-0 text-[13px] font-semibold",
                    (e.type === "in" || e.type === "income") ? "text-emerald-700" : "text-red-700"
                  )}>
                    {(e.type === "in" || e.type === "income") ? "+" : "-"}{Math.round(Number(e.amount)).toLocaleString("fr-FR")} MAD
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-6 text-ink-soft">
              <Icon name="BookOpen" className="h-5 w-5" />
              <p className="text-[13px]">Aucune écriture comptable</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
