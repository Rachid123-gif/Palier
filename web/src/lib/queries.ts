import { supabase, DEMO_BUILDING_ID, DEMO_PROFILE_ID, DEMO_UNIT_ID } from "./supabase";
import type {
  Charge, Incident, Post, LedgerEntry, Provider, CurrentUser, BuildingKpis,
} from "./types";

export interface AppData {
  currentUser: CurrentUser;
  building: { name: string; address: string; city: string; lots: number; syndic: string };
  buildingKpis: BuildingKpis;
  charges: Charge[];
  chargesHistory: Charge[];
  totalDue: number;
  ledger: LedgerEntry[];
  incidents: Incident[];
  posts: Post[];
  providers: Provider[];
  notifications: { id: string; title: string; body: string; created_at: string; kind: string }[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapProvider = (r: any): Provider => ({
  id: r.id, name: r.name, categorySlug: r.category_slug, city: r.city_slug,
  district: r.district, phone: r.phone, whatsapp: r.whatsapp,
  rating: Number(r.rating), reviews: r.reviews, bio: r.bio,
  basePrice: Number(r.base_price), badges: r.badges ?? [],
  verified: r.verified, insured: r.insured, topNeighbor: r.top_neighbor,
  availableToday: r.available_today,
  avatar: { from: r.avatar_from, to: r.avatar_to, initials: r.avatar_initials },
});

const mapCharge = (r: any): Charge => ({
  id: r.id, label: r.label, detail: r.detail, period: r.period,
  amount: Number(r.amount), paid: Number(r.paid), dueDate: r.due_date,
  status: r.status, category: r.category,
});

const mapIncident = (r: any): Incident => ({
  id: r.id, category: r.category, title: r.title, details: r.details,
  urgency: r.urgency, status: r.status, reporter: r.reporter_name,
  createdAt: r.created_at, messages: r.messages_count ?? 0,
});

const mapPost = (r: any): Post => ({
  id: r.id, type: r.type, author: r.author_name, role: r.role,
  avatarColor: r.avatar_color, createdAt: r.created_at, pinned: r.pinned,
  emoji: r.emoji, title: r.title, body: r.body,
  reactions: { like: r.like_count ?? 0, love: r.love_count ?? 0, haha: r.haha_count ?? 0, wow: r.wow_count ?? 0 },
  comments: r.comments_count ?? 0,
});

const mapLedger = (r: any): LedgerEntry => ({
  id: r.id, type: r.type, label: r.label, amount: Number(r.amount),
  date: r.entry_date, category: r.category, signed: r.signed,
});

/** Récupère tout le contexte résident depuis Supabase (server-side, sans flicker). */
export async function fetchAppData(): Promise<AppData> {
  const [bRes, pRes, uRes, chRes, ledRes, incRes, postRes, provRes, notifRes] = await Promise.all([
    supabase.from("buildings").select("*").eq("id", DEMO_BUILDING_ID).single(),
    supabase.from("profiles").select("*").eq("id", DEMO_PROFILE_ID).single(),
    supabase.from("units").select("*").eq("building_id", DEMO_BUILDING_ID).limit(1).single(),
    supabase.from("charges").select("*").eq("unit_id", DEMO_UNIT_ID),
    supabase.from("ledger_entries").select("*").eq("building_id", DEMO_BUILDING_ID).order("entry_date", { ascending: false }),
    supabase.from("incidents").select("*").eq("building_id", DEMO_BUILDING_ID).order("created_at", { ascending: false }),
    supabase.from("posts").select("*").eq("building_id", DEMO_BUILDING_ID).order("created_at", { ascending: false }),
    supabase.from("providers").select("*").eq("active", true),
    supabase.from("notifications").select("*").eq("profile_id", DEMO_PROFILE_ID).order("created_at", { ascending: false }),
  ]);

  const b = bRes.data;
  const p = pRes.data;
  const u = uRes.data;
  const allCharges = (chRes.data ?? []).map(mapCharge);
  const incidents = (incRes.data ?? []).map(mapIncident);

  const charges = allCharges.filter((c) => c.status !== "paid");
  const chargesHistory = allCharges.filter((c) => c.status === "paid");

  return {
    currentUser: {
      name: p?.full_name ?? "Résident",
      unit: u?.ref ?? "—",
      building: b?.name ?? "Mon immeuble",
      city: (b?.city ?? "Casablanca").toLowerCase(),
      cityName: b?.city ?? "Casablanca",
      avatarColor: p?.avatar_color ?? "#1e5b50",
    },
    building: {
      name: b?.name ?? "", address: b?.address ?? "", city: b?.city ?? "",
      lots: b?.lots_count ?? 0, syndic: b?.syndic_name ?? "",
    },
    buildingKpis: {
      balance: Number(b?.balance ?? 0),
      paymentRate: b?.payment_rate ?? 0,
      openIncidents: incidents.filter((i) => i.status !== "resolved").length,
    },
    charges,
    chargesHistory,
    totalDue: charges.reduce((s, c) => s + (c.amount - c.paid), 0),
    ledger: (ledRes.data ?? []).map(mapLedger),
    incidents,
    posts: (postRes.data ?? []).map(mapPost),
    providers: (provRes.data ?? []).map(mapProvider),
    notifications: notifRes.data ?? [],
  };
}
