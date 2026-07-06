-- ============================================================
-- PALIER — Migration V2: auth, commentaires incidents, votes AG, RLS
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Table des commentaires d'incidents (discussion syndic ↔ résident)
CREATE TABLE IF NOT EXISTS incident_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  avatar_color VARCHAR(10) DEFAULT '#1e5b50',
  body TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'resident' CHECK (role IN ('resident', 'syndic')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incident_comments_incident ON incident_comments(incident_id);

-- Fonction pour mettre à jour le compteur de messages
CREATE OR REPLACE FUNCTION increment_incident_messages(incident_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE incidents SET messages_count = COALESCE(messages_count, 0) + 1
  WHERE id = incident_id_input;
END;
$$ LANGUAGE plpgsql;

-- 2. Table des votes AG (persistance des votes résidents)
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

-- 3. Table feedback (si elle n'existe pas encore)
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID REFERENCES buildings(id),
  type VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  sender_name TEXT,
  sender_phone TEXT,
  sender_email TEXT,
  contact_preference VARCHAR(10),
  building_name TEXT,
  sender_role VARCHAR(20) DEFAULT 'resident',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Activer RLS sur toutes les tables principales
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

-- 5. Politique RLS permissive pour le MVP (anon key = lecture/écriture)
-- En production, remplacer par des politiques basées sur auth.uid()
CREATE POLICY "Allow all for anon" ON buildings FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON memberships FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON units FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON charges FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON incidents FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON incident_comments FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON posts FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON post_comments FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON assemblies FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON assembly_votes FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON ledger_entries FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON access_codes FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON building_settings FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON dunning_logs FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON feedback FOR ALL USING (true);

-- 6. S'assurer que messages_count existe sur incidents
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS messages_count INT DEFAULT 0;
