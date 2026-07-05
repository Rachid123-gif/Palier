import { supabase, DEMO_BUILDING_ID, DEMO_PROFILE_ID, DEMO_UNIT_ID } from "./supabase";
import type { Urgency, Comment } from "./types";

/** Écritures résident → Supabase (le backoffice syndic les exploite). */

export async function createIncident(input: {
  category: string;
  title: string;
  details: string;
  urgency: Urgency;
  reporter: string;
}) {
  return supabase.from("incidents").insert({
    building_id: DEMO_BUILDING_ID,
    unit_id: DEMO_UNIT_ID,
    reporter_name: input.reporter,
    category: input.category,
    title: input.title,
    details: input.details,
    urgency: input.urgency,
    status: "open",
  });
}

export async function createPost(input: {
  author: string;
  avatarColor: string;
  body: string;
  type?: "announcement" | "event" | "help" | "found" | "general";
}) {
  return supabase.from("posts").insert({
    building_id: DEMO_BUILDING_ID,
    author_name: input.author,
    avatar_color: input.avatarColor,
    role: "resident",
    type: input.type ?? "general",
    body: input.body,
  });
}

export async function createBooking(input: {
  providerId: string;
  categorySlug: string;
  whenType: "now" | "today" | "scheduled";
  priceEstimate: number;
}) {
  return supabase.from("bookings").insert({
    provider_id: input.providerId,
    profile_id: DEMO_PROFILE_ID,
    building_id: DEMO_BUILDING_ID,
    category_slug: input.categorySlug,
    when_type: input.whenType,
    price_estimate: input.priceEstimate,
    channel: "whatsapp",
    status: "sent",
  });
}

export async function createServiceRequest(input: {
  categorySlug: string;
  citySlug: string;
  details?: string;
}) {
  return supabase.from("service_requests").insert({
    profile_id: DEMO_PROFILE_ID,
    category_slug: input.categorySlug,
    city_slug: input.citySlug,
    details: input.details ?? null,
    status: "pending",
  });
}

export async function createLedgerEntry(input: {
  type: "in" | "out";
  label: string;
  amount: number;
  category: string;
  date: string;
}) {
  return supabase.from("ledger_entries").insert({
    building_id: DEMO_BUILDING_ID,
    type: input.type,
    label: input.label,
    amount: input.amount,
    category: input.category,
    entry_date: input.date,
    signed: true,
  });
}

export async function updateLedgerEntry(id: string, input: {
  type: "in" | "out";
  label: string;
  amount: number;
  category: string;
  date: string;
}) {
  return supabase.from("ledger_entries").update({
    type: input.type,
    label: input.label,
    amount: input.amount,
    category: input.category,
    entry_date: input.date,
  }).eq("id", id);
}

export async function deleteLedgerEntry(id: string) {
  return supabase.from("ledger_entries").delete().eq("id", id);
}

export async function logDunning(input: {
  unitId: string;
  channel: "push" | "sms" | "whatsapp" | "app";
  message: string;
}) {
  return supabase.from("dunning_logs").insert({
    building_id: DEMO_BUILDING_ID,
    unit_id: input.unitId,
    channel: input.channel,
    message: input.message,
  });
}

/** Envoyer une relance in-app (notification + dunning log) */
export async function sendRelance(input: {
  unitId: string;
  profileId: string;
  title: string;
  body: string;
}) {
  const [notifRes, dunningRes] = await Promise.all([
    supabase.from("notifications").insert({
      profile_id: input.profileId,
      title: input.title,
      body: input.body,
      kind: "charge",
    }),
    supabase.from("dunning_logs").insert({
      building_id: DEMO_BUILDING_ID,
      unit_id: input.unitId,
      channel: "app",
      message: input.body,
    }),
  ]);
  return { notifError: notifRes.error, dunningError: dunningRes.error };
}

