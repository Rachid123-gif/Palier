/**
 * Décret 2.23.700 — Data preparation for accounting annexes.
 *
 * Structure légale:
 *   Grand (≥ 500k MAD): Annexes 3–10
 *   Moyen (200k–500k MAD): Annexes 10, 11, 12
 *   Petit (≤ 200k MAD): Annexes 10, 13-1, 13-2
 */

import { PLAN_COMPTABLE } from "./comptabilite";
import type { Budget, UrgentWork } from "./types";
import type { RecouvrementRow } from "./syndic";

/* ═══════════════════════════════════════════
   Input type
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

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ═══════════════════════════════════════════
   Shared aggregate helpers
   ═══════════════════════════════════════════ */

export interface AccountRow { accountCode: string; accountLabel: string; amount: number }

function aggregateExpenses(entries: LedgerInput[]): { rows: AccountRow[]; total: number } {
  const m = new Map<string, number>();
  for (const e of entries.filter((e) => e.type === "out")) {
    const c = mapToAccount(e.category, "out");
    m.set(c, (m.get(c) ?? 0) + e.amount);
  }
  const rows: AccountRow[] = [...m.entries()]
    .map(([c, a]) => ({ accountCode: c, accountLabel: accountLabel(c), amount: round(a) }))
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  return { rows, total: rows.reduce((s, r) => s + r.amount, 0) };
}

function aggregateRevenues(entries: LedgerInput[]): { rows: AccountRow[]; total: number } {
  const m = new Map<string, number>();
  for (const e of entries.filter((e) => e.type === "in")) {
    const c = mapToAccount(e.category, "in");
    m.set(c, (m.get(c) ?? 0) + e.amount);
  }
  const rows: AccountRow[] = [...m.entries()]
    .map(([c, a]) => ({ accountCode: c, accountLabel: accountLabel(c), amount: round(a) }))
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  return { rows, total: rows.reduce((s, r) => s + r.amount, 0) };
}

function reserveInflows(entries: LedgerInput[]): number {
  return entries
    .filter((e) => e.type === "in" && (normalize(e.category).includes("reserve") || normalize(e.category).includes("fonds")))
    .reduce((s, e) => s + e.amount, 0);
}

function reserveOutflows(entries: LedgerInput[]): number {
  return entries
    .filter((e) => e.type === "out" && (normalize(e.category).includes("reserve") || normalize(e.category).includes("fonds")))
    .reduce((s, e) => s + e.amount, 0);
}

/* ═══════════════════════════════════════════
   Journal (for CSV export)
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

/* ═══════════════════════════════════════════════════════════
   ANNEXE 3 — État de la situation financière (Bilan)
   Grand ≥ 500 000 MAD

   ACTIF: Créances copropriétaires, Autres créances, Trésorerie
   PASSIF: Fonds de réserve, Provisions, Résultat, Dettes fournisseurs, Autres dettes
   Colonnes: Exercice N | Exercice N-1
   Règle: Total ACTIF = Total PASSIF
   ═══════════════════════════════════════════════════════════ */

export interface Annexe3Row { label: string; amountN: number; amountN1: number }
export interface Annexe3Section { label: string; rows: Annexe3Row[]; totalN: number; totalN1: number }

