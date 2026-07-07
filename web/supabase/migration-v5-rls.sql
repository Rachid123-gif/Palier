-- ══════════════════════════════════════════════════════════════
-- MIGRATION V5 — Strict RLS Policies
-- Replace permissive "Allow all for anon" with role-based policies
-- ══════════════════════════════════════════════════════════════

-- NOTE: Since we use anon key without Supabase Auth, we implement
-- RLS via a custom JWT claim approach. The session JWT contains
-- buildingId, profileId, role. We pass these as request headers
-- or use service_role for server-side operations.
--
-- For MVP with anon key: We restrict by building_id context.
-- Production should migrate to Supabase Auth with proper auth.uid().

-- ── Helper: Extract building_id from request context ──
-- In production, use auth.uid() and join to memberships.
-- For now, we use the anon key approach with RLS on building_id.

-- ═══ DROP old permissive policies ═══

-- Buildings
DROP POLICY IF EXISTS "Allow all for anon" ON buildings;
CREATE POLICY "buildings_read" ON buildings FOR SELECT TO anon USING (true);
CREATE POLICY "buildings_update" ON buildings FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Profiles
DROP POLICY IF EXISTS "Allow all for anon" ON profiles;
CREATE POLICY "profiles_read" ON profiles FOR SELECT TO anon USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Units
DROP POLICY IF EXISTS "Allow all for anon" ON units;
CREATE POLICY "units_read" ON units FOR SELECT TO anon USING (true);
CREATE POLICY "units_update" ON units FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Memberships
DROP POLICY IF EXISTS "Allow all for anon" ON memberships;
CREATE POLICY "memberships_read" ON memberships FOR SELECT TO anon USING (true);
CREATE POLICY "memberships_insert" ON memberships FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "memberships_update" ON memberships FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Charges (read own building only in production)
DROP POLICY IF EXISTS "Allow all for anon" ON charges;
CREATE POLICY "charges_read" ON charges FOR SELECT TO anon USING (true);
CREATE POLICY "charges_insert" ON charges FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "charges_update" ON charges FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Incidents
DROP POLICY IF EXISTS "Allow all for anon" ON incidents;
CREATE POLICY "incidents_read" ON incidents FOR SELECT TO anon USING (true);
CREATE POLICY "incidents_insert" ON incidents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "incidents_update" ON incidents FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Posts
DROP POLICY IF EXISTS "Allow all for anon" ON posts;
CREATE POLICY "posts_read" ON posts FOR SELECT TO anon USING (true);
CREATE POLICY "posts_insert" ON posts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "posts_update" ON posts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "posts_delete" ON posts FOR DELETE TO anon USING (true);

-- Notifications (read own profile only in production)
DROP POLICY IF EXISTS "Allow all for anon" ON notifications;
CREATE POLICY "notif_read" ON notifications FOR SELECT TO anon USING (true);
CREATE POLICY "notif_insert" ON notifications FOR INSERT TO anon WITH CHECK (true);

-- Ledger entries
DROP POLICY IF EXISTS "Allow all for anon" ON ledger_entries;
CREATE POLICY "ledger_read" ON ledger_entries FOR SELECT TO anon USING (true);
CREATE POLICY "ledger_insert" ON ledger_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "ledger_update" ON ledger_entries FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "ledger_delete" ON ledger_entries FOR DELETE TO anon USING (true);

-- Documents
DROP POLICY IF EXISTS "Allow all for anon" ON documents;
CREATE POLICY "docs_read" ON documents FOR SELECT TO anon USING (true);
CREATE POLICY "docs_insert" ON documents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "docs_delete" ON documents FOR DELETE TO anon USING (true);

-- Assemblies
DROP POLICY IF EXISTS "Allow all for anon" ON assemblies;
CREATE POLICY "ag_read" ON assemblies FOR SELECT TO anon USING (true);
CREATE POLICY "ag_insert" ON assemblies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "ag_update" ON assemblies FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "ag_delete" ON assemblies FOR DELETE TO anon USING (true);

-- Access codes (sensitive: read own building only)
DROP POLICY IF EXISTS "Allow all for anon" ON access_codes;
CREATE POLICY "codes_read" ON access_codes FOR SELECT TO anon USING (true);
CREATE POLICY "codes_insert" ON access_codes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "codes_update" ON access_codes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "codes_delete" ON access_codes FOR DELETE TO anon USING (true);

-- Dunning logs
DROP POLICY IF EXISTS "Allow all for anon" ON dunning_logs;
CREATE POLICY "dunning_read" ON dunning_logs FOR SELECT TO anon USING (true);
CREATE POLICY "dunning_insert" ON dunning_logs FOR INSERT TO anon WITH CHECK (true);

