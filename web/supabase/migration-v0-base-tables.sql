-- ══════════════════════════════════════════════════════════════
-- PALIER — Migration V0: Base Tables (CREATE TABLE IF NOT EXISTS)
-- ══════════════════════════════════════════════════════════════
--
-- This migration creates ALL core tables that the application code
-- references. It must be run BEFORE any other migration (v1–v8)
-- since those migrations ALTER or reference these tables.
--
-- Reverse-engineered from:
--   - All .from("table").select/insert/update calls in src/lib/
--   - Type definitions in src/lib/types.ts
--   - Mapper functions in src/lib/queries.ts and src/lib/syndic.ts
--   - ALTER TABLE statements in migrations v1–v8
--   - Schema validation in src/lib/schemas.ts
--
-- Convention: Moroccan context (MAD currency, 06/07/05 phone format)
-- ══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 1. BUILDINGS — Résidences / copropriétés
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: auth.ts (insert), queries.ts (select *), syndic.ts (select *),
--   admin-queries.ts (select id, name, city, lots_count, balance, payment_rate,
--   syndic_name, syndic_phone, created_at)
-- Columns from v3: annual_budget, accounting_tier

CREATE TABLE IF NOT EXISTS buildings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  address         TEXT NOT NULL DEFAULT '',
  city            VARCHAR(100) NOT NULL DEFAULT 'Casablanca',
  lots_count      INTEGER NOT NULL DEFAULT 0,
  syndic_name     VARCHAR(200) NOT NULL DEFAULT '',
  syndic_phone    VARCHAR(20) NOT NULL DEFAULT '',
  balance         NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_rate    INTEGER NOT NULL DEFAULT 0,
  -- V3: Loi 18-00 / Décret 2.23.700 compliance
  annual_budget   NUMERIC(12,2) DEFAULT 0,
  accounting_tier VARCHAR(10) DEFAULT 'tier1',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- 2. PROFILES — Utilisateurs (syndics + résidents)
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: auth.ts (insert: full_name, phone; select: id; update: full_name),
--   actions.ts (insert: full_name, phone, avatar_color, city; update: full_name, phone),
--   queries.ts (select *: full_name, phone, avatar_color),
--   syndic.ts (select *: id, full_name, avatar_color, phone),
--   admin-queries.ts (select: id, full_name, phone, created_at)

CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       VARCHAR(200) NOT NULL DEFAULT '',
  phone           VARCHAR(20) UNIQUE NOT NULL DEFAULT '',
  avatar_color    VARCHAR(10) DEFAULT '#1e5b50',
  city            VARCHAR(100) DEFAULT 'casablanca',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- ═══════════════════════════════════════════════════════════════
-- 3. UNITS — Lots / appartements
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: queries.ts (select *: id, ref, building_id + tantiemes from v3),
--   actions.ts (select: id, ref, tantiemes; update: tantiemes),
--   syndic.ts (select *: id, ref, floor, tantiemes)
-- Columns from v3: tantiemes

