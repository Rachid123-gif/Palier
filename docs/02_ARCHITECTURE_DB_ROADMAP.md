# PALIER — Architecture, Base de données, Roadmap

## 1. Vision produit (cadrage)
> Les concurrents digitalisent le **syndic**. Palier digitalise la **vie du copropriétaire**.

Trois surfaces, un seul backend :
1. **App Résident** (iOS/Android) — copropriétaires & locataires.
2. **Backoffice Syndic** (web) — gestion immeubles, charges, recouvrement, AG, marketplace.
3. **Espace Prestataire** (web léger + WhatsApp) — réception des demandes, agenda, profil.

## 2. Stack cible recommandée
| Couche | Choix | Pourquoi |
|---|---|---|
| App résident | **Expo / React Native + TypeScript** | rendu natif iOS/Android fidèle à la vidéo, OTA updates, une base de code. |
| Backoffice & espace prestataire | **Next.js 15 (App Router) + Tailwind + shadcn/ui** | premium, rapide, déployable Vercel. |
| Design system | **tokens partagés** (couleurs/typo/spacing) consommés par RN (NativeWind) et Next (Tailwind). |
| Backend | **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions) | RLS multi-tenant, realtime pour fil/incidents, auth téléphone OTP. |
| Paiements | **CMI / Payzone / wallet (à intégrer V1.1)** ; MVP = paiement après prestation + virement marqué manuellement. |
| Notifications | **Expo Push + WhatsApp Cloud API + SMS (gateway MA)** pour recouvrement. |
| Fichiers | Supabase Storage (reçus PDF, PV AG, photos prestataires/incidents). |

Monorepo : `apps/resident` (Expo), `apps/backoffice` (Next), `packages/ui` (tokens + composants partagés), `packages/types` (types DB générés), `supabase/` (migrations + edge functions).

## 3. Modèle de données (multi-tenant, RLS par immeuble)
Entités principales (clés en `id uuid`, `created_at`, `updated_at`) :

- **organizations** — cabinet de syndic (tenant racine). `name, logo, plan`.
- **buildings** (immeuble) — `org_id, name, address, city, lat, lng, lots_count, iban, syndic_user_id`.
- **units (lots)** — `building_id, ref (ex: Apt 3B), floor, tantieme/quote_part, surface, type`.
- **profiles (users)** — `phone, full_name, avatar, locale`. Lié à `auth.users`.
- **memberships** — `user_id, unit_id, role (owner|tenant|syndic|provider|admin), is_primary`. (Un user ↔ plusieurs lots, un lot ↔ plusieurs users.)
- **charges** — `unit_id, period, label, amount, due_date, status (due|partial|paid|late), category (syndic|travaux|provision), receipt_url`.
- **payments** — `charge_id, user_id, amount, method (cash|transfer|card|wallet), status, paid_at, reference`.
- **ledger_entries (Transparence)** — `building_id, type (in|out), label, amount, category, supplier_id, doc_url, signed_hash, created_by`. (Journal inviolable = « Trust Ledger ».)
- **budgets** — `building_id, year, line, planned, spent`.
- **incidents** — `building_id, unit_id, reporter_id, category, urgency (low|normal|high|urgent), title, details, status (open|in_progress|resolved), assignee_id`.
- **incident_messages** — `incident_id, user_id, body, media[]`.
- **announcements / posts** — `building_id, author_id, type (announcement|event|help|found|general), title, body, pinned, event_at`.
- **post_reactions** — `post_id, user_id, emoji`. **post_comments** — `post_id, user_id, body`.
- **assemblies (AG)** — `building_id, date, agenda[], status, convocation_url, pv_url`.
- **votes** — `assembly_id, question, options[], quorum, opens_at, closes_at`. **vote_ballots** — `vote_id, user_id, option, weight (=tantième)`.
- **documents** — `building_id, type (pv|contract|invoice|insurance|other), title, url, uploaded_by`.
- **common_spaces** + **space_bookings** — réservation salle/terrasse.
- **service_categories** — `slug, label, icon` (ménage, plomberie, électricité, climatisation, bricolage, peinture, jardinage, sécurité).
- **providers (prestataires)** — `name, photo_url (UNIQUE, jamais dupliquée), phone, whatsapp, city, district, lat, lng, rating, reviews_count, bio, base_price, badges[], verified, insured, active`.
- **provider_services** — `provider_id, category_id, base_price`.
- **bookings** — `provider_id, user_id, category_id, building_id, when_type (now|today|scheduled), slot_at, status (sent|confirmed|done|cancelled), channel (whatsapp|in_app), price_estimate`.
- **service_requests (anti-écran-vide)** — quand 0 prestataire : `user_id, category_id, city, details, status (pending|matched|closed)`.
- **reviews** — `provider_id, user_id, booking_id, rating, comment`.
- **notifications** — `user_id, type, title, body, read_at, deeplink`.
- **dunning_campaigns (recouvrement)** — `building_id, channel (push|sms|whatsapp), template, schedule, auto`. **dunning_logs** — `charge_id, channel, sent_at, status`.

RLS : un résident ne voit que les données de ses lots/immeubles ; un syndic, son organisation ; un prestataire, ses bookings.

## 4. Backoffice Syndic (modules, « supérieur à SyndicConnect »)
Immeubles · Résidents/Lots · Charges & appels de fonds · **Recouvrement** (push/SMS/WhatsApp + relance auto, suivi payé/partiel/retard) · Trésorerie & **Transparence** (ledger signé) · Budget & dépenses · Fournisseurs · AG & votes · Incidents · Documents · Marketplace (gestion prestataires) · Statistiques (taux de recouvrement, délai moyen, incidents/mois).

## 5. Anti-patterns produits imposés (règles dures)
- **Jamais** d'écran vide → toujours un état « action » (Faire une demande / Demander un devis).
- **Jamais** « Aucun prestataire » → CTA de mise en relation.
- **Jamais** de photo dupliquée entre prestataires.
- **Jamais** afficher « Trust Ledger » seul → « Transparence financière ».
- MVP Charges = **copropriété uniquement** (pas d'opérateurs).
- Flow réserver = Maintenant / Aujourd'hui / Planifier → WhatsApp pré-rempli.

## 6. Roadmap
### MVP (V1.0 — fidèle + corrigé)
- Auth tel + OTP réel, profil multi-lots.
- Accueil, Charges copropriété (consulter/payer/historique/reçu PDF/rappels).
- Immeuble (KPI, Transparence, AG/docs en lecture, incidents complets).
- Voisinage (fil + réactions + commentaires + composer).
- Services (géoloc, catégories, liste prestataires riches, fiche, flow réserver → WhatsApp, **état demande de devis**).
- Backoffice : immeubles, lots, résidents, charges, recouvrement (manuel + WhatsApp), incidents, prestataires, documents.
- Design system premium + seed crédible.

### V2
- Paiement in-app (CMI/wallet) + reçus auto, AG en ligne + votes pondérés tantièmes, réservation espaces communs, marketplace transactionnelle (commission), avis vérifiés post-prestation, intégration opérateurs (Redal/Lydec/IAM…), espace prestataire complet, analytics avancées, multi-langue AR/Darija + RTL.
