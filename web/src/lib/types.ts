export type ChargeStatus = "due" | "partial" | "paid" | "late";

export interface Charge {
  id: string;
  label: string;
  detail: string;
  period: string;
  amount: number;
  paid: number;
  dueDate: string; // ISO
  status: ChargeStatus;
  category: "courantes" | "travaux" | "provision" | "regularisation";
}

export type IncidentStatus = "open" | "in_progress" | "resolved";
export type Urgency = "low" | "normal" | "high" | "urgent";

export interface Incident {
  id: string;
  category: string; // slug catégorie
  title: string;
  details: string;
  urgency: Urgency;
  status: IncidentStatus;
  reporter: string;
  createdAt: string;
  messages: number;
}

export type PostType = "announcement" | "event" | "help" | "found" | "general";

export interface Post {
  id: string;
  type: PostType;
  author: string;
  role: "syndic" | "resident";
  avatarColor: string;
  createdAt: string;
  pinned?: boolean;
  emoji?: string;
  title?: string;
  body: string;
  reactions: { like: number; love: number; haha: number; wow: number };
  comments: number;
}

export interface LedgerEntry {
  id: string;
  type: "in" | "out";
  label: string;
  amount: number;
  date: string;
  category: string;
  signed: boolean;
}

export interface ServiceCategory {
  slug: string;
  label: string;
  short: string;
  icon: string; // lucide name
  tint: string; // bg tint class
  accent: string; // text/icon class
}

export interface Provider {
  id: string;
  name: string;
  categorySlug: string;
  city: string;
  district: string;
  phone: string;
  whatsapp: string;
  rating: number;
  reviews: number;
  bio: string;
  basePrice: number;
  badges: string[];
  verified: boolean;
  insured: boolean;
  topNeighbor?: boolean;
  availableToday?: boolean;
  /** Couleurs déterministes & uniques pour l'avatar (jamais dupliquées). */
  avatar: { from: string; to: string; initials: string };
}

export interface City {
  slug: string;
  name: string;
  providerCount: number;
}

export interface BuildingKpis {
  balance: number;
  paymentRate: number;
  openIncidents: number;
}

export interface CurrentUser {
  name: string;
  unit: string;
  building: string;
  city: string;
  cityName: string;
  avatarColor: string;
}
