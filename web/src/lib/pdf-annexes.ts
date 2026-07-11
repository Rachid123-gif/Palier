/**
 * PDF generators for the accounting annexes (Décret 2.23.700).
 * Each generator produces a jsPDF document matching the legal template.
 *
 * Grand (≥ 500k): Annexes 3–10
 * Moyen (200k–500k): Annexes 10, 11, 12
 * Petit (≤ 200k): Annexes 10, 13-1, 13-2
 */
import { jsPDF } from "jspdf";
import type {
  Annexe3Section, Annexe4Section,
  Annexe5Row, Annexe6Row, Annexe7Row,
  Annexe8Row, Annexe9Row, Annexe10Row,
  Annexe11Row, Annexe12Row,
  Annexe13_1Row, Annexe13_2Row,
} from "./annexes";

/* ═══ Shared helpers ═══ */

function fmtMad(n: number): string {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} MAD`;
}

function fmtMadOrDash(n: number): string {
  return n === 0 ? "—" : fmtMad(n);
}

function header(doc: jsPDF, annexeId: string, title: string, buildingName: string, fiscalYear: number): number {
  doc.setFillColor(30, 91, 80);
  doc.rect(0, 0, 210, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text(`Annexe ${annexeId} — ${title}`, 15, 15);
  doc.setFontSize(10);
  doc.text(`${buildingName} — Exercice ${fiscalYear}`, 15, 24);
  doc.text("Décret n° 2.23.700 relatif à la comptabilité des copropriétés", 15, 31);
  return 48;
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont(undefined!, "normal");
    doc.setTextColor(140, 140, 140);
    doc.text(`Généré par Palier — Décret 2.23.700`, 15, 288);
    doc.text(`Page ${i}/${pages}`, 195, 288, { align: "right" });
  }
}

function tableHeader(doc: jsPDF, y: number, cols: { label: string; x: number; align?: "right" | "left" }[]): number {
  doc.setFillColor(245, 241, 234);
  doc.rect(15, y - 3, 180, 8, "F");
  doc.setFont(undefined!, "bold");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  for (const c of cols) {
    doc.text(c.label, c.x, y + 2, c.align === "right" ? { align: "right" } : undefined);
  }
  doc.setTextColor(20, 32, 29);
  return y + 10;
}

function checkPage(doc: jsPDF, y: number, needed = 12): number {
  if (y > 275 - needed) { doc.addPage(); return 20; }
  return y;
}

function totalLine(doc: jsPDF, y: number, label: string, amount: number): number {
  y = checkPage(doc, y, 15);
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.line(15, y, 195, y);
  y += 7;
  doc.setFont(undefined!, "bold");
  doc.setFontSize(10);
  doc.text(label, 17, y);
  doc.text(fmtMad(amount), 193, y, { align: "right" });
  doc.setFont(undefined!, "normal");
  return y + 8;
}

function sectionBanner(doc: jsPDF, y: number, label: string, bgR: number, bgG: number, bgB: number): number {
  y = checkPage(doc, y, 20);
  doc.setFillColor(bgR, bgG, bgB);
  doc.rect(15, y - 3, 180, 9, "F");
  doc.setFont(undefined!, "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 32, 29);
  doc.text(label, 17, y + 3);
  return y + 12;
}

function neantMessage(doc: jsPDF, y: number, message: string): number {
  doc.setFont(undefined!, "italic");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(message, 17, y);
  doc.setFont(undefined!, "normal");
  doc.setTextColor(20, 32, 29);
  return y + 10;
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 3 — État de la situation financière (Bilan)
   Colonnes: Libellé | Exercice N | Exercice N-1
   ═══════════════════════════════════════════════════════════ */

export function generateAnnexe3PDF(actif: Annexe3Section, passif: Annexe3Section, buildingName: string, fiscalYear: number): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "3", "État de la situation financière", buildingName, fiscalYear);

  for (const section of [actif, passif]) {
    const isActif = section === actif;
    y = sectionBanner(doc, y, section.label, isActif ? 220 : 235, isActif ? 240 : 220, isActif ? 235 : 235);

    const cols = [
      { label: "Poste", x: 17 },
      { label: `Exercice ${fiscalYear}`, x: 140, align: "right" as const },
      { label: `Exercice ${fiscalYear - 1}`, x: 193, align: "right" as const },
    ];
    y = tableHeader(doc, y, cols);
    doc.setFont(undefined!, "normal");
    doc.setFontSize(9);

    for (const row of section.rows) {
      y = checkPage(doc, y);
      doc.text(row.label, 25, y);
      doc.text(fmtMadOrDash(row.amountN), 140, y, { align: "right" });
      doc.text(fmtMadOrDash(row.amountN1), 193, y, { align: "right" });
      y += 7;
    }

    // Total
    y += 2;
    doc.setDrawColor(180, 180, 180);
    doc.line(15, y, 195, y);
    y += 7;
    doc.setFont(undefined!, "bold");
    doc.text(`Total ${section.label}`, 17, y);
    doc.text(fmtMad(section.totalN), 140, y, { align: "right" });
    doc.text(fmtMadOrDash(section.totalN1), 193, y, { align: "right" });
    doc.setFont(undefined!, "normal");
    y += 12;
  }

  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 4 — Compte de gestion général
   Colonnes: Compte | Libellé | Réalisé N | Budget N+1
   ═══════════════════════════════════════════════════════════ */

export function generateAnnexe4PDF(
  produits: Annexe4Section, charges: Annexe4Section, resultat: number,
  buildingName: string, fiscalYear: number,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "4", "Compte de gestion général", buildingName, fiscalYear);

  for (const section of [produits, charges]) {
    const isProduits = section === produits;
    y = sectionBanner(doc, y, section.label, isProduits ? 220 : 250, isProduits ? 240 : 225, isProduits ? 235 : 225);

    const cols = [
      { label: "Compte", x: 17 },
      { label: "Libellé", x: 40 },
      { label: `Réalisé ${fiscalYear}`, x: 145, align: "right" as const },
      { label: `Budget ${fiscalYear + 1}`, x: 193, align: "right" as const },
    ];
    y = tableHeader(doc, y, cols);
    doc.setFont(undefined!, "normal");
    doc.setFontSize(9);

    for (const item of section.rows) {
      y = checkPage(doc, y);
      doc.setFont(undefined!, "bold");
      doc.text(item.accountCode, 17, y);
      doc.setFont(undefined!, "normal");
      doc.text(item.label.substring(0, 40), 40, y);
      doc.text(fmtMad(item.realiseN), 145, y, { align: "right" });
      doc.text(fmtMadOrDash(item.budgetN1), 193, y, { align: "right" });
      y += 6;
    }

    // Section total
    y += 2;
    doc.setDrawColor(180, 180, 180);
    doc.line(15, y, 195, y);
    y += 7;
    doc.setFont(undefined!, "bold");
    doc.setFontSize(9);
    doc.text(`Total ${section.label}`, 17, y);
    doc.text(fmtMad(section.totalRealise), 145, y, { align: "right" });
    doc.text(fmtMadOrDash(section.totalBudget), 193, y, { align: "right" });
    doc.setFont(undefined!, "normal");
    y += 10;
  }

  // Résultat
  y = checkPage(doc, y, 20);
  y += 5;
  doc.setFillColor(30, 91, 80);
  doc.rect(15, y - 3, 180, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined!, "bold");
  doc.setFontSize(12);
  doc.text("RÉSULTAT DE L'EXERCICE", 17, y + 4);
  doc.text(fmtMad(resultat), 193, y + 4, { align: "right" });
  doc.setTextColor(20, 32, 29);

  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 5 — Comparaison budgétaire
   Colonnes: Poste | Budget N-1 | Budget N | Réalisé N | Budget N+1 | Écart | Écart %
   ═══════════════════════════════════════════════════════════ */

export function generateAnnexe5PDF(
  rows: Annexe5Row[],
  totals: { budgetN1: number; budgetN: number; realiseN: number; budgetNext: number; ecartValeur: number },
  buildingName: string, fiscalYear: number,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  let y = header(doc, "5", "Comparaison budgétaire", buildingName, fiscalYear);

  const cols = [
    { label: "Poste", x: 17 },
    { label: `Budget ${fiscalYear - 1}`, x: 110, align: "right" as const },
    { label: `Budget ${fiscalYear}`, x: 140, align: "right" as const },
    { label: `Réalisé ${fiscalYear}`, x: 175, align: "right" as const },
    { label: `Prévision ${fiscalYear + 1}`, x: 210, align: "right" as const },
    { label: "Écart", x: 240, align: "right" as const },
    { label: "Écart %", x: 265, align: "right" as const },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(8);

  for (const r of rows) {
    y = checkPage(doc, y);
    doc.text(r.label.substring(0, 40), 17, y);
    doc.text(fmtMadOrDash(r.budgetN1), 110, y, { align: "right" });
    doc.text(fmtMad(r.budgetN), 140, y, { align: "right" });
    doc.text(fmtMad(r.realiseN), 175, y, { align: "right" });
    doc.text(fmtMadOrDash(r.budgetNext), 210, y, { align: "right" });

    // Écart color
    const ecartColor = r.ecartValeur < 0 ? [214, 69, 63] : r.ecartValeur > 0 ? [16, 163, 107] : [20, 32, 29];
    doc.setTextColor(ecartColor[0], ecartColor[1], ecartColor[2]);
    doc.text(fmtMad(r.ecartValeur), 240, y, { align: "right" });
    doc.text(r.ecartPct !== null ? `${r.ecartPct.toFixed(1)}%` : "—", 265, y, { align: "right" });

    // Alert indicator
    if (r.alert) {
      doc.setFontSize(6);
      doc.setTextColor(214, 69, 63);
      doc.text("⚠", 270, y);
      doc.setFontSize(8);
    }
    doc.setTextColor(20, 32, 29);
    y += 6;
  }

  // Totals
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.line(15, y, 275, y);
  y += 7;
  doc.setFont(undefined!, "bold");
  doc.setFontSize(8);
  doc.text("TOTAUX", 17, y);
  doc.text(fmtMadOrDash(totals.budgetN1), 110, y, { align: "right" });
  doc.text(fmtMad(totals.budgetN), 140, y, { align: "right" });
  doc.text(fmtMad(totals.realiseN), 175, y, { align: "right" });
  doc.text(fmtMadOrDash(totals.budgetNext), 210, y, { align: "right" });
  doc.text(fmtMad(totals.ecartValeur), 240, y, { align: "right" });

  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 6 — Travaux non courants
   Colonnes: Description | Montant voté (date) | Montant payé |
             Montant réalisé | Solde exécution | Réalisé non payé | Observations
   ═══════════════════════════════════════════════════════════ */

export function generateAnnexe6PDF(
  rows: Annexe6Row[],
  totals: { totalVote: number; totalPaye: number; totalRealise: number; totalSolde: number },
  buildingName: string, fiscalYear: number,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  let y = header(doc, "6", "Travaux non courants", buildingName, fiscalYear);

  const cols = [
    { label: "Description", x: 17 },
    { label: "Voté (date AG)", x: 95, align: "right" as const },
    { label: "Payé", x: 130, align: "right" as const },
    { label: "Réalisé", x: 165, align: "right" as const },
    { label: "Solde", x: 200, align: "right" as const },
    { label: "Réal. non payé", x: 235, align: "right" as const },
    { label: "Observations", x: 240 },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(8);

  for (const r of rows) {
    y = checkPage(doc, y, 12);
    doc.text(r.description.substring(0, 30), 17, y);
    doc.text(`${fmtMad(r.montantVote)}`, 90, y, { align: "right" });
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text(`(${r.dateAG})`, 95, y);
    doc.setFontSize(8);
    doc.setTextColor(20, 32, 29);
    doc.text(fmtMad(r.montantPaye), 130, y, { align: "right" });
    doc.text(fmtMad(r.montantRealise), 165, y, { align: "right" });
    doc.text(fmtMad(r.soldeExecution), 200, y, { align: "right" });
    doc.text(fmtMadOrDash(r.realiseNonPaye), 235, y, { align: "right" });
    doc.text(r.observations.substring(0, 25), 240, y);
    y += 7;
  }

  if (rows.length === 0) {
    y = neantMessage(doc, y, "Néant — Aucun travaux non courants durant cet exercice.");
  }

  // Totals
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.line(15, y, 275, y);
  y += 7;
  doc.setFont(undefined!, "bold");
  doc.setFontSize(8);
  doc.text("TOTAUX", 17, y);
  doc.text(fmtMad(totals.totalVote), 90, y, { align: "right" });
  doc.text(fmtMad(totals.totalPaye), 130, y, { align: "right" });
  doc.text(fmtMad(totals.totalRealise), 165, y, { align: "right" });
  doc.text(fmtMad(totals.totalSolde), 200, y, { align: "right" });

  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 7 — Suivi du fonds de réserve (art. 37bis)
   Colonnes: Date | Libellé | Entrée | Sortie | Solde cumulé
   ═══════════════════════════════════════════════════════════ */

export function generateAnnexe7PDF(rows: Annexe7Row[], solde: number, buildingName: string, fiscalYear: number): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "7", "Suivi du fonds de réserve", buildingName, fiscalYear);

  // Legal note
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Article 37bis de la Loi 18-00 — Minimum 5% du budget annuel", 17, y);
  doc.setTextColor(20, 32, 29);
  y += 8;

  const cols = [
    { label: "Date", x: 17 },
    { label: "Libellé", x: 50 },
    { label: "Entrée (MAD)", x: 125, align: "right" as const },
    { label: "Sortie (MAD)", x: 158, align: "right" as const },
    { label: "Solde (MAD)", x: 193, align: "right" as const },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(9);

  for (const r of rows) {
    y = checkPage(doc, y);
    doc.text(r.date, 17, y);
    doc.text(r.label.substring(0, 35), 50, y);
    doc.text(r.entree ? fmtMad(r.entree) : "—", 125, y, { align: "right" });
    doc.text(r.sortie ? fmtMad(r.sortie) : "—", 158, y, { align: "right" });
    doc.setFont(undefined!, "bold");
    doc.text(fmtMad(r.solde), 193, y, { align: "right" });
    doc.setFont(undefined!, "normal");
    y += 6;
  }

  if (rows.length === 0) {
    y = neantMessage(doc, y, "Néant — Aucun mouvement sur le fonds de réserve.");
  }

  totalLine(doc, y, "SOLDE DU FONDS DE RÉSERVE", solde);
  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 8 — Suivi des emprunts
   Colonnes: Date | Prêteur | Montant initial | Remboursements | Solde restant
   ═══════════════════════════════════════════════════════════ */

export function generateAnnexe8PDF(
  rows: Annexe8Row[],
  totals: { totalInitial: number; totalRembourse: number; totalRestant: number },
  buildingName: string, fiscalYear: number,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "8", "Suivi des emprunts", buildingName, fiscalYear);

  const cols = [
    { label: "Date emprunt", x: 17 },
    { label: "Prêteur", x: 55 },
    { label: "Montant initial", x: 120, align: "right" as const },
    { label: `Remboursé ${fiscalYear}`, x: 158, align: "right" as const },
    { label: "Solde restant", x: 193, align: "right" as const },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(9);

  if (rows.length === 0) {
    y = neantMessage(doc, y, "Néant — Aucun emprunt contracté par le syndicat.");
  } else {
    for (const r of rows) {
      y = checkPage(doc, y);
      doc.text(r.dateEmprunt, 17, y);
      doc.text(r.preteur.substring(0, 25), 55, y);
      doc.text(fmtMad(r.montantInitial), 120, y, { align: "right" });
      doc.text(fmtMad(r.remboursementsExercice), 158, y, { align: "right" });
      doc.text(fmtMad(r.soldeRestant), 193, y, { align: "right" });
      y += 6;
    }

    y += 3;
    doc.setDrawColor(180, 180, 180);
    doc.line(15, y, 195, y);
    y += 7;
    doc.setFont(undefined!, "bold");
    doc.setFontSize(9);
    doc.text("TOTAUX", 17, y);
    doc.text(fmtMad(totals.totalInitial), 120, y, { align: "right" });
    doc.text(fmtMad(totals.totalRembourse), 158, y, { align: "right" });
    doc.text(fmtMad(totals.totalRestant), 193, y, { align: "right" });
  }

  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 9 — Inventaire des immobilisations
   Colonnes: Type/nature | Fournisseur | Date mise en service | Valeur | Observations
   ═══════════════════════════════════════════════════════════ */

export function generateAnnexe9PDF(
  rows: Annexe9Row[], totalValeur: number,
  buildingName: string, fiscalYear: number,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "9", "Inventaire des immobilisations", buildingName, fiscalYear);

  const cols = [
    { label: "Type / nature", x: 17 },
    { label: "Fournisseur", x: 65 },
    { label: "Mise en service", x: 110 },
    { label: "Valeur (MAD)", x: 155, align: "right" as const },
    { label: "Observations", x: 160 },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(9);

  if (rows.length === 0) {
    y = neantMessage(doc, y, "Néant — Aucune immobilisation inventoriée.");
  } else {
    for (const r of rows) {
      y = checkPage(doc, y);
      doc.text(r.nature.substring(0, 25), 17, y);
      doc.text(r.fournisseur.substring(0, 20), 65, y);
      doc.text(r.dateMiseEnService, 110, y);
      doc.text(fmtMad(r.valeurAcquisition), 155, y, { align: "right" });
      doc.text(r.observations.substring(0, 20), 160, y);
      y += 6;
    }

    totalLine(doc, y, "TOTAL VALEUR D'ACQUISITION", totalValeur);
  }

  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 10 — Suivi des contributions des copropriétaires
   Colonnes: Lot | Copropriétaire | Tantièmes | Solde ouv. |
             Charges appelées | Paiements | Solde clôture
   ═══════════════════════════════════════════════════════════ */

export function generateAnnexe10PDF(
  rows: Annexe10Row[],
  totals: { totalTantiemes: number; totalCharges: number; totalPaiements: number; totalSolde: number },
  buildingName: string, fiscalYear: number,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  let y = header(doc, "10", "Suivi des contributions des copropriétaires", buildingName, fiscalYear);

  const cols = [
    { label: "Lot", x: 17 },
    { label: "Copropriétaire", x: 35 },
    { label: "Tantièmes", x: 105, align: "right" as const },
    { label: "Solde ouv.", x: 135, align: "right" as const },
    { label: "Charges appelées", x: 175, align: "right" as const },
    { label: "Paiements reçus", x: 215, align: "right" as const },
    { label: "Solde clôture", x: 260, align: "right" as const },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(8);

  for (const r of rows) {
    y = checkPage(doc, y);
    doc.text(r.unitRef, 17, y);
    doc.text(r.ownerName.substring(0, 30), 35, y);
    doc.text(String(r.tantiemes), 105, y, { align: "right" });
    doc.text(fmtMadOrDash(r.soldeOuverture), 135, y, { align: "right" });
    doc.text(fmtMad(r.chargesAppelees), 175, y, { align: "right" });
    doc.text(fmtMad(r.paiementsRecus), 215, y, { align: "right" });
    // Bold + color for closing balance
    doc.setFont(undefined!, "bold");
    if (r.soldeCloture > 0) doc.setTextColor(214, 69, 63);
    doc.text(fmtMad(r.soldeCloture), 260, y, { align: "right" });
    doc.setTextColor(20, 32, 29);
    doc.setFont(undefined!, "normal");
    y += 6;
  }

  // Totals
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.line(15, y, 275, y);
  y += 7;
  doc.setFont(undefined!, "bold");
  doc.setFontSize(8);
  doc.text("TOTAUX", 17, y);
  doc.text(String(totals.totalTantiemes), 105, y, { align: "right" });
  doc.text("—", 135, y, { align: "right" });
  doc.text(fmtMad(totals.totalCharges), 175, y, { align: "right" });
  doc.text(fmtMad(totals.totalPaiements), 215, y, { align: "right" });
  doc.text(fmtMad(totals.totalSolde), 260, y, { align: "right" });

  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 11 — États financiers simplifiés
   Section 1: Situation financière (N | N-1)
   Section 2: Compte de gestion (N | N-1)
   ═══════════════════════════════════════════════════════════ */

export function generateAnnexe11PDF(
  situation: Annexe11Row[], gestion: Annexe11Row[],
  totalActifN: number, totalActifN1: number,
  buildingName: string, fiscalYear: number,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "11", "États financiers simplifiés", buildingName, fiscalYear);

  // --- Situation financière ---
  y = sectionBanner(doc, y, "SITUATION FINANCIÈRE", 220, 240, 235);

  const sitCols = [
    { label: "Poste", x: 17 },
    { label: `Exercice ${fiscalYear}`, x: 140, align: "right" as const },
    { label: `Exercice ${fiscalYear - 1}`, x: 193, align: "right" as const },
  ];
  y = tableHeader(doc, y, sitCols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(10);

  for (const r of situation) {
    doc.text(r.label, 25, y);
    doc.text(fmtMad(r.amountN), 140, y, { align: "right" });
    doc.text(fmtMadOrDash(r.amountN1), 193, y, { align: "right" });
    y += 7;
  }

  // Total Actif
  y += 2;
  doc.setDrawColor(180, 180, 180);
  doc.line(15, y, 195, y);
  y += 7;
  doc.setFont(undefined!, "bold");
  doc.text("TOTAL ACTIF", 17, y);
  doc.text(fmtMad(totalActifN), 140, y, { align: "right" });
  doc.text(fmtMadOrDash(totalActifN1), 193, y, { align: "right" });
  doc.setFont(undefined!, "normal");
  y += 14;

  // --- Compte de gestion ---
  y = sectionBanner(doc, y, "COMPTE DE GESTION", 235, 220, 235);

  const gestCols = [
    { label: "Poste", x: 17 },
    { label: `Exercice ${fiscalYear}`, x: 140, align: "right" as const },
    { label: `Exercice ${fiscalYear - 1}`, x: 193, align: "right" as const },
  ];
  y = tableHeader(doc, y, gestCols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(10);

  for (const r of gestion) {
    const isResultat = r.label === "Résultat";
    if (isResultat) doc.setFont(undefined!, "bold");
    doc.text(r.label, 25, y);
    doc.text(fmtMad(r.amountN), 140, y, { align: "right" });
    doc.text(fmtMadOrDash(r.amountN1), 193, y, { align: "right" });
    if (isResultat) doc.setFont(undefined!, "normal");
    y += 7;
  }

  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 12 — Revenus et budgets simplifiés
   PRODUITS puis CHARGES
   Colonnes: Poste | Réalisé N | Budget N-1 | Budget N
   ═══════════════════════════════════════════════════════════ */

export function generateAnnexe12PDF(
  rows: Annexe12Row[],
  totalProduitsN: number, totalChargesN: number, resultatN: number,
  buildingName: string, fiscalYear: number,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "12", "Revenus et budgets simplifiés", buildingName, fiscalYear);

  const cols = [
    { label: "Poste", x: 17 },
    { label: `Réalisé ${fiscalYear}`, x: 110, align: "right" as const },
    { label: `Budget ${fiscalYear - 1}`, x: 150, align: "right" as const },
    { label: `Budget ${fiscalYear}`, x: 193, align: "right" as const },
  ];

  // PRODUITS section
  y = sectionBanner(doc, y, "PRODUITS", 220, 240, 235);
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(10);
  const produitsRows = rows.filter((r) => r.section === "produits");
  for (const r of produitsRows) {
    doc.text(r.label, 25, y);
    doc.text(fmtMad(r.realiseN), 110, y, { align: "right" });
    doc.text(fmtMadOrDash(r.budgetN1), 150, y, { align: "right" });
    doc.text(fmtMadOrDash(r.budgetN), 193, y, { align: "right" });
    y += 7;
  }

  // Total Produits
  y += 2;
  doc.setDrawColor(180, 180, 180);
  doc.line(15, y, 195, y);
  y += 7;
  doc.setFont(undefined!, "bold");
  doc.text("Total Produits", 17, y);
  doc.text(fmtMad(totalProduitsN), 110, y, { align: "right" });
  doc.setFont(undefined!, "normal");
  y += 14;

  // CHARGES section
  y = sectionBanner(doc, y, "CHARGES", 250, 225, 225);
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(10);
  const chargesRows = rows.filter((r) => r.section === "charges");
  for (const r of chargesRows) {
    doc.text(r.label, 25, y);
    doc.text(fmtMad(r.realiseN), 110, y, { align: "right" });
    doc.text(fmtMadOrDash(r.budgetN1), 150, y, { align: "right" });
    doc.text(fmtMadOrDash(r.budgetN), 193, y, { align: "right" });
    y += 7;
  }

  // Total Charges
  y += 2;
  doc.setDrawColor(180, 180, 180);
  doc.line(15, y, 195, y);
  y += 7;
  doc.setFont(undefined!, "bold");
  doc.text("Total Charges", 17, y);
  doc.text(fmtMad(totalChargesN), 110, y, { align: "right" });
  doc.setFont(undefined!, "normal");
  y += 12;

  // RÉSULTAT
  y = checkPage(doc, y, 15);
  doc.setFillColor(30, 91, 80);
  doc.rect(15, y - 3, 180, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined!, "bold");
  doc.setFontSize(12);
  doc.text(resultatN >= 0 ? "EXCÉDENT" : "DÉFICIT", 17, y + 4);
  doc.text(fmtMad(resultatN), 193, y + 4, { align: "right" });
  doc.setTextColor(20, 32, 29);

  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 13-1 — Situation financière très simplifiée
   4 lignes: Réserves | Créances | Dettes | Trésorerie
   5 colonnes: Exercice N | Dotation (+) | Utilisation (-) | Exercice N-1 | Observations
   ═══════════════════════════════════════════════════════════ */

export function generateAnnexe13_1PDF(
  rows: Annexe13_1Row[],
  totalActifN: number, totalActifN1: number,
  buildingName: string, fiscalYear: number,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  let y = header(doc, "13-1", "Situation financière très simplifiée", buildingName, fiscalYear);

  const cols = [
    { label: "Poste", x: 17 },
    { label: `Exercice ${fiscalYear}`, x: 100, align: "right" as const },
    { label: "Dotation (+)", x: 140, align: "right" as const },
    { label: "Utilisation (−)", x: 180, align: "right" as const },
    { label: `Exercice ${fiscalYear - 1}`, x: 220, align: "right" as const },
    { label: "Observations", x: 225 },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(10);

  for (const r of rows) {
    y = checkPage(doc, y);
    doc.text(r.label, 17, y);
    doc.setFont(undefined!, "bold");
    doc.text(fmtMad(r.exerciceN), 100, y, { align: "right" });
    doc.setFont(undefined!, "normal");
    doc.text(fmtMadOrDash(r.dotation), 140, y, { align: "right" });
    doc.text(fmtMadOrDash(r.utilisation), 180, y, { align: "right" });
    doc.text(fmtMadOrDash(r.exerciceN1), 220, y, { align: "right" });
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(r.observations.substring(0, 30), 225, y);
    doc.setTextColor(20, 32, 29);
    doc.setFontSize(10);
    y += 9;
  }

  // Total
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.line(15, y, 275, y);
  y += 7;
  doc.setFont(undefined!, "bold");
  doc.setFontSize(10);
  doc.text("TOTAL", 17, y);
  doc.text(fmtMad(totalActifN), 100, y, { align: "right" });
  doc.text(fmtMadOrDash(totalActifN1), 220, y, { align: "right" });

  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════════════════════
   ANNEXE 13-2 — Revenus et budget très simplifiés
   Colonnes: Poste | Budget approuvé (A) | Réalisé (B) | Écart (A−B) |
             Écart % | Budget prévisionnel N+1
   ═══════════════════════════════════════════════════════════ */

export function generateAnnexe13_2PDF(rows: Annexe13_2Row[], buildingName: string, fiscalYear: number): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  let y = header(doc, "13-2", "Revenus et budget très simplifiés", buildingName, fiscalYear);

  const cols = [
    { label: "Poste", x: 17 },
    { label: "Budget approuvé (A)", x: 100, align: "right" as const },
    { label: "Réalisé (B)", x: 140, align: "right" as const },
    { label: "Écart (A−B)", x: 180, align: "right" as const },
    { label: "Écart %", x: 215, align: "right" as const },
    { label: `Prévision ${fiscalYear + 1}`, x: 265, align: "right" as const },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(10);

  for (const r of rows) {
    y = checkPage(doc, y);
    doc.text(r.label, 17, y);
    doc.text(fmtMadOrDash(r.budgetApprouve), 100, y, { align: "right" });
    doc.text(fmtMad(r.realise), 140, y, { align: "right" });

    // Écart color
    const ecartColor = r.ecartValeur < 0 ? [214, 69, 63] : r.ecartValeur > 0 ? [16, 163, 107] : [20, 32, 29];
    doc.setTextColor(ecartColor[0], ecartColor[1], ecartColor[2]);
    doc.text(fmtMad(r.ecartValeur), 180, y, { align: "right" });
    doc.text(r.ecartPct !== null ? `${r.ecartPct.toFixed(1)}%` : "—", 215, y, { align: "right" });
    doc.setTextColor(20, 32, 29);

    doc.text(fmtMadOrDash(r.budgetNext), 265, y, { align: "right" });
    y += 9;
  }

  footer(doc);
  return doc;
}
