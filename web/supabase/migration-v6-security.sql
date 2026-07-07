-- ══════════════════════════════════════════════════════════════
-- MIGRATION V6 — Security Hardening
-- ══════════════════════════════════════════════════════════════
--
-- With service_role key used server-side, RLS is bypassed for
-- server operations. These policies are DEFENSE-IN-DEPTH for the
-- anon role (used only for client-side Storage uploads).
--
-- Primary authorization is enforced in application code:
-- - "use server" actions verify session via requireAuth()
-- - Middleware enforces route access + CSRF protection
-- - API routes verify session cookies
-- ══════════════════════════════════════════════════════════════

-- ═══ Lock down anon role: READ-ONLY on data tables ═══
-- The anon key is only used client-side for Storage uploads.
-- It should NOT be able to read or write data tables directly.

-- Buildings: no anon access (server fetches via service_role)
DROP POLICY IF EXISTS "buildings_read" ON buildings;
DROP POLICY IF EXISTS "buildings_update" ON buildings;
CREATE POLICY "buildings_deny_anon" ON buildings FOR ALL TO anon USING (false) WITH CHECK (false);

-- Profiles: no anon access
DROP POLICY IF EXISTS "profiles_read" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_deny_anon" ON profiles FOR ALL TO anon USING (false) WITH CHECK (false);

-- Units: no anon access
DROP POLICY IF EXISTS "units_read" ON units;
DROP POLICY IF EXISTS "units_update" ON units;
CREATE POLICY "units_deny_anon" ON units FOR ALL TO anon USING (false) WITH CHECK (false);

-- Memberships: no anon access
DROP POLICY IF EXISTS "memberships_read" ON memberships;
DROP POLICY IF EXISTS "memberships_insert" ON memberships;
DROP POLICY IF EXISTS "memberships_update" ON memberships;
CREATE POLICY "memberships_deny_anon" ON memberships FOR ALL TO anon USING (false) WITH CHECK (false);

-- Charges: no anon access
DROP POLICY IF EXISTS "charges_read" ON charges;
DROP POLICY IF EXISTS "charges_insert" ON charges;
DROP POLICY IF EXISTS "charges_update" ON charges;
CREATE POLICY "charges_deny_anon" ON charges FOR ALL TO anon USING (false) WITH CHECK (false);

-- Incidents: no anon access
DROP POLICY IF EXISTS "incidents_read" ON incidents;
DROP POLICY IF EXISTS "incidents_insert" ON incidents;
DROP POLICY IF EXISTS "incidents_update" ON incidents;
CREATE POLICY "incidents_deny_anon" ON incidents FOR ALL TO anon USING (false) WITH CHECK (false);

-- Posts: no anon access
DROP POLICY IF EXISTS "posts_read" ON posts;
DROP POLICY IF EXISTS "posts_insert" ON posts;
DROP POLICY IF EXISTS "posts_update" ON posts;
DROP POLICY IF EXISTS "posts_delete" ON posts;
CREATE POLICY "posts_deny_anon" ON posts FOR ALL TO anon USING (false) WITH CHECK (false);

-- Notifications: no anon access
DROP POLICY IF EXISTS "notif_read" ON notifications;
DROP POLICY IF EXISTS "notif_insert" ON notifications;
CREATE POLICY "notif_deny_anon" ON notifications FOR ALL TO anon USING (false) WITH CHECK (false);

-- Ledger entries: no anon access
DROP POLICY IF EXISTS "ledger_read" ON ledger_entries;
DROP POLICY IF EXISTS "ledger_insert" ON ledger_entries;
DROP POLICY IF EXISTS "ledger_update" ON ledger_entries;
DROP POLICY IF EXISTS "ledger_delete" ON ledger_entries;
CREATE POLICY "ledger_deny_anon" ON ledger_entries FOR ALL TO anon USING (false) WITH CHECK (false);