CREATE TABLE IF NOT EXISTS units (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  ref             VARCHAR(20) NOT NULL,          -- ex: "A3B", "1A", "2C"
  floor           INTEGER,                       -- étage
  tantiemes       INTEGER NOT NULL DEFAULT 0,    -- V3: millièmes
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_units_building ON units(building_id);

-- ═══════════════════════════════════════════════════════════════
-- 4. MEMBERSHIPS — Lien profil ↔ bâtiment ↔ lot
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: auth.ts (select: unit_id, role, building_id; insert: profile_id,
--   building_id, role, status),
--   actions.ts (select: profile_id, unit_id, status; insert: building_id, profile_id,
--   unit_id, role; update: role, status, deactivated_at),
--   queries.ts (select: building_id, role, unit_id, status),
--   syndic.ts (select *: unit_id, profile_id, role, is_primary, status, deactivated_at),
--   admin-queries.ts (select: profile_id, building_id, role, status, created_at)
-- Columns from v1: status, deactivated_at

CREATE TABLE IF NOT EXISTS memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_id         UUID REFERENCES units(id) ON DELETE SET NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'resident'
                    CHECK (role IN ('resident', 'syndic', 'owner', 'tenant')),
  is_primary      BOOLEAN DEFAULT false,
  -- V1: status + deactivation
  status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive')),
  deactivated_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- 5. CHARGES — Appels de fonds / cotisations
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: actions.ts (insert: building_id, unit_id, label, detail, period,
--   amount, paid, due_date, status, category; select: id, amount, paid, status,
--   label, due_date; update: paid, status, label, category, due_date),
--   queries.ts (select *: id, label, detail, period, amount, paid, due_date,
--   status, category),
--   syndic.ts (select *: all + created_at),
--   admin-queries.ts (select: id, building_id, amount, paid, status)

CREATE TABLE IF NOT EXISTS charges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  label           VARCHAR(200) NOT NULL,
  detail          TEXT NOT NULL DEFAULT '',
  period          VARCHAR(50) NOT NULL DEFAULT '',       -- ex: "janvier 2026"
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid            NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date        DATE,
  status          VARCHAR(20) NOT NULL DEFAULT 'due'
                    CHECK (status IN ('due', 'partial', 'paid', 'late')),
  category        VARCHAR(50) NOT NULL DEFAULT 'courantes'
                    CHECK (category IN ('courantes', 'travaux', 'provision', 'regularisation')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- 6. INCIDENTS — Signalements résidents
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: actions.ts (insert: building_id, unit_id, reporter_id, reporter_name,
--   category, title, details, urgency, status, image_url; select: reporter_id, title,
--   id; update: status, urgency),
--   queries.ts (select *: id, category, title, details, urgency, status, reporter_name,
--   created_at, messages_count, image_url),
--   admin-queries.ts (select: id, building_id, status, title, category, created_at)
-- Columns from v2: messages_count

CREATE TABLE IF NOT EXISTS incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_id         UUID REFERENCES units(id) ON DELETE SET NULL,
  reporter_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_name   VARCHAR(200) NOT NULL DEFAULT '',
  category        VARCHAR(100) NOT NULL,                 -- slug catégorie (plomberie, etc.)
  title           VARCHAR(300) NOT NULL,
  details         TEXT NOT NULL DEFAULT '',
  urgency         VARCHAR(20) NOT NULL DEFAULT 'normal'
                    CHECK (urgency IN ('low', 'normal', 'urgent')),
  status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'resolved')),
  image_url       TEXT,
  -- V2: message counter (updated by increment_incident_messages function)
  messages_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- 7. INCIDENT_COMMENTS — Discussion syndic ↔ résident
-- ═══════════════════════════════════════════════════════════════
-- Created in migration-v2 but included here as base table.
-- Referenced by: actions.ts (insert: incident_id, author_name, avatar_color,
--   body, role; select *: id, incident_id, author_name, avatar_color, body,
--   role, created_at)

CREATE TABLE IF NOT EXISTS incident_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id     UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author_name     TEXT NOT NULL,
  avatar_color    VARCHAR(10) DEFAULT '#1e5b50',
  body            TEXT NOT NULL,
  role            VARCHAR(20) DEFAULT 'resident'
                    CHECK (role IN ('resident', 'syndic')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incident_comments_incident ON incident_comments(incident_id);

-- ═══════════════════════════════════════════════════════════════
-- 8. POSTS — Publications voisinage
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: actions.ts (insert: building_id, author_name, avatar_color,
--   profile_id, role, type, body, title, image_url, category, provider_name,
--   provider_phone; select: id, profile_id, building_id, title, body;
--   update: body, title, category, provider_name, provider_phone, pinned),
--   queries.ts (select *: id, type, author_name, profile_id, role, avatar_color,
--   created_at, pinned, emoji, title, body, like_count, love_count, haha_count,
--   wow_count, comments_count, image_url, file_url, file_name, category,
--   provider_name, provider_phone),
--   admin-queries.ts (select: id, building_id, author_name, title, body, type, created_at)

CREATE TABLE IF NOT EXISTS posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  profile_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name     VARCHAR(200) NOT NULL,
  avatar_color    VARCHAR(10) DEFAULT '#1e5b50',
  role            VARCHAR(20) NOT NULL DEFAULT 'resident'
                    CHECK (role IN ('resident', 'syndic')),
  type            VARCHAR(30) NOT NULL DEFAULT 'general'
                    CHECK (type IN ('announcement', 'event', 'help', 'found',
                                    'general', 'service', 'recommendation')),
  title           VARCHAR(300),
  body            TEXT NOT NULL,
  emoji           VARCHAR(10),
  image_url       TEXT,
  pinned          BOOLEAN NOT NULL DEFAULT false,
  -- Recommandations: provider info
  category        VARCHAR(100),
  provider_name   VARCHAR(200),
  provider_phone  VARCHAR(20),
  -- File attachments (non-image documents)
  file_url        TEXT,
  file_name       VARCHAR(300),
  -- Reaction counters (updated via RPC functions)
  like_count      INTEGER NOT NULL DEFAULT 0,
  love_count      INTEGER NOT NULL DEFAULT 0,
  haha_count      INTEGER NOT NULL DEFAULT 0,
  wow_count       INTEGER NOT NULL DEFAULT 0,
  comments_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- 9. POST_COMMENTS — Commentaires sur les posts
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: actions.ts (insert: post_id, author_name, avatar_color, body;
--   select *: id, post_id, author_name, avatar_color, body, likes, created_at;
--   select: post_id)

CREATE TABLE IF NOT EXISTS post_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_name     VARCHAR(200) NOT NULL,
  avatar_color    VARCHAR(10) DEFAULT '#1e5b50',
  body            TEXT NOT NULL,
  likes           INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);

