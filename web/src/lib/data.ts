import type { ServiceCategory, City } from "./types";

/* ============================ SERVICES — CATÉGORIES ============================ */
/* Configuration statique : les catégories de services disponibles dans l'annuaire. */

export const categories: ServiceCategory[] = [
  { slug: "menage", label: "Ménage", short: "Ménage", icon: "Sparkles", tint: "bg-[#fbeef0]", accent: "text-[#c5604f]" },
  { slug: "plomberie", label: "Plomberie", short: "Plombier", icon: "Wrench", tint: "bg-[#e4eefb]", accent: "text-[#2f74c0]" },
  { slug: "electricite", label: "Électricité", short: "Élec", icon: "Zap", tint: "bg-[#fbf0d8]", accent: "text-[#d9961f]" },
  { slug: "climatisation", label: "Climatisation", short: "Clim", icon: "Snowflake", tint: "bg-[#e4f2fb]", accent: "text-[#2f9ec0]" },
  { slug: "bricolage", label: "Bricolage", short: "Bricolage", icon: "Hammer", tint: "bg-[#eef0e4]", accent: "text-[#6b7a3f]" },
  { slug: "peinture", label: "Peinture", short: "Peinture", icon: "PaintRoller", tint: "bg-[#f0e4fb]", accent: "text-[#7a4ea8]" },
  { slug: "jardinage", label: "Jardinage", short: "Jardin", icon: "Leaf", tint: "bg-[#e3f5ec]", accent: "text-[#2e9e6b]" },
  { slug: "securite", label: "Sécurité", short: "Sécurité", icon: "ShieldCheck", tint: "bg-[#fbe5e4]", accent: "text-[#d6453f]" },
  { slug: "serrurerie", label: "Serrurerie", short: "Serrure", icon: "KeyRound", tint: "bg-[#eef0e4]", accent: "text-[#6b7a3f]" },
  { slug: "demenagement", label: "Déménagement", short: "Démén.", icon: "Truck", tint: "bg-[#e4eefb]", accent: "text-[#2f74c0]" },
  { slug: "nettoyage-tapis", label: "Nettoyage tapis", short: "Tapis", icon: "Layers", tint: "bg-[#fbeef0]", accent: "text-[#c5604f]" },
  { slug: "nettoyage-canape", label: "Nettoyage canapé", short: "Canapé", icon: "Sofa", tint: "bg-[#f0e4fb]", accent: "text-[#7a4ea8]" },
  { slug: "piscine", label: "Piscine", short: "Piscine", icon: "Waves", tint: "bg-[#e4f2fb]", accent: "text-[#2f9ec0]" },
  { slug: "vitres", label: "Vitres", short: "Vitres", icon: "PanelsTopLeft", tint: "bg-[#e4eefb]", accent: "text-[#225a9c]" },
  { slug: "electromenager", label: "Réparation électroménager", short: "Électro.", icon: "WashingMachine", tint: "bg-[#fbf0d8]", accent: "text-[#d9961f]" },
  { slug: "desinfection", label: "Désinfection", short: "Désinf.", icon: "SprayCan", tint: "bg-[#e3f5ec]", accent: "text-[#2e9e6b]" },
];

export function categoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

/* ============================ VILLES ============================ */
/* Configuration statique : villes couvertes par l'annuaire. */

export const cities: City[] = [
  { slug: "casablanca", name: "Casablanca", providerCount: 0 },
  { slug: "rabat", name: "Rabat", providerCount: 0 },
  { slug: "marrakech", name: "Marrakech", providerCount: 0 },
  { slug: "tanger", name: "Tanger", providerCount: 0 },
];

/** Quartiers par ville (sélecteur de localisation). */
export const quartiersByCity: Record<string, string[]> = {
  casablanca: ["Maârif", "Anfa", "Gauthier", "Racine", "Bourgogne", "Oasis", "Sidi Maârouf", "Ain Diab", "Californie"],
  rabat: ["Agdal", "Hay Riad", "Souissi", "Hassan"],
  marrakech: ["Guéliz", "Hivernage", "Targa", "Médina"],
  tanger: ["Centre", "Malabata", "Iberia"],
};
