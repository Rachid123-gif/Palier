import type {
  Charge, Incident, Post, LedgerEntry, ServiceCategory,
  Provider, City, BuildingKpis, CurrentUser,
} from "./types";

/* ============================ UTILISATEUR & IMMEUBLE ============================ */

export const currentUser: CurrentUser = {
  name: "Yassine Bennani",
  unit: "Apt 3B",
  building: "Résidence Al Manar",
  city: "casablanca",
  cityName: "Casablanca",
  avatarColor: "#1e5b50",
};

export const building = {
  name: "Résidence Al Manar",
  address: "Bd Anfa",
  city: "Casablanca",
  lots: 24,
  syndic: "Karim Tazi",
};

export const buildingKpis: BuildingKpis = {
  balance: -5950,
  paymentRate: 87,
  openIncidents: 2,
};

/* ============================ CHARGES (COPROPRIÉTÉ UNIQUEMENT) ============================ */
/* MVP : aucune facture opérateur (Redal/Lydec/Inwi/IAM/Orange). Charges de syndic. */

export const charges: Charge[] = [
  {
    id: "ch_1", label: "Charges courantes", detail: "Gardiennage · nettoyage · ascenseur",
    period: "Juin 2026", amount: 650, paid: 0, dueDate: "2026-06-30",
    status: "due", category: "courantes",
  },
  {
    id: "ch_2", label: "Provision travaux", detail: "Ravalement de façade (3e appel)",
    period: "T2 2026", amount: 480, paid: 0, dueDate: "2026-06-30",
    status: "due", category: "travaux",
  },
  {
    id: "ch_3", label: "Régularisation eau", detail: "Parties communes 2025",
    period: "Solde 2025", amount: 104.95, paid: 0, dueDate: "2026-06-28",
    status: "late", category: "regularisation",
  },
];

export const chargesHistory: Charge[] = [
  {
    id: "ch_h1", label: "Charges courantes", detail: "Gardiennage · nettoyage · ascenseur",
    period: "Mai 2026", amount: 650, paid: 650, dueDate: "2026-05-31",
    status: "paid", category: "courantes",
  },
  {
    id: "ch_h2", label: "Charges courantes", detail: "Gardiennage · nettoyage · ascenseur",
    period: "Avril 2026", amount: 650, paid: 650, dueDate: "2026-04-30",
    status: "paid", category: "courantes",
  },
  {
    id: "ch_h3", label: "Provision travaux", detail: "Ravalement de façade (2e appel)",
    period: "T1 2026", amount: 480, paid: 480, dueDate: "2026-03-31",
    status: "paid", category: "travaux",
  },
];

export const totalDue = charges.reduce((s, c) => s + (c.amount - c.paid), 0); // 1234,95

/* ============================ INCIDENTS ============================ */

export const incidents: Incident[] = [
  {
    id: "inc_1", category: "ascenseur", title: "Ascenseur bloqué entre le 2e et le 3e",
    details: "L'ascenseur s'arrête et les portes ne s'ouvrent plus. Plusieurs voisins concernés.",
    urgency: "urgent", status: "in_progress", reporter: "Yassine B.",
    createdAt: "2026-06-18T19:30:00", messages: 4,
  },
  {
    id: "inc_2", category: "fuite", title: "Fuite d'eau au parking sous-sol",
    details: "Une flaque se forme près de la place 12, ça vient du plafond.",
    urgency: "high", status: "open", reporter: "Nadia R.",
    createdAt: "2026-06-18T09:10:00", messages: 2,
  },
  {
    id: "inc_3", category: "parking", title: "Voiture mal garée devant l'entrée",
    details: "Un véhicule bloque partiellement l'accès des poussettes.",
    urgency: "normal", status: "resolved", reporter: "Karim T.",
    createdAt: "2026-06-16T20:00:00", messages: 3,
  },
];

/* ============================ TRANSPARENCE (LEDGER) ============================ */

export const ledger: LedgerEntry[] = [
  { id: "l1", type: "out", label: "Salaire gardien — Mars 2026", amount: 3200, date: "2026-06-05", category: "Personnel", signed: true },
  { id: "l2", type: "out", label: "Eau parties communes", amount: 950, date: "2026-05-26", category: "Fluides", signed: true },
  { id: "l3", type: "out", label: "Réparation ascenseur (devis Otis)", amount: 1800, date: "2026-05-20", category: "Maintenance", signed: true },
  { id: "l4", type: "in", label: "Charges Mai 2026 — 21 lots encaissés", amount: 13650, date: "2026-05-12", category: "Charges", signed: true },
  { id: "l5", type: "out", label: "Produits d'entretien", amount: 420, date: "2026-05-08", category: "Fournitures", signed: true },
];

