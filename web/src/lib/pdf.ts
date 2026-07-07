/**
 * Client-side PDF generation for receipts and PV.
 * Uses jsPDF for lightweight PDF creation.
 */
import { jsPDF } from "jspdf";

/* ─── Shared helpers ─── */
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatMad(amount: number): string {
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} MAD`;
}

/* ─── Receipt PDF (reçu de paiement) ─── */
export function generateReceiptPDF(data: {
  buildingName: string;
  residentName: string;
  unit: string;
  charges: { label: string; amount: number; period: string; dueDate: string }[];
  totalPaid: number;
  paymentDate: string;
  receiptNumber?: string;
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const { buildingName, residentName, unit, charges, totalPaid, paymentDate } = data;
  const receiptNum = data.receiptNumber ?? `REC-${Date.now().toString(36).toUpperCase()}`;

  let y = 20;

  // Header
  doc.setFillColor(30, 91, 80); // palier-600
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("PALIER", 15, 18);
  doc.setFontSize(10);
  doc.text("Gestion de copropriété", 15, 26);
  doc.text(buildingName, 15, 33);
  y = 50;

  // Title
  doc.setTextColor(20, 32, 29);
  doc.setFontSize(16);
  doc.text("Reçu de paiement", 15, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`N° ${receiptNum} — ${formatDate(paymentDate)}`, 15, y);
  y += 15;

  // Resident info
  doc.setTextColor(20, 32, 29);
  doc.setFontSize(10);
  doc.text("Copropriétaire :", 15, y);
  doc.setFont(undefined!, "bold");
  doc.text(residentName, 55, y);
  y += 6;
  doc.setFont(undefined!, "normal");
  doc.text("Lot :", 15, y);
  doc.setFont(undefined!, "bold");
  doc.text(unit, 55, y);
  y += 12;

  // Table header
  doc.setFillColor(245, 241, 234); // cream
  doc.rect(15, y - 2, 180, 8, "F");
  doc.setFont(undefined!, "bold");
  doc.setFontSize(9);
  doc.text("Libellé", 17, y + 3);
  doc.text("Période", 100, y + 3);
  doc.text("Montant", 160, y + 3, { align: "right" });
  y += 12;

  // Table rows
  doc.setFont(undefined!, "normal");
  for (const c of charges) {
    doc.text(c.label, 17, y);
    doc.text(c.period, 100, y);
    doc.text(formatMad(c.amount), 192, y, { align: "right" });
    y += 7;
  }

  // Total
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, 195, y);
  y += 8;
  doc.setFontSize(12);
  doc.setFont(undefined!, "bold");
  doc.text("Total payé :", 15, y);
  doc.text(formatMad(totalPaid), 192, y, { align: "right" });
  y += 15;

  // Footer
  doc.setFontSize(8);
  doc.setFont(undefined!, "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Ce reçu est généré automatiquement par Palier.", 15, y);
  doc.text(`Date d'émission : ${formatDate(new Date().toISOString())}`, 15, y + 5);
  doc.text(`Résidence : ${buildingName}`, 15, y + 10);

  return doc;
}

