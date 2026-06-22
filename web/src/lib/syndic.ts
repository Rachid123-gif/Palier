import { supabase, DEMO_BUILDING_ID } from "./supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface RecouvrementRow {
  unitId: string;
  ref: string;
  floor: number | null;
  ownerName: string;
  avatarColor: string;
  role: string;
  phone: string;
  amount: number;
  paid: number;
  status: "due" | "partial" | "paid" | "late";
  lastDunnedAt: string | null;
}

export interface SyndicData {
  building: { id: string; name: string; address: string; city: string; lots: number; balance: number; syndic: string };
  kpis: {
    lots: number; residents: number; collected: number; expected: number; rate: number;
    outstanding: number; balance: number; openIncidents: number; lateCount: number; partialCount: number;
  };
  recouvrement: RecouvrementRow[];
  incidents: any[];
  residents: { id: string; name: string; avatarColor: string; phone: string; unit: string; role: string }[];
  ledger: any[];
  marketplace: { providers: number; bookings: number; requests: number };
}

export async function fetchSyndicData(): Promise<SyndicData> {
  const [bRes, uRes, mRes, pRes, chRes, dRes, incRes, ledRes, provRes, bookRes, reqRes] = await Promise.all([
    supabase.from("buildings").select("*").eq("id", DEMO_BUILDING_ID).single(),
    supabase.from("units").select("*").eq("building_id", DEMO_BUILDING_ID),
    supabase.from("memberships").select("*").eq("building_id", DEMO_BUILDING_ID),
    supabase.from("profiles").select("*"),
    supabase.from("charges").select("*").eq("building_id", DEMO_BUILDING_ID).eq("period", "Juin 2026"),
    supabase.from("dunning_logs").select("unit_id, sent_at").eq("building_id", DEMO_BUILDING_ID).order("sent_at", { ascending: false }),
    supabase.from("incidents").select("*").eq("building_id", DEMO_BUILDING_ID).order("created_at", { ascending: false }),
    supabase.from("ledger_entries").select("*").eq("building_id", DEMO_BUILDING_ID).order("entry_date", { ascending: false }),
    supabase.from("providers").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("service_requests").select("id", { count: "exact", head: true }),
  ]);

  const b = bRes.data;
  const units = uRes.data ?? [];
  const memberships = mRes.data ?? [];
  const profiles = pRes.data ?? [];
  const charges = chRes.data ?? [];
  const dunning = dRes.data ?? [];
  const profileById = new Map(profiles.map((p: any) => [p.id, p]));
  const lastDunnedByUnit = new Map<string, string>();
  for (const d of dunning) if (!lastDunnedByUnit.has(d.unit_id)) lastDunnedByUnit.set(d.unit_id, d.sent_at);

  const recouvrement: RecouvrementRow[] = units
    .map((u: any) => {
      const mem = memberships.find((m: any) => m.unit_id === u.id && m.is_primary) ?? memberships.find((m: any) => m.unit_id === u.id);
      const prof: any = mem ? profileById.get(mem.profile_id) : null;
      const ch = charges.find((c: any) => c.unit_id === u.id);
      return {
        unitId: u.id, ref: u.ref, floor: u.floor,
        ownerName: prof?.full_name ?? "—",
        avatarColor: prof?.avatar_color ?? "#8a9893",
        role: mem?.role ?? "owner",
        phone: prof?.phone ?? "",
        amount: ch ? Number(ch.amount) : 0,
        paid: ch ? Number(ch.paid) : 0,
        status: (ch?.status ?? "due") as RecouvrementRow["status"],
        lastDunnedAt: lastDunnedByUnit.get(u.id) ?? null,
      };
    })
    .sort((a, b) => {
      const order = { late: 0, partial: 1, due: 2, paid: 3 };
      return order[a.status] - order[b.status] || a.ref.localeCompare(b.ref);
    });

  const expected = charges.reduce((s: number, c: any) => s + Number(c.amount), 0);
  const collected = charges.reduce((s: number, c: any) => s + Number(c.paid), 0);
  const incidents = incRes.data ?? [];

  const residents = memberships
    .map((m: any) => {
      const p: any = profileById.get(m.profile_id);
      const u: any = units.find((x: any) => x.id === m.unit_id);
      return p ? { id: p.id, name: p.full_name, avatarColor: p.avatar_color, phone: p.phone, unit: u?.ref ?? "—", role: m.role } : null;
    })
    .filter(Boolean) as SyndicData["residents"];

  return {
    building: {
      id: b?.id, name: b?.name ?? "", address: b?.address ?? "", city: b?.city ?? "",
      lots: units.length, balance: Number(b?.balance ?? 0), syndic: b?.syndic_name ?? "",
    },
    kpis: {
      lots: units.length,
      residents: residents.length,
      collected, expected,
      rate: expected ? Math.round((collected / expected) * 100) : 0,
      outstanding: expected - collected,
      balance: Number(b?.balance ?? 0),
      openIncidents: incidents.filter((i: any) => i.status !== "resolved").length,
      lateCount: charges.filter((c: any) => c.status === "late").length,
      partialCount: charges.filter((c: any) => c.status === "partial").length,
    },
    recouvrement,
    incidents,
    residents,
    ledger: ledRes.data ?? [],
    marketplace: {
      providers: provRes.count ?? 0,
      bookings: bookRes.count ?? 0,
      requests: reqRes.count ?? 0,
    },
  };
}
