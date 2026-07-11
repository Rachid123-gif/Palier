/**
 * Plan comptable normalisé — Décret 2.23.700 (effectif jan 2026)
 * 7 classes comptables pour la copropriété marocaine.
 */

export interface AccountCode {
  code: string;
  label: string;
  class: number;
  className: string;
}

/** Les 7 classes du plan comptable copropriété */
export const ACCOUNT_CLASSES = [
  { class: 1, name: "Comptes de financement permanent", color: "#2563eb" },
  { class: 2, name: "Comptes d'actif immobilisé", color: "#7c3aed" },
  { class: 3, name: "Comptes d'actif circulant", color: "#0891b2" },
  { class: 4, name: "Comptes de passif circulant", color: "#d97706" },
  { class: 5, name: "Comptes de trésorerie", color: "#059669" },
  { class: 6, name: "Comptes de charges", color: "#dc2626" },
  { class: 7, name: "Comptes de produits", color: "#16a34a" },
] as const;

/** Plan comptable détaillé (comptes les plus courants) */
export const PLAN_COMPTABLE: AccountCode[] = [
  // Classe 1 — Financement permanent
  { code: "1110", label: "Fonds de roulement", class: 1, className: "Financement permanent" },
  { code: "1150", label: "Fonds de réserve", class: 1, className: "Financement permanent" },
  { code: "1160", label: "Fonds travaux (loi 106-12)", class: 1, className: "Financement permanent" },
  { code: "1400", label: "Emprunts", class: 1, className: "Financement permanent" },

  // Classe 2 — Actif immobilisé
  { code: "2300", label: "Installations techniques parties communes", class: 2, className: "Actif immobilisé" },
  { code: "2340", label: "Matériel et outillage", class: 2, className: "Actif immobilisé" },
  { code: "2350", label: "Mobilier parties communes", class: 2, className: "Actif immobilisé" },

  // Classe 3 — Actif circulant
  { code: "3421", label: "Copropriétaires — appels à payer", class: 3, className: "Actif circulant" },
  { code: "3424", label: "Copropriétaires — avances versées", class: 3, className: "Actif circulant" },
  { code: "3450", label: "Débiteurs divers", class: 3, className: "Actif circulant" },

  // Classe 4 — Passif circulant
  { code: "4411", label: "Fournisseurs", class: 4, className: "Passif circulant" },
  { code: "4432", label: "Rémunération syndic à payer", class: 4, className: "Passif circulant" },
  { code: "4441", label: "Charges sociales à payer", class: 4, className: "Passif circulant" },
  { code: "4452", label: "État — impôts et taxes", class: 4, className: "Passif circulant" },

  // Classe 5 — Trésorerie
  { code: "5141", label: "Compte bancaire copropriété", class: 5, className: "Trésorerie" },
  { code: "5161", label: "Caisse", class: 5, className: "Trésorerie" },
  { code: "5165", label: "Compte livret épargne (fonds travaux)", class: 5, className: "Trésorerie" },

  // Classe 6 — Charges
  { code: "6110", label: "Achats de fournitures", class: 6, className: "Charges" },
  { code: "6131", label: "Eau", class: 6, className: "Charges" },
  { code: "6132", label: "Électricité parties communes", class: 6, className: "Charges" },
  { code: "6133", label: "Gaz", class: 6, className: "Charges" },
  { code: "6134", label: "Carburant (groupe électrogène)", class: 6, className: "Charges" },
  { code: "6142", label: "Entretien et réparations", class: 6, className: "Charges" },
  { code: "6144", label: "Primes d'assurance", class: 6, className: "Charges" },
  { code: "6145", label: "Honoraires syndic professionnel", class: 6, className: "Charges" },
  { code: "6147", label: "Gardiennage et sécurité", class: 6, className: "Charges" },
  { code: "6148", label: "Nettoyage parties communes", class: 6, className: "Charges" },
  { code: "6161", label: "Ascenseur — contrat maintenance", class: 6, className: "Charges" },
  { code: "6171", label: "Salaires personnel immeuble", class: 6, className: "Charges" },
  { code: "6174", label: "Charges sociales", class: 6, className: "Charges" },
  { code: "6380", label: "Impôts et taxes", class: 6, className: "Charges" },
  { code: "6590", label: "Créances irrécouvrables", class: 6, className: "Charges" },
  { code: "6700", label: "Charges exceptionnelles", class: 6, className: "Charges" },

  // Classe 7 — Produits
  { code: "7140", label: "Appels de fonds — charges courantes", class: 7, className: "Produits" },
  { code: "7142", label: "Appels de fonds — travaux", class: 7, className: "Produits" },
  { code: "7150", label: "Cotisation fonds de réserve", class: 7, className: "Produits" },
  { code: "7380", label: "Produits financiers (intérêts)", class: 7, className: "Produits" },
  { code: "7580", label: "Produits divers (antenne, pub…)", class: 7, className: "Produits" },
  { code: "7700", label: "Produits exceptionnels", class: 7, className: "Produits" },
];