-- Documents: no anon access
DROP POLICY IF EXISTS "docs_read" ON documents;
DROP POLICY IF EXISTS "docs_insert" ON documents;
DROP POLICY IF EXISTS "docs_delete" ON documents;
CREATE POLICY "docs_deny_anon" ON documents FOR ALL TO anon USING (false) WITH CHECK (false);

-- Assemblies: no anon access
DROP POLICY IF EXISTS "ag_read" ON assemblies;
DROP POLICY IF EXISTS "ag_insert" ON assemblies;
DROP POLICY IF EXISTS "ag_update" ON assemblies;
DROP POLICY IF EXISTS "ag_delete" ON assemblies;
CREATE POLICY "ag_deny_anon" ON assemblies FOR ALL TO anon USING (false) WITH CHECK (false);

-- Access codes: no anon access
DROP POLICY IF EXISTS "codes_read" ON access_codes;
DROP POLICY IF EXISTS "codes_insert" ON access_codes;
DROP POLICY IF EXISTS "codes_update" ON access_codes;
DROP POLICY IF EXISTS "codes_delete" ON access_codes;
CREATE POLICY "codes_deny_anon" ON access_codes FOR ALL TO anon USING (false) WITH CHECK (false);

-- Dunning logs: no anon access
DROP POLICY IF EXISTS "dunning_read" ON dunning_logs;
DROP POLICY IF EXISTS "dunning_insert" ON dunning_logs;
CREATE POLICY "dunning_deny_anon" ON dunning_logs FOR ALL TO anon USING (false) WITH CHECK (false);

-- Building settings: no anon access
DROP POLICY IF EXISTS "settings_read" ON building_settings;
DROP POLICY IF EXISTS "settings_insert" ON building_settings;
DROP POLICY IF EXISTS "settings_update" ON building_settings;
CREATE POLICY "settings_deny_anon" ON building_settings FOR ALL TO anon USING (false) WITH CHECK (false);

-- Post comments: no anon access
DROP POLICY IF EXISTS "pcomments_read" ON post_comments;
DROP POLICY IF EXISTS "pcomments_insert" ON post_comments;
CREATE POLICY "pcomments_deny_anon" ON post_comments FOR ALL TO anon USING (false) WITH CHECK (false);

-- Incident comments: no anon access
DROP POLICY IF EXISTS "icomments_read" ON incident_comments;
DROP POLICY IF EXISTS "icomments_insert" ON incident_comments;
CREATE POLICY "icomments_deny_anon" ON incident_comments FOR ALL TO anon USING (false) WITH CHECK (false);

-- Assembly votes: no anon access
DROP POLICY IF EXISTS "votes_read" ON assembly_votes;
DROP POLICY IF EXISTS "votes_upsert" ON assembly_votes;
DROP POLICY IF EXISTS "votes_update" ON assembly_votes;
CREATE POLICY "votes_deny_anon" ON assembly_votes FOR ALL TO anon USING (false) WITH CHECK (false);

-- Assembly resolutions: no anon access
DROP POLICY IF EXISTS "resolutions_read" ON assembly_resolutions;
DROP POLICY IF EXISTS "resolutions_insert" ON assembly_resolutions;
DROP POLICY IF EXISTS "resolutions_update" ON assembly_resolutions;
DROP POLICY IF EXISTS "resolutions_delete" ON assembly_resolutions;
CREATE POLICY "resolutions_deny_anon" ON assembly_resolutions FOR ALL TO anon USING (false) WITH CHECK (false);

-- Budgets: no anon access
DROP POLICY IF EXISTS "budgets_read" ON budgets;
DROP POLICY IF EXISTS "budgets_insert" ON budgets;
DROP POLICY IF EXISTS "budgets_update" ON budgets;
DROP POLICY IF EXISTS "budgets_delete" ON budgets;
CREATE POLICY "budgets_deny_anon" ON budgets FOR ALL TO anon USING (false) WITH CHECK (false);

