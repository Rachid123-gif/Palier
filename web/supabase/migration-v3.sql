-- ============================================================
-- PALIER — Migration V3: Conformité Loi 18-00, Loi 106-12, Décret 2.23.700
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- ═══════════════════════════════════════════════════
-- 1. TANTIEMES (millièmes) sur les lots
-- ═══════════════════════════════════════════════════
ALTER TABLE units ADD COLUMN IF NOT EXISTS tantiemes INTEGER DEFAULT 0;

-- ═══════════════════════════════════════════════════
-- 2. ASSEMBLEES — champs conformité
-- ═══════════════════════════════════════════════════
ALTER TABLE assemblies ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'ordinaire';
ALTER TABLE assemblies ADD COLUMN IF NOT EXISTS convocation_sent_at TIMESTAMPTZ;
ALTER TABLE assemblies ADD COLUMN IF NOT EXISTS pv_sent_at TIMESTAMPTZ;
ALTER TABLE assemblies ADD COLUMN IF NOT EXISTS pv_distributed BOOLEAN DEFAULT false;
ALTER TABLE assemblies ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

-- Votes: poids tantièmes
ALTER TABLE assembly_votes ADD COLUMN IF NOT EXISTS tantiemes INTEGER DEFAULT 0;

-- Résolutions (remplace le JSONB votes pour la conformité 3 majorités)
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

-- ═══════════════════════════════════════════════════
-- 3. COMPTABILITÉ (Décret 2.23.700)
-- ═══════════════════════════════════════════════════
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS annual_budget NUMERIC(12,2) DEFAULT 0;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS accounting_tier VARCHAR(10) DEFAULT 'tier1';

ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS account_code VARCHAR(10);
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS fiscal_year INTEGER;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS is_reserve_fund BOOLEAN DEFAULT false;

-- ═══════════════════════════════════════════════════
-- 4. BUDGET PRÉVISIONNEL
-- ═══════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════
-- 5. RÈGLEMENT DE COPROPRIÉTÉ
-- ═══════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════
-- 6. ASSURANCE
-- ═══════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════
-- 7. MANDAT SYNDIC
-- ═══════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════
-- 8. TRAVAUX URGENTS
-- ═══════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════
-- 9. RLS pour les nouvelles tables
-- ═══════════════════════════════════════════════════
ALTER TABLE assembly_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE copropriete_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE syndic_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON assembly_resolutions FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON budgets FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON budget_lines FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON copropriete_rules FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON insurance_policies FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON syndic_mandates FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON urgent_works FOR ALL USING (true);
