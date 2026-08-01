-- ============================================================
-- PALIER — Migration v8: OTP codes en base (au lieu de mémoire)
-- À exécuter dans Supabase SQL Editor
-- ============================================================

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

-- Auto-cleanup : supprimer les OTP expirés (optionnel, peut être fait via cron Supabase)
-- SELECT cron.schedule('cleanup-otp', '*/10 * * * *', 'DELETE FROM otp_codes WHERE expires_at < now()');

-- RLS: bloquer l'accès anon direct
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "otp_deny_anon" ON otp_codes FOR ALL TO anon USING (false) WITH CHECK (false);
