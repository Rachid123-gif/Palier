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

/** "il y a 2 h", "il y a 3 j" */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return `il y a ${d} j`;
}

/** Salutation contextuelle */
export function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

/** Jours restants avant une date */
export function daysUntil(iso: string): number {
  const target = new Date(iso);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

/** Format date relative courte : "dans 3 jours", "demain", "aujourd'hui", "dépassée" */
export function dueDateLabel(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return "aujourd'hui";
  if (d === 1) return "demain";
  if (d <= 7) return `dans ${d} jours`;
  return shortDate(iso);
}
