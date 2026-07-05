-- ============================================================
-- PALIER — Migration: codes d'accès + configuration résidence
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Table des codes d'accès (générés par le syndic pour les résidents)
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'syndic')),
  label VARCHAR(100),            -- ex: "Apt 3B - Mohamed"
  used_by UUID REFERENCES profiles(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_building ON access_codes(building_id);

-- 2. Table configuration résidence (paramètres personnalisés par le syndic)
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

-- 3. Insérer la config par défaut pour le bâtiment démo
INSERT INTO building_settings (building_id)
VALUES ('00000000-0000-0000-0000-0000000000b1')
ON CONFLICT (building_id) DO NOTHING;

-- 4. Insérer un code syndic démo
INSERT INTO access_codes (building_id, code, role, label)
VALUES ('00000000-0000-0000-0000-0000000000b1', 'SYNDIC2026', 'syndic', 'Syndic principal')
ON CONFLICT (code) DO NOTHING;

-- 5. Insérer quelques codes résidents démo
INSERT INTO access_codes (building_id, code, role, label) VALUES
  ('00000000-0000-0000-0000-0000000000b1', 'RES-A3B-01', 'resident', 'Apt 3B - Yassine'),
  ('00000000-0000-0000-0000-0000000000b1', 'RES-A1A-02', 'resident', 'Apt 1A - Fatima'),
  ('00000000-0000-0000-0000-0000000000b1', 'RES-A2C-03', 'resident', 'Apt 2C - Omar')
ON CONFLICT (code) DO NOTHING;

-- 6. Ajouter status + deactivated_at à memberships (désactivation résident)
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- 7. Migrer urgence "high" → "urgent" (suppression du niveau redondant)
UPDATE incidents SET urgency = 'urgent' WHERE urgency = 'high';

-- 8. Migrer statut "in_progress" → "open" (simplification ouvert/résolu)
UPDATE incidents SET status = 'open' WHERE status = 'in_progress';

-- 9. Politique RLS (optionnelle pour le MVP, à activer en prod)
-- ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE building_settings ENABLE ROW LEVEL SECURITY;
