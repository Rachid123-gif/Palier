/**
 * Seed realistic demo data via Supabase REST API.
 * Run: node scripts/seed-demo.mjs
 */
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile.split("\n").filter(l => l && !l.startsWith("#")).map(l => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; })
);

const BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function upsert(table, data) {
  const res = await fetch(`${BASE}/${table}`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(Array.isArray(data) ? data : [data]),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`✗ ${table}:`, err);
    return false;
  }
  return true;
}

const BUILDING_ID = "dev-building-001";
const PROFILE_ID = "dev-profile-001";
const UNIT_ID = "dev-unit-001";

async function seed() {
  console.log("🌱 Seeding demo data...\n");

  if (await upsert("buildings", {
    id: BUILDING_ID, name: "Résidence Al Amal",
    address: "12, Rue des Oliviers, Quartier Gauthier", city: "Casablanca",
    lots_count: 24, syndic_name: "Youssef Bennani", syndic_phone: "0661234567",
    balance: 45200, payment_rate: 78,
  })) console.log("✓ Building: Résidence Al Amal");

  if (await upsert("profiles", {
    id: PROFILE_ID, full_name: "Amina El Fassi", phone: "0672345678", avatar_color: "#1e5b50",
  })) console.log("✓ Profile: Amina El Fassi");

  if (await upsert("units", {
    id: UNIT_ID, building_id: BUILDING_ID, ref: "Apt 7", tantiemes: 450,
  })) console.log("✓ Unit: Apt 7");

  if (await upsert("memberships", {
    profile_id: PROFILE_ID, building_id: BUILDING_ID, unit_id: UNIT_ID, role: "owner", status: "active",
  })) console.log("✓ Membership");

  const charges = [
    { id: "ch-001", unit_id: UNIT_ID, label: "Charges courantes T3 2026", detail: "Entretien, gardiennage, espaces verts", period: "Jul-Sep 2026", amount: 1800, paid: 0, due_date: "2026-07-15", status: "due", category: "courantes" },
    { id: "ch-002", unit_id: UNIT_ID, label: "Charges courantes T2 2026", detail: "Entretien, gardiennage, espaces verts", period: "Avr-Jun 2026", amount: 1800, paid: 1800, due_date: "2026-04-15", status: "paid", category: "courantes" },
    { id: "ch-003", unit_id: UNIT_ID, label: "Charges courantes T1 2026", detail: "Entretien, gardiennage, espaces verts", period: "Jan-Mar 2026", amount: 1800, paid: 1800, due_date: "2026-01-15", status: "paid", category: "courantes" },
    { id: "ch-004", unit_id: UNIT_ID, label: "Travaux ascenseur", detail: "Remplacement câbles + maintenance", period: "2026", amount: 3200, paid: 1600, due_date: "2026-06-30", status: "partial", category: "travaux" },
    { id: "ch-005", unit_id: UNIT_ID, label: "Charges courantes T4 2025", detail: "Entretien, gardiennage, espaces verts", period: "Oct-Déc 2025", amount: 1650, paid: 1650, due_date: "2025-10-15", status: "paid", category: "courantes" },
    { id: "ch-006", unit_id: UNIT_ID, label: "Provision fonds de travaux", detail: "Provision annuelle obligatoire", period: "2026", amount: 900, paid: 0, due_date: "2026-09-30", status: "due", category: "provision" },
  ];
  if (await upsert("charges", charges)) console.log(`✓ Charges: ${charges.length}`);

  const ledger = [
    { id: "led-001", building_id: BUILDING_ID, type: "in", label: "Charges T2 — Apt 3", amount: 1800, entry_date: "2026-06-10", category: "Charges courantes", signed: true },
    { id: "led-002", building_id: BUILDING_ID, type: "in", label: "Charges T2 — Apt 7", amount: 1800, entry_date: "2026-06-08", category: "Charges courantes", signed: true },
    { id: "led-003", building_id: BUILDING_ID, type: "out", label: "Gardiennage juin", amount: 4500, entry_date: "2026-06-01", category: "Gardiennage", signed: true },
    { id: "led-004", building_id: BUILDING_ID, type: "out", label: "Électricité parties communes", amount: 1230, entry_date: "2026-05-28", category: "Énergie", signed: true },
    { id: "led-005", building_id: BUILDING_ID, type: "in", label: "Charges T2 — Apt 12", amount: 2100, entry_date: "2026-05-22", category: "Charges courantes", signed: true },
    { id: "led-006", building_id: BUILDING_ID, type: "out", label: "Réparation interphone", amount: 850, entry_date: "2026-05-15", category: "Maintenance", signed: true },
    { id: "led-007", building_id: BUILDING_ID, type: "in", label: "Charges T2 — Apt 1", amount: 1800, entry_date: "2026-05-10", category: "Charges courantes", signed: true },
    { id: "led-008", building_id: BUILDING_ID, type: "out", label: "Nettoyage espaces verts", amount: 2200, entry_date: "2026-05-05", category: "Espaces verts", signed: true },
    { id: "led-009", building_id: BUILDING_ID, type: "in", label: "Travaux ascenseur — Apt 7", amount: 1600, entry_date: "2026-04-20", category: "Travaux", signed: true },
    { id: "led-010", building_id: BUILDING_ID, type: "out", label: "Gardiennage mai", amount: 4500, entry_date: "2026-05-01", category: "Gardiennage", signed: true },
    { id: "led-011", building_id: BUILDING_ID, type: "out", label: "Produits entretien", amount: 380, entry_date: "2026-04-28", category: "Entretien", signed: true },
    { id: "led-012", building_id: BUILDING_ID, type: "in", label: "Charges T1 — Apt 5", amount: 1650, entry_date: "2026-04-02", category: "Charges courantes", signed: true },
  ];
  if (await upsert("ledger_entries", ledger)) console.log(`✓ Ledger: ${ledger.length}`);

  const incidents = [
    { id: "inc-001", building_id: BUILDING_ID, category: "ascenseur", title: "Ascenseur bloqué au 3e", details: "L'ascenseur est bloqué portes ouvertes depuis ce matin.", urgency: "urgent", status: "in_progress", reporter_name: "Karim B.", created_at: "2026-07-06T09:30:00Z", messages_count: 3 },
    { id: "inc-002", building_id: BUILDING_ID, category: "fuite_eau", title: "Fuite dans le parking sous-sol", details: "Eau qui coule du plafond du parking niveau -1.", urgency: "normal", status: "open", reporter_name: "Amina E.", created_at: "2026-07-07T14:20:00Z", messages_count: 1 },
    { id: "inc-003", building_id: BUILDING_ID, category: "eclairage", title: "Éclairage couloir 2e étage HS", details: "Les néons du couloir du 2e ne fonctionnent plus.", urgency: "low", status: "resolved", reporter_name: "Hassan M.", created_at: "2026-06-28T11:00:00Z", messages_count: 2 },
    { id: "inc-004", building_id: BUILDING_ID, category: "proprete", title: "Poubelles débordent", details: "Les bacs poubelle du local à ordures sont pleins.", urgency: "normal", status: "open", reporter_name: "Fatima Z.", created_at: "2026-07-08T08:15:00Z", messages_count: 0 },
  ];
  if (await upsert("incidents", incidents)) console.log(`✓ Incidents: ${incidents.length}`);

  const posts = [
    { id: "post-001", building_id: BUILDING_ID, type: "announcement", author_name: "Youssef Bennani", profile_id: null, role: "syndic", avatar_color: "#2563eb", created_at: "2026-07-07T10:00:00Z", pinned: true, emoji: "📢", title: "Coupure d'eau prévue", body: "Une coupure d'eau est prévue le mercredi 9 juillet de 9h à 14h pour travaux sur la canalisation principale.", like_count: 5, love_count: 0, haha_count: 0, wow_count: 2, comments_count: 3 },
    { id: "post-002", building_id: BUILDING_ID, type: "event", author_name: "Amina El Fassi", profile_id: PROFILE_ID, role: "resident", avatar_color: "#1e5b50", created_at: "2026-07-05T16:30:00Z", pinned: false, emoji: "🎉", title: "Fête des voisins", body: "Bonjour à tous ! Je propose une fête des voisins le samedi 19 juillet à 18h dans le jardin. Qui est partant ? 🙌", like_count: 12, love_count: 8, haha_count: 0, wow_count: 1, comments_count: 7 },
    { id: "post-003", building_id: BUILDING_ID, type: "help", author_name: "Rachid Alami", profile_id: null, role: "resident", avatar_color: "#dc2626", created_at: "2026-07-04T09:15:00Z", pinned: false, emoji: "🔑", title: null, body: "Bonjour, j'ai trouvé un trousseau de clés dans le hall d'entrée. 3 clés + porte-clés bleu. Contactez-moi au 5e, Apt 14.", like_count: 2, love_count: 1, haha_count: 0, wow_count: 0, comments_count: 4 },
    { id: "post-004", building_id: BUILDING_ID, type: "recommendation", author_name: "Nadia Chraibi", profile_id: null, role: "resident", avatar_color: "#7c3aed", created_at: "2026-07-03T11:45:00Z", pinned: false, emoji: "⭐", title: null, body: "Je recommande Mohamed le plombier. Intervention rapide, très pro et prix raisonnable !", like_count: 6, love_count: 3, haha_count: 0, wow_count: 0, comments_count: 2, category: "plomberie", provider_name: "Mohamed Plomberie", provider_phone: "0671234567" },
    { id: "post-005", building_id: BUILDING_ID, type: "general", author_name: "Samir Tazi", profile_id: null, role: "resident", avatar_color: "#059669", created_at: "2026-07-02T20:00:00Z", pinned: false, emoji: null, title: null, body: "Est-ce que quelqu'un sait si le local vélo au sous-sol est ouvert ? La porte était fermée ce matin.", like_count: 1, love_count: 0, haha_count: 0, wow_count: 0, comments_count: 5 },
  ];
  if (await upsert("posts", posts)) console.log(`✓ Posts: ${posts.length}`);

  const notifs = [
    { id: "notif-001", profile_id: PROFILE_ID, title: "Nouvelle charge disponible", body: "Charges courantes T3 2026 — 1 800 MAD à régler avant le 15/07.", created_at: "2026-07-01T08:00:00Z", kind: "charge" },
    { id: "notif-002", profile_id: PROFILE_ID, title: "Incident mis à jour", body: "L'ascenseur bloqué au 3e est en cours de traitement.", created_at: "2026-07-06T10:00:00Z", kind: "incident" },
    { id: "notif-003", profile_id: PROFILE_ID, title: "Annonce du syndic", body: "Coupure d'eau prévue le mercredi 9 juillet de 9h à 14h.", created_at: "2026-07-07T10:05:00Z", kind: "syndic" },
    { id: "notif-004", profile_id: PROFILE_ID, title: "Nouveau commentaire", body: "Rachid a répondu à votre message sur la fête des voisins.", created_at: "2026-07-05T17:30:00Z", kind: "voisinage" },
  ];
  if (await upsert("notifications", notifs)) console.log(`✓ Notifications: ${notifs.length}`);

  if (await upsert("assemblies", {
    id: "ag-001", building_id: BUILDING_ID, date: "2026-07-25", time: "18h30",
    place: "Hall de la résidence",
    agenda: [
      { n: 1, t: "Approbation des comptes 2025", d: "Présentation et vote des comptes" },
      { n: 2, t: "Budget prévisionnel 2026-2027", d: "Discussion et adoption du budget" },
      { n: 3, t: "Travaux ascenseur", d: "Devis et vote pour la modernisation" },
      { n: 4, t: "Questions diverses", d: "Sujets libres" },
    ],
    votes: [],
  })) console.log("✓ Assembly: AG du 25/07");

  console.log("\n✅ Demo data seeded!");
}

seed().catch(e => { console.error(e); process.exit(1); });
