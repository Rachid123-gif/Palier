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
export type Urgency = "low" | "normal" | "urgent";

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
  imageUrl?: string;
}

export type PostType = "announcement" | "event" | "help" | "found" | "general" | "service" | "recommendation";

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
  /** Optional attached image */
  imageUrl?: string;
  /** Recommandations only: category slug */
  category?: string;
  /** Recommandations only: provider name */
  providerName?: string;
  /** Recommandations only: provider phone */
  providerPhone?: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  avatarColor: string;
  body: string;
  likes: number;
  createdAt: string;
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

export interface DocFile {
  id: string;
  title: string;
  type: string;
  date: string;
  icon: string;
  color: string;
  tint: string;
  url?: string;
}

export interface Assembly {
  id: string;
  date: string;
  time: string;
  place: string;
  buildingName: string;
  agenda: { n: number; t: string; d: string }[];
  votes: { id: string; q: string; options: string[]; closesAt: string }[];
}

export type MajorityType = "simple" | "trois_quarts" | "unanimite";

export interface Resolution {
  id: string;
  assemblyId: string;
  number: number;
  title: string;
  description?: string;
  majorityType: MajorityType;
  result?: "adoptee" | "rejetee" | "reportee";
  pourTantiemes: number;
  contreTantiemes: number;
  abstentionTantiemes: number;
  pourCount: number;
  contreCount: number;
  abstentionCount: number;
}

export interface Budget {
  id: string;
  buildingId: string;
  fiscalYear: number;
  status: "draft" | "vote" | "approved" | "closed";
  totalAmount: number;
  reserveFundAmount: number;
  lines: BudgetLine[];
  approvedAt?: string;
}

export interface BudgetLine {
  id: string;
  accountCode?: string;
  label: string;
  category: string;
  amountBudgeted: number;
  amountActual: number;
  notes?: string;
}

export interface InsurancePolicy {
  id: string;
  policyNumber?: string;
  insurer: string;
  coverageType: string;
  premiumAmount: number;
  startDate: string;
  endDate: string;
  renewalAlertDays: number;
  fileUrl?: string;
  notes?: string;
}

export interface SyndicMandate {
  id: string;
  syndicName: string;
  syndicType: "benevole" | "professionnel";
  deputyName?: string;
  electedAt: string;
  mandateEnd: string;
  remuneration?: number;
  contractUrl?: string;
}

export interface UrgentWork {
  id: string;
  incidentId?: string;
  title: string;
  description?: string;
  estimatedCost?: number;
  actualCost?: number;
  status: "declared" | "approved" | "in_progress" | "completed";
  declaredAt: string;
  completedAt?: string;
  justification: string;
  supplier?: string;
  invoiceUrl?: string;
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  author: string;
  avatarColor: string;
  body: string;
  role: "resident" | "syndic";
  createdAt: string;
}

export interface CoproprieteRule {
  id: string;
  title: string;
  fileUrl?: string;
  annexes: { title: string; url: string; type: string }[];
  adoptedAt?: string;
  notes?: string;
}

export interface BuildingKpis {
  balance: number;
  paymentRate: number;
  openIncidents: number;
}

export interface CurrentUser {
  name: string;
  phone: string;
  unit: string;
  unitId: string;
  tantiemes: number;
  role: string;
  building: string;
  city: string;
  cityName: string;
  avatarColor: string;
  membershipStatus: "active" | "inactive";
}
