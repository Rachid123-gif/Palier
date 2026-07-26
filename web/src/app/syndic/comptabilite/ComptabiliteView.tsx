"use client";
import { useMemo } from "react";
import { PageHeader, KpiCard } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { mad } from "@/lib/format";
import {
  ANNEXES,
  getAccountingTier,
  getRequiredAnnexes,
  type AccountingTier,
} from "@/lib/comptabilite";
import type { Budget, UrgentWork } from "@/lib/types";
import type { RecouvrementRow } from "@/lib/syndic";
import type { LedgerInput } from "@/lib/annexes";
import {
  prepareAnnexe3, prepareAnnexe4, prepareAnnexe5,
  prepareAnnexe6, prepareAnnexe7, prepareAnnexe8,
  prepareAnnexe9, prepareAnnexe10, prepareAnnexe11,
  prepareAnnexe12, prepareAnnexe13_1, prepareAnnexe13_2,
  prepareA13CSV,
} from "@/lib/annexes";
import {
  generateAnnexe3PDF, generateAnnexe4PDF, generateAnnexe5PDF,
  generateAnnexe6PDF, generateAnnexe7PDF, generateAnnexe8PDF,
  generateAnnexe9PDF, generateAnnexe10PDF, generateAnnexe11PDF,
  generateAnnexe12PDF, generateAnnexe13_1PDF, generateAnnexe13_2PDF,
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
  const tier = getAccountingTier(building.annualBudget) as AccountingTier;
  const requiredAnnexes = getRequiredAnnexes(tier);

  const tierLabel = tier === "tier1" ? "≤ 200 000 MAD" : tier === "tier2" ? "200 000 – 500 000 MAD" : "≥ 500 000 MAD";
  const tierName = tier === "tier1" ? "Petit" : tier === "tier2" ? "Moyen" : "Grand";

  // Compute totals
  const totalExpenses = ledger.filter((e: any) => e.type === "out" || e.type === "expense").reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
  const totalIncome = ledger.filter((e: any) => e.type === "in" || e.type === "income").reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);

  const fiscalYear = new Date().getFullYear();

  // Ledger inputs for current year (N)
  const ledgerInputs: LedgerInput[] = useMemo(() => ledger
    .filter((e: any) => {
      const d = e.entry_date ?? e.date ?? "";
      return d.startsWith(String(fiscalYear));
    })
    .map((e: any) => ({
      type: (e.type === "income" ? "in" : e.type === "expense" ? "out" : e.type) as "in" | "out",
      label: e.label ?? "",
      amount: Number(e.amount ?? 0),
      category: e.category ?? "",
      date: e.entry_date ?? e.date ?? "",
    })), [ledger, fiscalYear]);

  // Ledger inputs for previous year (N-1)
  const ledgerInputsN1: LedgerInput[] = useMemo(() => ledger
    .filter((e: any) => {
      const d = e.entry_date ?? e.date ?? "";
      return d.startsWith(String(fiscalYear - 1));
    })
    .map((e: any) => ({
      type: (e.type === "income" ? "in" : e.type === "expense" ? "out" : e.type) as "in" | "out",
      label: e.label ?? "",
      amount: Number(e.amount ?? 0),
      category: e.category ?? "",
      date: e.entry_date ?? e.date ?? "",
    })), [ledger, fiscalYear]);

  // If no entries match the fiscal year filter, fall back to all entries (for backwards compat)
  const entriesN = ledgerInputs.length > 0 ? ledgerInputs : useMemo(() => ledger.map((e: any) => ({
    type: (e.type === "income" ? "in" : e.type === "expense" ? "out" : e.type) as "in" | "out",
    label: e.label ?? "",
    amount: Number(e.amount ?? 0),
    category: e.category ?? "",
    date: e.entry_date ?? e.date ?? "",
  })), [ledger]);

  // Budgets: current, previous, next
  const currentBudget = budgets.find((b) => b.fiscalYear === fiscalYear) ?? budgets[0];
  const previousBudget = budgets.find((b) => b.fiscalYear === fiscalYear - 1);
  const nextBudget = budgets.find((b) => b.fiscalYear === fiscalYear + 1);

  // N-1 balance/unpaid — computed from previous year ledger entries
  const balanceN1 = useMemo(() => {
    const incomeN1 = ledgerInputsN1.reduce((s, e) => s + (e.type === "in" ? e.amount : 0), 0);
    const expenseN1 = ledgerInputsN1.reduce((s, e) => s + (e.type === "out" ? e.amount : 0), 0);
    return incomeN1 - expenseN1;
  }, [ledgerInputsN1]);
  const unpaidN1 = useMemo(() => {
    const prevBudget = budgets.find((b) => b.fiscalYear === fiscalYear - 1);
    if (!prevBudget) return 0;
    return recouvrement
      .filter((r) => r.dueDate && new Date(r.dueDate).getFullYear() === fiscalYear - 1)
      .reduce((s, r) => s + Math.max(0, r.amount - r.paid), 0);
  }, [budgets, recouvrement, fiscalYear]);

  // Export annexe
  function exportAnnexe(annexeId: string) {
    const name = building.name;
    const fy = fiscalYear;
    const fname = (id: string) => `Annexe_${id}_${name.replace(/\s+/g, "_")}_${fy}.pdf`;

    switch (annexeId) {
      case "3": {
        const { actif, passif } = prepareAnnexe3(entriesN, kpis.balance, kpis.outstanding, ledgerInputsN1, balanceN1, unpaidN1);
        downloadPDF(generateAnnexe3PDF(actif, passif, name, fy), fname("3"));
        break;
      }
      case "4": {
        const { produits, charges, resultat } = prepareAnnexe4(entriesN, nextBudget);
        downloadPDF(generateAnnexe4PDF(produits, charges, resultat, name, fy), fname("4"));
        break;
      }
      case "5": {
        const { rows, totals } = prepareAnnexe5(currentBudget, previousBudget, nextBudget);
        downloadPDF(generateAnnexe5PDF(rows, totals, name, fy), fname("5"));
        break;
      }
      case "6": {
        const data = prepareAnnexe6(urgentWorks);
        downloadPDF(generateAnnexe6PDF(data.rows, data, name, fy), fname("6"));
        break;
      }
      case "7": {
        const { rows, solde } = prepareAnnexe7(entriesN);
        downloadPDF(generateAnnexe7PDF(rows, solde, name, fy), fname("7"));
        break;
      }
      case "8": {
        const data = prepareAnnexe8();
        downloadPDF(generateAnnexe8PDF(data.rows, data, name, fy), fname("8"));
        break;
      }
      case "9": {
        const data = prepareAnnexe9();
        downloadPDF(generateAnnexe9PDF(data.rows, data.totalValeur, name, fy), fname("9"));
        break;
      }
      case "10": {
        const data = prepareAnnexe10(recouvrement);
        downloadPDF(generateAnnexe10PDF(data.rows, data, name, fy), fname("10"));
        break;
      }
      case "11": {
        const { situation, gestion, totalActifN, totalActifN1 } = prepareAnnexe11(entriesN, kpis.balance, kpis.outstanding, ledgerInputsN1, balanceN1, unpaidN1);
        downloadPDF(generateAnnexe11PDF(situation, gestion, totalActifN, totalActifN1, name, fy), fname("11"));
        break;
      }
      case "12": {
        const { rows, totalProduitsN, totalChargesN, resultatN } = prepareAnnexe12(entriesN, currentBudget, previousBudget);
        downloadPDF(generateAnnexe12PDF(rows, totalProduitsN, totalChargesN, resultatN, name, fy), fname("12"));
        break;
      }
      case "13-1": {
        const { rows, totalActifN, totalActifN1 } = prepareAnnexe13_1(entriesN, kpis.balance, kpis.outstanding, ledgerInputsN1, balanceN1, unpaidN1);
        downloadPDF(generateAnnexe13_1PDF(rows, totalActifN, totalActifN1, name, fy), fname("13-1"));
        break;
      }
      case "13-2": {
        const { rows } = prepareAnnexe13_2(entriesN, currentBudget, nextBudget);
        downloadPDF(generateAnnexe13_2PDF(rows, name, fy), fname("13-2"));
        break;
      }
    }
  }

  function canExport(annexeId: string): boolean {
    switch (annexeId) {
      case "3": return entriesN.length > 0;
      case "4": return entriesN.length > 0;
      case "5": return !!currentBudget && currentBudget.lines.length > 0;
      case "6": return true; // Shows "Néant" if no works
      case "7": return entriesN.some((e) => {
        const n = e.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return n.includes("reserve") || n.includes("fonds");
      });
      case "8": return true; // Shows "Néant" if no loans
      case "9": return true; // Shows "Néant" if no equipment
      case "10": return recouvrement.length > 0;
      case "11": return entriesN.length > 0;
      case "12": return entriesN.length > 0 || (!!currentBudget && currentBudget.lines.length > 0);
      case "13-1": return true;
      case "13-2": return true;
      default: return false;
    }
  }

  // Group required annexes by section
  const annexeGroups = useMemo(() => {
    const groups: { title: string; subtitle: string; annexes: typeof ANNEXES }[] = [];
    const required = requiredAnnexes;
    if (tier === "tier3") {
      groups.push({
        title: "Annexes détaillées (3–10)",
        subtitle: "Régime Grand — obligatoires pour budget ≥ 500 000 MAD",
        annexes: required.filter((a) => parseInt(a.id) >= 3 && parseInt(a.id) <= 10),
      });
    } else if (tier === "tier2") {
      groups.push({
        title: "Annexes simplifiées (11–12)",
        subtitle: "Régime Moyen — obligatoires pour budget 200 000 – 500 000 MAD",
        annexes: required.filter((a) => a.id === "11" || a.id === "12"),
      });
      const a10 = required.find((a) => a.id === "10");
      if (a10) {
        groups.push({
          title: "Suivi des contributions",
          subtitle: "Obligatoire pour tous les régimes",
          annexes: [a10],
        });
      }
    } else {
      groups.push({
        title: "Annexes très simplifiées (13)",
        subtitle: "Régime Petit — obligatoires pour budget ≤ 200 000 MAD",
        annexes: required.filter((a) => a.id.startsWith("13")),
      });
      const a10 = required.find((a) => a.id === "10");
      if (a10) {
        groups.push({
          title: "Suivi des contributions",
          subtitle: "Obligatoire pour tous les régimes",
          annexes: [a10],
        });
      }
    }
    return groups;
  }, [tier, requiredAnnexes]);

  const exportableCount = requiredAnnexes.filter((a) => canExport(a.id)).length;

  return (
    <div>
      <PageHeader
        title="Comptabilité"
        subtitle={`Régime ${tierName} · ${tierLabel} · Exercice ${fiscalYear}`}
      />

      {/* Tier info banner */}
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-palier-200 bg-palier-50/50 px-4 py-3">
        <Icon name="Scale" className="mt-0.5 h-4 w-4 shrink-0 text-palier-700" />
        <div className="text-[12px]">
          <p className="font-semibold text-palier-800">Régime comptable : {tierName}</p>
          <p className="mt-0.5 text-palier-700">
            {requiredAnnexes.length} annexe{requiredAnnexes.length > 1 ? "s" : ""} obligatoire{requiredAnnexes.length > 1 ? "s" : ""} selon le Décret 2.23.700.
            {tier === "tier3" && " Un commissaire aux comptes est requis au-delà de 1 000 000 MAD."}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Recettes" value={mad(totalIncome, { decimals: false })} />
        <KpiCard label="Dépenses" value={mad(totalExpenses, { decimals: false })} />
        <KpiCard label="Solde trésorerie" value={mad(kpis.balance, { decimals: false })} />
        <KpiCard label="Impayés" value={mad(kpis.outstanding, { decimals: false })} hint={kpis.outstanding > 0 ? "à recouvrer" : "aucun impayé"} />
      </div>

      {/* Annexes header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">Annexes légales</h2>
        <span className="rounded-full bg-palier-50 px-2.5 py-1 text-[11px] font-bold text-palier-700">
          {exportableCount}/{requiredAnnexes.length} prêtes
        </span>
      </div>

      {/* Explainer note */}
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-palier-200 bg-palier-50/50 px-4 py-3">
        <Icon name="Lightbulb" className="mt-0.5 h-4 w-4 shrink-0 text-palier-700" />
        <div className="text-[12px] text-palier-800">
          <p className="font-semibold">Comment ça marche ?</p>
          <p className="mt-0.5 text-palier-700">
            Ces documents sont exigés par le Décret 2.23.700 et générés automatiquement à partir de vos données (Transparence, Budget, Recouvrement). Téléchargez-les en PDF pour les présenter lors de l&apos;assemblée générale.
          </p>
        </div>
      </div>

      {/* Annexes */}
      <div className="space-y-5">
        {annexeGroups.map((group) => (
          <div key={group.title}>
            <div className="mb-2">
              <h3 className="text-[14px] font-semibold text-ink">{group.title}</h3>
              <p className="text-[12px] text-ink-soft">{group.subtitle}</p>
            </div>
            <div className="space-y-2">
              {group.annexes.map((annexe) => {
                const exportable = canExport(annexe.id);
                return (
                  <div key={annexe.id} className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-palier-100 text-[12px] font-bold text-palier-700">
                        {annexe.id}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-ink">{annexe.label}</p>
                        <p className="mt-0.5 text-[12px] text-ink-soft">{annexe.description}</p>
                        {exportable && (
                          <button
                            onClick={() => exportAnnexe(annexe.id)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-palier-200 bg-palier-50 px-3 py-1.5 text-[11px] font-semibold text-palier-700 transition-colors hover:bg-palier-100"
                          >
                            <Icon name="Download" className="h-3.5 w-3.5" />
                            Télécharger PDF
                          </button>
                        )}
                        {!exportable && (
                          <p className="mt-1.5 text-[11px] text-amber-600">Pas de données disponibles</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* CSV export for auditor */}
        {tier === "tier3" && entriesN.length > 0 && (
          <div>
            <div className="mb-2">
              <h3 className="text-[14px] font-semibold text-ink">Export auditeur</h3>
              <p className="text-[12px] text-ink-soft">Pour transmission au commissaire aux comptes</p>
            </div>
            <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/30 p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[11px] font-bold text-blue-700">
                  CSV
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">Export complet du journal</p>
                  <p className="mt-0.5 text-[12px] text-ink-soft">Toutes les écritures comptables en format CSV</p>
                  <button
                    onClick={() => {
                      const csv = prepareA13CSV(entriesN, building.name, fiscalYear);
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Export_CAC_${building.name.replace(/\s+/g, "_")}_${fiscalYear}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <Icon name="FileSpreadsheet" className="h-3.5 w-3.5" />
                    Exporter CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