-- ═══════════════════════════════════════════════════════════════
-- 10. NOTIFICATIONS — Notifications in-app
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: actions.ts (insert: profile_id, title, body, kind),
--   queries.ts (select *: id, title, body, created_at, kind)

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           VARCHAR(300) NOT NULL,
  body            TEXT NOT NULL DEFAULT '',
  kind            VARCHAR(30) NOT NULL DEFAULT 'general',  -- charge, ag, incident, post, document
  read            BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- 11. DOCUMENTS — Fichiers partagés (PV, règlement, etc.)
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: actions.ts (insert: building_id, title, doc_type, doc_date,
--   size, url; upsert with ref_id; delete by id+building_id),
--   queries.ts (select *: id, title, doc_type, type, doc_date, created_at,
--   icon, color, tint, url, file_url),
--   syndic.ts (select *: id, title, doc_type, type, doc_date, created_at,
--   size, url)

CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  title           VARCHAR(300) NOT NULL,
  doc_type        VARCHAR(50) NOT NULL DEFAULT 'autre',   -- pv, reglement, facture, etc.
  doc_date        DATE,
  size            VARCHAR(20) DEFAULT '',                  -- ex: "256 KB"
  url             TEXT,                                    -- public URL to file
  file_url        TEXT,                                    -- alternative URL field
  icon            VARCHAR(50) DEFAULT 'FileText',
  color           VARCHAR(30) DEFAULT 'text-ink-soft',
  tint            VARCHAR(30) DEFAULT 'bg-cream-card',
  ref_id          VARCHAR(100) UNIQUE,                     -- for upsert on conflict
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- 12. ASSEMBLIES — Assemblées générales
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: actions.ts (insert: building_id, date, time, place, type,
--   agenda, votes, quorum; update: quorum, votes, summary, pv_url, status,
--   convocation_sent_at, pv_distributed, pv_sent_at),
--   queries.ts (select *: id, date, time, place, agenda, votes, pv_url, status),
--   syndic.ts (select *: id, date, time, place, type, status, agenda, votes,
--   quorum, summary, pv_url, convocation_sent_at, pv_sent_at, pv_distributed)
-- Columns from v3: type, convocation_sent_at, pv_sent_at, pv_distributed, status

