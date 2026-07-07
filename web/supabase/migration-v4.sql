-- ══════════════════════════════════════════════════════════════
-- MIGRATION V4 — Indexes, constraints, push subscriptions
-- Décret 2.23.700 compliance + performance + push notifications
-- ══════════════════════════════════════════════════════════════

-- ── Push subscriptions for Web Push API ──
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL DEFAULT '',
  auth TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (profile_id, endpoint)
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON push_subscriptions FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── Account codes reference table ──
CREATE TABLE IF NOT EXISTS account_codes (
  code VARCHAR(10) PRIMARY KEY,
  label TEXT NOT NULL,
  class INTEGER NOT NULL CHECK (class BETWEEN 1 AND 7),
  class_name TEXT NOT NULL
);

-- Seed plan comptable (if empty)
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

-- ══════════════════════════════════════════════════════════════
-- PERFORMANCE INDEXES
-- ══════════════════════════════════════════════════════════════

-- Charges: lookup by unit + building
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

-- Assembly resolutions: lookup by assembly
CREATE INDEX IF NOT EXISTS idx_resolutions_assembly ON assembly_resolutions(assembly_id);

-- Budget lines: budget lookup
CREATE INDEX IF NOT EXISTS idx_budget_lines_budget ON budget_lines(budget_id);

-- Budgets: building lookup
CREATE INDEX IF NOT EXISTS idx_budgets_building ON budgets(building_id);

-- Insurance: building + dates
CREATE INDEX IF NOT EXISTS idx_insurance_building ON insurance_policies(building_id);

-- Urgent works: building
CREATE INDEX IF NOT EXISTS idx_urgent_works_building ON urgent_works(building_id);

-- Push subscriptions: profile lookup
CREATE INDEX IF NOT EXISTS idx_push_subs_profile ON push_subscriptions(profile_id);

-- ══════════════════════════════════════════════════════════════
-- DATA INTEGRITY CONSTRAINTS
-- ══════════════════════════════════════════════════════════════

-- Unique membership per profile+building (prevent duplicates)
-- Using DO NOTHING since constraint might already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_memberships_profile_building'
  ) THEN
    ALTER TABLE memberships ADD CONSTRAINT uq_memberships_profile_building UNIQUE (profile_id, building_id);
  END IF;
EXCEPTION WHEN others THEN
  -- Constraint might fail if duplicates exist; skip gracefully
  NULL;
END $$;

-- Tantiemes validation: ensure sum per building doesn't exceed 10000 (millièmes)
-- We use a trigger function for this
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
