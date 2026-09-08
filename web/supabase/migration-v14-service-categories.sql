-- Migration v14: Add service_categories to building_settings
-- Service categories are used for Google Places search on the resident side
-- Stored as JSONB array of {label, query} objects
-- Run in Supabase SQL Editor

ALTER TABLE building_settings ADD COLUMN IF NOT EXISTS service_categories JSONB DEFAULT '[]'::jsonb;
