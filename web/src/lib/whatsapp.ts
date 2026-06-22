/** Construit un deeplink WhatsApp avec message pré-rempli (wa.me). */
export function whatsappLink(phoneIntl: string, message: string): string {
  const digits = phoneIntl.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Lien d'appel téléphonique */
export function telLink(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

export type WhenType = "now" | "today" | "scheduled";

export function bookingMessage(params: {
  providerName: string;
  serviceLabel: string;
  whenType: WhenType;
  slotLabel?: string;
  city: string;
  building?: string;
  userName?: string;
}): string {
  const { providerName, serviceLabel, whenType, slotLabel, city, building, userName } = params;
  const whenText =
    whenType === "now"
      ? "dès que possible (maintenant)"
      : whenType === "today"
        ? "aujourd'hui"
        : slotLabel ?? "à planifier";
  return [
    `Bonjour ${providerName} 👋`,
    ``,
    `Je vous contacte via *Palier* pour une prestation :`,
    `• Service : ${serviceLabel}`,
    `• Quand : ${whenText}`,
    `• Adresse : ${building ? building + ", " : ""}${city}`,
    userName ? `• De la part de : ${userName}` : ``,
    ``,
    `Pouvez-vous confirmer votre disponibilité et le tarif ? Merci !`,
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
    `Pouvez-vous me proposer quelqu'un de vérifié ? Merci !`,
  ]
    .filter(Boolean)
    .join("\n");
}
