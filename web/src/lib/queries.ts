import { supabaseAdmin } from "./supabase-server";
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
  assemblies: Assembly[];
  gardien: { name: string; phone: string; horaires: Record<string, { de: string; a: string; repos: boolean }>; taches: string[] } | null;
  welcomeMessage: string;
  insurancePolicies: { insurer: string; coverageType: string; startDate: string; endDate: string }[];
  mandate: { syndicName: string; syndicType: string; mandateEnd: string; electedAt: string } | null;
  coproprieteRule: { title: string; fileUrl?: string; adoptedAt?: string } | null;
  budgetSummary: { fiscalYear: number; totalAmount: number; status: string; lines: { label: string; category: string; amountBudgeted: number; amountActual: number }[] } | null;
  notifications: { id: string; title: string; body: string; created_at: string; kind: string }[];
  /** Multi-building: all buildings user has access to */
  buildings: UserBuilding[];
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
  id: r.id, type: r.type, author: r.author_name, authorId: r.profile_id ?? null, role: r.role,
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

/* ─── Multi-building: list all buildings a user has access to ─── */

export interface UserBuilding {
  buildingId: string;
  name: string;
  city: string;
  role: "resident" | "syndic";
  unitId: string | null;
}

export async function getUserBuildings(profileId: string): Promise<UserBuilding[]> {
  const { data: memberships } = await supabaseAdmin
    .from("memberships")
    .select("building_id, role, unit_id")
    .eq("profile_id", profileId)
    .eq("status", "active");
  if (!memberships || memberships.length === 0) return [];

  const buildingIds = memberships.map((m) => m.building_id);
  const { data: buildings } = await supabaseAdmin
    .from("buildings")
    .select("id, name, city")
    .in("id", buildingIds);

  const buildingMap = new Map((buildings ?? []).map((b) => [b.id, b]));
  return memberships.map((m) => {
    const b = buildingMap.get(m.building_id);
    return {
      buildingId: m.building_id,
      name: b?.name ?? "Immeuble",
      city: b?.city ?? "",
      role: m.role as "resident" | "syndic",
      unitId: m.unit_id,
    };
  });
}

/** Récupère tout le contexte résident depuis Supabase (server-side, sans flicker). */
export async function fetchAppData(buildingId: string, profileId: string | null, unitId: string | null, buildings?: UserBuilding[]): Promise<AppData> {
  const [bRes, pRes, uRes, memRes, chRes, ledRes, incRes, postRes, provRes, notifRes, docRes, agRes, allAgRes, settingsRes, insurRes, mandateRes, ruleRes, budgetRes] = await Promise.all([
    supabaseAdmin.from("buildings").select("*").eq("id", buildingId).single(),
    profileId ? supabaseAdmin.from("profiles").select("*").eq("id", profileId).single() : Promise.resolve({ data: null }),
    unitId ? supabaseAdmin.from("units").select("*").eq("id", unitId).single() : supabaseAdmin.from("units").select("*").eq("building_id", buildingId).limit(1).single(),
    profileId ? supabaseAdmin.from("memberships").select("role, status").eq("profile_id", profileId).eq("building_id", buildingId).single() : Promise.resolve({ data: null }),
    unitId ? supabaseAdmin.from("charges").select("*").eq("unit_id", unitId) : Promise.resolve({ data: [] }),
    supabaseAdmin.from("ledger_entries").select("*").eq("building_id", buildingId).order("entry_date", { ascending: false }),
    supabaseAdmin.from("incidents").select("*").eq("building_id", buildingId).order("created_at", { ascending: false }),
    supabaseAdmin.from("posts").select("*").eq("building_id", buildingId).order("created_at", { ascending: false }),
    supabaseAdmin.from("providers").select("*").eq("active", true),
    profileId ? supabaseAdmin.from("notifications").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    supabaseAdmin.from("documents").select("*").eq("building_id", buildingId).order("created_at", { ascending: false }),
    supabaseAdmin.from("assemblies").select("*").eq("building_id", buildingId).order("date", { ascending: false }).limit(1).single(),
    supabaseAdmin.from("assemblies").select("*").eq("building_id", buildingId).order("date", { ascending: false }),
    supabaseAdmin.from("building_settings").select("*").eq("building_id", buildingId).single(),
    supabaseAdmin.from("insurance_policies").select("insurer, coverage_type, start_date, end_date").eq("building_id", buildingId),
    supabaseAdmin.from("syndic_mandates").select("*").eq("building_id", buildingId).order("created_at", { ascending: false }).limit(1).single(),
    supabaseAdmin.from("copropriete_rules").select("title, file_url, adopted_at").eq("building_id", buildingId).single(),
    supabaseAdmin.from("budgets").select("*, budget_lines(*)").eq("building_id", buildingId).eq("status", "approved").order("fiscal_year", { ascending: false }).limit(1).single(),
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
    assemblies: (allAgRes.data ?? []).map((a: any) => ({
      id: a.id, date: a.date, time: a.time ?? "18h30",
      place: a.place ?? "Hall de la résidence",
      buildingName: b?.name ?? "",
      agenda: a.agenda ?? [], votes: a.votes ?? [],
      pvUrl: a.pv_url ?? undefined,
      status: a.status ?? "upcoming",
    })),
    gardien: settingsRes.data?.gardien ?? null,
    welcomeMessage: settingsRes.data?.welcome_message ?? "",
    insurancePolicies: (insurRes.data ?? []).map((p: any) => ({
      insurer: p.insurer, coverageType: p.coverage_type,
      startDate: p.start_date, endDate: p.end_date,
    })),
    mandate: mandateRes.data ? {
      syndicName: mandateRes.data.syndic_name,
      syndicType: mandateRes.data.syndic_type,
      mandateEnd: mandateRes.data.mandate_end,
      electedAt: mandateRes.data.elected_at,
    } : null,
    coproprieteRule: ruleRes.data ? {
      title: ruleRes.data.title,
      fileUrl: ruleRes.data.file_url ?? undefined,
      adoptedAt: ruleRes.data.adopted_at ?? undefined,
    } : null,
    budgetSummary: budgetRes.data ? {
      fiscalYear: budgetRes.data.fiscal_year,
      totalAmount: budgetRes.data.total_amount,
      status: budgetRes.data.status,
      lines: (budgetRes.data.budget_lines ?? []).map((l: any) => ({
        label: l.label, category: l.category,
        amountBudgeted: Number(l.amount_budgeted), amountActual: Number(l.amount_actual),
      })),
    } : null,
    notifications: (notifRes as any).data ?? [],
    buildings: buildings ?? [],
  };
}
