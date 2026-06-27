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

export async function logDunning(input: {
  unitId: string;
  channel: "push" | "sms" | "whatsapp";
  message: string;
}) {
  return supabase.from("dunning_logs").insert({
    building_id: DEMO_BUILDING_ID,
    unit_id: input.unitId,
    channel: input.channel,
    message: input.message,
  });
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
  // Marque chaque charge réglée (montant propre).
  await Promise.all(
    items.map((c) => supabase.from("charges").update({ status: "paid", paid: c.amount }).eq("id", c.id)),
  );
}