/* ============================ VOISINAGE ============================ */

export const posts: Post[] = [
  {
    id: "p1", type: "announcement", author: "Karim Tazi", role: "syndic", avatarColor: "#1e5b50",
    createdAt: "2026-06-19T11:00:00", pinned: true, emoji: "📅",
    title: "AG ordinaire du 12 mai 2026",
    body: "Convocation envoyée pour notre AG annuelle. Ordre du jour : approbation des comptes 2025, budget 2026, rénovation du hall.",
    reactions: { like: 6, love: 2, haha: 0, wow: 0 }, comments: 4,
  },
  {
    id: "p2", type: "event", author: "Mehdi El Idrissi", role: "resident", avatarColor: "#7a4ea8",
    createdAt: "2026-06-18T10:00:00", emoji: "☕",
    title: "Café entre voisins samedi 9h",
    body: "Comme chaque mois, on se retrouve dans le hall pour un thé. Tout le monde est bienvenu. J'apporte les msemen 😊",
    reactions: { like: 8, love: 5, haha: 2, wow: 1 }, comments: 3,
  },
  {
    id: "p3", type: "help", author: "Fatima Chraibi", role: "resident", avatarColor: "#c5604f",
    createdAt: "2026-06-16T15:00:00", emoji: "🔧",
    title: "Recommandation plombier",
    body: "J'ai eu une fuite hier, j'ai contacté Hassan via l'app. Très efficace, pro et tarif honnête. Je recommande à 100 %.",
    reactions: { like: 7, love: 2, haha: 0, wow: 1 }, comments: 2,
  },
  {
    id: "p4", type: "found", author: "Sara Mansouri", role: "resident", avatarColor: "#e0a82e",
    createdAt: "2026-06-18T18:00:00", emoji: "🔑",
    title: "Trousseau de clés trouvé",
    body: "Quelqu'un a perdu un trousseau de clés dans la cour ? Apt 3B, sonnez 😄",
    reactions: { like: 3, love: 1, haha: 2, wow: 0 }, comments: 1,
  },
];

/* ============================ SERVICES — CATÉGORIES ============================ */

export const categories: ServiceCategory[] = [
  { slug: "menage", label: "Ménage", short: "Ménage", icon: "Sparkles", tint: "bg-[#fbeef0]", accent: "text-[#c5604f]" },
  { slug: "plomberie", label: "Plomberie", short: "Plombier", icon: "Wrench", tint: "bg-[#e4eefb]", accent: "text-[#2f74c0]" },
  { slug: "electricite", label: "Électricité", short: "Élec", icon: "Zap", tint: "bg-[#fbf0d8]", accent: "text-[#d9961f]" },
  { slug: "climatisation", label: "Climatisation", short: "Clim", icon: "Snowflake", tint: "bg-[#e4f2fb]", accent: "text-[#2f9ec0]" },
  { slug: "bricolage", label: "Bricolage", short: "Bricolage", icon: "Hammer", tint: "bg-[#eef0e4]", accent: "text-[#6b7a3f]" },
  { slug: "peinture", label: "Peinture", short: "Peinture", icon: "PaintRoller", tint: "bg-[#f0e4fb]", accent: "text-[#7a4ea8]" },
  { slug: "jardinage", label: "Jardinage", short: "Jardin", icon: "Leaf", tint: "bg-[#e3f5ec]", accent: "text-[#2e9e6b]" },
  { slug: "securite", label: "Sécurité", short: "Sécurité", icon: "ShieldCheck", tint: "bg-[#fbe5e4]", accent: "text-[#d6453f]" },
];

export function categoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

/* ============================ VILLES ============================ */

export const cities: City[] = [
  { slug: "casablanca", name: "Casablanca", providerCount: 10 },
  { slug: "rabat", name: "Rabat", providerCount: 4 },
  { slug: "marrakech", name: "Marrakech", providerCount: 4 },
  { slug: "tanger", name: "Tanger", providerCount: 2 },
];

/* ============================ PRESTATAIRES ============================ */
/* Chaque prestataire a un avatar à dégradé UNIQUE (couleurs jamais dupliquées). */

