"use server";

import { supabaseAdmin } from "./supabase-server";
import { getSession } from "./auth";
import type { Comment, IncidentComment } from "./types";
import type { SessionData } from "./session";
import {
  createIncidentSchema,
  createPostSchema,
  createBookingSchema,
  createServiceRequestSchema,
  createLedgerEntrySchema,
  updateLedgerEntrySchema,
  sendRelanceSchema,
  createCommentSchema,
  createIncidentCommentSchema,
  addResidentSchema,
  updateResidentSchema,
  emitChargesSchema,
  createAssemblySchema,
  updateAssemblySchema,
  createResolutionSchema,
  updateResolutionResultSchema,
  createBudgetSchema,
  addBudgetLineSchema,
  createInsurancePolicySchema,
  createMandateSchema,
  createUrgentWorkSchema,
  upsertCoproprieteRuleSchema,
  castVoteSchema,
  updateTantiemesSchema,
  updateInsurancePolicySchema,
  updateMandateSchema,
  updateBudgetLineSchema,
  saveBuildingSettingsSchema,
} from "./schemas";

/* ═══════════════════════════════════════════════════════════════
   HELPERS — validate + authorize
   ═══════════════════════════════════════════════════════════════ */
function validate<T>(schema: { parse: (data: unknown) => T }, data: unknown): T {
  return schema.parse(data);
}

/**
 * Require an authenticated session. Optionally enforce role and/or buildingId.
 * Throws if unauthorized — server action returns error to client.
 */
async function requireAuth(opts?: {
  role?: "syndic" | "resident";
  buildingId?: string;
}): Promise<SessionData> {
  const session = await getSession();
  if (!session) throw new Error("unauthorized");
  if (opts?.role && session.role !== opts.role) throw new Error("forbidden");
  if (opts?.buildingId && session.buildingId !== opts.buildingId) throw new Error("forbidden_building");
  return session;
}

/* ═══════════════════════════════════════════════════════════════
   RÉSIDENT — Actions
   ═══════════════════════════════════════════════════════════════ */

export async function createIncident(input: {
  buildingId: string;
  unitId: string;
  category: string;
  title: string;
  details: string;
  urgency: "low" | "normal" | "urgent";
  reporter: string;
  imageUrl?: string;
}) {
  await requireAuth({ buildingId: input.buildingId });
  const v = validate(createIncidentSchema, input);
  return supabaseAdmin.from("incidents").insert({
    building_id: v.buildingId,
    unit_id: v.unitId,
    reporter_name: v.reporter,
    category: v.category,
    title: v.title,
    details: v.details,
    urgency: v.urgency,
    status: "open",
    image_url: v.imageUrl ?? null,
  });
}

export async function createPost(input: {
  buildingId: string;
  author: string;
  avatarColor: string;
  body: string;
  type?: "announcement" | "event" | "help" | "found" | "general" | "service" | "recommendation";
  title?: string;
  category?: string;
  providerName?: string;
  providerPhone?: string;
  imageUrl?: string;
}) {
  await requireAuth({ buildingId: input.buildingId });
  const v = validate(createPostSchema, input);
  return supabaseAdmin.from("posts").insert({
    building_id: v.buildingId,
    author_name: v.author,
    avatar_color: v.avatarColor,
    role: "resident",
    type: v.type ?? "general",
    body: v.body,
    title: v.title ?? null,
    category: v.category ?? null,
    provider_name: v.providerName ?? null,
    provider_phone: v.providerPhone ?? null,
    image_url: v.imageUrl ?? null,
  });
}

export async function createBooking(input: {
  providerId: string;
  profileId: string;
  buildingId: string;
  categorySlug: string;
  whenType: "now" | "today" | "scheduled";
  priceEstimate: number;
}) {
  const session = await requireAuth({ buildingId: input.buildingId });
  if (session.profileId !== input.profileId) throw new Error("forbidden");
  const v = validate(createBookingSchema, input);
  return supabaseAdmin.from("bookings").insert({
    provider_id: v.providerId,
    profile_id: v.profileId,
    building_id: v.buildingId,
    category_slug: v.categorySlug,
    when_type: v.whenType,
    price_estimate: v.priceEstimate,
    channel: "whatsapp",
    status: "sent",
  });
}

export async function createServiceRequest(input: {
  profileId: string;
  categorySlug: string;
  citySlug: string;
  details?: string;
}) {
  const session = await requireAuth();
  if (session.profileId !== input.profileId) throw new Error("forbidden");
  const v = validate(createServiceRequestSchema, input);
  return supabaseAdmin.from("service_requests").insert({
    profile_id: v.profileId,
    category_slug: v.categorySlug,
    city_slug: v.citySlug,
    details: v.details ?? null,
    status: "pending",
  });
}