CREATE TABLE IF NOT EXISTS assemblies (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id           UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  date                  DATE NOT NULL,
  time                  VARCHAR(10) DEFAULT '18h30',
  place                 VARCHAR(200) DEFAULT 'Hall de la résidence',
  -- V3: compliance fields
  type                  VARCHAR(20) DEFAULT 'ordinaire'
                          CHECK (type IN ('ordinaire', 'extraordinaire')),
  status                VARCHAR(20) DEFAULT 'draft'
                          CHECK (status IN ('draft', 'convoquee', 'tenue', 'pv_distribue')),
  convocation_sent_at   TIMESTAMPTZ,
  pv_sent_at            TIMESTAMPTZ,
  pv_distributed        BOOLEAN DEFAULT false,
  -- Content
  agenda                JSONB NOT NULL DEFAULT '[]'::jsonb,
  votes                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  quorum                INTEGER NOT NULL DEFAULT 0,
  summary               TEXT NOT NULL DEFAULT '',
  pv_url                TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- 13. LEDGER_ENTRIES — Journal comptable
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: actions.ts (insert: building_id, type, label, amount, category,
--   entry_date, signed; update: type, label, amount, category, entry_date),
--   queries.ts (select *: id, type, label, amount, entry_date, category, signed),
--   syndic.ts (select *)
-- Columns from v3: account_code, fiscal_year, is_reserve_fund

CREATE TABLE IF NOT EXISTS ledger_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  type            VARCHAR(10) NOT NULL DEFAULT 'out'
                    CHECK (type IN ('in', 'out')),
  label           VARCHAR(300) NOT NULL,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  category        VARCHAR(100) NOT NULL DEFAULT '',
  entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  signed          BOOLEAN NOT NULL DEFAULT false,
  -- V3: Décret 2.23.700 compliance
  account_code    VARCHAR(10),
  fiscal_year     INTEGER,
  is_reserve_fund BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- 14. DUNNING_LOGS — Historique des relances
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: actions.ts (insert: building_id, unit_id, channel, message),
--   syndic.ts (select: unit_id, sent_at)

CREATE TABLE IF NOT EXISTS dunning_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  channel         VARCHAR(20) NOT NULL DEFAULT 'app'
                    CHECK (channel IN ('push', 'sms', 'whatsapp', 'app')),
  message         TEXT NOT NULL DEFAULT '',
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- 15. PROVIDERS — Annuaire prestataires
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: queries.ts (select * where active=true:
--   id, name, category_slug, city_slug, district, phone, whatsapp,
--   rating, reviews, bio, base_price, badges, verified, insured,
--   top_neighbor, available_today, avatar_from, avatar_to, avatar_initials)
-- RLS policies in v5/v6 reference this table.

CREATE TABLE IF NOT EXISTS providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  category_slug   VARCHAR(100) NOT NULL,                  -- plomberie, electricite, etc.
  city_slug       VARCHAR(100) NOT NULL DEFAULT 'casablanca',
  district        VARCHAR(100) NOT NULL DEFAULT '',
  phone           VARCHAR(20) NOT NULL DEFAULT '',
  whatsapp        VARCHAR(20) NOT NULL DEFAULT '',
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0,        -- 0.00 to 5.00
  reviews         INTEGER NOT NULL DEFAULT 0,
  bio             TEXT NOT NULL DEFAULT '',
  base_price      NUMERIC(10,2) NOT NULL DEFAULT 0,       -- prix de base en MAD
  badges          TEXT[] DEFAULT '{}',
  verified        BOOLEAN NOT NULL DEFAULT false,
  insured         BOOLEAN NOT NULL DEFAULT false,
  top_neighbor    BOOLEAN NOT NULL DEFAULT false,
  available_today BOOLEAN NOT NULL DEFAULT false,
  active          BOOLEAN NOT NULL DEFAULT true,
  -- Avatar (gradient colors + initials for deterministic display)
  avatar_from     VARCHAR(10) NOT NULL DEFAULT '#1e5b50',
  avatar_to       VARCHAR(10) NOT NULL DEFAULT '#2c7766',
  avatar_initials VARCHAR(5) NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(category_slug);
CREATE INDEX IF NOT EXISTS idx_providers_city ON providers(city_slug);
CREATE INDEX IF NOT EXISTS idx_providers_active ON providers(active);

-- ═══════════════════════════════════════════════════════════════
-- 16. PAYMENTS — Historique des paiements
-- ═══════════════════════════════════════════════════════════════
-- Referenced by: actions.ts (insert: charge_id, amount, method, status,
--   profile_id, note; select: id, amount, method, note, created_at, charge_id;
--   delete by id)

CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_id       UUID NOT NULL REFERENCES charges(id) ON DELETE CASCADE,
  profile_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  method          VARCHAR(20) NOT NULL DEFAULT 'cash'
                    CHECK (method IN ('cash', 'cheque', 'virement', 'autre')),
  status          VARCHAR(20) NOT NULL DEFAULT 'paid'
                    CHECK (status IN ('paid', 'pending', 'failed')),
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_charge ON payments(charge_id);
CREATE INDEX IF NOT EXISTS idx_payments_profile ON payments(profile_id);

-- ═══════════════════════════════════════════════════════════════
-- 17. FEEDBACK — Retours utilisateurs
-- ═══════════════════════════════════════════════════════════════
-- Created in migration-v2 but included here as base table.
-- Referenced by: actions.ts (insert: building_id, type, message, sender_name,
--   sender_phone, sender_email, contact_preference, building_name, sender_role)

CREATE TABLE IF NOT EXISTS feedback (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id          UUID REFERENCES buildings(id) ON DELETE SET NULL,
  type                 VARCHAR(20) NOT NULL,               -- bug, suggestion, autre
  message              TEXT NOT NULL,
  sender_name          TEXT,
  sender_phone         TEXT,
  sender_email         TEXT,
  contact_preference   VARCHAR(10),                        -- phone, email, whatsapp
  building_name        TEXT,
  sender_role          VARCHAR(20) DEFAULT 'resident',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ══════════════════════════════════════════════════════════════
-- RPC FUNCTIONS — Required by application code
-- ══════════════════════════════════════════════════════════════

-- Increment incident messages counter
CREATE OR REPLACE FUNCTION increment_incident_messages(incident_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE incidents SET messages_count = COALESCE(messages_count, 0) + 1
  WHERE id = incident_id_input;
END;
$$ LANGUAGE plpgsql;

-- Increment post like counter
CREATE OR REPLACE FUNCTION increment_like_count(post_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql;

-- Increment post comments counter
CREATE OR REPLACE FUNCTION increment_comments_count(post_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql;

-- Increment comment likes counter
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE post_comments SET likes = COALESCE(likes, 0) + 1
  WHERE id = comment_id_input;
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════
-- 18. RATE_LIMITS — DB-based rate limiting
-- ═══════════════════════════════════════════════════════════════
-- Replaces in-memory rate limiter for multi-instance deployments.

CREATE TABLE IF NOT EXISTS rate_limits (
  key             VARCHAR(200) PRIMARY KEY,
  count           INTEGER NOT NULL DEFAULT 1,
  reset_at        TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);

-- ══════════════════════════════════════════════════════════════
-- PERFORMANCE INDEXES
-- ══════════════════════════════════════════════════════════════

-- Charges: lookup by unit + building + status
CREATE INDEX IF NOT EXISTS idx_charges_unit_id ON charges(unit_id);
CREATE INDEX IF NOT EXISTS idx_charges_building_id ON charges(building_id);
CREATE INDEX IF NOT EXISTS idx_charges_status ON charges(status);

-- Memberships: lookup by profile + building
CREATE INDEX IF NOT EXISTS idx_memberships_profile_building ON memberships(profile_id, building_id);
CREATE INDEX IF NOT EXISTS idx_memberships_unit_id ON memberships(unit_id);
CREATE INDEX IF NOT EXISTS idx_memberships_building_id ON memberships(building_id);

-- Posts: timeline query
CREATE INDEX IF NOT EXISTS idx_posts_building_created ON posts(building_id, created_at DESC);

-- Incidents: building list
CREATE INDEX IF NOT EXISTS idx_incidents_building_created ON incidents(building_id, created_at DESC);

-- Notifications: user inbox
CREATE INDEX IF NOT EXISTS idx_notifications_profile_created ON notifications(profile_id, created_at DESC);

-- Ledger: building journal
CREATE INDEX IF NOT EXISTS idx_ledger_building_date ON ledger_entries(building_id, entry_date DESC);

-- Dunning logs: unit lookup
CREATE INDEX IF NOT EXISTS idx_dunning_unit_sent ON dunning_logs(unit_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_dunning_building ON dunning_logs(building_id);

-- Documents: building + date
CREATE INDEX IF NOT EXISTS idx_documents_building ON documents(building_id, created_at DESC);

-- Assemblies: building + date
CREATE INDEX IF NOT EXISTS idx_assemblies_building_date ON assemblies(building_id, date DESC);


-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — Enable on all tables
-- (Policies are defined in migration-v5-rls and migration-v6-security)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE dunning_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