export const providers: Provider[] = [
  // ---- Casablanca · Ménage
  {
    id: "pr_1", name: "Fatima Cleaning Services", categorySlug: "menage", city: "casablanca", district: "Maârif",
    phone: "+212 6 61 23 45 67", whatsapp: "+212661234567", rating: 4.9, reviews: 287,
    bio: "Équipe de 6 personnes. Produits écologiques inclus. 8 ans d'expérience.",
    basePrice: 150, badges: ["Top voisins", "Produits inclus"], verified: true, insured: true,
    topNeighbor: true, availableToday: true,
    avatar: { from: "#1e5b50", to: "#45937e", initials: "FC" },
  },
  {
    id: "pr_2", name: "CleanPro Casa", categorySlug: "menage", city: "casablanca", district: "Anfa",
    phone: "+212 6 62 11 22 33", whatsapp: "+212662112233", rating: 4.7, reviews: 156,
    bio: "Service ménage professionnel. Équipe vérifiée. Assurance incluse.",
    basePrice: 180, badges: ["Assuré"], verified: true, insured: true, availableToday: true,
    avatar: { from: "#2f74c0", to: "#5aa0e0", initials: "CP" },
  },
  {
    id: "pr_3", name: "Atlas Cleaning", categorySlug: "menage", city: "casablanca", district: "Sidi Maârouf",
    phone: "+212 6 63 44 55 66", whatsapp: "+212663445566", rating: 4.8, reviews: 131,
    bio: "Ménage à domicile, repassage, vitres. Équipe vérifiée, assurance incluse.",
    basePrice: 110, badges: ["Repassage"], verified: true, insured: true, availableToday: true,
    avatar: { from: "#194a42", to: "#2c7766", initials: "AC" },
  },
  // ---- Casablanca · Plomberie
  {
    id: "pr_4", name: "Hassan Plomberie", categorySlug: "plomberie", city: "casablanca", district: "Gauthier",
    phone: "+212 6 64 77 88 99", whatsapp: "+212664778899", rating: 4.9, reviews: 203,
    bio: "Dépannage urgent 24/7, fuites, chauffe-eau, sanitaires. 12 ans de métier.",
    basePrice: 200, badges: ["Top voisins", "Urgence 24/7"], verified: true, insured: true,
    topNeighbor: true, availableToday: true,
    avatar: { from: "#2f74c0", to: "#2f9ec0", initials: "HP" },
  },
  {
    id: "pr_5", name: "AquaFix Casa", categorySlug: "plomberie", city: "casablanca", district: "Bourgogne",
    phone: "+212 6 65 12 34 56", whatsapp: "+212665123456", rating: 4.6, reviews: 98,
    bio: "Installation et réparation. Devis gratuit sous 1h.",
    basePrice: 180, badges: ["Devis gratuit"], verified: true, insured: true, availableToday: false,
    avatar: { from: "#0f6e7a", to: "#3aa6b0", initials: "AF" },
  },
  // ---- Casablanca · Électricité
  {
    id: "pr_6", name: "Volt Électricité", categorySlug: "electricite", city: "casablanca", district: "Racine",
    phone: "+212 6 66 98 76 54", whatsapp: "+212666987654", rating: 4.8, reviews: 142,
    bio: "Mise aux normes, tableaux, dépannage. Électricien certifié.",
    basePrice: 220, badges: ["Certifié"], verified: true, insured: true, availableToday: true,
    avatar: { from: "#d9961f", to: "#f2c14e", initials: "VE" },
  },
  // ---- Casablanca · Climatisation
  {
    id: "pr_7", name: "Cool Air Maroc", categorySlug: "climatisation", city: "casablanca", district: "Ain Diab",
    phone: "+212 6 67 22 33 44", whatsapp: "+212667223344", rating: 4.8, reviews: 176,
    bio: "Installation, recharge gaz, entretien filtres. Toutes marques.",
    basePrice: 220, badges: ["Toutes marques"], verified: true, insured: true, availableToday: true,
    avatar: { from: "#2f9ec0", to: "#7ccbe0", initials: "CA" },
  },
  // ---- Casablanca · Bricolage
  {
    id: "pr_8", name: "Mains Habiles", categorySlug: "bricolage", city: "casablanca", district: "Oasis",
    phone: "+212 6 68 55 66 77", whatsapp: "+212668556677", rating: 4.7, reviews: 89,
    bio: "Montage meubles, fixations, petites réparations. Ponctuel et soigné.",
    basePrice: 130, badges: ["Polyvalent"], verified: true, insured: false, availableToday: true,
    avatar: { from: "#6b7a3f", to: "#8a9a4e", initials: "MH" },
  },
  // ---- Casablanca · Peinture
  {
    id: "pr_9", name: "Couleurs & Co", categorySlug: "peinture", city: "casablanca", district: "Maârif",
    phone: "+212 6 69 11 88 22", whatsapp: "+212669118822", rating: 4.9, reviews: 64,
    bio: "Peinture intérieure, enduits, décoration. Devis sous 24h.",
    basePrice: 90, badges: ["Devis 24h"], verified: true, insured: true, availableToday: false,
    avatar: { from: "#7a4ea8", to: "#a878d0", initials: "CC" },
  },
  // ---- Casablanca · Jardinage
  {
    id: "pr_10", name: "Vert Jardin", categorySlug: "jardinage", city: "casablanca", district: "Californie",
    phone: "+212 6 70 33 22 11", whatsapp: "+212670332211", rating: 4.7, reviews: 51,
    bio: "Entretien d'espaces verts, taille, arrosage automatique.",
    basePrice: 140, badges: ["Espaces communs"], verified: true, insured: true, availableToday: true,
    avatar: { from: "#2e9e6b", to: "#5fcf95", initials: "VJ" },
  },

  // ---- Rabat
  {
    id: "pr_11", name: "Khadija Ménage Pro", categorySlug: "menage", city: "rabat", district: "Agdal",
    phone: "+212 6 71 44 55 66", whatsapp: "+212671445566", rating: 4.9, reviews: 173,
    bio: "Service ménage hebdomadaire ou ponctuel. 5 ans à Rabat.",
    basePrice: 160, badges: ["Top voisins"], verified: true, insured: true, topNeighbor: true, availableToday: true,
    avatar: { from: "#1e5b50", to: "#2c7766", initials: "KM" },
  },
  {
    id: "pr_12", name: "Rabat Plomberie Express", categorySlug: "plomberie", city: "rabat", district: "Hassan",
    phone: "+212 6 72 77 11 33", whatsapp: "+212672771133", rating: 4.7, reviews: 84,
    bio: "Intervention rapide, fuites et sanitaires.",
    basePrice: 190, badges: ["Rapide"], verified: true, insured: true, availableToday: true,
    avatar: { from: "#225a9c", to: "#4a8fd6", initials: "RP" },
  },
  {
    id: "pr_13", name: "Lumière Élec Rabat", categorySlug: "electricite", city: "rabat", district: "Hay Riad",
    phone: "+212 6 73 22 99 88", whatsapp: "+212673229988", rating: 4.6, reviews: 61,
    bio: "Dépannage et installation électrique.",
    basePrice: 210, badges: ["Certifié"], verified: true, insured: true, availableToday: false,
    avatar: { from: "#cf8a1a", to: "#e8b94a", initials: "LE" },
  },
  {
    id: "pr_14", name: "Jardins d'Agdal", categorySlug: "jardinage", city: "rabat", district: "Agdal",
    phone: "+212 6 74 55 44 33", whatsapp: "+212674554433", rating: 4.8, reviews: 39,
    bio: "Paysagiste, entretien et création de jardins.",
    basePrice: 150, badges: ["Paysagiste"], verified: true, insured: true, availableToday: true,
    avatar: { from: "#288a5d", to: "#52c089", initials: "JA" },
  },

  // ---- Marrakech
  {
    id: "pr_15", name: "Medina Clean", categorySlug: "menage", city: "marrakech", district: "Guéliz",
    phone: "+212 6 75 11 22 33", whatsapp: "+212675112233", rating: 4.8, reviews: 121,
    bio: "Ménage riads et appartements. Équipe de confiance.",
    basePrice: 140, badges: ["Riads"], verified: true, insured: true, topNeighbor: true, availableToday: true,
    avatar: { from: "#16403a", to: "#2c7766", initials: "MC" },
  },
  {
    id: "pr_16", name: "Atlas Froid", categorySlug: "climatisation", city: "marrakech", district: "Hivernage",
    phone: "+212 6 76 88 77 66", whatsapp: "+212676887766", rating: 4.7, reviews: 93,
    bio: "Climatisation : installation et entretien, indispensable l'été.",
    basePrice: 240, badges: ["Spécial été"], verified: true, insured: true, availableToday: true,
    avatar: { from: "#2f9ec0", to: "#6cc4dc", initials: "AF" },
  },
  {
    id: "pr_17", name: "Bricolo Marrakech", categorySlug: "bricolage", city: "marrakech", district: "Targa",
    phone: "+212 6 77 33 44 55", whatsapp: "+212677334455", rating: 4.6, reviews: 47,
    bio: "Petits travaux, montage, dépannage maison.",
    basePrice: 120, badges: ["Polyvalent"], verified: true, insured: false, availableToday: false,
    avatar: { from: "#5d6c35", to: "#869646", initials: "BM" },
  },
  {
    id: "pr_18", name: "Couleurs du Sud", categorySlug: "peinture", city: "marrakech", district: "Gueliz",
    phone: "+212 6 78 99 11 22", whatsapp: "+212678991122", rating: 4.9, reviews: 58,
    bio: "Peinture et tadelakt traditionnel.",
    basePrice: 100, badges: ["Tadelakt"], verified: true, insured: true, availableToday: true,
    avatar: { from: "#8a4ea0", to: "#b87fd2", initials: "CS" },
  },

  // ---- Tanger
  {
    id: "pr_19", name: "Detroit Clean", categorySlug: "menage", city: "tanger", district: "Centre",
    phone: "+212 6 79 22 33 44", whatsapp: "+212679223344", rating: 4.7, reviews: 72,
    bio: "Ménage à domicile et bureaux, équipe locale.",
    basePrice: 130, badges: ["Bureaux"], verified: true, insured: true, topNeighbor: true, availableToday: true,
    avatar: { from: "#1a5048", to: "#3a8678", initials: "DC" },
  },
  {
    id: "pr_20", name: "Nord Plomberie", categorySlug: "plomberie", city: "tanger", district: "Malabata",
    phone: "+212 6 80 44 55 66", whatsapp: "+212680445566", rating: 4.6, reviews: 44,
    bio: "Dépannage plomberie et chauffe-eau.",
    basePrice: 170, badges: ["Chauffe-eau"], verified: true, insured: true, availableToday: false,
    avatar: { from: "#1d5fa0", to: "#4d92d8", initials: "NP" },
  },
];

