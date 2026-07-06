import { supabase } from "./supabase";
import type {
  Charge, Incident, Post, LedgerEntry, Provider, CurrentUser, BuildingKpis,
  DocFile, Assembly,
} from "./types";

export interface AppData {
  /** IDs for write operations (passed to actions) */
  buildingId: string;
  profileId: string | null;
  unitId: string | null;
  currentUser: CurrentUser;
  building: { name: string; address: string; city: string; lots: number; syndic: string; syndicPhone: string };
  buildingKpis: BuildingKpis;
  charges: Charge[];
  chargesHistory: Charge[];
  totalDue: number;
  ledger: LedgerEntry[];
  incidents: Incident[];
  posts: Post[];
  providers: Provider[];
  documents: DocFile[];
  assembly: Assembly | null;
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
  imageUrl: r.image_url ?? undefined,
});

const mapPost = (r: any): Post => ({
  id: r.id, type: r.type, author: r.author_name, role: r.role,
  avatarColor: r.avatar_color, createdAt: r.created_at, pinned: r.pinned,
  emoji: r.emoji, title: r.title, body: r.body,
  reactions: { like: r.like_count ?? 0, love: r.love_count ?? 0, haha: r.haha_count ?? 0, wow: r.wow_count ?? 0 },
  comments: r.comments_count ?? 0,
  imageUrl: r.image_url ?? undefined,
  category: r.category ?? undefined,
  providerName: r.provider_name ?? undefined,
  providerPhone: r.provider_phone ?? undefined,
});

const mapLedger = (r: any): LedgerEntry => ({
  id: r.id, type: r.type, label: r.label, amount: Number(r.amount),
  date: r.entry_date, category: r.category, signed: r.signed,
});

/** Récupère tout le contexte résident depuis Supabase (server-side, sans flicker). */
export async function fetchAppData(buildingId: string, profileId: string | null, unitId: string | null): Promise<AppData> {
  const [bRes, pRes, uRes, memRes, chRes, ledRes, incRes, postRes, provRes, notifRes, docRes, agRes] = await Promise.all([
    supabase.from("buildings").select("*").eq("id", buildingId).single(),
    profileId ? supabase.from("profiles").select("*").eq("id", profileId).single() : Promise.resolve({ data: null }),
    unitId ? supabase.from("units").select("*").eq("id", unitId).single() : supabase.from("units").select("*").eq("building_id", buildingId).limit(1).single(),
    profileId ? supabase.from("memberships").select("role, status").eq("profile_id", profileId).eq("building_id", buildingId).single() : Promise.resolve({ data: null }),
    unitId ? supabase.from("charges").select("*").eq("unit_id", unitId) : Promise.resolve({ data: [] }),
    supabase.from("ledger_entries").select("*").eq("building_id", buildingId).order("entry_date", { ascending: false }),
    supabase.from("incidents").select("*").eq("building_id", buildingId).order("created_at", { ascending: false }),
    supabase.from("posts").select("*").eq("building_id", buildingId).order("created_at", { ascending: false }),
    supabase.from("providers").select("*").eq("active", true),
    profileId ? supabase.from("notifications").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    supabase.from("documents").select("*").eq("building_id", buildingId).order("created_at", { ascending: false }),
    supabase.from("assemblies").select("*").eq("building_id", buildingId).order("date", { ascending: false }).limit(1).single(),
  ]);

  const b = bRes.data;
  const p = pRes.data;
  const u = uRes.data;
  const allCharges = ((chRes as any).data ?? []).map(mapCharge);
  const incidents = (incRes.data ?? []).map(mapIncident);

  const charges = allCharges.filter((c: Charge) => c.status !== "paid");
  const chargesHistory = allCharges.filter((c: Charge) => c.status === "paid");

  return {
    buildingId,
    profileId,
    unitId: unitId ?? u?.id ?? null,
    currentUser: {
      name: p?.full_name ?? "Résident",
      phone: p?.phone ?? "",
      unit: u?.ref ?? "—",
      unitId: unitId ?? u?.id ?? "",
      tantiemes: u?.tantiemes ?? 0,
      role: (memRes as any).data?.role ?? "owner",
      membershipStatus: ((memRes as any).data?.status ?? "active") as "active" | "inactive",
      building: b?.name ?? "Mon immeuble",
      city: (b?.city ?? "Casablanca").toLowerCase(),
      cityName: b?.city ?? "Casablanca",
      avatarColor: p?.avatar_color ?? "#1e5b50",
    },
    building: {
      name: b?.name ?? "", address: b?.address ?? "", city: b?.city ?? "",
      lots: b?.lots_count ?? 0, syndic: b?.syndic_name ?? "", syndicPhone: b?.syndic_phone ?? "",
    },
    buildingKpis: {
      balance: Number(b?.balance ?? 0),
      paymentRate: b?.payment_rate ?? 0,
      openIncidents: incidents.filter((i) => i.status !== "resolved").length,
    },
    charges,
    chargesHistory,
    totalDue: charges.reduce((s: number, c: Charge) => s + (c.amount - c.paid), 0),
    ledger: (ledRes.data ?? []).map(mapLedger),
    incidents,
    posts: (postRes.data ?? []).map(mapPost),
    providers: (provRes.data ?? []).map(mapProvider),
    documents: (docRes.data ?? []).map((r: any): DocFile => ({
      id: r.id, title: r.title, type: r.doc_type ?? r.type ?? "", date: r.doc_date ?? r.created_at,
      icon: r.icon ?? "FileText", color: r.color ?? "text-ink-soft", tint: r.tint ?? "bg-cream-card",
      url: r.url ?? r.file_url ?? undefined,
    })),
    assembly: agRes.data ? {
      id: agRes.data.id, date: agRes.data.date, time: agRes.data.time ?? "18h30",
      place: agRes.data.place ?? "Hall de la résidence",
      buildingName: b?.name ?? "",
      agenda: agRes.data.agenda ?? [], votes: agRes.data.votes ?? [],
    } : null,
    notifications: (notifRes as any).data ?? [],
  };
}
