-- ============================================================================
-- Migration 008: Row Level Security (RLS) Policies
-- Secures all tables against unauthorized Data API mutations while allowing
-- read access for frontend dashboards and realtime subscriptions.
-- ============================================================================

-- ── 1. Enable RLS on all tables ─────────────────────────────────────────────
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = '_resq_migrations') THEN
        ALTER TABLE _resq_migrations ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ── 2. Agencies Policies ─────────────────────────────────────────────────────
-- Public read access: anyone (anon & authenticated) can view participating agencies
DROP POLICY IF EXISTS "Allow public read access on agencies" ON agencies;
CREATE POLICY "Allow public read access on agencies"
    ON agencies FOR SELECT
    TO anon, authenticated
    USING (true);

-- ── 3. Assets Policies ───────────────────────────────────────────────────────
-- Public read access: only non-deleted assets are visible
DROP POLICY IF EXISTS "Allow public read access on assets" ON assets;
CREATE POLICY "Allow public read access on assets"
    ON assets FOR SELECT
    TO anon, authenticated
    USING (is_deleted = FALSE);

-- ── 4. Incidents Policies ────────────────────────────────────────────────────
-- Public read access: view incident progress, triage, and status
DROP POLICY IF EXISTS "Allow public read access on incidents" ON incidents;
CREATE POLICY "Allow public read access on incidents"
    ON incidents FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow public distress report insertion (for field app and web SOS forms)
DROP POLICY IF EXISTS "Allow public insert on incidents" ON incidents;
CREATE POLICY "Allow public insert on incidents"
    ON incidents FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- ── 5. Allocations Policies ──────────────────────────────────────────────────
-- Public read access: track asset dispatch and arrival
DROP POLICY IF EXISTS "Allow public read access on allocations" ON allocations;
CREATE POLICY "Allow public read access on allocations"
    ON allocations FOR SELECT
    TO anon, authenticated
    USING (true);

-- Note: All INSERT, UPDATE, DELETE on agencies, assets, allocations,
-- and UPDATE, DELETE on incidents are restricted to service_role,
-- which bypasses RLS automatically in PostgreSQL.