export function providersFor(citySlug: string, categorySlug?: string): Provider[] {
  return providers
    .filter((p) => p.city === citySlug && (!categorySlug || p.categorySlug === categorySlug))
    .sort((a, b) => Number(b.topNeighbor ?? false) - Number(a.topNeighbor ?? false) || b.rating - a.rating);
}

export function providerById(id: string) {
  return providers.find((p) => p.id === id);
}

/* ============================ OFFRES & POPULAIRES ============================ */

export const popular = [
  {
    id: "pop_1", title: "Ménage 2h", desc: "Produits inclus, équipe vérifiée",
    rating: 4.9, reviews: 287, price: 150, categorySlug: "menage", tag: "#1 cette semaine",
    tint: "bg-[#eef4fb]", icon: "Sparkles", accent: "text-[#2f74c0]",
  },
  {
    id: "pop_2", title: "Ménage en profondeur", desc: "Vitres, frigo, four",
    rating: 4.8, reviews: 142, price: 280, categorySlug: "menage", tag: "",
    tint: "bg-[#f3e9fb]", icon: "Stars", accent: "text-[#7a4ea8]",
  },
];

export const offers = [
  { id: "of_1", title: "Abonnement ménage hebdo", desc: "Le même prestataire chaque semaine", price: 120, was: 150, off: "-20%", icon: "CalendarHeart", tint: "bg-[#fbeef0]", accent: "text-[#c5604f]" },
  { id: "of_2", title: "1er ménage offert", desc: "Offre nouveaux voisins · valable 7 jours", price: 1, was: 180, off: "", icon: "Gift", tint: "bg-[#e3f5ec]", accent: "text-[#2e9e6b]" },
  { id: "of_3", title: "Entretien clim avant l'été", desc: "Recharge gaz + nettoyage filtres", price: 220, was: 320, off: "-30%", icon: "Snowflake", tint: "bg-[#e4f2fb]", accent: "text-[#2f9ec0]" },
  { id: "of_4", title: "Plombier urgence nuit", desc: "Intervention 24/7", price: 200, was: 0, off: "", icon: "Wrench", tint: "bg-[#fbeef0]", accent: "text-[#c5604f]" },
];

/* ============================ NOTIFICATIONS ============================ */

export const notifications = [
  { id: "n1", title: "Ascenseur — intervention programmée", body: "Otis passe demain entre 9h et 11h.", time: "il y a 2 h", kind: "incident" as const },
  { id: "n2", title: "Charges de juin disponibles", body: "1 234,95 MAD à régler avant le 30/06/2026.", time: "il y a 1 j", kind: "charge" as const },
  { id: "n3", title: "Nouvelle annonce du syndic", body: "AG ordinaire du 12 mai 2026 — convocation envoyée.", time: "il y a 1 j", kind: "post" as const },
];
