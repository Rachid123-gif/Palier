import { supabase } from "./supabase";
import type { Urgency, Comment } from "./types";

/** Écritures résident → Supabase (le backoffice syndic les exploite). */

export async function createIncident(input: {
  buildingId: string;
  unitId: string;
  category: string;
  title: string;
  details: string;
  urgency: Urgency;
  reporter: string;
  imageUrl?: string;
}) {
  return supabase.from("incidents").insert({
    building_id: input.buildingId,
    unit_id: input.unitId,
    reporter_name: input.reporter,
    category: input.category,
    title: input.title,
    details: input.details,
    urgency: input.urgency,
    status: "open",
    image_url: input.imageUrl ?? null,
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
  return supabase.from("posts").insert({
    building_id: input.buildingId,
    author_name: input.author,
    avatar_color: input.avatarColor,
    role: "resident",
    type: input.type ?? "general",
    body: input.body,
    title: input.title ?? null,
    category: input.category ?? null,
    provider_name: input.providerName ?? null,
    provider_phone: input.providerPhone ?? null,
    image_url: input.imageUrl ?? null,
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
  return supabase.from("bookings").insert({
    provider_id: input.providerId,
    profile_id: input.profileId,
    building_id: input.buildingId,
    category_slug: input.categorySlug,
    when_type: input.whenType,
    price_estimate: input.priceEstimate,
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
  return supabase.from("service_requests").insert({
    profile_id: input.profileId,
    category_slug: input.categorySlug,
    city_slug: input.citySlug,
    details: input.details ?? null,
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
  return supabase.from("ledger_entries").insert({
    building_id: input.buildingId,
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
  buildingId: string;
  unitId: string;
  channel: "push" | "sms" | "whatsapp" | "app";
  message: string;
}) {
  return supabase.from("dunning_logs").insert({
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
  const [notifRes, dunningRes] = await Promise.all([
    supabase.from("notifications").insert({
      profile_id: input.profileId,
      title: input.title,
      body: input.body,
      kind: "charge",
    }),
    supabase.from("dunning_logs").insert({
      building_id: input.buildingId,
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

export async function likePost(postId: string) {
  return supabase.rpc("increment_like_count", { post_id_input: postId });
}

export async function recordPayment(profileId: string, items: { id: string; amount: number }[], method: string) {
  await supabase.from("payments").insert(
    items.map((c) => ({ charge_id: c.id, profile_id: profileId, amount: c.amount, method, status: "paid" })),
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

  // 5. Auto-generate unique access code linked to profile
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = "RES-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  await supabase.from("access_codes").insert({
    building_id: input.buildingId,
    code,
    role: "resident",
    label: `${input.unit.trim().toUpperCase()} – ${input.name}`,
    used_by: profile.id, // Link code to the profile
  });

  return { code };
}

/** Marquer un incident comme en cours de traitement */
export async function markIncidentInProgress(incidentId: string) {
  return supabase.from("incidents").update({ status: "in_progress" }).eq("id", incidentId);
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
  distribution?: "flat" | "tantiemes";
}) {
  const { data: units } = await supabase
    .from("units")
    .select("id, ref, tantiemes")
    .eq("building_id", input.buildingId);

  if (!units?.length) return { error: "no_units" };

  const totalTantiemes = units.reduce((s, u: any) => s + (u.tantiemes ?? 0), 0);
  const useTantiemes = input.distribution === "tantiemes" && totalTantiemes > 0;

  const charges = units.map((u: any) => {
    const unitAmount = useTantiemes
      ? Math.round((input.amount * (u.tantiemes ?? 0) / totalTantiemes) * 100) / 100
      : input.amount;
    return {
      building_id: input.buildingId,
      unit_id: u.id,
      label: input.label,
      detail: input.detail,
      period: new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      amount: unitAmount,
      paid: 0,
      due_date: input.dueDate,
      status: "due",
      category: input.category,
    };
  });

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

/** Mettre à jour les résultats d'une assemblée (quorum + votes + compte-rendu + PV) */
export async function updateAssembly(input: {
  assemblyId: string;
  quorum: number;
  votes: { q: string; pour: number; contre: number; abst: number }[];
  summary?: string;
  pvUrl?: string;
}) {
  return supabase.from("assemblies").update({
    quorum: input.quorum,
    votes: input.votes,
    summary: input.summary ?? "",
    pv_url: input.pvUrl ?? "",
  }).eq("id", input.assemblyId);
}

/** Supprimer une AG (annuler une convocation) */
export async function deleteAssembly(assemblyId: string) {
  return supabase.from("assemblies").delete().eq("id", assemblyId);
}

/** Notifier tous les résidents d'une AG */
export async function notifyAssembly(input: {
  profileIds: string[];
  date: string;
  place: string;
}) {
  const title = "Assemblée générale convoquée";
  const body = `Assemblée prévue le ${input.date} à ${input.place}. Consultez l'ordre du jour dans votre application.`;
  const notifications = input.profileIds.map((profileId) => ({
    profile_id: profileId,
    title,
    body,
    kind: "ag",
  }));
  return supabase.from("notifications").insert(notifications);
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
export async function saveBuildingSettings(buildingId: string, settings: Record<string, unknown>) {
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

/* ═══════════════════════════════════════════════════════════════
   VOISINAGE — Modération syndic
   ═══════════════════════════════════════════════════════════════ */

/** Supprimer un post (modération syndic) */
export async function deletePost(postId: string) {
  return supabase.from("posts").delete().eq("id", postId);
}

/** Épingler / Désépingler un post */
export async function togglePinPost(postId: string, pinned: boolean) {
  return supabase.from("posts").update({ pinned }).eq("id", postId);
}

/* ═══════════════════════════════════════════════════════════════
   INCIDENTS — Commentaires / discussion
   ═══════════════════════════════════════════════════════════════ */

export interface IncidentComment {
  id: string;
  incidentId: string;
  author: string;
  avatarColor: string;
  body: string;
  role: "resident" | "syndic";
  createdAt: string;
}

export async function createIncidentComment(input: {
  incidentId: string;
  author: string;
  avatarColor: string;
  body: string;
  role: "resident" | "syndic";
}) {
  const { error } = await supabase.from("incident_comments").insert({
    incident_id: input.incidentId,
    author_name: input.author,
    avatar_color: input.avatarColor,
    body: input.body,
    role: input.role,
  });
  if (!error) {
    await supabase.rpc("increment_incident_messages", { incident_id_input: input.incidentId });
  }
  return { error };
}

export async function fetchIncidentComments(incidentId: string): Promise<IncidentComment[]> {
  const { data } = await supabase
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
  return supabase.from("assembly_votes").upsert({
    assembly_id: input.assemblyId,
    vote_id: input.voteId,
    profile_id: input.profileId,
    choice: input.choice,
  }, { onConflict: "assembly_id,vote_id,profile_id" });
}

export async function fetchMyVotes(assemblyId: string, profileId: string) {
  const { data } = await supabase
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
  await Promise.all(
    updates.map((u) => supabase.from("units").update({ tantiemes: u.tantiemes }).eq("id", u.unitId))
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
  return supabase.from("assembly_resolutions").insert({
    assembly_id: input.assemblyId,
    number: input.number,
    title: input.title,
    description: input.description ?? null,
    majority_type: input.majorityType,
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
  return supabase.from("assembly_resolutions").update({
    result: input.result,
    pour_tantiemes: input.pourTantiemes,
    contre_tantiemes: input.contreTantiemes,
    abstention_tantiemes: input.abstentionTantiemes,
    pour_count: input.pourCount,
    contre_count: input.contreCount,
    abstention_count: input.abstentionCount,
  }).eq("id", resolutionId);
}

export async function deleteResolution(resolutionId: string) {
  return supabase.from("assembly_resolutions").delete().eq("id", resolutionId);
}

/** Mettre à jour le statut de convocation d'une AG */
export async function markAssemblyConvoked(assemblyId: string) {
  return supabase.from("assemblies").update({
    status: "convoquee",
    convocation_sent_at: new Date().toISOString(),
  }).eq("id", assemblyId);
}

/** Distribuer le PV aux résidents */
export async function distributePV(assemblyId: string, profileIds: string[], agDate: string) {
  const title = "Procès-verbal disponible";
  const body = `Le PV de l'assemblée du ${agDate} est disponible. Consultez-le dans votre application.`;
  const notifications = profileIds.map((pid) => ({ profile_id: pid, title, body, kind: "ag" }));
  await supabase.from("notifications").insert(notifications);
  return supabase.from("assemblies").update({
    pv_distributed: true,
    pv_sent_at: new Date().toISOString(),
    status: "pv_distribue",
  }).eq("id", assemblyId);
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
  const total = input.lines.reduce((s, l) => s + l.amountBudgeted, 0);
  const { data: budget, error } = await supabase.from("budgets").insert({
    building_id: input.buildingId,
    fiscal_year: input.fiscalYear,
    total_amount: total + (input.reserveFundAmount ?? 0),
    reserve_fund_amount: input.reserveFundAmount ?? 0,
    status: "draft",
  }).select().single();

  if (error || !budget) return { error: error?.message ?? "budget_error" };

  if (input.lines.length > 0) {
    await supabase.from("budget_lines").insert(
      input.lines.map((l) => ({
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
  const update: Record<string, any> = { status, updated_at: new Date().toISOString() };
  if (status === "approved") {
    update.approved_at = new Date().toISOString();
    if (assemblyId) update.approved_assembly_id = assemblyId;
  }
  return supabase.from("budgets").update(update).eq("id", budgetId);
}

export async function addBudgetLine(budgetId: string, input: { label: string; category: string; amountBudgeted: number; accountCode?: string }) {
  return supabase.from("budget_lines").insert({
    budget_id: budgetId,
    label: input.label,
    category: input.category,
    amount_budgeted: input.amountBudgeted,
    account_code: input.accountCode ?? null,
  });
}

export async function updateBudgetLine(lineId: string, input: { label?: string; category?: string; amountBudgeted?: number; amountActual?: number }) {
  return supabase.from("budget_lines").update(input).eq("id", lineId);
}

export async function deleteBudgetLine(lineId: string) {
  return supabase.from("budget_lines").delete().eq("id", lineId);
}

export async function deleteBudget(budgetId: string) {
  return supabase.from("budgets").delete().eq("id", budgetId);
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
  return supabase.from("insurance_policies").insert({
    building_id: input.buildingId,
    insurer: input.insurer,
    policy_number: input.policyNumber ?? null,
    coverage_type: input.coverageType ?? "multirisque",
    premium_amount: input.premiumAmount,
    start_date: input.startDate,
    end_date: input.endDate,
    renewal_alert_days: input.renewalAlertDays ?? 30,
    file_url: input.fileUrl ?? null,
    notes: input.notes ?? null,
  });
}

export async function updateInsurancePolicy(id: string, input: Record<string, any>) {
  return supabase.from("insurance_policies").update(input).eq("id", id);
}

export async function deleteInsurancePolicy(id: string) {
  return supabase.from("insurance_policies").delete().eq("id", id);
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
  return supabase.from("syndic_mandates").insert({
    building_id: input.buildingId,
    syndic_name: input.syndicName,
    syndic_type: input.syndicType,
    deputy_name: input.deputyName ?? null,
    elected_at: input.electedAt,
    mandate_end: input.mandateEnd,
    remuneration: input.remuneration ?? null,
    contract_url: input.contractUrl ?? null,
    elected_assembly_id: input.assemblyId ?? null,
  });
}

export async function updateMandate(id: string, input: Record<string, any>) {
  return supabase.from("syndic_mandates").update(input).eq("id", id);
}

export async function deleteMandate(id: string) {
  return supabase.from("syndic_mandates").delete().eq("id", id);
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
  return supabase.from("urgent_works").insert({
    building_id: input.buildingId,
    title: input.title,
    description: input.description ?? null,
    estimated_cost: input.estimatedCost ?? null,
    justification: input.justification,
    supplier: input.supplier ?? null,
    incident_id: input.incidentId ?? null,
  });
}

export async function updateUrgentWorkStatus(id: string, status: "declared" | "approved" | "in_progress" | "completed", actualCost?: number) {
  const update: Record<string, any> = { status };
  if (status === "completed") update.completed_at = new Date().toISOString();
  if (actualCost !== undefined) update.actual_cost = actualCost;
  return supabase.from("urgent_works").update(update).eq("id", id);
}

export async function deleteUrgentWork(id: string) {
  return supabase.from("urgent_works").delete().eq("id", id);
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
  return supabase.from("copropriete_rules").upsert({
    building_id: input.buildingId,
    title: input.title ?? "Règlement de copropriété",
    file_url: input.fileUrl ?? null,
    annexes: input.annexes ?? [],
    adopted_at: input.adoptedAt ?? null,
    notes: input.notes ?? null,
    last_modified_at: new Date().toISOString().slice(0, 10),
  }, { onConflict: "building_id" });
}
