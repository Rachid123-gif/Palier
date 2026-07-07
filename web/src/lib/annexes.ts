/**
 * Décret 2.23.700 — Data preparation for the 13 accounting annexes.
 * Transforms app data (ledger, charges, budgets) into annexe-ready formats.
 */

import { PLAN_COMPTABLE } from "./comptabilite";
import type { Budget, BudgetLine, UrgentWork } from "./types";
import type { RecouvrementRow } from "./syndic";

/* ═══════════════════════════════════════════
   Input type (ledger row from syndic data)
   ═══════════════════════════════════════════ */
export interface LedgerInput {
  type: "in" | "out";
  label: string;
  amount: number;
  category: string;
  date: string;
}

/* ═══════════════════════════════════════════
   Category → Account code mapping
   ═══════════════════════════════════════════ */

const EXPENSE_MAP: [string, string][] = [
  ["eau", "6131"], ["électricité", "6132"], ["electricite", "6132"],
  ["gaz", "6133"], ["carburant", "6134"],
  ["entretien", "6142"], ["maintenance", "6142"], ["réparation", "6142"],
  ["assurance", "6144"], ["honoraire", "6145"], ["syndic pro", "6145"],
  ["gardien", "6147"], ["sécurité", "6147"], ["securite", "6147"],
  ["nettoyage", "6148"], ["ascenseur", "6161"],
  ["salaire", "6171"], ["personnel", "6171"],
  ["charges sociales", "6174"], ["impôt", "6380"], ["taxe", "6380"],
  ["fourniture", "6110"], ["travaux", "6142"],
];

const REVENUE_MAP: [string, string][] = [
  ["charges courantes", "7140"], ["cotisation", "7140"], ["appel", "7140"],
  ["travaux", "7142"], ["fonds de réserve", "7150"],
  ["réserve", "7150"], ["reserve", "7150"],
  ["intérêt", "7380"], ["divers", "7580"],
];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function mapToAccount(category: string, type: "in" | "out"): string {
  const n = normalize(category);
  const map = type === "out" ? EXPENSE_MAP : REVENUE_MAP;
  for (const [kw, code] of map) {
    if (n.includes(normalize(kw))) return code;
  }
  return type === "out" ? "6700" : "7580";
}

function accountLabel(code: string): string {
  return PLAN_COMPTABLE.find((a) => a.code === code)?.label ?? code;
}

/* ═══════════════════════════════════════════
   Double-entry journal derivation
   ═══════════════════════════════════════════ */

export interface JournalEntry {
  date: string;
  label: string;
  accountDebit: string;
  accountCredit: string;
  amount: number;
}

function deriveJournal(entries: LedgerInput[]): JournalEntry[] {
  return entries.map((e) => {
    const code = mapToAccount(e.category, e.type);
    return e.type === "out"
      ? { date: e.date, label: e.label, accountDebit: code, accountCredit: "5141", amount: e.amount }
      : { date: e.date, label: e.label, accountDebit: "5141", accountCredit: code, amount: e.amount };
  });
}

/* ═══════════════════════════════════════════
   A1 — État des dépenses
   ═══════════════════════════════════════════ */
export interface A1Row { accountCode: string; accountLabel: string; amount: number }

export function prepareA1(entries: LedgerInput[]) {
  const m = new Map<string, number>();
  for (const e of entries.filter((e) => e.type === "out")) {
    const c = mapToAccount(e.category, "out");
    m.set(c, (m.get(c) ?? 0) + e.amount);
  }
  const rows: A1Row[] = [...m.entries()]
    .map(([c, a]) => ({ accountCode: c, accountLabel: accountLabel(c), amount: round(a) }))
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  return { rows, total: rows.reduce((s, r) => s + r.amount, 0) };
}

/* ═══════════════════════════════════════════
   A2 — État des recettes
   ═══════════════════════════════════════════ */
export function prepareA2(entries: LedgerInput[]) {
  const m = new Map<string, number>();
  for (const e of entries.filter((e) => e.type === "in")) {
    const c = mapToAccount(e.category, "in");
    m.set(c, (m.get(c) ?? 0) + e.amount);
  }
  const rows: A1Row[] = [...m.entries()]
    .map(([c, a]) => ({ accountCode: c, accountLabel: accountLabel(c), amount: round(a) }))
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  return { rows, total: rows.reduce((s, r) => s + r.amount, 0) };
}

/* ═══════════════════════════════════════════
   A3 — Situation de trésorerie
   ═══════════════════════════════════════════ */
export interface A3Row { code: string; label: string; amount: number }

export function prepareA3(balance: number) {
  const rows: A3Row[] = [
    { code: "5141", label: "Compte bancaire copropriété", amount: round(balance) },
  ];
  return { rows, total: round(balance) };
}