export async function createComment(input: {
  postId: string;
  author: string;
  avatarColor: string;
  body: string;
}) {
  const { error } = await supabase.from("post_comments").insert({
    post_id: input.postId,
    author_name: input.author,
    avatar_color: input.avatarColor,
    body: input.body,
  });
  if (!error) {
    // Incrémenter le compteur de commentaires sur le post
    await supabase.rpc("increment_comments_count", { post_id_input: input.postId });
  }
  return { error };
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    postId: r.post_id as string,
    author: r.author_name as string,
    avatarColor: r.avatar_color as string,
    body: r.body as string,
    likes: (r.likes as number) ?? 0,
    createdAt: r.created_at as string,
  }));
}

export async function likeComment(commentId: string) {
  return supabase.rpc("increment_comment_likes", { comment_id_input: commentId });
}

export async function recordPayment(items: { id: string; amount: number }[], method: string) {
  await supabase.from("payments").insert(
    items.map((c) => ({ charge_id: c.id, profile_id: DEMO_PROFILE_ID, amount: c.amount, method, status: "paid" })),
  );
  await Promise.all(
    items.map((c) => supabase.from("charges").update({ status: "paid", paid: c.amount }).eq("id", c.id)),
  );
}

/* ═══════════════════════════════════════════════════════════════
   SYNDIC — Actions backoffice
   ═══════════════════════════════════════════════════════════════ */

/** Générer un code d'accès résident */
export async function generateAccessCode(input: {
  buildingId: string;
  label?: string;
}) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = "RES-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const { data, error } = await supabase.from("access_codes").insert({
    building_id: input.buildingId,
    code,
    role: "resident",
    label: input.label ?? null,
  }).select().single();
  return { data, error, code };
}

/** Lister les codes d'accès d'un bâtiment */
export async function listAccessCodes(buildingId: string) {
  const { data } = await supabase
    .from("access_codes")
    .select("*")
    .eq("building_id", buildingId)
    .eq("role", "resident")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Valider un code d'accès (onboarding) */
export async function validateAccessCode(code: string, selectedRole: "resident" | "syndic") {
  const { data } = await supabase
    .from("access_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (!data) return { valid: false, error: "code_not_found" as const };
  if (data.used_at) return { valid: false, error: "code_already_used" as const };
  if (data.role !== selectedRole) return { valid: false, error: "wrong_role" as const, expectedRole: data.role };

  // Marquer comme utilisé
  await supabase
    .from("access_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { valid: true, buildingId: data.building_id, role: data.role };
}

/** Supprimer un code non utilisé */
export async function deleteAccessCode(codeId: string) {
  return supabase.from("access_codes").delete().eq("id", codeId).is("used_at", null);
}

/** Ajouter un résident + générer un code d'accès automatique */
export async function addResident(input: {
  buildingId: string;
  name: string;
  phone: string;
  unit: string;
  role: "owner" | "tenant";
}): Promise<{ error?: string; code?: string }> {
  // 1. Find the unit by ref
  const { data: unit } = await supabase
    .from("units")
    .select("id")
    .eq("building_id", input.buildingId)
    .eq("ref", input.unit.trim().toUpperCase())
    .single();

  if (!unit) return { error: "unit_not_found" };

  // 2. Random avatar color
  const colors = ["#2c7766", "#2f74c0", "#d9961f", "#d6453f", "#8a9a4e", "#c5604f", "#45937e"];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  // 3. Create profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .insert({
      full_name: input.name,
      phone: input.phone,
      avatar_color: avatarColor,
      city: "casablanca",
    })
    .select()
    .single();

  if (profileErr || !profile) return { error: "profile_error" };

  // 4. Create membership
  const { error: memberErr } = await supabase
    .from("memberships")
    .insert({
      building_id: input.buildingId,
      profile_id: profile.id,
      unit_id: unit.id,
      role: input.role,
    });

  if (memberErr) return { error: "membership_error" };

  // 5. Auto-generate unique access code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = "RES-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  await supabase.from("access_codes").insert({
    building_id: input.buildingId,
    code,
    role: "resident",
    label: `${input.unit.trim().toUpperCase()} – ${input.name}`,
  });

  return { code };
}