-- Budget lines: no anon access
DROP POLICY IF EXISTS "blines_read" ON budget_lines;
DROP POLICY IF EXISTS "blines_insert" ON budget_lines;
DROP POLICY IF EXISTS "blines_update" ON budget_lines;
DROP POLICY IF EXISTS "blines_delete" ON budget_lines;
CREATE POLICY "blines_deny_anon" ON budget_lines FOR ALL TO anon USING (false) WITH CHECK (false);

-- Insurance policies: no anon access
DROP POLICY IF EXISTS "insurance_read" ON insurance_policies;
DROP POLICY IF EXISTS "insurance_insert" ON insurance_policies;
DROP POLICY IF EXISTS "insurance_update" ON insurance_policies;
DROP POLICY IF EXISTS "insurance_delete" ON insurance_policies;
CREATE POLICY "insurance_deny_anon" ON insurance_policies FOR ALL TO anon USING (false) WITH CHECK (false);

-- Syndic mandates: no anon access
DROP POLICY IF EXISTS "mandates_read" ON syndic_mandates;
DROP POLICY IF EXISTS "mandates_insert" ON syndic_mandates;
DROP POLICY IF EXISTS "mandates_update" ON syndic_mandates;
DROP POLICY IF EXISTS "mandates_delete" ON syndic_mandates;
CREATE POLICY "mandates_deny_anon" ON syndic_mandates FOR ALL TO anon USING (false) WITH CHECK (false);

-- Urgent works: no anon access
DROP POLICY IF EXISTS "uw_read" ON urgent_works;
DROP POLICY IF EXISTS "uw_insert" ON urgent_works;
DROP POLICY IF EXISTS "uw_update" ON urgent_works;
DROP POLICY IF EXISTS "uw_delete" ON urgent_works;
CREATE POLICY "uw_deny_anon" ON urgent_works FOR ALL TO anon USING (false) WITH CHECK (false);

-- Copropriete rules: no anon access
DROP POLICY IF EXISTS "rules_read" ON copropriete_rules;
DROP POLICY IF EXISTS "rules_upsert" ON copropriete_rules;
DROP POLICY IF EXISTS "rules_update" ON copropriete_rules;
CREATE POLICY "rules_deny_anon" ON copropriete_rules FOR ALL TO anon USING (false) WITH CHECK (false);

-- Push subscriptions: no anon access
DROP POLICY IF EXISTS "push_read" ON push_subscriptions;
DROP POLICY IF EXISTS "push_insert" ON push_subscriptions;
DROP POLICY IF EXISTS "push_delete" ON push_subscriptions;
CREATE POLICY "push_deny_anon" ON push_subscriptions FOR ALL TO anon USING (false) WITH CHECK (false);

-- Account codes: read-only reference data, keep accessible
DROP POLICY IF EXISTS "acodes_read" ON account_codes;
CREATE POLICY "acodes_read" ON account_codes FOR SELECT TO anon USING (true);

-- Providers: public directory, keep accessible
DROP POLICY IF EXISTS "providers_read" ON providers;
CREATE POLICY "providers_read" ON providers FOR SELECT TO anon USING (true);

-- ═══ Payments table (if exists) ═══
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for anon" ON payments;
  CREATE POLICY "payments_deny_anon" ON payments FOR ALL TO anon USING (false) WITH CHECK (false);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ═══ Bookings table (if exists) ═══
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for anon" ON bookings;
  CREATE POLICY "bookings_deny_anon" ON bookings FOR ALL TO anon USING (false) WITH CHECK (false);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ═══ Service requests table (if exists) ═══
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for anon" ON service_requests;
  CREATE POLICY "service_requests_deny_anon" ON service_requests FOR ALL TO anon USING (false) WITH CHECK (false);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ═══ Feedback table (if exists) ═══
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for anon" ON feedback;
  CREATE POLICY "feedback_deny_anon" ON feedback FOR ALL TO anon USING (false) WITH CHECK (false);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
