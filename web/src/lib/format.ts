/** Formatage monétaire MAD façon app marocaine : "1 234,95 MAD" */
export function mad(amount: number, opts: { decimals?: boolean } = {}): string {
  const decimals = opts.decimals ?? true;
  const n = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(amount);
  return `${n.replace(/ /g, " ")} MAD`;
}

/** Montant nu sans devise (pour affichages héro) */
export function num(amount: number, decimals = true): string {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })
    .format(amount)
    .replace(/ /g, " ");
}

const MONTHS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function longDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "il y a 2 h", "il y a 3 j" — à partir d'une date de référence fixe (démo) */
const NOW = new Date("2026-06-19T13:00:00");
export function timeAgo(iso: string): string {
  const diff = NOW.getTime() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 60) return `il y a ${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return `il y a ${d} j`;
}

/** Salutation contextuelle */
export function greeting(): string {
  const h = NOW.getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}
