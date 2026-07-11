/** Construit un deeplink WhatsApp avec message pré-rempli (wa.me). */
export function whatsappLink(phoneIntl: string, message: string): string {
  const digits = phoneIntl.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Lien d'appel téléphonique */
export function telLink(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

export function contactMessage(params: {
  providerName: string;
  serviceLabel: string;
  city: string;
  building?: string;
  userName?: string;
}): string {
  const { providerName, serviceLabel, city, building, userName } = params;
  return [
    `Bonjour ${providerName} 👋`,
    ``,
    `Je vous contacte via *Palier* pour un service de *${serviceLabel}*.`,
    `• Adresse : ${building ? building + ", " : ""}${city}`,
    userName ? `• De la part de : ${userName}` : ``,
    ``,
    `Êtes-vous disponible ? Quel serait le tarif ? Merci !`,
  ]
    .filter(Boolean)
    .join("\n");
}


export function dunningMessage(params: {
  name: string;
  amount: number;
  paid?: number;
  remaining?: number;
  period: string;
  building: string;
  lot?: string;
  dueDate?: string;
}): string {
  const { name, amount, paid, remaining, period, building, lot, dueDate } = params;
  const fmt = (n: number) => new Intl.NumberFormat("fr-MA").format(n);
  const rest = remaining ?? amount - (paid ?? 0);
  return [
    `Bonjour ${name},`,
    ``,
    `Rappel concernant vos charges de copropriété à *${building}*${lot ? ` (Lot ${lot})` : ""}.`,
    ``,
    `• Montant dû : *${fmt(amount)} MAD*`,
    paid && paid > 0 ? `• Déjà payé : ${fmt(paid)} MAD` : null,
    paid && paid > 0 ? `• Reste à régler : *${fmt(rest)} MAD*` : null,
    dueDate ? `• Échéance : ${dueDate}` : null,
    `• Période : ${period}`,
    ``,
    `Merci de régulariser votre situation. — Syndic, ${building}`,
  ].filter(Boolean).join("\n");
}

export function quoteRequestMessage(params: {
  categoryLabel: string;
  city: string;
  details?: string;
}): string {
  const { categoryLabel, city, details } = params;
  return [
    `Bonjour, je cherche un prestataire *${categoryLabel}* à ${city} via Palier.`,
    details ? `Besoin : ${details}` : ``,
    `Pouvez-vous m'aider ? Merci !`,
  ]
    .filter(Boolean)
    .join("\n");
}