/* ─── PV AG PDF (Procès-verbal) ─── */
export function generatePVPDF(data: {
  buildingName: string;
  buildingAddress: string;
  date: string;
  time: string;
  place: string;
  type: string;
  quorum: number;
  totalTantiemes: number;
  agenda: { n: number; t: string; d: string }[];
  resolutions: {
    number: number;
    title: string;
    majorityType: string;
    result?: string;
    pourTantiemes: number;
    contreTantiemes: number;
    abstentionTantiemes: number;
    pourCount: number;
    contreCount: number;
    abstentionCount: number;
  }[];
  summary: string;
  syndicName: string;
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const d = data;
  let y = 20;

  // Header
  doc.setFillColor(30, 91, 80);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("PROCÈS-VERBAL", 15, 18);
  doc.setFontSize(10);
  doc.text(`Assemblée Générale ${d.type === "extraordinaire" ? "Extraordinaire" : "Ordinaire"}`, 15, 26);
  doc.text(d.buildingName, 15, 33);
  y = 50;

  // Meta
  doc.setTextColor(20, 32, 29);
  doc.setFontSize(10);
  const meta = [
    ["Résidence", d.buildingName],
    ["Adresse", d.buildingAddress],
    ["Date", formatDate(d.date)],
    ["Heure", d.time],
    ["Lieu", d.place],
    ["Quorum", `${d.quorum} / ${d.totalTantiemes} tantièmes (${d.totalTantiemes > 0 ? Math.round(d.quorum / d.totalTantiemes * 100) : 0}%)`],
  ];
  for (const [label, value] of meta) {
    doc.setFont(undefined!, "normal");
    doc.text(`${label} :`, 15, y);
    doc.setFont(undefined!, "bold");
    doc.text(value, 55, y);
    y += 6;
  }
  y += 8;

  // Ordre du jour
  doc.setFontSize(13);
  doc.setFont(undefined!, "bold");
  doc.text("Ordre du jour", 15, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont(undefined!, "normal");
  for (const item of d.agenda) {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont(undefined!, "bold");
    doc.text(`${item.n}.`, 15, y);
    doc.text(item.t, 22, y);
    y += 5;
    if (item.d) {
      doc.setFont(undefined!, "normal");
      doc.setTextColor(100, 100, 100);
      const lines = doc.splitTextToSize(item.d, 165);
      doc.text(lines, 22, y);
      y += lines.length * 4.5 + 3;
      doc.setTextColor(20, 32, 29);
    }
  }
  y += 6;

  // Résolutions
  if (d.resolutions.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont(undefined!, "bold");
    doc.text("Résolutions", 15, y);
    y += 8;

    for (const r of d.resolutions) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont(undefined!, "bold");
      doc.text(`Résolution n°${r.number} : ${r.title}`, 15, y);
      y += 5;
      doc.setFont(undefined!, "normal");
      const majorityLabel = r.majorityType === "simple" ? "Majorité simple" : r.majorityType === "trois_quarts" ? "Majorité des 3/4" : "Unanimité";
      doc.text(`Majorité requise : ${majorityLabel}`, 15, y);
      y += 5;
      doc.text(`Pour : ${r.pourCount} voix (${r.pourTantiemes} tantièmes) — Contre : ${r.contreCount} voix (${r.contreTantiemes} t.) — Abstention : ${r.abstentionCount} voix (${r.abstentionTantiemes} t.)`, 15, y);
      y += 5;
      if (r.result) {
        const resultLabel = r.result === "adoptee" ? "ADOPTÉE" : r.result === "rejetee" ? "REJETÉE" : "REPORTÉE";
        doc.setFont(undefined!, "bold");
        doc.setTextColor(r.result === "adoptee" ? 16 : r.result === "rejetee" ? 214 : 217, r.result === "adoptee" ? 163 : r.result === "rejetee" ? 69 : 150, r.result === "adoptee" ? 107 : r.result === "rejetee" ? 63 : 31);
        doc.text(`Résultat : ${resultLabel}`, 15, y);
        doc.setTextColor(20, 32, 29);
      }
      y += 8;
    }
  }

  // Compte-rendu
  if (d.summary) {
    if (y > 250) { doc.addPage(); y = 20; }
    y += 4;
    doc.setFontSize(13);
    doc.setFont(undefined!, "bold");
    doc.text("Compte-rendu", 15, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont(undefined!, "normal");
    const summaryLines = doc.splitTextToSize(d.summary, 175);
    doc.text(summaryLines, 15, y);
    y += summaryLines.length * 4.5 + 8;
  }

  // Signature
  if (y > 250) { doc.addPage(); y = 20; }
  y += 10;
  doc.setFontSize(10);
  doc.text("Le syndic,", 15, y);
  y += 6;
  doc.setFont(undefined!, "bold");
  doc.text(d.syndicName, 15, y);
  y += 15;
  doc.setFont(undefined!, "normal");
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text(`Document généré par Palier le ${formatDate(new Date().toISOString())}`, 15, y);
  doc.text("Conformément à la Loi 18-00 sur la copropriété des immeubles bâtis.", 15, y + 5);

  return doc;
}

/* ─── Accounting Export PDF ─── */
export function generateAnnexePDF(data: {
  buildingName: string;
  annexeId: string;
  annexeLabel: string;
  period: string;
  rows: { label: string; amount: number; category?: string }[];
  total: number;
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 20;

  // Header
  doc.setFillColor(30, 91, 80);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(`Annexe ${data.annexeId} — ${data.annexeLabel}`, 15, 16);
  doc.setFontSize(10);
  doc.text(`${data.buildingName} — ${data.period}`, 15, 24);
  doc.text("Décret n° 2.23.700", 15, 30);
  y = 45;

  // Table header
  doc.setTextColor(20, 32, 29);
  doc.setFillColor(245, 241, 234);
  doc.rect(15, y - 2, 180, 8, "F");
  doc.setFont(undefined!, "bold");
  doc.setFontSize(9);
  doc.text("Libellé", 17, y + 3);
  if (data.rows[0]?.category !== undefined) doc.text("Catégorie", 100, y + 3);
  doc.text("Montant (MAD)", 170, y + 3, { align: "right" });
  y += 12;

  // Rows
  doc.setFont(undefined!, "normal");
  for (const r of data.rows) {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(r.label.substring(0, 60), 17, y);
    if (r.category) doc.text(r.category, 100, y);
    doc.text(formatMad(r.amount), 192, y, { align: "right" });
    y += 6;
  }

  // Total
  y += 4;
  doc.line(15, y, 195, y);
  y += 8;
  doc.setFont(undefined!, "bold");
  doc.setFontSize(11);
  doc.text("TOTAL", 17, y);
  doc.text(formatMad(data.total), 192, y, { align: "right" });

  // Footer
  doc.setFontSize(8);
  doc.setFont(undefined!, "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Généré par Palier le ${formatDate(new Date().toISOString())} — Décret 2.23.700`, 15, 285);

  return doc;
}

/* ─── Download helper ─── */
export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}