export async function createLedgerEntry(input: {
  buildingId: string;
  type: "in" | "out";
  label: string;
  amount: number;
  category: string;
  date: string;
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  const v = validate(createLedgerEntrySchema, input);
  return supabaseAdmin.from("ledger_entries").insert({
    building_id: v.buildingId,
    type: v.type,
    label: v.label,
    amount: v.amount,
    category: v.category,
    entry_date: v.date,
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
  const session = await requireAuth({ role: "syndic" });
  const v = validate(updateLedgerEntrySchema, input);
  return supabaseAdmin.from("ledger_entries").update({
    type: v.type,
    label: v.label,
    amount: v.amount,
    category: v.category,
    entry_date: v.date,
  }).eq("id", id).eq("building_id", session.buildingId);
}

export async function deleteLedgerEntry(id: string) {
  const session = await requireAuth({ role: "syndic" });
  return supabaseAdmin.from("ledger_entries").delete().eq("id", id).eq("building_id", session.buildingId);
}

export async function logDunning(input: {
  buildingId: string;
  unitId: string;
  channel: "push" | "sms" | "whatsapp" | "app";
  message: string;
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  return supabaseAdmin.from("dunning_logs").insert({
    building_id: input.buildingId,
    unit_id: input.unitId,
    channel: input.channel,
    message: input.message,
  });
}

/** Envoyer une relance in-app (notification + dunning log) */
export async function sendRelance(input: {
  buildingId: string;
  unitId: string;
  profileId: string;
  title: string;
  body: string;
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  const v = validate(sendRelanceSchema, input);
  const [notifRes, dunningRes] = await Promise.all([
    supabaseAdmin.from("notifications").insert({
      profile_id: v.profileId,
      title: v.title,
      body: v.body,
      kind: "charge",
    }),
    supabaseAdmin.from("dunning_logs").insert({
      building_id: v.buildingId,
      unit_id: v.unitId,
      channel: "app",
      message: v.body,
    }),
  ]);

  // Trigger push notification
  await triggerPush([v.profileId], v.title, v.body);

  return { notifError: notifRes.error, dunningError: dunningRes.error };
}

export async function createComment(input: {
  postId: string;
  author: string;
  avatarColor: string;
  body: string;
}) {
  const session = await requireAuth();
  const v = validate(createCommentSchema, input);
  // Verify post belongs to user's building
  const { data: post } = await supabaseAdmin.from("posts").select("id").eq("id", v.postId).eq("building_id", session.buildingId).single();
  if (!post) throw new Error("forbidden_building");
  const { error } = await supabaseAdmin.from("post_comments").insert({
    post_id: v.postId,
    author_name: v.author,
    avatar_color: v.avatarColor,
    body: v.body,
  });
  if (!error) {
    await supabaseAdmin.rpc("increment_comments_count", { post_id_input: v.postId });
  }
  return { error };
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  await requireAuth();
  const { data } = await supabaseAdmin
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
  const session = await requireAuth();
  // Verify comment's post belongs to user's building
  const { data: comment } = await supabaseAdmin.from("post_comments").select("post_id").eq("id", commentId).single();
  if (comment) {
    const { data: post } = await supabaseAdmin.from("posts").select("id").eq("id", comment.post_id).eq("building_id", session.buildingId).single();
    if (!post) throw new Error("forbidden_building");
  }
  return supabaseAdmin.rpc("increment_comment_likes", { comment_id_input: commentId });
}

export async function likePost(postId: string) {
  const session = await requireAuth();
  // Verify post belongs to user's building
  const { data: post } = await supabaseAdmin.from("posts").select("id").eq("id", postId).eq("building_id", session.buildingId).single();
  if (!post) throw new Error("forbidden_building");
  return supabaseAdmin.rpc("increment_like_count", { post_id_input: postId });
}

export async function recordPayment(profileId: string, items: { id: string; amount: number }[], method: string) {
  const session = await requireAuth();
  if (session.profileId !== profileId) throw new Error("forbidden");
  // Verify all charges belong to a unit in the resident's building
  for (const item of items) {
    const { data: charge } = await supabaseAdmin
      .from("charges")
      .select("id, unit_id")
      .eq("id", item.id)
      .eq("building_id", session.buildingId)
      .single();
    if (!charge) throw new Error("forbidden_charge");
  }
  await supabaseAdmin.from("payments").insert(
    items.map((c) => ({ charge_id: c.id, profile_id: profileId, amount: c.amount, method, status: "paid" })),
  );
  await Promise.all(
    items.map((c) => supabaseAdmin.from("charges").update({ status: "paid", paid: c.amount }).eq("id", c.id).eq("building_id", session.buildingId)),
  );
}

/* ═══════════════════════════════════════════════════════════════
   SYNDIC — Actions backoffice
   ═══════════════════════════════════════════════════════════════ */

/** Générer un code d'accès résident (crée un profil + membership pour que le code soit utilisable) */
export async function generateAccessCode(input: {
  buildingId: string;
  phone?: string;
  label?: string;
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });

  // Create a minimal profile so the code is linked
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .insert({ full_name: input.label || "Résident", phone: input.phone ?? "" })
    .select("id")
    .single();
  if (!profile) return { data: null, error: "profile_creation_failed", code: "" };

  // Create membership
  await supabaseAdmin.from("memberships").insert({
    profile_id: profile.id,
    building_id: input.buildingId,
    role: "resident",
    status: "active",
  });

  // Generate and link the code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = "RES-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const { data, error } = await supabaseAdmin.from("access_codes").insert({
    building_id: input.buildingId,
    code,
    role: "resident",
    label: input.label ?? null,
    used_by: profile.id,
  }).select().single();
  return { data, error, code };
}

/** Lister les codes d'accès d'un bâtiment */
export async function listAccessCodes(buildingId: string) {
  await requireAuth({ role: "syndic", buildingId });
  const { data } = await supabaseAdmin
    .from("access_codes")
    .select("*")
    .eq("building_id", buildingId)
    .eq("role", "resident")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Supprimer un code non utilisé */
export async function deleteAccessCode(codeId: string) {
  const session = await requireAuth({ role: "syndic" });
  return supabaseAdmin.from("access_codes").delete().eq("id", codeId).eq("building_id", session.buildingId).is("used_at", null);
}

/** Ajouter un résident + générer un code d'accès automatique */
export async function addResident(input: {
  buildingId: string;
  name: string;
  phone: string;
  unit: string;
  role: "owner" | "tenant";
}): Promise<{ error?: string; code?: string }> {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  const v = validate(addResidentSchema, input);

  const { data: unit } = await supabaseAdmin
    .from("units")
    .select("id")
    .eq("building_id", v.buildingId)
    .eq("ref", v.unit.toUpperCase())
    .single();

  if (!unit) return { error: "unit_not_found" };

  const colors = ["#2c7766", "#2f74c0", "#d9961f", "#d6453f", "#8a9a4e", "#c5604f", "#45937e"];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .insert({
      full_name: v.name,
      phone: v.phone,
      avatar_color: avatarColor,
      city: "casablanca",
    })
    .select()
    .single();

  if (profileErr || !profile) return { error: "profile_error" };

  const { error: memberErr } = await supabaseAdmin
    .from("memberships")
    .insert({
      building_id: v.buildingId,
      profile_id: profile.id,
      unit_id: unit.id,
      role: v.role,
    });

  if (memberErr) return { error: "membership_error" };

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = "RES-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  await supabaseAdmin.from("access_codes").insert({
    building_id: v.buildingId,
    code,
    role: "resident",
    label: `${v.unit.toUpperCase()} – ${v.name}`,
    used_by: profile.id,
  });

  return { code };
}

/** Régénérer le code d'accès d'un résident (invalide l'ancien) */
export async function regenerateResidentCode(profileId: string): Promise<{ error?: string; code?: string }> {
  const session = await requireAuth({ role: "syndic" });

  // Verify resident belongs to this building
  const { data: membership } = await supabaseAdmin
    .from("memberships")
    .select("unit_id")
    .eq("profile_id", profileId)
    .eq("building_id", session.buildingId)
    .eq("status", "active")
    .single();
  if (!membership) return { error: "not_found" };

  // Get resident name for label
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", profileId)
    .single();

  // Get unit ref
  const { data: unit } = membership.unit_id
    ? await supabaseAdmin.from("units").select("ref").eq("id", membership.unit_id).single()
    : { data: null };

  // Invalidate all existing unused codes for this resident in this building
  await supabaseAdmin
    .from("access_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("building_id", session.buildingId)
    .eq("used_by", profileId)
    .eq("role", "resident")
    .is("used_at", null);

  // Generate new code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = "RES-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  await supabaseAdmin.from("access_codes").insert({
    building_id: session.buildingId,
    code,
    role: "resident",
    label: `${unit?.ref ?? "—"} – ${profile?.full_name ?? "Résident"}`,
    used_by: profileId,
  });

  return { code };
}

