-- ══════════════════════════════════════════════════════════════
-- PALIER — MIGRATION COMPLÈTE (v0 → v10)
-- Coller dans Supabase SQL Editor et cliquer Run
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- V0: BASE TABLES
-- ══════════════════════════════════════════════════════════════

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
  annual_budget   NUMERIC(12,2) DEFAULT 0,
  accounting_tier VARCHAR(10) DEFAULT 'tier1',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS units (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  ref             VARCHAR(20) NOT NULL,
  floor           INTEGER,
  tantiemes       INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_units_building ON units(building_id);

CREATE TABLE IF NOT EXISTS memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_id         UUID REFERENCES units(id) ON DELETE SET NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'resident'
                    CHECK (role IN ('resident', 'syndic', 'owner', 'tenant')),
  is_primary      BOOLEAN DEFAULT false,
  status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive')),
  deactivated_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS charges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  label           VARCHAR(200) NOT NULL,
  detail          TEXT NOT NULL DEFAULT '',
  period          VARCHAR(50) NOT NULL DEFAULT '',
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid            NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date        DATE,
  status          VARCHAR(20) NOT NULL DEFAULT 'due'
                    CHECK (status IN ('due', 'partial', 'paid', 'late')),
  category        VARCHAR(50) NOT NULL DEFAULT 'courantes'
                    CHECK (category IN ('courantes', 'travaux', 'provision', 'regularisation')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_id         UUID REFERENCES units(id) ON DELETE SET NULL,
  reporter_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_name   VARCHAR(200) NOT NULL DEFAULT '',
  category        VARCHAR(100) NOT NULL,
  title           VARCHAR(300) NOT NULL,
  details         TEXT NOT NULL DEFAULT '',
  urgency         VARCHAR(20) NOT NULL DEFAULT 'normal'
                    CHECK (urgency IN ('low', 'normal', 'urgent')),
  status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'resolved')),
  image_url       TEXT,
  messages_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  category        VARCHAR(100),
  provider_name   VARCHAR(200),
  provider_phone  VARCHAR(20),
  file_url        TEXT,
  file_name       VARCHAR(300),
  like_count      INTEGER NOT NULL DEFAULT 0,
  love_count      INTEGER NOT NULL DEFAULT 0,
  haha_count      INTEGER NOT NULL DEFAULT 0,
  wow_count       INTEGER NOT NULL DEFAULT 0,
  comments_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           VARCHAR(300) NOT NULL,
  body            TEXT NOT NULL DEFAULT '',
  kind            VARCHAR(30) NOT NULL DEFAULT 'general',
  read            BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  title           VARCHAR(300) NOT NULL,
  doc_type        VARCHAR(50) NOT NULL DEFAULT 'autre',
  doc_date        DATE,
  size            VARCHAR(20) DEFAULT '',
  url             TEXT,
  file_url        TEXT,
  icon            VARCHAR(50) DEFAULT 'FileText',
  color           VARCHAR(30) DEFAULT 'text-ink-soft',
  tint            VARCHAR(30) DEFAULT 'bg-cream-card',
  ref_id          VARCHAR(100) UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assemblies (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id           UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  date                  DATE NOT NULL,
  time                  VARCHAR(10) DEFAULT '18h30',
  place                 VARCHAR(200) DEFAULT 'Hall de la résidence',
  type                  VARCHAR(20) DEFAULT 'ordinaire'
                          CHECK (type IN ('ordinaire', 'extraordinaire')),
  status                VARCHAR(20) DEFAULT 'draft'
                          CHECK (status IN ('draft', 'convoquee', 'tenue', 'pv_distribue')),
  convocation_sent_at   TIMESTAMPTZ,
  pv_sent_at            TIMESTAMPTZ,
  pv_distributed        BOOLEAN DEFAULT false,
  agenda                JSONB NOT NULL DEFAULT '[]'::jsonb,
  votes                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  quorum                INTEGER NOT NULL DEFAULT 0,
  summary               TEXT NOT NULL DEFAULT '',
  pv_url                TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  account_code    VARCHAR(10),
  fiscal_year     INTEGER,
  is_reserve_fund BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dunning_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  channel         VARCHAR(20) NOT NULL DEFAULT 'app'
                    CHECK (channel IN ('push', 'sms', 'whatsapp', 'app')),
  message         TEXT NOT NULL DEFAULT '',
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  category_slug   VARCHAR(100) NOT NULL,
  city_slug       VARCHAR(100) NOT NULL DEFAULT 'casablanca',
  district        VARCHAR(100) NOT NULL DEFAULT '',
  phone           VARCHAR(20) NOT NULL DEFAULT '',
  whatsapp        VARCHAR(20) NOT NULL DEFAULT '',
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews         INTEGER NOT NULL DEFAULT 0,
  bio             TEXT NOT NULL DEFAULT '',
  base_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  badges          TEXT[] DEFAULT '{}',
  verified        BOOLEAN NOT NULL DEFAULT false,
  insured         BOOLEAN NOT NULL DEFAULT false,
  top_neighbor    BOOLEAN NOT NULL DEFAULT false,
  available_today BOOLEAN NOT NULL DEFAULT false,
  active          BOOLEAN NOT NULL DEFAULT true,
  avatar_from     VARCHAR(10) NOT NULL DEFAULT '#1e5b50',
  avatar_to       VARCHAR(10) NOT NULL DEFAULT '#2c7766',
  avatar_initials VARCHAR(5) NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(category_slug);
CREATE INDEX IF NOT EXISTS idx_providers_city ON providers(city_slug);
CREATE INDEX IF NOT EXISTS idx_providers_active ON providers(active);

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

CREATE TABLE IF NOT EXISTS feedback (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id          UUID REFERENCES buildings(id) ON DELETE SET NULL,
  type                 VARCHAR(20) NOT NULL,
  message              TEXT NOT NULL,
  sender_name          TEXT,
  sender_phone         TEXT,
  sender_email         TEXT,
  contact_preference   VARCHAR(10),
  building_name        TEXT,
  sender_role          VARCHAR(20) DEFAULT 'resident',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key             VARCHAR(200) PRIMARY KEY,
  count           INTEGER NOT NULL DEFAULT 1,
  reset_at        TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);

-- RPC Functions
CREATE OR REPLACE FUNCTION increment_incident_messages(incident_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE incidents SET messages_count = COALESCE(messages_count, 0) + 1
  WHERE id = incident_id_input;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_like_count(post_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comments_count(post_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE post_comments SET likes = COALESCE(likes, 0) + 1
  WHERE id = comment_id_input;
END;
$$ LANGUAGE plpgsql;


-- ══════════════════════════════════════════════════════════════
-- V1: ACCESS CODES + BUILDING SETTINGS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'syndic')),
  label VARCHAR(100),
  used_by UUID REFERENCES profiles(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_building ON access_codes(building_id);

CREATE TABLE IF NOT EXISTS building_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL UNIQUE REFERENCES buildings(id) ON DELETE CASCADE,
  enabled_categories TEXT[] DEFAULT ARRAY['menage','plomberie','electricite','climatisation','bricolage','peinture','jardinage','securite','serrurerie','demenagement','nettoyage-tapis','nettoyage-canape','piscine','vitres','electromenager','desinfection'],
  features JSONB DEFAULT '{"voisinage": true, "services": true, "ag": true, "documents": true, "signaler": true, "transparence": true}'::jsonb,
  syndic_phone VARCHAR(20),
  syndic_email VARCHAR(100),
  welcome_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ══════════════════════════════════════════════════════════════
-- V2: ASSEMBLY VOTES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS assembly_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assembly_id UUID NOT NULL REFERENCES assemblies(id) ON DELETE CASCADE,
  vote_id TEXT NOT NULL,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  choice TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assembly_id, vote_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_assembly_votes_assembly ON assembly_votes(assembly_id);


-- ══════════════════════════════════════════════════════════════
-- V3: CONFORMITÉ LOI 18-00
-- ══════════════════════════════════════════════════════════════

ALTER TABLE assembly_votes ADD COLUMN IF NOT EXISTS tantiemes INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS assembly_resolutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assembly_id UUID NOT NULL REFERENCES assemblies(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  majority_type VARCHAR(20) NOT NULL DEFAULT 'simple'
    CHECK (majority_type IN ('simple', 'trois_quarts', 'unanimite')),
  result VARCHAR(20) CHECK (result IN ('adoptee', 'rejetee', 'reportee')),
  pour_tantiemes INTEGER DEFAULT 0,
  contre_tantiemes INTEGER DEFAULT 0,
  abstention_tantiemes INTEGER DEFAULT 0,
  pour_count INTEGER DEFAULT 0,
  contre_count INTEGER DEFAULT 0,
  abstention_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resolutions_assembly ON assembly_resolutions(assembly_id);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft', 'vote', 'approved', 'closed')),
  total_amount NUMERIC(12,2) DEFAULT 0,
  reserve_fund_amount NUMERIC(12,2) DEFAULT 0,
  approved_at TIMESTAMPTZ,
  approved_assembly_id UUID REFERENCES assemblies(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(building_id, fiscal_year)
);

CREATE TABLE IF NOT EXISTS budget_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  account_code VARCHAR(10),
  label TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount_budgeted NUMERIC(12,2) DEFAULT 0,
  amount_actual NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_budget_lines_budget ON budget_lines(budget_id);

CREATE TABLE IF NOT EXISTS copropriete_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Règlement de copropriété',
  file_url TEXT,
  annexes JSONB DEFAULT '[]',
  adopted_at DATE,
  last_modified_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(building_id)
);

CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  policy_number VARCHAR(50),
  insurer TEXT NOT NULL,
  coverage_type VARCHAR(50) DEFAULT 'multirisque',
  premium_amount NUMERIC(10,2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_alert_days INTEGER DEFAULT 30,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insurance_building ON insurance_policies(building_id);

CREATE TABLE IF NOT EXISTS syndic_mandates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  syndic_name TEXT NOT NULL,
  syndic_type VARCHAR(20) DEFAULT 'benevole'
    CHECK (syndic_type IN ('benevole', 'professionnel')),
  deputy_name TEXT,
  elected_at DATE NOT NULL,
  mandate_end DATE NOT NULL,
  elected_assembly_id UUID REFERENCES assemblies(id),
  remuneration NUMERIC(10,2),
  contract_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mandate_building ON syndic_mandates(building_id);

CREATE TABLE IF NOT EXISTS urgent_works (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incidents(id),
  title TEXT NOT NULL,
  description TEXT,
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  status VARCHAR(20) DEFAULT 'declared'
    CHECK (status IN ('declared', 'approved', 'in_progress', 'completed')),
  declared_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  justification TEXT NOT NULL,
  supplier TEXT,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_urgent_works_building ON urgent_works(building_id);


-- ══════════════════════════════════════════════════════════════
-- V4: PUSH SUBSCRIPTIONS + ACCOUNT CODES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL DEFAULT '',
  auth TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (profile_id, endpoint)
);

CREATE TABLE IF NOT EXISTS account_codes (
  code VARCHAR(10) PRIMARY KEY,
  label TEXT NOT NULL,
  class INTEGER NOT NULL CHECK (class BETWEEN 1 AND 7),
  class_name TEXT NOT NULL
);

INSERT INTO account_codes (code, label, class, class_name) VALUES
  ('1110', 'Fonds de roulement', 1, 'Financement permanent'),
  ('1150', 'Fonds de réserve', 1, 'Financement permanent'),
  ('1160', 'Fonds travaux (loi 106-12)', 1, 'Financement permanent'),
  ('1400', 'Emprunts', 1, 'Financement permanent'),
  ('2300', 'Installations techniques parties communes', 2, 'Actif immobilisé'),
  ('2340', 'Matériel et outillage', 2, 'Actif immobilisé'),
  ('2350', 'Mobilier parties communes', 2, 'Actif immobilisé'),
  ('3421', 'Copropriétaires — appels à payer', 3, 'Actif circulant'),
  ('3424', 'Copropriétaires — avances versées', 3, 'Actif circulant'),
  ('3450', 'Débiteurs divers', 3, 'Actif circulant'),
  ('4411', 'Fournisseurs', 4, 'Passif circulant'),
  ('4432', 'Rémunération syndic à payer', 4, 'Passif circulant'),
  ('4441', 'Charges sociales à payer', 4, 'Passif circulant'),
  ('4452', 'État — impôts et taxes', 4, 'Passif circulant'),
  ('5141', 'Compte bancaire copropriété', 5, 'Trésorerie'),
  ('5161', 'Caisse', 5, 'Trésorerie'),
  ('5165', 'Compte livret épargne (fonds travaux)', 5, 'Trésorerie'),
  ('6110', 'Achats de fournitures', 6, 'Charges'),
  ('6131', 'Eau', 6, 'Charges'),
  ('6132', 'Électricité parties communes', 6, 'Charges'),
  ('6133', 'Gaz', 6, 'Charges'),
  ('6134', 'Carburant (groupe électrogène)', 6, 'Charges'),
  ('6142', 'Entretien et réparations', 6, 'Charges'),
  ('6144', 'Primes d''assurance', 6, 'Charges'),
  ('6145', 'Honoraires syndic professionnel', 6, 'Charges'),
  ('6147', 'Gardiennage et sécurité', 6, 'Charges'),
  ('6148', 'Nettoyage parties communes', 6, 'Charges'),
  ('6161', 'Ascenseur — contrat maintenance', 6, 'Charges'),
  ('6171', 'Salaires personnel immeuble', 6, 'Charges'),
  ('6174', 'Charges sociales', 6, 'Charges'),
  ('6380', 'Impôts et taxes', 6, 'Charges'),
  ('6590', 'Créances irrécouvrables', 6, 'Charges'),
  ('6700', 'Charges exceptionnelles', 6, 'Charges'),
  ('7140', 'Appels de fonds — charges courantes', 7, 'Produits'),
  ('7142', 'Appels de fonds — travaux', 7, 'Produits'),
  ('7150', 'Cotisation fonds de réserve', 7, 'Produits'),
  ('7380', 'Produits financiers (intérêts)', 7, 'Produits'),
  ('7580', 'Produits divers (antenne, pub…)', 7, 'Produits'),
  ('7700', 'Produits exceptionnels', 7, 'Produits')
ON CONFLICT (code) DO NOTHING;

-- Tantiemes trigger
CREATE OR REPLACE FUNCTION check_tantiemes_sum()
RETURNS TRIGGER AS $$
DECLARE
  total_tantiemes INTEGER;
BEGIN
  SELECT COALESCE(SUM(tantiemes), 0) INTO total_tantiemes
  FROM units
  WHERE building_id = NEW.building_id AND id != NEW.id;
  total_tantiemes := total_tantiemes + COALESCE(NEW.tantiemes, 0);
  IF total_tantiemes > 10000 THEN
    RAISE EXCEPTION 'Total tantièmes for building cannot exceed 10000 (current: %)', total_tantiemes;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_tantiemes ON units;
CREATE TRIGGER trg_check_tantiemes
  BEFORE INSERT OR UPDATE OF tantiemes ON units
  FOR EACH ROW
  EXECUTE FUNCTION check_tantiemes_sum();

-- Unique membership constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_memberships_profile_building'
  ) THEN
    ALTER TABLE memberships ADD CONSTRAINT uq_memberships_profile_building UNIQUE (profile_id, building_id);
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;


-- ══════════════════════════════════════════════════════════════
-- PERFORMANCE INDEXES
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_charges_unit_id ON charges(unit_id);
CREATE INDEX IF NOT EXISTS idx_charges_building_id ON charges(building_id);
CREATE INDEX IF NOT EXISTS idx_charges_status ON charges(status);
CREATE INDEX IF NOT EXISTS idx_memberships_profile_building ON memberships(profile_id, building_id);
CREATE INDEX IF NOT EXISTS idx_memberships_unit_id ON memberships(unit_id);
CREATE INDEX IF NOT EXISTS idx_memberships_building_id ON memberships(building_id);
CREATE INDEX IF NOT EXISTS idx_posts_building_created ON posts(building_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_building_created ON incidents(building_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_created ON notifications(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_building_date ON ledger_entries(building_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_dunning_unit_sent ON dunning_logs(unit_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_dunning_building ON dunning_logs(building_id);
CREATE INDEX IF NOT EXISTS idx_documents_building ON documents(building_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assemblies_building_date ON assemblies(building_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_building ON budgets(building_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_profile ON push_subscriptions(profile_id);


-- ══════════════════════════════════════════════════════════════
-- RLS: ENABLE ON ALL TABLES
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
ALTER TABLE assembly_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dunning_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE copropriete_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE syndic_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════
-- V6: SECURITY — DENY ANON ON ALL DATA TABLES
-- (service_role bypasses RLS, anon blocked)
-- ══════════════════════════════════════════════════════════════

CREATE POLICY "buildings_deny_anon" ON buildings FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "profiles_deny_anon" ON profiles FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "units_deny_anon" ON units FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "memberships_deny_anon" ON memberships FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "charges_deny_anon" ON charges FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "incidents_deny_anon" ON incidents FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "posts_deny_anon" ON posts FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "notif_deny_anon" ON notifications FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "ledger_deny_anon" ON ledger_entries FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "docs_deny_anon" ON documents FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "ag_deny_anon" ON assemblies FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "codes_deny_anon" ON access_codes FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "dunning_deny_anon" ON dunning_logs FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "settings_deny_anon" ON building_settings FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "pcomments_deny_anon" ON post_comments FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "icomments_deny_anon" ON incident_comments FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "votes_deny_anon" ON assembly_votes FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "resolutions_deny_anon" ON assembly_resolutions FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "budgets_deny_anon" ON budget_lines FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "blines_deny_anon" ON budget_lines FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "insurance_deny_anon" ON insurance_policies FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "mandates_deny_anon" ON syndic_mandates FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "uw_deny_anon" ON urgent_works FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "rules_deny_anon" ON copropriete_rules FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "push_deny_anon" ON push_subscriptions FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "payments_deny_anon" ON payments FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "feedback_deny_anon" ON feedback FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "ratelimits_deny_anon" ON rate_limits FOR ALL TO anon USING (false) WITH CHECK (false);

-- Account codes & providers: public read-only
CREATE POLICY "acodes_read" ON account_codes FOR SELECT TO anon USING (true);
CREATE POLICY "providers_read" ON providers FOR SELECT TO anon USING (true);


-- ══════════════════════════════════════════════════════════════
-- V7: BETA INVITES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS beta_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_beta_invites_code ON beta_invites(code);
ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beta_deny_anon" ON beta_invites FOR ALL TO anon USING (false) WITH CHECK (false);


-- ══════════════════════════════════════════════════════════════
-- V8: OTP CODES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  attempts INT DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "otp_deny_anon" ON otp_codes FOR ALL TO anon USING (false) WITH CHECK (false);


-- ══════════════════════════════════════════════════════════════
-- V9: BUILDING SETTINGS COLUMNS
-- ══════════════════════════════════════════════════════════════

ALTER TABLE building_settings ADD COLUMN IF NOT EXISTS incident_categories TEXT[];
ALTER TABLE building_settings ADD COLUMN IF NOT EXISTS expense_categories TEXT[];
ALTER TABLE building_settings ADD COLUMN IF NOT EXISTS charge_categories TEXT[];
ALTER TABLE building_settings ADD COLUMN IF NOT EXISTS relance_message TEXT;
ALTER TABLE building_settings ADD COLUMN IF NOT EXISTS gardien_name VARCHAR(200);
ALTER TABLE building_settings ADD COLUMN IF NOT EXISTS gardien_phone VARCHAR(20);
ALTER TABLE building_settings ADD COLUMN IF NOT EXISTS gardien_hours VARCHAR(200);
ALTER TABLE building_settings ADD COLUMN IF NOT EXISTS gardien JSONB;
ALTER TABLE building_settings ADD COLUMN IF NOT EXISTS notifications JSONB;


-- ══════════════════════════════════════════════════════════════
-- V10: POST LIKES (server-side dedup)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_post_likes_profile ON post_likes(profile_id);
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_likes_deny_anon" ON post_likes FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION like_post(p_post_id UUID, p_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  inserted BOOLEAN;
BEGIN
  INSERT INTO post_likes (post_id, profile_id)
  VALUES (p_post_id, p_profile_id)
  ON CONFLICT (post_id, profile_id) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = p_post_id;
  END IF;
  RETURN inserted;
END;
$$ LANGUAGE plpgsql;


-- ══════════════════════════════════════════════════════════════
-- DONE! All tables, indexes, RLS policies, and functions created.
-- ══════════════════════════════════════════════════════════════
