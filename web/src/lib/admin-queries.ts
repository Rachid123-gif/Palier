import { supabaseAdmin } from "./supabase-server";

export interface AdminBuilding {
  id: string;
  name: string;
  city: string;
  lots: number;
  syndicName: string;
  createdAt: string;
  residentsCount: number;
}

export interface AdminSyndic {
  profileId: string;
  name: string;
  buildings: { id: string; name: string; city: string }[];
  createdAt: string;
}

export interface AdminKpis {
  totalBuildings: number;
  totalSyndics: number;
  activeResidents: number;
  totalPosts: number;
  newBuildingsThisMonth: number;
  newResidentsThisMonth: number;
  pendingRequests: number;
  unreadFeedback: number;
}

export interface AdminData {
  kpis: AdminKpis;
  buildings: AdminBuilding[];
  syndics: AdminSyndic[];
}

export async function fetchAdminData(): Promise<AdminData> {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    buildingsRes,
    membershipsRes,
    postsCountRes,
    recentBuildingsRes,
    recentMembershipsRes,
    pendingRequestsRes,
    unreadFeedbackRes,
  ] = await Promise.all([
    supabaseAdmin.from("buildings").select("id, name, city, lots_count, syndic_name, created_at").order("created_at", { ascending: false }),
    supabaseAdmin.from("memberships").select("profile_id, building_id, role, status, created_at"),
    supabaseAdmin.from("posts").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("buildings").select("id").gte("created_at", firstOfMonth),
    supabaseAdmin.from("memberships").select("id, role").in("role", ["resident", "owner", "tenant"]).gte("created_at", firstOfMonth),
    supabaseAdmin.from("registration_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabaseAdmin.from("feedback").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const buildings = buildingsRes.data ?? [];
  const memberships = membershipsRes.data ?? [];

  // Count residents per building + syndic memberships
  const residentsPerBuilding = new Map<string, number>();
  const syndicMemberships = new Map<string, string[]>();
  for (const m of memberships) {
    if (m.role !== "syndic" && m.status === "active") {
      residentsPerBuilding.set(m.building_id, (residentsPerBuilding.get(m.building_id) ?? 0) + 1);
    }
    if (m.role === "syndic" && m.status === "active") {
      const list = syndicMemberships.get(m.profile_id) ?? [];
      list.push(m.building_id);
      syndicMemberships.set(m.profile_id, list);
    }
  }

  // Build admin buildings list
  const adminBuildings: AdminBuilding[] = buildings.map((b) => ({
    id: b.id,
    name: b.name,
    city: b.city ?? "",
    lots: b.lots_count ?? 0,
    syndicName: b.syndic_name ?? "",
    createdAt: b.created_at,
    residentsCount: residentsPerBuilding.get(b.id) ?? 0,
  }));

  // Build syndics list (name only, no phone)
  const buildingMap = new Map(buildings.map((b) => [b.id, { id: b.id, name: b.name, city: b.city ?? "" }]));
  const syndicProfileIds = [...syndicMemberships.keys()];
  const adminSyndics: AdminSyndic[] = [];
  if (syndicProfileIds.length > 0) {
    const { data: syndicProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, created_at")
      .in("id", syndicProfileIds);
    const profileMap = new Map((syndicProfiles ?? []).map((p) => [p.id, p]));
    for (const [profileId, buildingIds] of syndicMemberships) {
      const p = profileMap.get(profileId);
      if (!p) continue;
      adminSyndics.push({
        profileId,
        name: p.full_name ?? "",
        buildings: buildingIds.map((bid) => buildingMap.get(bid) ?? { id: bid, name: "—", city: "" }),
        createdAt: p.created_at,
      });
    }
  }

  const activeResidents = memberships.filter((m) => m.role !== "syndic" && m.status === "active").length;

  const kpis: AdminKpis = {
    totalBuildings: buildings.length,
    totalSyndics: syndicMemberships.size,
    activeResidents,
    totalPosts: postsCountRes.count ?? 0,
    newBuildingsThisMonth: recentBuildingsRes.data?.length ?? 0,
    newResidentsThisMonth: recentMembershipsRes.data?.length ?? 0,
    pendingRequests: pendingRequestsRes.count ?? 0,
    unreadFeedback: unreadFeedbackRes.count ?? 0,
  };

  return { kpis, buildings: adminBuildings, syndics: adminSyndics };
}
