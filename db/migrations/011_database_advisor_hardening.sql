-- ============================================================================
-- Migration 011: Database Advisor Hardening & Performance Optimization
-- Resolves all Supabase Security, Performance, and RLS Advisor recommendations:
--
-- 1. Function Search Path Mutable:
--    Explicitly binds search_path to 'public, extensions' on stored procedures
--    to prevent search-path injection vulnerabilities.
-- 2. Materialized View in API (mv_hex_equity):
--    Revokes public Data API access from anon/authenticated, keeping it
--    strictly backend-accessible for the Node.js server and service_role.
-- 3. RLS Policy Always True (incidents):
--    Replaces unrestricted WITH CHECK (true) with domain validation
--    (status = 'Open', valid distress text, non-null GPS location).
-- 4. RLS Enabled No Policy (_resq_migrations):
--    Adds explicit administrative management policy for service_role.
-- 5. Unindexed Foreign Keys:
--    Adds covering indexes for allocations(superseded_by_id),
--    incidents(duplicate_of_id), and assets(agency_id).
-- ============================================================================

-- ── 1. Function search_path Hardening ────────────────────────────────────────
ALTER FUNCTION fn_allocate_asset(uuid, text) SET search_path = public, extensions;
ALTER FUNCTION fn_handle_asset_degradation(uuid, text) SET search_path = public, extensions;
ALTER FUNCTION fn_update_allocation_status(uuid, text, text) SET search_path = public, extensions;
ALTER FUNCTION fn_refresh_equity() SET search_path = public, extensions;

-- ── 2. Materialized View API Isolation ───────────────────────────────────────
REVOKE ALL ON mv_hex_equity FROM anon, authenticated;

-- ── 3. RLS Policy Hardening on Incidents ────────────────────────────────────
DROP POLICY IF EXISTS "Allow public insert on incidents" ON incidents;
CREATE POLICY "Allow public insert on incidents"
    ON incidents FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        status = 'Open'
        AND raw_sos_text IS NOT NULL
        AND length(trim(raw_sos_text)) > 0
        AND location IS NOT NULL
    );

-- ── 4. RLS Policy for Migration Tracking ────────────────────────────────────
DROP POLICY IF EXISTS "Service role manages migrations" ON _resq_migrations;
CREATE POLICY "Service role manages migrations"
    ON _resq_migrations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ── 5. Indexes for Unindexed Foreign Keys ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_alloc_superseded_by ON allocations(superseded_by_id);
CREATE INDEX IF NOT EXISTS idx_incidents_duplicate_of ON incidents(duplicate_of_id);
DROP INDEX IF EXISTS idx_assets_agency;
CREATE INDEX idx_assets_agency ON assets(agency_id);
