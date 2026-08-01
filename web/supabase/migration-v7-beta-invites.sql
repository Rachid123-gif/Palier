-- ============================================================
-- PALIER — Migration v7: Codes d'invitation beta individuels
-- À exécuter dans Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS beta_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  used_at TIMESTAMPTZ,              -- NULL = disponible
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beta_invites_code ON beta_invites(code);

-- RLS: bloquer l'accès anon direct
ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beta_deny_anon" ON beta_invites FOR ALL TO anon USING (false) WITH CHECK (false);
