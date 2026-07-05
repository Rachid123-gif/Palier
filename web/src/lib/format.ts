import { t, type Lang } from "./i18n";

/** Formatage monétaire MAD façon app marocaine : "1 234,95 MAD" */
export function mad(amount: number, opts: { decimals?: boolean } = {}): string {
  const decimals = opts.decimals ?? true;
  const n = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(amount);
  return `${n.replace(/ /g, "\u00A0")} MAD`;
}

/** Montant nu sans devise (pour affichages héro) */
export function num(amount: number, decimals = true): string {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })
    .format(amount)
    .replace(/ /g, "\u00A0");
}

/** "Juillet 2026" — mois courant avec année */
export function currentPeriod(lang: Lang = "fr"): string {
  const now = new Date();
  return `${t[lang].months[now.getMonth()]} ${now.getFullYear()}`;
}

export function shortDate(iso: string, lang: Lang = "fr"): string {
  const d = new Date(iso);
  return `${d.getDate()} ${t[lang].monthsShort[d.getMonth()]}`;
}

export function longDate(iso: string, lang: Lang = "fr"): string {
  const d = new Date(iso);
  return `${d.getDate()} ${t[lang].monthsShort[d.getMonth()]} ${d.getFullYear()}`;
}

/** "il y a 2 h", "منذ 2 س" */
export function timeAgo(iso: string, lang: Lang = "fr"): string {
  const i = t[lang];
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return i.aLinstant;
  if (min < 60) return i.ilYA(min, i.min);
  const h = Math.round(min / 60);
  if (h < 24) return i.ilYA(h, i.h);
  const d = Math.round(h / 24);
  return i.ilYA(d, i.j);
}

/** Salutation contextuelle */
export function greeting(lang: Lang = "fr"): string {
  const i = t[lang];
  const h = new Date().getHours();
  if (h < 6) return i.bonneNuit;
  if (h < 12) return i.bonjour;
  if (h < 18) return i.bonApresMidi;
  return i.bonsoir;
}

/** Jours restants avant une date */
export function daysUntil(iso: string): number {
  const target = new Date(iso);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

/** Format date relative courte */
export function dueDateLabel(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return "aujourd'hui";
  if (d === 1) return "demain";
  if (d <= 7) return `dans ${d} jours`;
  return shortDate(iso);
}