/** Determine accounting tier based on annual budget (Décret 2.23.700) */
export type AccountingTier = "tier1" | "tier2" | "tier3";

export function getAccountingTier(annualBudget: number): AccountingTier {
  if (annualBudget >= 500_000) return "tier3";
  if (annualBudget >= 200_000) return "tier2";
  return "tier1";
}

/** Annexes required per tier */
export interface AnnexeRequirement {
  id: string;
  label: string;
  description: string;
  tiers: AccountingTier[];
}

export const ANNEXES: AnnexeRequirement[] = [
  // Grand (≥ 500 000 MAD) — Annexes 3 à 10
  { id: "3", label: "État de la situation financière", description: "Bilan actif / passif — Exercice N et N-1", tiers: ["tier3"] },
  { id: "4", label: "Compte de gestion général", description: "Produits et charges par code comptable — Réalisé N + Budget N+1", tiers: ["tier3"] },
  { id: "5", label: "Comparaison budgétaire", description: "Budget N-1, N, Réalisé N, Prévision N+1, Écart valeur et %", tiers: ["tier3"] },
  { id: "6", label: "Travaux non courants", description: "Voté (date AG), payé, réalisé, solde, réalisé non payé", tiers: ["tier3"] },
  { id: "7", label: "Suivi du fonds de réserve", description: "Mouvements chronologiques du fonds (art. 37bis Loi 18-00)", tiers: ["tier3"] },
  { id: "8", label: "Suivi des emprunts", description: "Date, prêteur, montant initial, remboursements, solde restant", tiers: ["tier3"] },
  { id: "9", label: "Inventaire des immobilisations", description: "Nature, fournisseur, mise en service, valeur d'acquisition", tiers: ["tier3"] },
  // Toutes catégories — Annexe 10
  { id: "10", label: "Suivi des contributions", description: "Par copropriétaire : tantièmes, charges, paiements, solde clôture", tiers: ["tier1", "tier2", "tier3"] },
  // Moyen (200 000 – 500 000 MAD) — Annexes 11, 12
  { id: "11", label: "États financiers simplifiés", description: "Situation financière + gestion — Exercice N et N-1", tiers: ["tier2"] },
  { id: "12", label: "Revenus et budgets simplifiés", description: "Produits / Charges par catégorie — Réalisé N, Budget N-1, Budget N", tiers: ["tier2"] },
  // Petit (≤ 200 000 MAD) — Annexes 13-1, 13-2
  { id: "13-1", label: "Situation financière très simplifiée", description: "4 lignes — N, Dotation, Utilisation, N-1, Observations", tiers: ["tier1"] },
  { id: "13-2", label: "Revenus et budget très simplifiés", description: "Budget, Réalisé, Écart valeur, Écart %, Prévision N+1", tiers: ["tier1"] },
];

export function getRequiredAnnexes(tier: AccountingTier): AnnexeRequirement[] {
  return ANNEXES.filter((a) => a.tiers.includes(tier));
}
