-- ============================================================================
-- Migration 004: Stored Procedures
-- ============================================================================

-- ── 4.1 Atomic Race-Safe Allocation ──────────────────────────────────────────
-- Called from the API layer to dispatch the best available asset to an incident.
-- Uses SELECT FOR UPDATE SKIP LOCKED to prevent double-booking under concurrent
-- commander dispatching — a critical safety requirement.
--
-- Scoring formula (dimensionally consistent, both axes in [0,1]):
--   score = (dist_km / max_range_km) * 0.65  +  (1 - fuel_level) * 0.35
--   Lower score = better candidate.
--
-- Returns JSONB with { ok, incident_id, asset_id, asset_name, ... } so the API
-- layer has a structured response it can forward directly to the frontend.
CREATE OR REPLACE FUNCTION fn_allocate_asset(
    p_incident_id   UUID,
    p_dispatched_by TEXT DEFAULT 'SYSTEM_AI'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_incident      incidents%ROWTYPE;
    v_asset         RECORD;
    v_dist_km       FLOAT;
    v_speed_kmh     FLOAT;
    v_alloc_version INT;
BEGIN
    -- 1. Lock the incident row. SKIP LOCKED means if another transaction already
    --    holds this row, we return immediately rather than blocking or deadlocking.
    SELECT * INTO v_incident
    FROM   incidents
    WHERE  id = p_incident_id AND status = 'Open'
    FOR UPDATE SKIP LOCKED;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok',      false,
            'code',    'INCIDENT_NOT_AVAILABLE',
            'message', 'Incident is already assigned, locked by another transaction, or does not exist.'
        );
    END IF;

    -- 2. Find and lock the best eligible asset.
    --    @> containment: asset must provide ALL tags the incident requires.
    SELECT
        a.*,
        ST_Distance(a.location::GEOGRAPHY, v_incident.location::GEOGRAPHY) / 1000.0 AS dist_km,
        COALESCE((a.capabilities->>'speed_kmh')::FLOAT, 30.0) AS speed_kmh,
        COALESCE((a.capabilities->>'max_range_km')::FLOAT, 20.0) AS max_range_km
    INTO v_asset
    FROM assets a
    WHERE a.status = 'Available'
      AND a.is_deleted = FALSE
      -- Tag containment: asset must cover every required tag
      AND a.capability_tags @> v_incident.required_capability_tags
      -- Range feasibility check (85% safety reserve on fuel)
      AND (
          ST_Distance(a.location::GEOGRAPHY, v_incident.location::GEOGRAPHY) / 1000.0
      ) <= (
          COALESCE((a.capabilities->>'max_range_km')::FLOAT, 20.0) * a.fuel_level * 0.85
      )
    ORDER BY
        -- Normalized composite score: lower = better
        (
            (ST_Distance(a.location::GEOGRAPHY, v_incident.location::GEOGRAPHY) / 1000.0)
            / COALESCE((a.capabilities->>'max_range_km')::FLOAT, 20.0)
        ) * 0.65
        + (1.0 - a.fuel_level) * 0.35
    ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok',      false,
            'code',    'NO_ASSET_AVAILABLE',
            'message', 'No capable asset found within operational range. Consider requesting mutual aid.'
        );
    END IF;

    -- 3. Compute next monotonic allocation version for this incident
    SELECT COALESCE(MAX(allocation_version), 0) + 1
    INTO   v_alloc_version
    FROM   allocations
    WHERE  incident_id = p_incident_id;

    -- 4. Pre-compute route metrics
    v_dist_km   := v_asset.dist_km;
    v_speed_kmh := v_asset.speed_kmh;

    -- 5. Atomic state transitions — all 3 writes in the same transaction
    UPDATE incidents
    SET    status     = 'Assigned',
           updated_at = NOW(),
           updated_by = p_dispatched_by
    WHERE  id = v_incident.id;

    UPDATE assets
    SET    status     = 'Assigned',
           updated_at = NOW(),
           updated_by = p_dispatched_by
    WHERE  id = v_asset.id;

    INSERT INTO allocations (
        incident_id,
        asset_id,
        allocation_version,
        algorithm,
        dispatched_by,
        distance_km,
        est_transit_minutes,
        est_fuel_drain,
        status
    ) VALUES (
        v_incident.id,
        v_asset.id,
        v_alloc_version,
        'GREEDY_CAPABILITY_HAVERSINE',
        p_dispatched_by,
        v_dist_km,
        (v_dist_km / v_speed_kmh) * 60.0,
        (v_dist_km / v_asset.max_range_km) * 0.5,
        'Dispatched'
    );

    -- 6. Return structured dispatch summary for the API layer
    RETURN jsonb_build_object(
        'ok',            true,
        'incident_id',   v_incident.id,
        'asset_id',      v_asset.id,
        'asset_name',    v_asset.name,
        'call_sign',     v_asset.call_sign,
        'distance_km',   ROUND(v_dist_km::NUMERIC, 2),
        'eta_minutes',   ROUND(((v_dist_km / v_speed_kmh) * 60.0)::NUMERIC, 1),
        'alloc_version', v_alloc_version
    );
END;
$$;