export function prepareAnnexe3(
  entries: LedgerInput[], balance: number, unpaidTotal: number,
  entriesN1: LedgerInput[], balanceN1: number, unpaidN1: number,
) {
  function compute(ent: LedgerInput[], bal: number, unpaid: number) {
    const exp = aggregateExpenses(ent);
    const rev = aggregateRevenues(ent);
    const reserve = reserveInflows(ent);
    const resultat = rev.total - exp.total;
    const totalActif = round(bal + unpaid);
    const dettes = round(Math.max(0, totalActif - reserve - resultat));
    return { reserve: round(reserve), resultat: round(resultat), totalActif, bal: round(bal), unpaid: round(unpaid), dettes };
  }

  const n = compute(entries, balance, unpaidTotal);
  const n1 = compute(entriesN1, balanceN1, unpaidN1);

  const actif: Annexe3Section = {
    label: "ACTIF",
    rows: [
      { label: "Créances copropriétaires", amountN: n.unpaid, amountN1: n1.unpaid },
      { label: "Autres créances", amountN: 0, amountN1: 0 },
      { label: "Trésorerie (banque + caisse)", amountN: n.bal, amountN1: n1.bal },
    ],
    totalN: n.totalActif,
    totalN1: n1.totalActif,
  };

  const passif: Annexe3Section = {
    label: "PASSIF",
    rows: [
      { label: "Fonds de réserve", amountN: n.reserve, amountN1: n1.reserve },
      { label: "Provisions", amountN: 0, amountN1: 0 },
      { label: "Résultat de l'exercice", amountN: n.resultat, amountN1: n1.resultat },
      { label: "Dettes fournisseurs", amountN: n.dettes, amountN1: n1.dettes },
      { label: "Autres dettes", amountN: 0, amountN1: 0 },
    ],
    totalN: n.totalActif,
    totalN1: n1.totalActif,
  };

  return { actif, passif };
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 4 — Compte de gestion général
   Grand ≥ 500 000 MAD

   PRODUITS et CHARGES détaillés par code comptable
   Colonnes: Réalisé exercice N | Budget à approuver N+1
   ═══════════════════════════════════════════════════════════ */

export interface Annexe4Row { accountCode: string; label: string; realiseN: number; budgetN1: number }
export interface Annexe4Section { label: string; rows: Annexe4Row[]; totalRealise: number; totalBudget: number }

export function prepareAnnexe4(entries: LedgerInput[], nextBudget?: Budget) {
  const exp = aggregateExpenses(entries);
  const rev = aggregateRevenues(entries);

  const budgetByCode = new Map<string, number>();
  if (nextBudget?.lines) {
    for (const l of nextBudget.lines) {
      const code = l.accountCode || mapToAccount(l.label + " " + l.category, "out");
      budgetByCode.set(code, (budgetByCode.get(code) ?? 0) + l.amountBudgeted);
    }
  }

  const produits: Annexe4Section = {
    label: "PRODUITS",
    rows: rev.rows.map((r) => ({
      accountCode: r.accountCode, label: r.accountLabel,
      realiseN: r.amount, budgetN1: round(budgetByCode.get(r.accountCode) ?? 0),
    })),
    totalRealise: rev.total,
    totalBudget: rev.rows.reduce((s, r) => s + round(budgetByCode.get(r.accountCode) ?? 0), 0),
  };

  const charges: Annexe4Section = {
    label: "CHARGES",
    rows: exp.rows.map((r) => ({
      accountCode: r.accountCode, label: r.accountLabel,
      realiseN: r.amount, budgetN1: round(budgetByCode.get(r.accountCode) ?? 0),
    })),
    totalRealise: exp.total,
    totalBudget: exp.rows.reduce((s, r) => s + round(budgetByCode.get(r.accountCode) ?? 0), 0),
  };

  return { produits, charges, resultat: round(rev.total - exp.total) };
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 5 — Comparaison budgétaire
   Grand ≥ 500 000 MAD

   Colonnes: Budget approuvé N-1 | Budget voté N | Réalisé N | Budget prévisionnel N+1
             Écart valeur (Budget N − Réalisé N) | Écart %
   Signaler tout poste avec |écart %| > 10%
   ═══════════════════════════════════════════════════════════ */

export interface Annexe5Row {
  label: string;
  category: string;
  budgetN1: number;
  budgetN: number;
  realiseN: number;
  budgetNext: number;
  ecartValeur: number;
  ecartPct: number | null;
  alert: boolean;
}

export function prepareAnnexe5(currentBudget?: Budget, previousBudget?: Budget, nextBudget?: Budget) {
  if (!currentBudget?.lines.length) {
    return { rows: [] as Annexe5Row[], totals: { budgetN1: 0, budgetN: 0, realiseN: 0, budgetNext: 0, ecartValeur: 0 } };
  }

  const prevByLabel = new Map<string, number>();
  if (previousBudget?.lines) for (const l of previousBudget.lines) prevByLabel.set(l.label, l.amountBudgeted);
  const nextByLabel = new Map<string, number>();
  if (nextBudget?.lines) for (const l of nextBudget.lines) nextByLabel.set(l.label, l.amountBudgeted);

  const rows: Annexe5Row[] = currentBudget.lines.map((l) => {
    const budgetN = round(l.amountBudgeted);
    const realiseN = round(l.amountActual);
    const ecartValeur = round(budgetN - realiseN);
    const ecartPct = budgetN !== 0 ? round((ecartValeur / budgetN) * 100) : null;
    return {
      label: l.label, category: l.category,
      budgetN1: round(prevByLabel.get(l.label) ?? 0),
      budgetN, realiseN,
      budgetNext: round(nextByLabel.get(l.label) ?? 0),
      ecartValeur, ecartPct,
      alert: ecartPct !== null && Math.abs(ecartPct) > 10,
    };
  });

  return {
    rows,
    totals: {
      budgetN1: rows.reduce((s, r) => s + r.budgetN1, 0),
      budgetN: rows.reduce((s, r) => s + r.budgetN, 0),
      realiseN: rows.reduce((s, r) => s + r.realiseN, 0),
      budgetNext: rows.reduce((s, r) => s + r.budgetNext, 0),
      ecartValeur: rows.reduce((s, r) => s + r.ecartValeur, 0),
    },
  };
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 6 — Travaux non courants
   Grand ≥ 500 000 MAD

   Colonnes: Description | Montant voté (date AG) | Montant payé |
             Montant réalisé | Solde exécution en attente |
             Montants réalisés non payés | Observations
   ═══════════════════════════════════════════════════════════ */

export interface Annexe6Row {
  description: string;
  montantVote: number;
  dateAG: string;
  montantPaye: number;
  montantRealise: number;
  soldeExecution: number;
  realiseNonPaye: number;
  observations: string;
}

export function prepareAnnexe6(works: UrgentWork[]) {
  const statusLabels: Record<string, string> = {
    declared: "Déclaré", approved: "Approuvé", in_progress: "En cours", completed: "Terminé",
  };

  const rows: Annexe6Row[] = works.map((w) => {
    const vote = round(w.estimatedCost ?? 0);
    const realise = round(w.actualCost ?? 0);
    return {
      description: w.title,
      montantVote: vote,
      dateAG: w.declaredAt ? new Date(w.declaredAt).toLocaleDateString("fr-FR") : "—",
      montantPaye: realise,
      montantRealise: realise,
      soldeExecution: round(Math.max(0, vote - realise)),
      realiseNonPaye: 0,
      observations: `${statusLabels[w.status] ?? w.status}${w.supplier ? ` — Fournisseur : ${w.supplier}` : ""}`,
    };
  });

  return {
    rows,
    totalVote: rows.reduce((s, r) => s + r.montantVote, 0),
    totalPaye: rows.reduce((s, r) => s + r.montantPaye, 0),
    totalRealise: rows.reduce((s, r) => s + r.montantRealise, 0),
    totalSolde: rows.reduce((s, r) => s + r.soldeExecution, 0),
  };
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 7 — Suivi du fonds de réserve (art. 37bis Loi 18-00)
   Grand ≥ 500 000 MAD

   Chronologie des mouvements du fonds de réserve
   Colonnes: Date | Libellé | Entrée | Sortie | Solde cumulé
   ═══════════════════════════════════════════════════════════ */

export interface Annexe7Row { date: string; label: string; entree: number; sortie: number; solde: number }

export function prepareAnnexe7(entries: LedgerInput[]) {
  const reserveEntries = entries.filter((e) => {
    const n = normalize(e.category);
    return n.includes("reserve") || n.includes("fonds");
  }).sort((a, b) => a.date.localeCompare(b.date));

  let solde = 0;
  const rows: Annexe7Row[] = reserveEntries.map((e) => {
    const entree = e.type === "in" ? round(e.amount) : 0;
    const sortie = e.type === "out" ? round(e.amount) : 0;
    solde += entree - sortie;
    return { date: e.date, label: e.label, entree, sortie, solde: round(solde) };
  });

  return { rows, solde: round(solde) };
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 8 — Suivi des emprunts
   Grand ≥ 500 000 MAD

   Colonnes: Date emprunt | Nom prêteur | Montant initial |
             Remboursements exercice | Solde restant dû
   ═══════════════════════════════════════════════════════════ */

export interface Annexe8Row {
  dateEmprunt: string;
  preteur: string;
  montantInitial: number;
  remboursementsExercice: number;
  soldeRestant: number;
}

export function prepareAnnexe8() {
  // Pas de données d'emprunts dans le modèle actuel — "Néant" si aucun emprunt
  return {
    rows: [] as Annexe8Row[],
    totalInitial: 0, totalRembourse: 0, totalRestant: 0,
  };
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 9 — Inventaire des immobilisations
   Grand ≥ 500 000 MAD

   Colonnes: Type/nature équipement | Fournisseur |
             Date mise en service | Valeur acquisition | Observations
   ═══════════════════════════════════════════════════════════ */

export interface Annexe9Row {
  nature: string;
  fournisseur: string;
  dateMiseEnService: string;
  valeurAcquisition: number;
  observations: string;
}

export function prepareAnnexe9() {
  // Pas de données d'inventaire dans le modèle actuel — "Néant" si aucun équipement
  return { rows: [] as Annexe9Row[], totalValeur: 0 };
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 10 — Suivi des contributions des copropriétaires
   TOUS TIERS (obligatoire pour tous)

   Par copropriétaire:
     Référence bien | Nom | Quote-part (tantièmes)
     Solde ouverture | Total charges appelées | Total paiements reçus | Solde clôture
   ═══════════════════════════════════════════════════════════ */

export interface Annexe10Row {
  unitRef: string;
  ownerName: string;
  tantiemes: number;
  soldeOuverture: number;
  chargesAppelees: number;
  paiementsRecus: number;
  soldeCloture: number;
}

export function prepareAnnexe10(recouvrement: RecouvrementRow[]) {
  const rows: Annexe10Row[] = recouvrement.map((r) => ({
    unitRef: r.ref,
    ownerName: r.ownerName,
    tantiemes: r.tantiemes,
    soldeOuverture: 0,
    chargesAppelees: round(r.amount),
    paiementsRecus: round(r.paid),
    soldeCloture: round(r.amount - r.paid),
  })).sort((a, b) => a.unitRef.localeCompare(b.unitRef));

  return {
    rows,
    totalTantiemes: rows.reduce((s, r) => s + r.tantiemes, 0),
    totalCharges: rows.reduce((s, r) => s + r.chargesAppelees, 0),
    totalPaiements: rows.reduce((s, r) => s + r.paiementsRecus, 0),
    totalSolde: rows.reduce((s, r) => s + r.soldeCloture, 0),
  };
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 11 — États financiers simplifiés
   Moyen 200 000 – 500 000 MAD

   Situation financière simplifiée:
     Créances | Trésorerie | Fonds de réserve | Dettes | Résultat
   Compte de gestion simplifié:
     Total produits | Total charges | Résultat
   Colonnes: Exercice N | Exercice N-1
   ═══════════════════════════════════════════════════════════ */

export interface Annexe11Row { label: string; amountN: number; amountN1: number }

export function prepareAnnexe11(
  entries: LedgerInput[], balance: number, unpaidTotal: number,
  entriesN1: LedgerInput[], balanceN1: number, unpaidN1: number,
) {
  function compute(ent: LedgerInput[], bal: number, unpaid: number) {
    const exp = aggregateExpenses(ent);
    const rev = aggregateRevenues(ent);
    const reserve = reserveInflows(ent);
    const resultat = rev.total - exp.total;
    const dettes = round(Math.max(0, bal + unpaid - reserve - resultat));
    return {
      bal: round(bal), unpaid: round(unpaid), reserve: round(reserve),
      resultat: round(resultat), dettes, produits: round(rev.total), charges: round(exp.total),
    };
  }

  const n = compute(entries, balance, unpaidTotal);
  const n1 = compute(entriesN1, balanceN1, unpaidN1);

  const situation: Annexe11Row[] = [
    { label: "Créances copropriétaires", amountN: n.unpaid, amountN1: n1.unpaid },
    { label: "Trésorerie (banque + caisse)", amountN: n.bal, amountN1: n1.bal },
    { label: "Fonds de réserve", amountN: n.reserve, amountN1: n1.reserve },
    { label: "Dettes fournisseurs", amountN: n.dettes, amountN1: n1.dettes },
    { label: "Résultat de l'exercice", amountN: n.resultat, amountN1: n1.resultat },
  ];

  const gestion: Annexe11Row[] = [
    { label: "Total produits", amountN: n.produits, amountN1: n1.produits },
    { label: "Total charges", amountN: n.charges, amountN1: n1.charges },
    { label: "Résultat", amountN: n.resultat, amountN1: n1.resultat },
  ];

  return {
    situation, gestion,
    totalActifN: round(n.bal + n.unpaid),
    totalActifN1: round(n1.bal + n1.unpaid),
  };
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 12 — Revenus et budgets simplifiés
   Moyen 200 000 – 500 000 MAD

   PRODUITS: Cotisations, Travaux, Fonds de réserve, Autres
   CHARGES: Fournitures et services, Taxes et impôts, Personnel, Autres
   Colonnes: Réalisé N | Budget approuvé N-1 | Budget voté N
   Résultat: Excédent / Déficit
   ═══════════════════════════════════════════════════════════ */

export interface Annexe12Row {
  label: string;
  section: "produits" | "charges";
  realiseN: number;
  budgetN1: number;
  budgetN: number;
}

/** Map budget lines to law-defined categories */
function groupBudgetByLawCategory(budget?: Budget): { fournitures: number; taxes: number; personnel: number; autres: number } {
  const result = { fournitures: 0, taxes: 0, personnel: 0, autres: 0 };
  if (!budget?.lines) return result;
  for (const l of budget.lines) {
    const n = normalize(l.label + " " + l.category);
    if (n.includes("salaire") || n.includes("personnel") || n.includes("charges sociales") || n.includes("gardien")) {
      result.personnel += l.amountBudgeted;
    } else if (n.includes("impot") || n.includes("taxe")) {
      result.taxes += l.amountBudgeted;
    } else {
      result.fournitures += l.amountBudgeted;
    }
  }
  return result;
}

export function prepareAnnexe12(entries: LedgerInput[], currentBudget?: Budget, previousBudget?: Budget) {
  const exp = aggregateExpenses(entries);
  const rev = aggregateRevenues(entries);

  // --- PRODUITS par catégorie légale ---
  const cotisations = rev.rows.filter((r) => r.accountCode === "7140").reduce((s, r) => s + r.amount, 0);
  const travaux = rev.rows.filter((r) => r.accountCode === "7142").reduce((s, r) => s + r.amount, 0);
  const reserve = rev.rows.filter((r) => r.accountCode === "7150").reduce((s, r) => s + r.amount, 0);
  const autresProduits = round(rev.total - cotisations - travaux - reserve);

  // --- CHARGES par catégorie légale ---
  const FOURNITURES_CODES = ["6110", "6131", "6132", "6133", "6134", "6142", "6144", "6145", "6148", "6161"];
  const fournitures = exp.rows.filter((r) => FOURNITURES_CODES.includes(r.accountCode)).reduce((s, r) => s + r.amount, 0);
  const taxes = exp.rows.filter((r) => r.accountCode === "6380").reduce((s, r) => s + r.amount, 0);
  const personnel = exp.rows.filter((r) => ["6147", "6171", "6174"].includes(r.accountCode)).reduce((s, r) => s + r.amount, 0);
  const autresCharges = round(exp.total - fournitures - taxes - personnel);

  // Budget par catégorie
  const budgetN = groupBudgetByLawCategory(currentBudget);
  const budgetN1 = groupBudgetByLawCategory(previousBudget);

  // Budget total for revenue side = total budget amount
  const budgetRevN = round(currentBudget?.totalAmount ?? 0);
  const budgetRevN1 = round(previousBudget?.totalAmount ?? 0);
  const budgetReserveN = round(currentBudget?.reserveFundAmount ?? 0);
  const budgetReserveN1 = round(previousBudget?.reserveFundAmount ?? 0);

  const rows: Annexe12Row[] = [
    { label: "Cotisations régulières", section: "produits", realiseN: round(cotisations), budgetN1: round(budgetRevN1 - budgetReserveN1), budgetN: round(budgetRevN - budgetReserveN) },
    { label: "Appels travaux", section: "produits", realiseN: round(travaux), budgetN1: 0, budgetN: 0 },
    { label: "Fonds de réserve", section: "produits", realiseN: round(reserve), budgetN1: round(budgetReserveN1), budgetN: round(budgetReserveN) },
    { label: "Autres produits", section: "produits", realiseN: autresProduits, budgetN1: 0, budgetN: 0 },
    { label: "Fournitures et services", section: "charges", realiseN: round(fournitures), budgetN1: round(budgetN1.fournitures), budgetN: round(budgetN.fournitures) },
    { label: "Taxes et impôts", section: "charges", realiseN: round(taxes), budgetN1: round(budgetN1.taxes), budgetN: round(budgetN.taxes) },
    { label: "Personnel", section: "charges", realiseN: round(personnel), budgetN1: round(budgetN1.personnel), budgetN: round(budgetN.personnel) },
    { label: "Autres charges", section: "charges", realiseN: autresCharges, budgetN1: round(budgetN1.autres), budgetN: round(budgetN.autres) },
  ];

  const totalProduitsN = round(rev.total);
  const totalChargesN = round(exp.total);

  return {
    rows,
    totalProduitsN, totalChargesN,
    resultatN: round(totalProduitsN - totalChargesN),
  };
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 13-1 — Situation financière très simplifiée
   Petit ≤ 200 000 MAD

   4 lignes: Comptes de réserve | Créances | Dettes | Trésorerie
   5 colonnes: Exercice N | Dotation (+) | Utilisation (-) | Exercice N-1 | Observations
   ═══════════════════════════════════════════════════════════ */

export interface Annexe13_1Row {
  label: string;
  exerciceN: number;
  dotation: number;
  utilisation: number;
  exerciceN1: number;
  observations: string;
}

export function prepareAnnexe13_1(
  entries: LedgerInput[], balance: number, unpaidTotal: number,
  entriesN1: LedgerInput[], balanceN1: number, unpaidN1: number,
) {
  const reserveIn = round(reserveInflows(entries));
  const reserveOut = round(reserveOutflows(entries));
  const reserveN1 = round(reserveInflows(entriesN1) - reserveOutflows(entriesN1));

  const exp = aggregateExpenses(entries);
  const rev = aggregateRevenues(entries);
  const dettes = round(Math.max(0, balance + unpaidTotal - (reserveIn - reserveOut) - (rev.total - exp.total)));
  const dettesN1In = aggregateRevenues(entriesN1);
  const dettesN1Exp = aggregateExpenses(entriesN1);
  const dettesN1 = round(Math.max(0, balanceN1 + unpaidN1 - reserveN1 - (dettesN1In.total - dettesN1Exp.total)));

  const rows: Annexe13_1Row[] = [
    {
      label: "Comptes de réserve (Classe 1)",
      exerciceN: round(reserveIn - reserveOut),
      dotation: reserveIn,
      utilisation: reserveOut,
      exerciceN1: reserveN1,
      observations: "Art. 37bis Loi 18-00",
    },
    {
      label: "Créances (Classe 3)",
      exerciceN: round(unpaidTotal),
      dotation: round(unpaidTotal),
      utilisation: 0,
      exerciceN1: round(unpaidN1),
      observations: "Impayés copropriétaires",
    },
    {
      label: "Dettes (Classe 4)",
      exerciceN: dettes,
      dotation: 0,
      utilisation: 0,
      exerciceN1: dettesN1,
      observations: "Fournisseurs et divers",
    },
    {
      label: "Trésorerie (Classe 5)",
      exerciceN: round(balance),
      dotation: round(rev.total),
      utilisation: round(exp.total),
      exerciceN1: round(balanceN1),
      observations: "Banque + caisse",
    },
  ];

  return { rows, totalActifN: round(balance + unpaidTotal), totalActifN1: round(balanceN1 + unpaidN1) };
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 13-2 — Revenus et budget très simplifiés
   Petit ≤ 200 000 MAD

   Colonnes: Budget approuvé (A) | Réalisé (B) | Écart valeur (A−B) |
             Écart % | Budget prévisionnel N+1
   ═══════════════════════════════════════════════════════════ */

export interface Annexe13_2Row {
  label: string;
  budgetApprouve: number;
  realise: number;
  ecartValeur: number;
  ecartPct: number | null;
  budgetNext: number;
}

export function prepareAnnexe13_2(entries: LedgerInput[], currentBudget?: Budget, nextBudget?: Budget) {
  const exp = aggregateExpenses(entries);
  const rev = aggregateRevenues(entries);

  const budgetTotal = currentBudget?.totalAmount ?? 0;
  const reserveBudget = currentBudget?.reserveFundAmount ?? 0;
  const budgetCharges = round(budgetTotal - reserveBudget);
  const budgetProduits = round(budgetTotal);

  const nextTotal = nextBudget?.totalAmount ?? 0;
  const nextReserve = nextBudget?.reserveFundAmount ?? 0;

  function ecart(budget: number, realise: number) {
    const v = round(budget - realise);
    const pct = budget !== 0 ? round((v / budget) * 100) : null;
    return { v, pct };
  }

  const eRecettes = ecart(budgetProduits, rev.total);
  const eDepenses = ecart(budgetCharges, exp.total);
  const resultatBudget = round(budgetProduits - budgetCharges);
  const resultatRealise = round(rev.total - exp.total);
  const eResultat = ecart(resultatBudget, resultatRealise);

  const rows: Annexe13_2Row[] = [
    {
      label: "Total recettes",
      budgetApprouve: round(budgetProduits),
      realise: round(rev.total),
      ecartValeur: eRecettes.v,
      ecartPct: eRecettes.pct,
      budgetNext: round(nextTotal),
    },
    {
      label: "Total dépenses",
      budgetApprouve: round(budgetCharges),
      realise: round(exp.total),
      ecartValeur: eDepenses.v,
      ecartPct: eDepenses.pct,
      budgetNext: round(nextTotal - nextReserve),
    },
    {
      label: "Résultat (excédent / déficit)",
      budgetApprouve: resultatBudget,
      realise: resultatRealise,
      ecartValeur: eResultat.v,
      ecartPct: eResultat.pct,
      budgetNext: round(nextTotal - (nextTotal - nextReserve)),
    },
  ];

  return { rows };
}

/* ═══════════════════════════════════════════
   CSV export (commissaire aux comptes)
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
