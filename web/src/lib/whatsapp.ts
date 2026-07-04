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
  period: string;
  building: string;
}): string {
  const { name, amount, period, building } = params;
  return [
    `Bonjour ${name},`,
    ``,
    `Rappel amical : vos charges de copropriété de *${period}* (${new Intl.NumberFormat("fr-MA").format(amount)} MAD) restent à régler.`,
    `Vous pouvez payer en 1 clic depuis l'application *Palier*.`,
    ``,
    `Merci de régulariser au plus vite. — Syndic, ${building}`,
  ].join("\n");
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