-- ── 4.2 Asset Degradation Handler ────────────────────────────────────────────
-- Called when an asset transitions to 'Degraded' status (mechanical failure,
-- comms loss, etc.). Supersedes the current allocation, reopens the incident,
-- and returns the incident_id so the API layer can immediately call fn_allocate_asset.
CREATE OR REPLACE FUNCTION fn_handle_asset_degradation(
    p_asset_id  UUID,
    p_reason    TEXT DEFAULT 'ASSET_DEGRADED'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_active_alloc  allocations%ROWTYPE;
BEGIN
    -- 1. Check the asset exists and lock it before any other writes
    PERFORM id FROM assets WHERE id = p_asset_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'ASSET_NOT_FOUND');
    END IF;

    -- 2. Find active allocation FIRST (before changing asset state).
    --    If this SELECT fails or returns nothing, the asset state is still clean.
    SELECT * INTO v_active_alloc
    FROM   allocations
    WHERE  asset_id = p_asset_id
      AND  status NOT IN ('Completed', 'Superseded')
    ORDER BY dispatched_at DESC
    LIMIT  1
    FOR UPDATE;

    -- 3. Now safe to mark asset Degraded — allocation state is locked
    UPDATE assets
    SET    status     = 'Degraded',
           updated_at = NOW(),
           updated_by = 'SYSTEM_FAILOVER'
    WHERE  id = p_asset_id;

    -- Asset was idle (Available/Standby) — just mark degraded, no orphaned incident
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok',              true,
            'orphaned_incident', false
        );
    END IF;

    -- 4. Supersede the broken allocation leg
    UPDATE allocations
    SET    status              = 'Superseded',
           supersession_reason = p_reason
    WHERE  id = v_active_alloc.id;

    -- 5. Reopen the incident for immediate re-queuing
    UPDATE incidents
    SET    status     = 'Open',
           updated_at = NOW(),
           updated_by = 'SYSTEM_FAILOVER'
    WHERE  id = v_active_alloc.incident_id;

    -- Signal the API layer to call fn_allocate_asset() for the orphaned incident
    RETURN jsonb_build_object(
        'ok',                true,
        'orphaned_incident', true,
        'incident_id',       v_active_alloc.incident_id,
        'superseded_alloc',  v_active_alloc.id
    );
END;
$$;


-- ── 4.3 Update Allocation Status ─────────────────────────────────────────────
-- Called when an asset reports On_Scene or Completed status.
-- Updates both the allocation row and the corresponding asset/incident rows.
CREATE OR REPLACE FUNCTION fn_update_allocation_status(
    p_asset_id   UUID,
    p_new_status TEXT,            -- 'On_Scene' | 'Completed'
    p_updated_by TEXT DEFAULT 'SYSTEM'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_alloc     allocations%ROWTYPE;
    v_now       TIMESTAMPTZ := NOW();
BEGIN
    -- Guard: only allow valid forward transitions
    IF p_new_status NOT IN ('En_Route', 'On_Scene', 'Completed') THEN
        RETURN jsonb_build_object(
            'ok',    false,
            'code',  'INVALID_STATUS',
            'message', 'Allowed values: En_Route, On_Scene, Completed'
        );
    END IF;

    SELECT * INTO v_alloc
    FROM   allocations
    WHERE  asset_id = p_asset_id
      AND  status NOT IN ('Completed', 'Superseded')
    ORDER BY dispatched_at DESC
    LIMIT  1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'NO_ACTIVE_ALLOCATION');
    END IF;

    UPDATE allocations
    SET    status       = p_new_status,
           on_scene_at  = CASE WHEN p_new_status = 'On_Scene'  THEN v_now ELSE on_scene_at END,
           completed_at = CASE WHEN p_new_status = 'Completed' THEN v_now ELSE completed_at END
    WHERE  id = v_alloc.id;

    -- Mirror state on asset and incident
    IF p_new_status = 'On_Scene' THEN
        UPDATE assets    SET status = 'On_Scene', updated_at = v_now, updated_by = p_updated_by WHERE id = p_asset_id;
        UPDATE incidents SET status = 'On_Scene', updated_at = v_now, updated_by = p_updated_by WHERE id = v_alloc.incident_id;

    ELSIF p_new_status = 'Completed' THEN
        UPDATE assets    SET status = 'Returning', updated_at = v_now, updated_by = p_updated_by WHERE id = p_asset_id;
        UPDATE incidents SET status = 'Resolved',  updated_at = v_now, updated_by = p_updated_by WHERE id = v_alloc.incident_id;
    END IF;

    RETURN jsonb_build_object(
        'ok',          true,
        'allocation_id', v_alloc.id,
        'incident_id', v_alloc.incident_id,
        'new_status',  p_new_status
    );
END;
$$;


-- ── 4.4 Active Allocations View ───────────────────────────────────────────────
-- Replaces the bidirectional FK antipattern. This is the single source of truth
-- for "which asset is currently assigned to which incident".
CREATE OR REPLACE VIEW active_allocations AS
    SELECT DISTINCT ON (incident_id)
        a.id                AS allocation_id,
        a.incident_id,
        a.asset_id,
        a.allocation_version,
        a.algorithm,
        a.dispatched_by,
        a.distance_km,
        a.est_transit_minutes,
        a.status            AS allocation_status,
        a.dispatched_at,
        a.on_scene_at
    FROM allocations a
    WHERE a.status NOT IN ('Completed', 'Superseded')
    ORDER BY incident_id, allocation_version DESC;