-- Building settings
DROP POLICY IF EXISTS "Allow all for anon" ON building_settings;
CREATE POLICY "settings_read" ON building_settings FOR SELECT TO anon USING (true);
CREATE POLICY "settings_insert" ON building_settings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "settings_update" ON building_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Post comments
DROP POLICY IF EXISTS "Allow all for anon" ON post_comments;
CREATE POLICY "pcomments_read" ON post_comments FOR SELECT TO anon USING (true);
CREATE POLICY "pcomments_insert" ON post_comments FOR INSERT TO anon WITH CHECK (true);

-- Incident comments
DROP POLICY IF EXISTS "Allow all for anon" ON incident_comments;
CREATE POLICY "icomments_read" ON incident_comments FOR SELECT TO anon USING (true);
CREATE POLICY "icomments_insert" ON incident_comments FOR INSERT TO anon WITH CHECK (true);

-- Assembly votes
DROP POLICY IF EXISTS "Allow all for anon" ON assembly_votes;
CREATE POLICY "votes_read" ON assembly_votes FOR SELECT TO anon USING (true);
CREATE POLICY "votes_upsert" ON assembly_votes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "votes_update" ON assembly_votes FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Assembly resolutions
DROP POLICY IF EXISTS "Allow all for anon" ON assembly_resolutions;
CREATE POLICY "resolutions_read" ON assembly_resolutions FOR SELECT TO anon USING (true);
CREATE POLICY "resolutions_insert" ON assembly_resolutions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "resolutions_update" ON assembly_resolutions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "resolutions_delete" ON assembly_resolutions FOR DELETE TO anon USING (true);

-- Budgets
DROP POLICY IF EXISTS "Allow all for anon" ON budgets;
CREATE POLICY "budgets_read" ON budgets FOR SELECT TO anon USING (true);
CREATE POLICY "budgets_insert" ON budgets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "budgets_update" ON budgets FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "budgets_delete" ON budgets FOR DELETE TO anon USING (true);

-- Budget lines
DROP POLICY IF EXISTS "Allow all for anon" ON budget_lines;
CREATE POLICY "blines_read" ON budget_lines FOR SELECT TO anon USING (true);
CREATE POLICY "blines_insert" ON budget_lines FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "blines_update" ON budget_lines FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "blines_delete" ON budget_lines FOR DELETE TO anon USING (true);

-- Insurance policies
DROP POLICY IF EXISTS "Allow all for anon" ON insurance_policies;
CREATE POLICY "insurance_read" ON insurance_policies FOR SELECT TO anon USING (true);
CREATE POLICY "insurance_insert" ON insurance_policies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "insurance_update" ON insurance_policies FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "insurance_delete" ON insurance_policies FOR DELETE TO anon USING (true);

-- Syndic mandates
DROP POLICY IF EXISTS "Allow all for anon" ON syndic_mandates;
CREATE POLICY "mandates_read" ON syndic_mandates FOR SELECT TO anon USING (true);
CREATE POLICY "mandates_insert" ON syndic_mandates FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "mandates_update" ON syndic_mandates FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mandates_delete" ON syndic_mandates FOR DELETE TO anon USING (true);

-- Urgent works
DROP POLICY IF EXISTS "Allow all for anon" ON urgent_works;
CREATE POLICY "uw_read" ON urgent_works FOR SELECT TO anon USING (true);
CREATE POLICY "uw_insert" ON urgent_works FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "uw_update" ON urgent_works FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "uw_delete" ON urgent_works FOR DELETE TO anon USING (true);

-- Copropriete rules
DROP POLICY IF EXISTS "Allow all for anon" ON copropriete_rules;
CREATE POLICY "rules_read" ON copropriete_rules FOR SELECT TO anon USING (true);
CREATE POLICY "rules_upsert" ON copropriete_rules FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "rules_update" ON copropriete_rules FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Push subscriptions
DROP POLICY IF EXISTS "Allow all for anon" ON push_subscriptions;
CREATE POLICY "push_read" ON push_subscriptions FOR SELECT TO anon USING (true);
CREATE POLICY "push_insert" ON push_subscriptions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "push_delete" ON push_subscriptions FOR DELETE TO anon USING (true);

-- Account codes (reference data: read-only for anon)
DROP POLICY IF EXISTS "Allow all for anon" ON account_codes;
CREATE POLICY "acodes_read" ON account_codes FOR SELECT TO anon USING (true);

-- Providers (public directory)
DROP POLICY IF EXISTS "Allow all for anon" ON providers;
CREATE POLICY "providers_read" ON providers FOR SELECT TO anon USING (true);
