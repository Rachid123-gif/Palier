/**
 * Dedicated PDF generators for the accounting annexes (Décret 2.23.700).
 * Numbering follows the decree: Annexes 3–10 (Grand), 11–12 (Moyen), 13-1/13-2 (Petit).
 */
import { jsPDF } from "jspdf";
import type {
  A1Row, A3Row, A4Row, A5Row, A6Row, A7Account, A9Row, A10Row,
  BilanSection, CRSection, JournalEntry,
  A11SimplRow, A12SimplRow, A13_1Row, A13_2Row,
} from "./annexes";

/* ═══ Shared helpers ═══ */

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtMad(n: number): string {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} MAD`;
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
    doc.text(`Généré par Palier le ${fmtDate(new Date().toISOString())} — Décret 2.23.700`, 15, 288);
    doc.text(`Page ${i}/${pages}`, 195, 288, { align: "right" });
  }
}

function tableHeader(doc: jsPDF, y: number, cols: { label: string; x: number; align?: "right" | "left" }[]): number {
  doc.setFillColor(245, 241, 234);
  doc.rect(15, y - 3, 180, 8, "F");
  doc.setFont(undefined!, "bold");
  doc.setFontSize(8);
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

/* ═══════════════════════════════════════════
   Annexe 3 — État de la situation financière (Bilan)
   Grand ≥ 500 000 MAD
   ═══════════════════════════════════════════ */
export function generateAnnexe3PDF(actif: BilanSection, passif: BilanSection, buildingName: string, fiscalYear: number): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "3", "État de la situation financière", buildingName, fiscalYear);

  for (const section of [actif, passif]) {
    y = checkPage(doc, y, 30);
    doc.setFillColor(section === actif ? 220 : 235, section === actif ? 240 : 220, section === actif ? 235 : 235);
    doc.rect(15, y - 3, 180, 9, "F");
    doc.setFont(undefined!, "bold");
    doc.setFontSize(11);
    doc.text(section.label, 17, y + 3);
    y += 12;

    doc.setFont(undefined!, "normal");
    doc.setFontSize(10);
    for (const item of section.items) {
      y = checkPage(doc, y);
      doc.text(item.label, 25, y);
      doc.text(fmtMad(item.amount), 193, y, { align: "right" });
      y += 7;
    }
    y += 2;
    doc.setDrawColor(180, 180, 180);
    doc.line(15, y, 195, y);
    y += 7;
    doc.setFont(undefined!, "bold");
    doc.text(`Total ${section.label}`, 17, y);
    doc.text(fmtMad(section.total), 193, y, { align: "right" });
    y += 12;
  }
  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════
   Annexe 4 — Compte de gestion général
   Grand ≥ 500 000 MAD
   ═══════════════════════════════════════════ */
export function generateAnnexe4PDF(charges: CRSection, produits: CRSection, resultat: number, buildingName: string, fiscalYear: number): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "4", "Compte de gestion général", buildingName, fiscalYear);

  for (const section of [produits, charges]) {
    y = checkPage(doc, y, 25);
    const isProduits = section === produits;
    doc.setFillColor(isProduits ? 220 : 250, isProduits ? 240 : 225, isProduits ? 235 : 225);
    doc.rect(15, y - 3, 180, 9, "F");
    doc.setFont(undefined!, "bold");
    doc.setFontSize(11);
    doc.text(section.label, 17, y + 3);
    y += 12;

    const cols = [
      { label: "Compte", x: 17 },
      { label: "Libellé", x: 45 },
      { label: "Montant (MAD)", x: 193, align: "right" as const },
    ];
    y = tableHeader(doc, y, cols);
    doc.setFont(undefined!, "normal");
    doc.setFontSize(9);
    for (const item of section.items) {
      y = checkPage(doc, y);
      doc.setFont(undefined!, "bold");
      doc.text(item.accountCode, 17, y);
      doc.setFont(undefined!, "normal");
      doc.text(item.label.substring(0, 45), 45, y);
      doc.text(fmtMad(item.amount), 193, y, { align: "right" });
      y += 6;
    }
    totalLine(doc, y, `Total ${section.label}`, section.total);
    y += 5;
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

/* ═══════════════════════════════════════════
   Annexe 5 — Comparaison budgétaire
   Grand ≥ 500 000 MAD
   ═══════════════════════════════════════════ */
export function generateAnnexe5PDF(
  rows: A5Row[], totalBudgeted: number, totalActual: number, totalEcart: number,
  buildingName: string, fiscalYear: number,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "5", "Comparaison budgétaire", buildingName, fiscalYear);
  const cols = [
    { label: "Poste", x: 17 },
    { label: "Catégorie", x: 80 },
    { label: "Prévu (MAD)", x: 130, align: "right" as const },
    { label: "Réalisé (MAD)", x: 160, align: "right" as const },
    { label: "Écart (MAD)", x: 193, align: "right" as const },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(9);
  for (const r of rows) {
    y = checkPage(doc, y);
    doc.text(r.label.substring(0, 35), 17, y);
    doc.text(r.category.substring(0, 15), 80, y);
    doc.text(fmtMad(r.budgeted), 130, y, { align: "right" });
    doc.text(fmtMad(r.actual), 160, y, { align: "right" });
    const ecartColor = r.ecart > 0 ? [214, 69, 63] : r.ecart < 0 ? [16, 163, 107] : [20, 32, 29];
    doc.setTextColor(ecartColor[0], ecartColor[1], ecartColor[2]);
    doc.text(fmtMad(r.ecart), 193, y, { align: "right" });
    doc.setTextColor(20, 32, 29);
    y += 6;
  }
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.line(15, y, 195, y);
  y += 7;
  doc.setFont(undefined!, "bold");
  doc.setFontSize(9);
  doc.text("TOTAUX", 17, y);
  doc.text(fmtMad(totalBudgeted), 130, y, { align: "right" });
  doc.text(fmtMad(totalActual), 160, y, { align: "right" });
  doc.text(fmtMad(totalEcart), 193, y, { align: "right" });
  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════
   Annexe 6 — Travaux non courants
   Grand ≥ 500 000 MAD
   ═══════════════════════════════════════════ */
export function generateAnnexe6PDF(rows: A10Row[], totalBudget: number, totalDepense: number, buildingName: string, fiscalYear: number): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "6", "Travaux non courants", buildingName, fiscalYear);
  const cols = [
    { label: "Travaux", x: 17 },
    { label: "Fournisseur", x: 65 },
    { label: "Budget (MAD)", x: 120, align: "right" as const },
    { label: "Dépensé (MAD)", x: 155, align: "right" as const },
    { label: "Reste (MAD)", x: 193, align: "right" as const },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(9);
  for (const r of rows) {
    y = checkPage(doc, y);
    doc.text(r.title.substring(0, 25), 17, y);
    doc.text(r.supplier.substring(0, 15), 65, y);
    doc.text(fmtMad(r.budgetVote), 120, y, { align: "right" });
    doc.text(fmtMad(r.depense), 155, y, { align: "right" });
    doc.text(fmtMad(r.resteAPayer), 193, y, { align: "right" });
    y += 6;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(`Statut : ${r.status}`, 17, y);
    doc.setTextColor(20, 32, 29);
    doc.setFontSize(9);
    y += 5;
  }
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.line(15, y, 195, y);
  y += 7;
  doc.setFont(undefined!, "bold");
  doc.setFontSize(9);
  doc.text("TOTAUX", 17, y);
  doc.text(fmtMad(totalBudget), 120, y, { align: "right" });
  doc.text(fmtMad(totalDepense), 155, y, { align: "right" });
  doc.text(fmtMad(Math.max(0, totalBudget - totalDepense)), 193, y, { align: "right" });
  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════
   Annexe 7 — Suivi du fonds de réserve
   Grand ≥ 500 000 MAD
   ═══════════════════════════════════════════ */
export function generateAnnexe7PDF(rows: A9Row[], solde: number, buildingName: string, fiscalYear: number): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "7", "Suivi du fonds de réserve", buildingName, fiscalYear);
  const cols = [
    { label: "Date", x: 17 },
    { label: "Libellé", x: 45 },
    { label: "Entrée (MAD)", x: 120, align: "right" as const },
    { label: "Sortie (MAD)", x: 155, align: "right" as const },
    { label: "Solde (MAD)", x: 193, align: "right" as const },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(9);
  for (const r of rows) {
    y = checkPage(doc, y);
    doc.text(r.date, 17, y);
    doc.text(r.label.substring(0, 35), 45, y);
    doc.text(r.entree ? fmtMad(r.entree) : "—", 120, y, { align: "right" });
    doc.text(r.sortie ? fmtMad(r.sortie) : "—", 155, y, { align: "right" });
    doc.setFont(undefined!, "bold");
    doc.text(fmtMad(r.solde), 193, y, { align: "right" });
    doc.setFont(undefined!, "normal");
    y += 6;
  }
  totalLine(doc, y, "SOLDE DU FONDS DE RÉSERVE", solde);
  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════
   Annexe 10 — Suivi des contributions des copropriétaires
   Toutes catégories
   ═══════════════════════════════════════════ */
export function generateAnnexe10PDF(rows: A4Row[], total: number, buildingName: string, fiscalYear: number): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "10", "Suivi des contributions des copropriétaires", buildingName, fiscalYear);
  const cols = [
    { label: "Lot", x: 17 },
    { label: "Copropriétaire", x: 35 },
    { label: "Dû (MAD)", x: 120, align: "right" as const },
    { label: "Payé (MAD)", x: 150, align: "right" as const },
    { label: "Solde (MAD)", x: 193, align: "right" as const },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(9);
  for (const r of rows) {
    y = checkPage(doc, y);
    doc.text(r.unitRef, 17, y);
    doc.text(r.ownerName.substring(0, 30), 35, y);
    doc.text(fmtMad(r.totalDue), 120, y, { align: "right" });
    doc.text(fmtMad(r.totalPaid), 150, y, { align: "right" });
    doc.setFont(undefined!, "bold");
    doc.text(fmtMad(r.balance), 193, y, { align: "right" });
    doc.setFont(undefined!, "normal");
    y += 6;
  }
  totalLine(doc, y, "TOTAL IMPAYÉS", total);
  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════
   Annexe 11 — États simplifiés
   Moyen 200 000 – 500 000 MAD
   ═══════════════════════════════════════════ */
export function generateAnnexe11PDF(
  situation: A11SimplRow[], gestion: A11SimplRow[], totalActif: number,
  buildingName: string, fiscalYear: number,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "11", "États simplifiés", buildingName, fiscalYear);

  // Situation financière
  doc.setFillColor(220, 240, 235);
  doc.rect(15, y - 3, 180, 9, "F");
  doc.setFont(undefined!, "bold");
  doc.setFontSize(11);
  doc.text("SITUATION FINANCIÈRE", 17, y + 3);
  y += 14;

  doc.setFont(undefined!, "normal");
  doc.setFontSize(10);
  for (const r of situation) {
    doc.text(r.label, 25, y);
    doc.text(fmtMad(r.amount), 193, y, { align: "right" });
    y += 7;
  }
  totalLine(doc, y, "TOTAL ACTIF", totalActif);
  y += 10;

  // Compte de gestion
  doc.setFillColor(235, 220, 235);
  doc.rect(15, y - 3, 180, 9, "F");
  doc.setFont(undefined!, "bold");
  doc.setFontSize(11);
  doc.text("COMPTE DE GESTION", 17, y + 3);
  y += 14;

  doc.setFont(undefined!, "normal");
  doc.setFontSize(10);
  for (const r of gestion) {
    doc.text(r.label, 25, y);
    const isResultat = r.label === "Résultat";
    if (isResultat) doc.setFont(undefined!, "bold");
    doc.text(fmtMad(r.amount), 193, y, { align: "right" });
    if (isResultat) doc.setFont(undefined!, "normal");
    y += 7;
  }

  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════
   Annexe 12 — Revenus et budgets simplifiés
   Moyen 200 000 – 500 000 MAD
   ═══════════════════════════════════════════ */
export function generateAnnexe12PDF(
  rows: A12SimplRow[], totalBudgeted: number, totalActual: number, totalEcart: number,
  buildingName: string, fiscalYear: number,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "12", "Revenus et budgets simplifiés", buildingName, fiscalYear);
  const cols = [
    { label: "Poste", x: 17 },
    { label: "Budget voté (MAD)", x: 110, align: "right" as const },
    { label: "Réalisé (MAD)", x: 150, align: "right" as const },
    { label: "Écart (MAD)", x: 193, align: "right" as const },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(10);
  for (const r of rows) {
    y = checkPage(doc, y);
    doc.text(r.label.substring(0, 45), 17, y);
    doc.text(fmtMad(r.budgeted), 110, y, { align: "right" });
    doc.text(fmtMad(r.actual), 150, y, { align: "right" });
    const ecartColor = r.ecart > 0 ? [214, 69, 63] : r.ecart < 0 ? [16, 163, 107] : [20, 32, 29];
    doc.setTextColor(ecartColor[0], ecartColor[1], ecartColor[2]);
    doc.text(fmtMad(r.ecart), 193, y, { align: "right" });
    doc.setTextColor(20, 32, 29);
    y += 7;
  }
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.line(15, y, 195, y);
  y += 7;
  doc.setFont(undefined!, "bold");
  doc.setFontSize(9);
  doc.text("TOTAUX", 17, y);
  doc.text(fmtMad(totalBudgeted), 110, y, { align: "right" });
  doc.text(fmtMad(totalActual), 150, y, { align: "right" });
  doc.text(fmtMad(totalEcart), 193, y, { align: "right" });
  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════
   Annexe 13-1 — Bilan très simplifié
   Petit ≤ 200 000 MAD
   ═══════════════════════════════════════════ */
export function generateAnnexe13_1PDF(rows: A13_1Row[], totalActif: number, buildingName: string, fiscalYear: number): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "13-1", "Bilan très simplifié", buildingName, fiscalYear);

  doc.setFont(undefined!, "normal");
  doc.setFontSize(11);
  for (const r of rows) {
    doc.text(r.label, 25, y);
    doc.setFont(undefined!, "bold");
    doc.text(fmtMad(r.amount), 193, y, { align: "right" });
    doc.setFont(undefined!, "normal");
    y += 9;
  }
  totalLine(doc, y, "TOTAL", totalActif);

  footer(doc);
  return doc;
}

/* ═══════════════════════════════════════════
   Annexe 13-2 — Revenus et budget très simplifiés
   Petit ≤ 200 000 MAD
   ═══════════════════════════════════════════ */
export function generateAnnexe13_2PDF(rows: A13_2Row[], buildingName: string, fiscalYear: number): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, "13-2", "Revenus et budget très simplifiés", buildingName, fiscalYear);
  const cols = [
    { label: "Poste", x: 17 },
    { label: "Budget (MAD)", x: 110, align: "right" as const },
    { label: "Réalisé (MAD)", x: 150, align: "right" as const },
    { label: "Écart (MAD)", x: 193, align: "right" as const },
  ];
  y = tableHeader(doc, y, cols);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(11);
  for (const r of rows) {
    y = checkPage(doc, y);
    doc.text(r.label, 17, y);
    doc.text(fmtMad(r.budgetN), 110, y, { align: "right" });
    doc.text(fmtMad(r.actual), 150, y, { align: "right" });
    doc.text(fmtMad(r.ecart), 193, y, { align: "right" });
    y += 9;
  }

  footer(doc);
  return doc;
}
