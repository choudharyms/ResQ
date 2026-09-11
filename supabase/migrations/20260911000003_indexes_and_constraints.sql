-- ============================================================================
-- Migration 003: Indexes & Constraints
-- ============================================================================

-- ── Agencies ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_agencies_category ON agencies(category);

-- ── Assets ────────────────────────────────────────────────────────────────────
-- GIST index for fast ST_Distance and ST_DWithin spatial queries
CREATE INDEX idx_assets_location    ON assets USING GIST(location);

-- GIN index enables @> containment: "does this asset have all required tags?"
CREATE INDEX idx_assets_tags        ON assets USING GIN(capability_tags);

-- Partial indexes: only the rows that matter in hot query paths
-- "Find me all available, non-deleted assets" — the most common query
CREATE INDEX idx_assets_available   ON assets(fuel_level DESC)
    WHERE status = 'Available' AND is_deleted = FALSE;

-- For agency-scoped queries from the fleet panel
CREATE INDEX idx_assets_agency      ON assets(agency_id)
    WHERE is_deleted = FALSE;

-- ── Incidents ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_incidents_location ON incidents USING GIST(location);

-- H3 grouping for equity aggregation and deduplication checks
CREATE INDEX idx_incidents_h3_res7  ON incidents(h3_res7);
CREATE INDEX idx_incidents_h3_res9  ON incidents(h3_res9);

-- Lifecycle status filter
CREATE INDEX idx_incidents_status   ON incidents(status);

-- Priority triage queue: only open incidents are triaged
CREATE INDEX idx_incidents_priority ON incidents(priority_score DESC)
    WHERE status = 'Open';

-- GIN for required_capability_tags (used in allocation matching queries)
CREATE INDEX idx_incidents_req_tags ON incidents USING GIN(required_capability_tags);

-- Deduplication check: composite on h3_res9 + primary_need + status + time
-- Used in the dedup function: same micro-hex + same need + active + last 30 min
CREATE INDEX idx_incidents_dedup    ON incidents(h3_res9, primary_need, status, created_at DESC)
    WHERE status IN ('Open', 'Assigned', 'On_Scene');

-- ── Allocations ───────────────────────────────────────────────────────────────
-- Primary lookup: latest version per incident
CREATE INDEX idx_alloc_incident     ON allocations(incident_id, allocation_version DESC);

-- Asset history: all allocations for a given asset
CREATE INDEX idx_alloc_asset        ON allocations(asset_id, dispatched_at DESC);

-- Active allocation lookup: powers the active_allocations view
CREATE INDEX idx_alloc_active       ON allocations(incident_id)
    WHERE status NOT IN ('Completed', 'Superseded');