/* ═══════════════════════════════════════════
   A4 — État des impayés
   ═══════════════════════════════════════════ */
export interface A4Row {
  unitRef: string; ownerName: string;
  totalDue: number; totalPaid: number; balance: number;
  dueDate: string | null;
}

export function prepareA4(recouvrement: RecouvrementRow[]) {
  const rows: A4Row[] = recouvrement
    .filter((r) => r.status !== "paid" && r.amount - r.paid > 0)
    .map((r) => ({
      unitRef: r.ref,
      ownerName: r.ownerName,
      totalDue: round(r.amount),
      totalPaid: round(r.paid),
      balance: round(r.amount - r.paid),
      dueDate: r.dueDate,
    }))
    .sort((a, b) => b.balance - a.balance);
  return { rows, total: rows.reduce((s, r) => s + r.balance, 0) };
}

/* ═══════════════════════════════════════════
   A5 — Budget prévisionnel (voté vs réalisé)
   ═══════════════════════════════════════════ */
export interface A5Row {
  label: string; category: string;
  budgeted: number; actual: number; ecart: number;
}

export function prepareA5(budget: Budget | undefined) {
  if (!budget || !budget.lines.length) return { rows: [] as A5Row[], totalBudgeted: 0, totalActual: 0, totalEcart: 0 };
  const rows: A5Row[] = budget.lines.map((l) => ({
    label: l.label,
    category: l.category,
    budgeted: round(l.amountBudgeted),
    actual: round(l.amountActual),
    ecart: round(l.amountActual - l.amountBudgeted),
  }));
  const totalBudgeted = rows.reduce((s, r) => s + r.budgeted, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  return { rows, totalBudgeted, totalActual, totalEcart: totalActual - totalBudgeted };
}

/* ═══════════════════════════════════════════
   A6 — Balance générale
   ═══════════════════════════════════════════ */
export interface A6Row {
  accountCode: string; label: string;
  totalDebit: number; totalCredit: number;
  soldeDebiteur: number; soldeCrediteur: number;
}

export function prepareA6(entries: LedgerInput[]) {
  const journal = deriveJournal(entries);
  const m = new Map<string, { debit: number; credit: number }>();
  for (const je of journal) {
    const d = m.get(je.accountDebit) ?? { debit: 0, credit: 0 };
    d.debit += je.amount; m.set(je.accountDebit, d);
    const c = m.get(je.accountCredit) ?? { debit: 0, credit: 0 };
    c.credit += je.amount; m.set(je.accountCredit, c);
  }
  const rows: A6Row[] = [...m.entries()]
    .map(([code, { debit, credit }]) => ({
      accountCode: code, label: accountLabel(code),
      totalDebit: round(debit), totalCredit: round(credit),
      soldeDebiteur: debit > credit ? round(debit - credit) : 0,
      soldeCrediteur: credit > debit ? round(credit - debit) : 0,
    }))
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  return { rows };
}

/* ═══════════════════════════════════════════
   A7 — Grand livre
   ═══════════════════════════════════════════ */
export interface A7Account {
  accountCode: string; label: string;
  entries: { date: string; label: string; debit: number; credit: number; solde: number }[];
}

export function prepareA7(entries: LedgerInput[]) {
  const journal = deriveJournal(entries);
  const byAccount = new Map<string, { date: string; label: string; debit: number; credit: number }[]>();
  for (const je of journal) {
    const dList = byAccount.get(je.accountDebit) ?? [];
    dList.push({ date: je.date, label: je.label, debit: je.amount, credit: 0 });
    byAccount.set(je.accountDebit, dList);
    const cList = byAccount.get(je.accountCredit) ?? [];
    cList.push({ date: je.date, label: je.label, debit: 0, credit: je.amount });
    byAccount.set(je.accountCredit, cList);
  }
  const accounts: A7Account[] = [];
  for (const [code, raw] of [...byAccount.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    let solde = 0;
    const sorted = raw.sort((a, b) => a.date.localeCompare(b.date));
    const withSolde = sorted.map((e) => { solde += e.debit - e.credit; return { ...e, solde: round(solde) }; });
    accounts.push({ accountCode: code, label: accountLabel(code), entries: withSolde });
  }
  return { accounts };
}

/* ═══════════════════════════════════════════
   A8 — Journal des opérations
   ═══════════════════════════════════════════ */
export function prepareA8(entries: LedgerInput[]) {
  const rows = deriveJournal(entries).sort((a, b) => a.date.localeCompare(b.date));
  return { rows };
}

/* ═══════════════════════════════════════════
   A9 — État du fonds de réserve
   ═══════════════════════════════════════════ */
export interface A9Row { date: string; label: string; entree: number; sortie: number; solde: number }

export function prepareA9(entries: LedgerInput[]) {
  const reserveEntries = entries.filter((e) => {
    const n = normalize(e.category);
    return n.includes("reserve") || n.includes("fonds");
  }).sort((a, b) => a.date.localeCompare(b.date));
  let solde = 0;
  const rows: A9Row[] = reserveEntries.map((e) => {
    const entree = e.type === "in" ? e.amount : 0;
    const sortie = e.type === "out" ? e.amount : 0;
    solde += entree - sortie;
    return { date: e.date, label: e.label, entree: round(entree), sortie: round(sortie), solde: round(solde) };
  });
  return { rows, solde: round(solde) };
}

/* ═══════════════════════════════════════════
   A10 — État des travaux
   ═══════════════════════════════════════════ */
export interface A10Row {
  title: string; supplier: string;
  budgetVote: number; depense: number; resteAPayer: number;
  status: string;
}

export function prepareA10(works: UrgentWork[]) {
  const statusLabels: Record<string, string> = {
    declared: "Déclaré", approved: "Approuvé", in_progress: "En cours", completed: "Terminé",
  };
  const rows: A10Row[] = works.map((w) => ({
    title: w.title,
    supplier: w.supplier ?? "—",
    budgetVote: round(w.estimatedCost ?? 0),
    depense: round(w.actualCost ?? 0),
    resteAPayer: round(Math.max(0, (w.estimatedCost ?? 0) - (w.actualCost ?? 0))),
    status: statusLabels[w.status] ?? w.status,
  }));
  return {
    rows,
    totalBudget: rows.reduce((s, r) => s + r.budgetVote, 0),
    totalDepense: rows.reduce((s, r) => s + r.depense, 0),
  };
}

/* ═══════════════════════════════════════════
   A11 — Bilan (Actif / Passif)
   ═══════════════════════════════════════════ */
export interface BilanSection {
  label: string;
  items: { label: string; amount: number }[];
  total: number;
}

export function prepareA11(entries: LedgerInput[], balance: number, unpaidTotal: number) {
  const a1 = prepareA1(entries);
  const a2 = prepareA2(entries);
  const reserveIn = entries
    .filter((e) => e.type === "in" && normalize(e.category).includes("reserve"))
    .reduce((s, e) => s + e.amount, 0);
  const resultat = a2.total - a1.total;

  const actif: BilanSection = {
    label: "ACTIF",
    items: [
      { label: "Trésorerie (banque + caisse)", amount: round(balance) },
      { label: "Créances copropriétaires", amount: round(unpaidTotal) },
    ],
    total: round(balance + unpaidTotal),
  };
  const passif: BilanSection = {
    label: "PASSIF",
    items: [
      { label: "Fonds de réserve", amount: round(reserveIn) },
      { label: "Résultat de l'exercice", amount: round(resultat) },
      { label: "Dettes fournisseurs et divers", amount: round(Math.max(0, actif.total - reserveIn - resultat)) },
    ],
    total: actif.total,
  };
  return { actif, passif };
}

/* ═══════════════════════════════════════════
   A12 — Compte de résultat
   ═══════════════════════════════════════════ */
export interface CRSection {
  label: string;
  items: { accountCode: string; label: string; amount: number }[];
  total: number;
}

export function prepareA12(entries: LedgerInput[]) {
  const a1 = prepareA1(entries);
  const a2 = prepareA2(entries);
  const charges: CRSection = {
    label: "CHARGES",
    items: a1.rows.map((r) => ({ accountCode: r.accountCode, label: r.accountLabel, amount: r.amount })),
    total: a1.total,
  };
  const produits: CRSection = {
    label: "PRODUITS",
    items: a2.rows.map((r) => ({ accountCode: r.accountCode, label: r.accountLabel, amount: r.amount })),
    total: a2.total,
  };
  return { charges, produits, resultat: round(a2.total - a1.total) };
}

/* ═══════════════════════════════════════════
   A13 — Export données pour commissaire aux comptes
   ═══════════════════════════════════════════ */
export function prepareA13CSV(entries: LedgerInput[], buildingName: string, fiscalYear: number): string {
  const journal = deriveJournal(entries).sort((a, b) => a.date.localeCompare(b.date));
  const header = "Date,Libellé,Compte débité,Compte crédité,Montant (MAD)";
  const rows = journal.map((j) =>
    `${j.date},"${j.label.replace(/"/g, '""')}",${j.accountDebit} ${accountLabel(j.accountDebit)},${j.accountCredit} ${accountLabel(j.accountCredit)},${j.amount.toFixed(2)}`
  );
  const meta = `# Export comptable — ${buildingName} — Exercice ${fiscalYear}\n# Décret 2.23.700\n# Généré par Palier le ${new Date().toISOString().slice(0, 10)}\n`;
  return meta + header + "\n" + rows.join("\n");
}

/* ═══════════════════════════════════════════
   Annexe 11 — États simplifiés (Moyen)
   Situation financière + gestion condensées
   ═══════════════════════════════════════════ */
export interface A11SimplRow { label: string; amount: number }

export function prepareAnnexe11(entries: LedgerInput[], balance: number, unpaidTotal: number) {
  const a1 = prepareA1(entries);
  const a2 = prepareA2(entries);
  const reserveIn = entries
    .filter((e) => e.type === "in" && normalize(e.category).includes("reserve"))
    .reduce((s, e) => s + e.amount, 0);
  const resultat = a2.total - a1.total;

  const situation: A11SimplRow[] = [
    { label: "Trésorerie", amount: round(balance) },
    { label: "Créances copropriétaires", amount: round(unpaidTotal) },
    { label: "Fonds de réserve", amount: round(reserveIn) },
    { label: "Dettes fournisseurs", amount: round(Math.max(0, balance + unpaidTotal - reserveIn - resultat)) },
  ];
  const gestion: A11SimplRow[] = [
    { label: "Total produits", amount: round(a2.total) },
    { label: "Total charges", amount: round(a1.total) },
    { label: "Résultat", amount: round(resultat) },
  ];
  return { situation, gestion, totalActif: round(balance + unpaidTotal) };
}

/* ═══════════════════════════════════════════
   Annexe 12 — Revenus et budgets simplifiés (Moyen)
   3 colonnes : budget voté, réalisé, écart
   ═══════════════════════════════════════════ */
export interface A12SimplRow { label: string; budgeted: number; actual: number; ecart: number }

export function prepareAnnexe12(budget: Budget | undefined, entries: LedgerInput[]) {
  if (!budget || !budget.lines.length) {
    const a1 = prepareA1(entries);
    const a2 = prepareA2(entries);
    const rows: A12SimplRow[] = [
      { label: "Charges courantes", budgeted: 0, actual: a1.total, ecart: a1.total },
      { label: "Produits courants", budgeted: 0, actual: a2.total, ecart: a2.total },
    ];
    return { rows, totalBudgeted: 0, totalActual: a1.total + a2.total, totalEcart: a1.total + a2.total };
  }
  const rows: A12SimplRow[] = budget.lines.map((l) => ({
    label: l.label,
    budgeted: round(l.amountBudgeted),
    actual: round(l.amountActual),
    ecart: round(l.amountActual - l.amountBudgeted),
  }));
  const totalBudgeted = rows.reduce((s, r) => s + r.budgeted, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  return { rows, totalBudgeted, totalActual, totalEcart: totalActual - totalBudgeted };
}

/* ═══════════════════════════════════════════
   Annexe 13-1 — Bilan très simplifié (Petit)
   4 lignes : réserves, créances, dettes, trésorerie
   ═══════════════════════════════════════════ */
export interface A13_1Row { label: string; amount: number }

export function prepareAnnexe13_1(entries: LedgerInput[], balance: number, unpaidTotal: number) {
  const reserveIn = entries
    .filter((e) => e.type === "in" && normalize(e.category).includes("reserve"))
    .reduce((s, e) => s + e.amount, 0);
  const rows: A13_1Row[] = [
    { label: "Fonds de réserve", amount: round(reserveIn) },
    { label: "Créances copropriétaires", amount: round(unpaidTotal) },
    { label: "Dettes fournisseurs", amount: round(Math.max(0, balance + unpaidTotal - reserveIn)) },
    { label: "Trésorerie (banque + caisse)", amount: round(balance) },
  ];
  return { rows, totalActif: round(balance + unpaidTotal) };
}

/* ═══════════════════════════════════════════
   Annexe 13-2 — Revenus et budget très simplifiés (Petit)
   5 colonnes : poste, budget N-1, budget N, réalisé N, écart
   ═══════════════════════════════════════════ */
export interface A13_2Row { label: string; budgetN: number; actual: number; ecart: number }

export function prepareAnnexe13_2(entries: LedgerInput[], budget: Budget | undefined) {
  const a1 = prepareA1(entries);
  const a2 = prepareA2(entries);
  const totalBudgeted = budget ? budget.lines.reduce((s, l) => s + l.amountBudgeted, 0) : 0;

  const rows: A13_2Row[] = [
    { label: "Total recettes", budgetN: round(totalBudgeted > 0 ? totalBudgeted * 0.6 : 0), actual: round(a2.total), ecart: round(a2.total - totalBudgeted * 0.6) },
    { label: "Total dépenses", budgetN: round(totalBudgeted > 0 ? totalBudgeted * 0.4 : 0), actual: round(a1.total), ecart: round(a1.total - totalBudgeted * 0.4) },
    { label: "Résultat", budgetN: 0, actual: round(a2.total - a1.total), ecart: round(a2.total - a1.total) },
  ];
  return { rows };
}

/* ═══ Utility ═══ */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}
