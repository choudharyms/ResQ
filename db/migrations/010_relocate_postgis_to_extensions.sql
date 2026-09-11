-- ============================================================================
-- Migration 010: Relocate PostGIS to 'extensions' Schema
-- Resolves Supabase Security Advisor Critical Issue:
-- "RLS Disabled in Public public.spatial_ref_sys"
--
-- By relocating the PostGIS extension from 'public' to 'extensions',
-- its internal catalog tables (spatial_ref_sys, geography_columns, geometry_columns)
-- are moved out of the PostgREST-exposed 'public' schema into the secure
-- 'extensions' schema, completely resolving the linter warning while preserving
-- all geospatial functionality, coordinates, and spatial indexes.
-- ============================================================================

DO $$
DECLARE
    v_postgis_schema TEXT;
BEGIN
    SELECT n.nspname INTO v_postgis_schema
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'postgis';

    IF v_postgis_schema = 'public' THEN
        -- 1. Preserve coordinate data in temporary WKT columns
        ALTER TABLE agencies ADD COLUMN IF NOT EXISTS temp_staging text;
        UPDATE agencies SET temp_staging = ST_AsText(staging_location);
        ALTER TABLE agencies DROP COLUMN staging_location;

        ALTER TABLE assets ADD COLUMN IF NOT EXISTS temp_loc text;
        UPDATE assets SET temp_loc = ST_AsText(location);
        ALTER TABLE assets DROP COLUMN location;

        ALTER TABLE incidents ADD COLUMN IF NOT EXISTS temp_loc text;
        UPDATE incidents SET temp_loc = ST_AsText(location);
        ALTER TABLE incidents DROP COLUMN location;

        -- 2. Drop PostGIS from public schema
        DROP EXTENSION postgis;

        -- 3. Install PostGIS in the standard extensions schema
        CREATE EXTENSION postgis SCHEMA extensions;

        -- 4. Restore geometry columns with native PostGIS types
        ALTER TABLE agencies ADD COLUMN staging_location GEOMETRY(Point, 4326);
        UPDATE agencies SET staging_location = ST_GeomFromText(temp_staging, 4326);
        ALTER TABLE agencies DROP COLUMN temp_staging;

        ALTER TABLE assets ADD COLUMN location GEOMETRY(Point, 4326);
        UPDATE assets SET location = ST_GeomFromText(temp_loc, 4326);
        ALTER TABLE assets DROP COLUMN temp_loc;

        ALTER TABLE incidents ADD COLUMN location GEOMETRY(Point, 4326);
        UPDATE incidents SET location = ST_GeomFromText(temp_loc, 4326);
        ALTER TABLE incidents DROP COLUMN temp_loc;

        -- 5. Restore spatial GIST indexes
        DROP INDEX IF EXISTS idx_assets_location;
        CREATE INDEX idx_assets_location ON assets USING GIST(location);

        DROP INDEX IF EXISTS idx_incidents_location;
        CREATE INDEX idx_incidents_location ON incidents USING GIST(location);
    END IF;
END $$;
