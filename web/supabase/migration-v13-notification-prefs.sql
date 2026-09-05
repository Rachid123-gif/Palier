-- Migration v13: Add notification_prefs column to profiles
-- Allows server-side enforcement of resident notification preferences.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB
  DEFAULT '{"charges":true,"incidents":true,"voisinage":true,"ag":true,"syndic":true}';

COMMENT ON COLUMN profiles.notification_prefs IS
  'Resident notification preferences. Keys: charges, incidents, voisinage, ag, syndic. Values: boolean.';
