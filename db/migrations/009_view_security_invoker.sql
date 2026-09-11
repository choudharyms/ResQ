-- ============================================================================
-- Migration 009: View Security Invoker Hardening
-- Enforces caller/invoker Row Level Security (RLS) on all views in public schema.
-- In PostgreSQL 15+, setting security_invoker = true ensures that queries
-- against the view check the RLS policies of the underlying table (allocations)
-- using the permissions of the invoking user (e.g. anon, authenticated),
-- preventing any RLS bypass.
-- ============================================================================

ALTER VIEW active_allocations SET (security_invoker = true);