/** Marquer un incident comme en cours de traitement */
export async function markIncidentInProgress(incidentId: string) {
  const session = await requireAuth({ role: "syndic" });
  return supabaseAdmin.from("incidents").update({ status: "in_progress" }).eq("id", incidentId).eq("building_id", session.buildingId);
}

/** Résoudre un incident */
export async function resolveIncident(incidentId: string) {
  const session = await requireAuth({ role: "syndic" });
  return supabaseAdmin.from("incidents").update({ status: "resolved" }).eq("id", incidentId).eq("building_id", session.buildingId);
}

/** Émettre un appel de fonds (créer des charges pour tous les lots) */
export async function emitCharges(input: {
  buildingId: string;
  label: string;
  detail: string;
  amount: number;
  category: string;
  dueDate: string;
  distribution?: "flat" | "tantiemes";
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  const v = validate(emitChargesSchema, input);

  const { data: units } = await supabaseAdmin
    .from("units")
    .select("id, ref, tantiemes")
    .eq("building_id", v.buildingId);

  if (!units?.length) return { error: "no_units" };

  const totalTantiemes = units.reduce((s, u: any) => s + (u.tantiemes ?? 0), 0);
  const useTantiemes = v.distribution === "tantiemes" && totalTantiemes > 0;

  const charges = units.map((u: any) => {
    const unitAmount = useTantiemes
      ? Math.round((v.amount * (u.tantiemes ?? 0) / totalTantiemes) * 100) / 100
      : v.amount;
    return {
      building_id: v.buildingId,
      unit_id: u.id,
      label: v.label,
      detail: v.detail,
      period: new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      amount: unitAmount,
      paid: 0,
      due_date: v.dueDate,
      status: "due",
      category: v.category,
    };
  });

  // Send notification to all residents
  const { data: memberships } = await supabaseAdmin
    .from("memberships")
    .select("profile_id")
    .eq("building_id", v.buildingId)
    .eq("status", "active");

  if (memberships?.length) {
    const profileIds = memberships.map((m: any) => m.profile_id).filter(Boolean);
    await notifyProfiles(profileIds, "Nouvel appel de fonds", `${v.label} — Échéance : ${v.dueDate}`, "charge");
  }

  return supabaseAdmin.from("charges").insert(charges);
}

/** Convoquer une AG */
export async function createAssembly(input: {
  buildingId: string;
  date: string;
  time: string;
  place: string;
  agenda: { n: number; t: string; d: string }[];
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  const v = validate(createAssemblySchema, input);
  return supabaseAdmin.from("assemblies").insert({
    building_id: v.buildingId,
    date: v.date,
    time: v.time,
    place: v.place,
    agenda: v.agenda,
    votes: [],
    quorum: 0,
  });
}

/** Mettre à jour les résultats d'une assemblée */
export async function updateAssembly(input: {
  assemblyId: string;
  quorum: number;
  votes: { q: string; pour: number; contre: number; abst: number }[];
  summary?: string;
  pvUrl?: string;
}) {
  const session = await requireAuth({ role: "syndic" });
  const v = validate(updateAssemblySchema, input);
  return supabaseAdmin.from("assemblies").update({
    quorum: v.quorum,
    votes: v.votes,
    summary: v.summary ?? "",
    pv_url: v.pvUrl ?? "",
  }).eq("id", v.assemblyId).eq("building_id", session.buildingId);
}

/** Supprimer une AG */
export async function deleteAssembly(assemblyId: string) {
  const session = await requireAuth({ role: "syndic" });
  return supabaseAdmin.from("assemblies").delete().eq("id", assemblyId).eq("building_id", session.buildingId);
}

/** Notifier tous les résidents d'une AG */
export async function notifyAssembly(input: {
  profileIds: string[];
  date: string;
  place: string;
}) {
  await requireAuth({ role: "syndic" });
  const title = "Assemblée générale convoquée";
  const body = `Assemblée prévue le ${input.date} à ${input.place}. Consultez l'ordre du jour dans votre application.`;
  const notifications = input.profileIds.map((profileId) => ({
    profile_id: profileId,
    title,
    body,
    kind: "ag",
  }));

  // In-app + push
  await supabaseAdmin.from("notifications").insert(notifications);
  await triggerPush(input.profileIds, title, body);
}

/** Charger la configuration du bâtiment */
export async function loadBuildingSettings(buildingId: string) {
  await requireAuth({ buildingId });
  const { data } = await supabaseAdmin
    .from("building_settings")
    .select("*")
    .eq("building_id", buildingId)
    .single();
  return data;
}

/** Sauvegarder la configuration du bâtiment */
export async function saveBuildingSettings(buildingId: string, settings: Record<string, unknown>) {
  await requireAuth({ role: "syndic", buildingId });
  const v = validate(saveBuildingSettingsSchema, settings);
  const { data: existing } = await supabaseAdmin
    .from("building_settings")
    .select("id")
    .eq("building_id", buildingId)
    .single();

  if (existing) {
    return supabaseAdmin.from("building_settings")
      .update({ ...v, updated_at: new Date().toISOString() })
      .eq("building_id", buildingId);
  }
  return supabaseAdmin.from("building_settings").insert({ building_id: buildingId, ...v });
}

/** Modifier les infos d'un résident */
export async function updateResident(input: {
  profileId: string;
  name: string;
  phone: string;
  role: "owner" | "tenant";
  buildingId: string;
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  const v = validate(updateResidentSchema, input);
  await supabaseAdmin.from("profiles").update({ full_name: v.name, phone: v.phone }).eq("id", v.profileId);
  await supabaseAdmin.from("memberships").update({ role: v.role }).eq("profile_id", v.profileId).eq("building_id", v.buildingId);
}

/** Désactiver un résident */
export async function deactivateResident(profileId: string, buildingId: string) {
  await requireAuth({ role: "syndic", buildingId });
  await supabaseAdmin
    .from("memberships")
    .update({ status: "inactive", deactivated_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .eq("building_id", buildingId);
}

/** Réactiver un résident désactivé */
export async function reactivateResident(profileId: string, buildingId: string) {
  await requireAuth({ role: "syndic", buildingId });
  await supabaseAdmin
    .from("memberships")
    .update({ status: "active", deactivated_at: null })
    .eq("profile_id", profileId)
    .eq("building_id", buildingId);
}

/** Récupérer l'historique complet d'un résident pour export */
export async function fetchResidentHistory(profileId: string, buildingId: string) {
  await requireAuth({ role: "syndic", buildingId });
  const { data: memData } = await supabaseAdmin
    .from("memberships")
    .select("unit_id")
    .eq("profile_id", profileId)
    .eq("building_id", buildingId)
    .single();

  const unitId = memData?.unit_id ?? "";

  const [memRes, chargesRes, incRes, postsRes] = await Promise.all([
    supabaseAdmin.from("memberships").select("*, units(ref)").eq("profile_id", profileId).eq("building_id", buildingId).single(),
    supabaseAdmin.from("charges").select("*").eq("unit_id", unitId),
    supabaseAdmin.from("incidents").select("*").eq("reporter_id", profileId).eq("building_id", buildingId).order("created_at", { ascending: false }),
    supabaseAdmin.from("posts").select("*").eq("author_id", profileId).eq("building_id", buildingId).order("created_at", { ascending: false }),
  ]);

  return {
    membership: memRes.data,
    charges: chargesRes.data ?? [],
    incidents: incRes.data ?? [],
    posts: postsRes.data ?? [],
  };
}

/* ═══════════════════════════════════════════════════════════════
   VOISINAGE — Modération syndic
   ═══════════════════════════════════════════════════════════════ */

export async function deletePost(postId: string) {
  const session = await requireAuth({ role: "syndic" });
  return supabaseAdmin.from("posts").delete().eq("id", postId).eq("building_id", session.buildingId);
}

export async function togglePinPost(postId: string, pinned: boolean) {
  const session = await requireAuth({ role: "syndic" });
  return supabaseAdmin.from("posts").update({ pinned }).eq("id", postId).eq("building_id", session.buildingId);
}

/* ═══════════════════════════════════════════════════════════════
   INCIDENTS — Commentaires / discussion
   ═══════════════════════════════════════════════════════════════ */

export async function createIncidentComment(input: {
  incidentId: string;
  author: string;
  avatarColor: string;
  body: string;
  role: "resident" | "syndic";
}) {
  const session = await requireAuth();
  const v = validate(createIncidentCommentSchema, input);
  // Verify incident belongs to user's building
  const { data: incident } = await supabaseAdmin.from("incidents").select("id").eq("id", v.incidentId).eq("building_id", session.buildingId).single();
  if (!incident) throw new Error("forbidden_building");
  const { error } = await supabaseAdmin.from("incident_comments").insert({
    incident_id: v.incidentId,
    author_name: v.author,
    avatar_color: v.avatarColor,
    body: v.body,
    role: v.role,
  });
  if (!error) {
    await supabaseAdmin.rpc("increment_incident_messages", { incident_id_input: v.incidentId });
  }
  return { error };
}

export async function fetchIncidentComments(incidentId: string): Promise<IncidentComment[]> {
  await requireAuth();
  const { data } = await supabaseAdmin
    .from("incident_comments")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    incidentId: r.incident_id as string,
    author: r.author_name as string,
    avatarColor: r.avatar_color as string,
    body: r.body as string,
    role: (r.role as "resident" | "syndic") ?? "resident",
    createdAt: r.created_at as string,
  }));
}

/* ═══════════════════════════════════════════════════════════════
   AG — Votes persistés en DB
   ═══════════════════════════════════════════════════════════════ */

export async function castVote(input: {
  assemblyId: string;
  voteId: string;
  profileId: string;
  choice: string;
}) {
  const session = await requireAuth();
  if (session.profileId !== input.profileId) throw new Error("forbidden");
  const v = validate(castVoteSchema, input);
  return supabaseAdmin.from("assembly_votes").upsert({
    assembly_id: v.assemblyId,
    vote_id: v.voteId,
    profile_id: v.profileId,
    choice: v.choice,
  }, { onConflict: "assembly_id,vote_id,profile_id" });
}

export async function fetchMyVotes(assemblyId: string, profileId: string) {
  const session = await requireAuth();
  if (session.profileId !== profileId) throw new Error("forbidden");
  const { data } = await supabaseAdmin
    .from("assembly_votes")
    .select("vote_id, choice")
    .eq("assembly_id", assemblyId)
    .eq("profile_id", profileId);
  return data ?? [];
}

/* ═══════════════════════════════════════════════════════════════
   TANTIEMES
   ═══════════════════════════════════════════════════════════════ */

export async function updateUnitTantiemes(buildingId: string, updates: { unitId: string; tantiemes: number }[]) {
  await requireAuth({ role: "syndic", buildingId });
  validate(updateTantiemesSchema, { updates });
  await Promise.all(
    updates.map((u) => supabaseAdmin.from("units").update({ tantiemes: u.tantiemes }).eq("id", u.unitId).eq("building_id", buildingId))
  );
}

/* ═══════════════════════════════════════════════════════════════
   RÉSOLUTIONS AG (3 niveaux de majorité)
   ═══════════════════════════════════════════════════════════════ */

export async function createResolution(input: {
  assemblyId: string;
  number: number;
  title: string;
  description?: string;
  majorityType: "simple" | "trois_quarts" | "unanimite";
}) {
  const session = await requireAuth({ role: "syndic" });
  const v = validate(createResolutionSchema, input);
  // Verify assembly belongs to syndic's building
  const { data: ag } = await supabaseAdmin.from("assemblies").select("id").eq("id", v.assemblyId).eq("building_id", session.buildingId).single();
  if (!ag) throw new Error("forbidden_building");
  return supabaseAdmin.from("assembly_resolutions").insert({
    assembly_id: v.assemblyId,
    number: v.number,
    title: v.title,
    description: v.description ?? null,
    majority_type: v.majorityType,
  });
}

export async function updateResolutionResult(resolutionId: string, input: {
  result: "adoptee" | "rejetee" | "reportee";
  pourTantiemes: number;
  contreTantiemes: number;
  abstentionTantiemes: number;
  pourCount: number;
  contreCount: number;
  abstentionCount: number;
}) {
  const session = await requireAuth({ role: "syndic" });
  const v = validate(updateResolutionResultSchema, input);
  // Verify resolution's assembly belongs to syndic's building
  const { data: res } = await supabaseAdmin.from("assembly_resolutions").select("assembly_id").eq("id", resolutionId).single();
  if (res) {
    const { data: ag } = await supabaseAdmin.from("assemblies").select("id").eq("id", res.assembly_id).eq("building_id", session.buildingId).single();
    if (!ag) throw new Error("forbidden_building");
  }
  return supabaseAdmin.from("assembly_resolutions").update({
    result: v.result,
    pour_tantiemes: v.pourTantiemes,
    contre_tantiemes: v.contreTantiemes,
    abstention_tantiemes: v.abstentionTantiemes,
    pour_count: v.pourCount,
    contre_count: v.contreCount,
    abstention_count: v.abstentionCount,
  }).eq("id", resolutionId);
}

export async function deleteResolution(resolutionId: string) {
  const session = await requireAuth({ role: "syndic" });
  // Verify resolution's assembly belongs to syndic's building
  const { data: res } = await supabaseAdmin.from("assembly_resolutions").select("assembly_id").eq("id", resolutionId).single();
  if (res) {
    const { data: ag } = await supabaseAdmin.from("assemblies").select("id").eq("id", res.assembly_id).eq("building_id", session.buildingId).single();
    if (!ag) throw new Error("forbidden_building");
  }
  return supabaseAdmin.from("assembly_resolutions").delete().eq("id", resolutionId);
}

/** Mettre à jour le statut de convocation d'une AG */
export async function markAssemblyConvoked(assemblyId: string) {
  const session = await requireAuth({ role: "syndic" });
  return supabaseAdmin.from("assemblies").update({
    status: "convoquee",
    convocation_sent_at: new Date().toISOString(),
  }).eq("id", assemblyId).eq("building_id", session.buildingId);
}

/** Distribuer le PV aux résidents */
export async function distributePV(assemblyId: string, profileIds: string[], agDate: string) {
  const session = await requireAuth({ role: "syndic" });
  const title = "Procès-verbal disponible";
  const body = `Le PV de l'assemblée du ${agDate} est disponible. Consultez-le dans votre application.`;
  const notifications = profileIds.map((pid) => ({ profile_id: pid, title, body, kind: "ag" }));
  await supabaseAdmin.from("notifications").insert(notifications);
  await triggerPush(profileIds, title, body);
  return supabaseAdmin.from("assemblies").update({
    pv_distributed: true,
    pv_sent_at: new Date().toISOString(),
    status: "pv_distribue",
  }).eq("id", assemblyId).eq("building_id", session.buildingId);
}

/* ═══════════════════════════════════════════════════════════════
   BUDGET PRÉVISIONNEL
   ═══════════════════════════════════════════════════════════════ */

export async function createBudget(input: {
  buildingId: string;
  fiscalYear: number;
  lines: { label: string; category: string; amountBudgeted: number; accountCode?: string }[];
  reserveFundAmount?: number;
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  const v = validate(createBudgetSchema, input);
  const total = v.lines.reduce((s, l) => s + l.amountBudgeted, 0);
  const { data: budget, error } = await supabaseAdmin.from("budgets").insert({
    building_id: v.buildingId,
    fiscal_year: v.fiscalYear,
    total_amount: total + (v.reserveFundAmount ?? 0),
    reserve_fund_amount: v.reserveFundAmount ?? 0,
    status: "draft",
  }).select().single();

  if (error || !budget) return { error: error?.message ?? "budget_error" };

  if (v.lines.length > 0) {
    await supabaseAdmin.from("budget_lines").insert(
      v.lines.map((l) => ({
        budget_id: budget.id,
        label: l.label,
        category: l.category,
        amount_budgeted: l.amountBudgeted,
        account_code: l.accountCode ?? null,
      }))
    );
  }
  return { data: budget };
}

export async function updateBudgetStatus(budgetId: string, status: "draft" | "vote" | "approved" | "closed", assemblyId?: string) {
  const session = await requireAuth({ role: "syndic" });
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "approved") {
    update.approved_at = new Date().toISOString();
    if (assemblyId) update.approved_assembly_id = assemblyId;
  }
  return supabaseAdmin.from("budgets").update(update).eq("id", budgetId).eq("building_id", session.buildingId);
}

export async function addBudgetLine(budgetId: string, input: { label: string; category: string; amountBudgeted: number; accountCode?: string }) {
  const session = await requireAuth({ role: "syndic" });
  // Verify budget belongs to syndic's building
  const { data: budget } = await supabaseAdmin.from("budgets").select("id").eq("id", budgetId).eq("building_id", session.buildingId).single();
  if (!budget) throw new Error("forbidden_building");
  const v = validate(addBudgetLineSchema, input);
  return supabaseAdmin.from("budget_lines").insert({
    budget_id: budgetId,
    label: v.label,
    category: v.category,
    amount_budgeted: v.amountBudgeted,
    account_code: v.accountCode ?? null,
  });
}

export async function updateBudgetLine(lineId: string, input: { label?: string; category?: string; amountBudgeted?: number; amountActual?: number }) {
  const session = await requireAuth({ role: "syndic" });
  const v = validate(updateBudgetLineSchema, input);
  // Verify budget_line's budget belongs to syndic's building
  const { data: line } = await supabaseAdmin.from("budget_lines").select("budget_id").eq("id", lineId).single();
  if (line) {
    const { data: budget } = await supabaseAdmin.from("budgets").select("id").eq("id", line.budget_id).eq("building_id", session.buildingId).single();
    if (!budget) throw new Error("forbidden_building");
  }
  const dbUpdate: Record<string, unknown> = {};
  if (v.label !== undefined) dbUpdate.label = v.label;
  if (v.category !== undefined) dbUpdate.category = v.category;
  if (v.amountBudgeted !== undefined) dbUpdate.amount_budgeted = v.amountBudgeted;
  if (v.amountActual !== undefined) dbUpdate.amount_actual = v.amountActual;
  if (v.accountCode !== undefined) dbUpdate.account_code = v.accountCode;
  return supabaseAdmin.from("budget_lines").update(dbUpdate).eq("id", lineId);
}

export async function deleteBudgetLine(lineId: string) {
  const session = await requireAuth({ role: "syndic" });
  const { data: line } = await supabaseAdmin.from("budget_lines").select("budget_id").eq("id", lineId).single();
  if (line) {
    const { data: budget } = await supabaseAdmin.from("budgets").select("id").eq("id", line.budget_id).eq("building_id", session.buildingId).single();
    if (!budget) throw new Error("forbidden_building");
  }
  return supabaseAdmin.from("budget_lines").delete().eq("id", lineId);
}

export async function deleteBudget(budgetId: string) {
  const session = await requireAuth({ role: "syndic" });
  return supabaseAdmin.from("budgets").delete().eq("id", budgetId).eq("building_id", session.buildingId);
}

/* ═══════════════════════════════════════════════════════════════
   ASSURANCE
   ═══════════════════════════════════════════════════════════════ */

export async function createInsurancePolicy(input: {
  buildingId: string;
  insurer: string;
  policyNumber?: string;
  coverageType?: string;
  premiumAmount: number;
  startDate: string;
  endDate: string;
  renewalAlertDays?: number;
  fileUrl?: string;
  notes?: string;
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  const v = validate(createInsurancePolicySchema, input);
  return supabaseAdmin.from("insurance_policies").insert({
    building_id: v.buildingId,
    insurer: v.insurer,
    policy_number: v.policyNumber ?? null,
    coverage_type: v.coverageType ?? "multirisque",
    premium_amount: v.premiumAmount,
    start_date: v.startDate,
    end_date: v.endDate,
    renewal_alert_days: v.renewalAlertDays ?? 30,
    file_url: v.fileUrl ?? null,
    notes: v.notes ?? null,
  });
}

export async function updateInsurancePolicy(id: string, input: Record<string, unknown>) {
  const session = await requireAuth({ role: "syndic" });
  const v = validate(updateInsurancePolicySchema, input);
  const dbUpdate: Record<string, unknown> = {};
  if (v.insurer !== undefined) dbUpdate.insurer = v.insurer;
  if (v.policyNumber !== undefined) dbUpdate.policy_number = v.policyNumber;
  if (v.coverageType !== undefined) dbUpdate.coverage_type = v.coverageType;
  if (v.premiumAmount !== undefined) dbUpdate.premium_amount = v.premiumAmount;
  if (v.startDate !== undefined) dbUpdate.start_date = v.startDate;
  if (v.endDate !== undefined) dbUpdate.end_date = v.endDate;
  if (v.renewalAlertDays !== undefined) dbUpdate.renewal_alert_days = v.renewalAlertDays;
  if (v.fileUrl !== undefined) dbUpdate.file_url = v.fileUrl;
  if (v.notes !== undefined) dbUpdate.notes = v.notes;
  return supabaseAdmin.from("insurance_policies").update(dbUpdate).eq("id", id).eq("building_id", session.buildingId);
}

export async function deleteInsurancePolicy(id: string) {
  const session = await requireAuth({ role: "syndic" });
  return supabaseAdmin.from("insurance_policies").delete().eq("id", id).eq("building_id", session.buildingId);
}

/* ═══════════════════════════════════════════════════════════════
   MANDAT SYNDIC
   ═══════════════════════════════════════════════════════════════ */

export async function createMandate(input: {
  buildingId: string;
  syndicName: string;
  syndicType: "benevole" | "professionnel";
  deputyName?: string;
  electedAt: string;
  mandateEnd: string;
  remuneration?: number;
  contractUrl?: string;
  assemblyId?: string;
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  const v = validate(createMandateSchema, input);
  return supabaseAdmin.from("syndic_mandates").insert({
    building_id: v.buildingId,
    syndic_name: v.syndicName,
    syndic_type: v.syndicType,
    deputy_name: v.deputyName ?? null,
    elected_at: v.electedAt,
    mandate_end: v.mandateEnd,
    remuneration: v.remuneration ?? null,
    contract_url: v.contractUrl ?? null,
    elected_assembly_id: v.assemblyId ?? null,
  });
}

export async function updateMandate(id: string, input: Record<string, unknown>) {
  const session = await requireAuth({ role: "syndic" });
  const v = validate(updateMandateSchema, input);
  const dbUpdate: Record<string, unknown> = {};
  if (v.syndicName !== undefined) dbUpdate.syndic_name = v.syndicName;
  if (v.syndicType !== undefined) dbUpdate.syndic_type = v.syndicType;
  if (v.deputyName !== undefined) dbUpdate.deputy_name = v.deputyName;
  if (v.electedAt !== undefined) dbUpdate.elected_at = v.electedAt;
  if (v.mandateEnd !== undefined) dbUpdate.mandate_end = v.mandateEnd;
  if (v.remuneration !== undefined) dbUpdate.remuneration = v.remuneration;
  if (v.contractUrl !== undefined) dbUpdate.contract_url = v.contractUrl;
  if (v.assemblyId !== undefined) dbUpdate.elected_assembly_id = v.assemblyId;
  return supabaseAdmin.from("syndic_mandates").update(dbUpdate).eq("id", id).eq("building_id", session.buildingId);
}

export async function deleteMandate(id: string) {
  const session = await requireAuth({ role: "syndic" });
  return supabaseAdmin.from("syndic_mandates").delete().eq("id", id).eq("building_id", session.buildingId);
}

/* ═══════════════════════════════════════════════════════════════
   TRAVAUX URGENTS
   ═══════════════════════════════════════════════════════════════ */

export async function createUrgentWork(input: {
  buildingId: string;
  title: string;
  description?: string;
  estimatedCost?: number;
  justification: string;
  supplier?: string;
  incidentId?: string;
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  const v = validate(createUrgentWorkSchema, input);
  return supabaseAdmin.from("urgent_works").insert({
    building_id: v.buildingId,
    title: v.title,
    description: v.description ?? null,
    estimated_cost: v.estimatedCost ?? null,
    justification: v.justification,
    supplier: v.supplier ?? null,
    incident_id: v.incidentId ?? null,
  });
}

export async function updateUrgentWorkStatus(id: string, status: "declared" | "approved" | "in_progress" | "completed", actualCost?: number) {
  const session = await requireAuth({ role: "syndic" });
  const update: Record<string, unknown> = { status };
  if (status === "completed") update.completed_at = new Date().toISOString();
  if (actualCost !== undefined) update.actual_cost = actualCost;
  return supabaseAdmin.from("urgent_works").update(update).eq("id", id).eq("building_id", session.buildingId);
}

export async function deleteUrgentWork(id: string) {
  const session = await requireAuth({ role: "syndic" });
  return supabaseAdmin.from("urgent_works").delete().eq("id", id).eq("building_id", session.buildingId);
}

/* ═══════════════════════════════════════════════════════════════
   RÈGLEMENT DE COPROPRIÉTÉ
   ═══════════════════════════════════════════════════════════════ */

export async function upsertCoproprieteRule(input: {
  buildingId: string;
  title?: string;
  fileUrl?: string;
  annexes?: { title: string; url: string; type: string }[];
  adoptedAt?: string;
  notes?: string;
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  const v = validate(upsertCoproprieteRuleSchema, input);
  return supabaseAdmin.from("copropriete_rules").upsert({
    building_id: v.buildingId,
    title: v.title ?? "Règlement de copropriété",
    file_url: v.fileUrl ?? null,
    annexes: v.annexes ?? [],
    adopted_at: v.adoptedAt ?? null,
    notes: v.notes ?? null,
    last_modified_at: new Date().toISOString().slice(0, 10),
  }, { onConflict: "building_id" });
}

/* ═══════════════════════════════════════════════════════════════
   RELANCE — In-app + Push (no external APIs)
   ═══════════════════════════════════════════════════════════════ */

/** Send dunning relance via in-app notification + push */
export async function sendDunningRelance(input: {
  buildingId: string;
  unitId: string;
  profileId: string | null;
  title: string;
  body: string;
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  // Log dunning
  await supabaseAdmin.from("dunning_logs").insert({
    building_id: input.buildingId,
    unit_id: input.unitId,
    channel: "app",
    message: input.body,
  });

  // Send in-app notification + push
  if (input.profileId) {
    await supabaseAdmin.from("notifications").insert({
      profile_id: input.profileId,
      title: input.title,
      body: input.body,
      kind: "charge",
    });
    await triggerPush([input.profileId], input.title, input.body);
  }
}

/* ═══════════════════════════════════════════════════════════════
   DOCUMENTS — CRUD (called from syndic DocumentsView & AgView)
   ═══════════════════════════════════════════════════════════════ */

export async function insertDocument(input: {
  buildingId: string;
  title: string;
  docType: string;
  docDate: string;
  size: string;
  url: string;
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  const { data, error } = await supabaseAdmin.from("documents").insert({
    building_id: input.buildingId,
    title: input.title,
    doc_type: input.docType,
    doc_date: input.docDate,
    size: input.size,
    url: input.url,
  }).select().single();
  if (error) throw new Error("insert_document_failed");
  return data;
}

export async function deleteDocument(id: string, buildingId: string) {
  await requireAuth({ role: "syndic", buildingId });
  const { error } = await supabaseAdmin.from("documents").delete().eq("id", id).eq("building_id", buildingId);
  if (error) throw new Error("delete_document_failed");
}

export async function upsertDocument(input: {
  buildingId: string;
  title: string;
  docType: string;
  docDate: string;
  size: string;
  url: string;
  refId: string;
}) {
  await requireAuth({ role: "syndic", buildingId: input.buildingId });
  const { error } = await supabaseAdmin.from("documents").upsert({
    building_id: input.buildingId,
    title: input.title,
    doc_type: input.docType,
    doc_date: input.docDate,
    size: input.size,
    url: input.url,
    ref_id: input.refId,
  }, { onConflict: "ref_id" });
  if (error) throw new Error("upsert_document_failed");
}

/* ═══════════════════════════════════════════════════════════════
   FEEDBACK — Submit (called from FeedbackCard & SettingsView)
   ═══════════════════════════════════════════════════════════════ */

export async function submitFeedback(input: {
  buildingId: string;
  type: string;
  message: string;
  senderName: string;
  senderPhone?: string | null;
  senderEmail?: string | null;
  contactPreference: string;
  buildingName: string;
  senderRole?: string;
}) {
  await requireAuth({ buildingId: input.buildingId });
  const { error } = await supabaseAdmin.from("feedback").insert({
    building_id: input.buildingId,
    type: input.type,
    message: input.message,
    sender_name: input.senderName,
    sender_phone: input.senderPhone ?? null,
    sender_email: input.senderEmail ?? null,
    contact_preference: input.contactPreference,
    building_name: input.buildingName,
    sender_role: input.senderRole ?? "syndic",
  });
  if (error) throw new Error("submit_feedback_failed");
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS — Internal helpers (not exported)
   ═══════════════════════════════════════════════════════════════ */

/** Create in-app notifications for multiple profiles */
async function notifyProfiles(profileIds: string[], title: string, body: string, kind: string) {
  if (!profileIds.length) return;
  const notifications = profileIds.map((pid) => ({
    profile_id: pid,
    title,
    body,
    kind,
  }));
  await supabaseAdmin.from("notifications").insert(notifications);
  await triggerPush(profileIds, title, body);
}

/** Trigger push notifications (best-effort, never throws) */
async function triggerPush(profileIds: string[], title: string, body: string) {
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    await fetch(`${origin}/api/push/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
      },
      body: JSON.stringify({ profileIds, title, body }),
    });
  } catch {
    // Push is best-effort, don't fail the action
  }
}
