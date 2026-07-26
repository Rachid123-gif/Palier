import { supabaseAdmin } from "./supabase-server";

export interface AdminBuilding {
  id: string;
  name: string;
  city: string;
  lots: number;
  balance: number;
  paymentRate: number;
  syndicName: string;
  syndicPhone: string;
  createdAt: string;
  residentsCount: number;
  openIncidents: number;
}

export interface AdminSyndic {
  profileId: string;
  name: string;
  phone: string;
  buildings: { id: string; name: string; city: string }[];
  createdAt: string;
}

export interface AdminKpis {
  totalBuildings: number;
  totalSyndics: number;
  totalResidents: number;
  activeResidents: number;
  totalIncidents: number;
  openIncidents: number;
  totalPosts: number;
  totalChargesEmitted: number;
  totalChargesPaid: number;
  // Growth (this month)
  newBuildingsThisMonth: number;
  newResidentsThisMonth: number;
}

export interface RecentActivity {
  type: "building" | "incident" | "post" | "charge";
  title: string;
  detail: string;
  date: string;
}

export interface AdminData {
  kpis: AdminKpis;
  buildings: AdminBuilding[];
  syndics: AdminSyndic[];
  recentActivity: RecentActivity[];
}

export async function fetchAdminData(): Promise<AdminData> {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    buildingsRes,
    membershipsRes,
    incidentsRes,
    postsRes,
    chargesRes,
    profilesRes,
    recentBuildingsRes,
    recentMembershipsRes,
  ] = await Promise.all([
    supabaseAdmin.from("buildings").select("id, name, city, lots_count, balance, payment_rate, syndic_name, syndic_phone, created_at").order("created_at", { ascending: false }),
    supabaseAdmin.from("memberships").select("profile_id, building_id, role, status, created_at"),
    supabaseAdmin.from("incidents").select("id, building_id, status, title, category, created_at").order("created_at", { ascending: false }).limit(200),
    supabaseAdmin.from("posts").select("id, building_id, author_name, title, body, type, created_at").order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("charges").select("id, building_id, amount, paid, status"),
    supabaseAdmin.from("profiles").select("id, full_name, phone, created_at"),
    supabaseAdmin.from("buildings").select("id").gte("created_at", firstOfMonth),
    supabaseAdmin.from("memberships").select("id").eq("role", "resident").gte("created_at", firstOfMonth),
  ]);

  const buildings = buildingsRes.data ?? [];
  const memberships = membershipsRes.data ?? [];
  const incidents = incidentsRes.data ?? [];
  const posts = postsRes.data ?? [];
  const charges = chargesRes.data ?? [];
  const profiles = profilesRes.data ?? [];

  // Count residents per building
  const residentsPerBuilding = new Map<string, number>();
  const syndicMemberships = new Map<string, string[]>(); // profileId → buildingIds
  for (const m of memberships) {
    if (m.role === "resident" && m.status === "active") {
      residentsPerBuilding.set(m.building_id, (residentsPerBuilding.get(m.building_id) ?? 0) + 1);
    }
    if (m.role === "syndic" && m.status === "active") {
      const list = syndicMemberships.get(m.profile_id) ?? [];
      list.push(m.building_id);
      syndicMemberships.set(m.profile_id, list);
    }
  }

  // Open incidents per building
  const openIncidentsPerBuilding = new Map<string, number>();
  let totalOpenIncidents = 0;
  for (const inc of incidents) {
    if (inc.status !== "resolved") {
      openIncidentsPerBuilding.set(inc.building_id, (openIncidentsPerBuilding.get(inc.building_id) ?? 0) + 1);
      totalOpenIncidents++;
    }
  }

  // Build admin buildings list
  const adminBuildings: AdminBuilding[] = buildings.map((b) => ({
    id: b.id,
    name: b.name,
    city: b.city ?? "",
    lots: b.lots_count ?? 0,
    balance: Number(b.balance ?? 0),
    paymentRate: b.payment_rate ?? 0,
    syndicName: b.syndic_name ?? "",
    syndicPhone: b.syndic_phone ?? "",
    createdAt: b.created_at,
    residentsCount: residentsPerBuilding.get(b.id) ?? 0,
    openIncidents: openIncidentsPerBuilding.get(b.id) ?? 0,
  }));

  // Build syndics list
  const buildingMap = new Map(buildings.map((b) => [b.id, { id: b.id, name: b.name, city: b.city ?? "" }]));
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const adminSyndics: AdminSyndic[] = [];
  for (const [profileId, buildingIds] of syndicMemberships) {
    const p = profileMap.get(profileId);
    if (!p) continue;
    adminSyndics.push({
      profileId,
      name: p.full_name ?? "",
      phone: p.phone ?? "",
      buildings: buildingIds.map((bid) => buildingMap.get(bid) ?? { id: bid, name: "—", city: "" }),
      createdAt: p.created_at,
    });
  }

  // Charges stats
  const totalEmitted = charges.reduce((s, c) => s + Number(c.amount ?? 0), 0);
  const totalPaid = charges.reduce((s, c) => s + Number(c.paid ?? 0), 0);

  // Residents count
  const totalResidents = memberships.filter((m) => m.role === "resident").length;
  const activeResidents = memberships.filter((m) => m.role === "resident" && m.status === "active").length;

  // KPIs
  const kpis: AdminKpis = {
    totalBuildings: buildings.length,
    totalSyndics: syndicMemberships.size,
    totalResidents,
    activeResidents,
    totalIncidents: incidents.length,
    openIncidents: totalOpenIncidents,
    totalPosts: posts.length,
    totalChargesEmitted: totalEmitted,
    totalChargesPaid: totalPaid,
    newBuildingsThisMonth: recentBuildingsRes.data?.length ?? 0,
    newResidentsThisMonth: recentMembershipsRes.data?.length ?? 0,
  };

  // Recent activity (mix of recent incidents, posts, buildings)
  const recentActivity: RecentActivity[] = [];

  for (const b of buildings.slice(0, 5)) {
    recentActivity.push({
      type: "building",
      title: `Nouvel immeuble : ${b.name}`,
      detail: `${b.city} · ${b.lots_count} lots`,
      date: b.created_at,
    });
  }
  for (const inc of incidents.slice(0, 10)) {
    recentActivity.push({
      type: "incident",
      title: inc.title,
      detail: `${inc.category} · ${inc.status}`,
      date: inc.created_at,
    });
  }
  for (const p of posts.slice(0, 10)) {
    recentActivity.push({
      type: "post",
      title: p.title || p.body?.slice(0, 50) || "Post",
      detail: `par ${p.author_name} · ${p.type}`,
      date: p.created_at,
    });
  }

  recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { kpis, buildings: adminBuildings, syndics: adminSyndics, recentActivity: recentActivity.slice(0, 20) };
}