/** Résoudre un incident */
export async function resolveIncident(incidentId: string) {
  return supabase.from("incidents").update({ status: "resolved" }).eq("id", incidentId);
}


/** Émettre un appel de fonds (créer des charges pour tous les lots) */
export async function emitCharges(input: {
  buildingId: string;
  label: string;
  detail: string;
  amount: number;
  category: string;
  dueDate: string;
}) {
  const { data: units } = await supabase
    .from("units")
    .select("id, ref")
    .eq("building_id", input.buildingId);

  if (!units?.length) return { error: "no_units" };

  const charges = units.map((u) => ({
    building_id: input.buildingId,
    unit_id: u.id,
    label: input.label,
    detail: input.detail,
    period: new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    amount: input.amount,
    paid: 0,
    due_date: input.dueDate,
    status: "due",
    category: input.category,
  }));

  return supabase.from("charges").insert(charges);
}

/** Convoquer une AG */
export async function createAssembly(input: {
  buildingId: string;
  date: string;
  time: string;
  place: string;
  agenda: { n: number; t: string; d: string }[];
}) {
  return supabase.from("assemblies").insert({
    building_id: input.buildingId,
    date: input.date,
    time: input.time,
    place: input.place,
    agenda: input.agenda,
    votes: [],
    quorum: 0,
  });
}

/** Charger la configuration du bâtiment */
export async function loadBuildingSettings(buildingId: string) {
  const { data } = await supabase
    .from("building_settings")
    .select("*")
    .eq("building_id", buildingId)
    .single();
  return data;
}

/** Sauvegarder la configuration du bâtiment */
export async function saveBuildingSettings(buildingId: string, settings: {
  enabled_categories?: string[];
  features?: Record<string, boolean>;
  syndic_phone?: string;
  syndic_email?: string;
  welcome_message?: string;
}) {
  const { data: existing } = await supabase
    .from("building_settings")
    .select("id")
    .eq("building_id", buildingId)
    .single();

  if (existing) {
    return supabase.from("building_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("building_id", buildingId);
  }
  return supabase.from("building_settings").insert({ building_id: buildingId, ...settings });
}

/** Modifier les infos d'un résident */
export async function updateResident(input: {
  profileId: string;
  name: string;
  phone: string;
  role: "owner" | "tenant";
  buildingId: string;
}) {
  await supabase.from("profiles").update({ full_name: input.name, phone: input.phone }).eq("id", input.profileId);
  await supabase.from("memberships").update({ role: input.role }).eq("profile_id", input.profileId).eq("building_id", input.buildingId);
}

/** Désactiver un résident (ne supprime rien, met le membership en "inactive") */
export async function deactivateResident(profileId: string, buildingId: string) {
  await supabase
    .from("memberships")
    .update({ status: "inactive", deactivated_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .eq("building_id", buildingId);
}

/** Réactiver un résident désactivé */
export async function reactivateResident(profileId: string, buildingId: string) {
  await supabase
    .from("memberships")
    .update({ status: "active", deactivated_at: null })
    .eq("profile_id", profileId)
    .eq("building_id", buildingId);
}

/** Récupérer l'historique complet d'un résident pour export */
export async function fetchResidentHistory(profileId: string, buildingId: string) {
  const [memRes, chargesRes, incRes, postsRes] = await Promise.all([
    supabase.from("memberships").select("*, units(ref)").eq("profile_id", profileId).eq("building_id", buildingId).single(),
    supabase.from("charges").select("*").eq("unit_id", (await supabase.from("memberships").select("unit_id").eq("profile_id", profileId).eq("building_id", buildingId).single()).data?.unit_id ?? ""),
    supabase.from("incidents").select("*").eq("reporter_id", profileId).eq("building_id", buildingId).order("created_at", { ascending: false }),
    supabase.from("posts").select("*").eq("author_id", profileId).eq("building_id", buildingId).order("created_at", { ascending: false }),
  ]);

  return {
    membership: memRes.data,
    charges: chargesRes.data ?? [],
    incidents: incRes.data ?? [],
    posts: postsRes.data ?? [],
  };
}
