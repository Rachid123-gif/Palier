-- ══════════════════════════════════════════════════════════════
-- PALIER — Migration V9: Add missing building_settings columns
-- ══════════════════════════════════════════════════════════════
--
-- The app's Zod schema (saveBuildingSettingsSchema) expects
-- additional columns beyond what migration.sql created.
-- This migration adds them safely with IF NOT EXISTS.
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
