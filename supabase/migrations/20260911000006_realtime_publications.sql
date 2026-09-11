-- ============================================================================
-- Migration 006: Supabase Realtime Publications
-- ============================================================================
-- Only stream tables that drive live UI state changes.
-- mv_hex_equity is a materialized view — Postgres does not support CDC on views.
-- The frontend polls GET /api/equity on a 5-second interval for equity data.

ALTER PUBLICATION supabase_realtime ADD TABLE agencies;
ALTER PUBLICATION supabase_realtime ADD TABLE assets;
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE allocations;
