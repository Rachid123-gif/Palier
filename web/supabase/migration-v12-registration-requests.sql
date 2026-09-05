-- v12: Registration requests (syndic approval flow)
-- Run this migration on Supabase SQL Editor

CREATE TABLE IF NOT EXISTS registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  building_name TEXT NOT NULL,
  city TEXT NOT NULL,
  lots_count INTEGER NOT NULL DEFAULT 2,
  syndic_unit TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  beta_code TEXT,
  access_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_requests_phone ON registration_requests(phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_registration_requests_access_code ON registration_requests(access_code) WHERE access_code IS NOT NULL;
