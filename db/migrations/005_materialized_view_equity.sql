-- ============================================================================
-- Migration 005: Materialized View — Hex Equity Metrics
-- ============================================================================
-- Replaces the antipattern of a mutable hex_equity_metrics table.
-- This view is the single source of truth for equity ratios.
-- REFRESH CONCURRENTLY means reads are never blocked during a refresh.
--
-- Equity ratio:
--   Ei = deployed_capacity / vulnerability_weighted_need_weight
--
-- Vulnerability weight (computed here, never stored on incidents):
--   Vj = 1.0 + (0.30 × infants_j) + (0.20 × elderly_j) + (0.40 × critical_ill_j)
--   Wj = people_count_j × priority_score_j × Vj
-- ============================================================================

CREATE MATERIALIZED VIEW mv_hex_equity AS
WITH incident_weights AS (
    -- Aggregate vulnerability-weighted demand per H3 res7 hex.
    -- Excludes resolved, duplicate, or false-alarm incidents.
    SELECT
        i.h3_res7,
        COUNT(*)                                                        AS total_incidents,
        SUM(i.people_count)                                             AS total_victims,
        SUM(
            i.people_count
            * i.priority_score
            * (
                1.0
                + (0.30 * i.vulnerable_infants)
                + (0.20 * i.vulnerable_elderly)
                + (0.40 * i.vulnerable_critical_ill)
              )
        )                                                               AS need_weight
    FROM   incidents i
    WHERE  i.status NOT IN ('Resolved', 'Duplicate', 'False_Alarm')
    GROUP  BY i.h3_res7
),
deployed_capacity AS (
    -- Aggregate evac capacity of assets currently assigned/on-scene in each hex.
    -- We infer the asset's hex from the incident it is assigned to.
    SELECT
        i.h3_res7,
        SUM(
            COALESCE((a.capabilities->>'evac_capacity_persons')::INT, 1)
        )                                                               AS capacity
    FROM   allocations al
    JOIN   incidents i ON i.id  = al.incident_id
    JOIN   assets    a ON a.id  = al.asset_id
    WHERE  al.status NOT IN ('Completed', 'Superseded')
    GROUP  BY i.h3_res7
)
SELECT
    iw.h3_res7,
    iw.total_incidents,
    iw.total_victims,
    iw.need_weight,
    COALESCE(dc.capacity, 0.0)                                          AS deployed_capacity,

    -- Equity ratio: clamp to 1.0 when no need exists (avoid div-by-zero)
    CASE
        WHEN iw.need_weight = 0 THEN 1.0
        ELSE ROUND(
            (COALESCE(dc.capacity, 0.0) / iw.need_weight)::NUMERIC,
            4
        )
    END                                                                 AS equity_ratio,

    -- Neglected zone flag: meaningful need AND under 35% coverage
    (
        iw.need_weight > 3.0
        AND CASE
            WHEN iw.need_weight = 0 THEN 1.0
            ELSE COALESCE(dc.capacity, 0.0) / iw.need_weight
        END < 0.35
    )                                                                   AS is_neglected,

    NOW()                                                               AS computed_at
FROM   incident_weights iw
LEFT   JOIN deployed_capacity dc USING (h3_res7)
WITH DATA;

-- Unique index is required for CONCURRENT refresh (Postgres requirement)
CREATE UNIQUE INDEX ON mv_hex_equity(h3_res7);

-- ── Refresh function ──────────────────────────────────────────────────────────
-- Called by the API layer (fire-and-forget) after any incident or allocation write.
-- In production, pg_cron would also call this every 30 seconds as a safety net.
CREATE OR REPLACE FUNCTION fn_refresh_equity()
RETURNS VOID
LANGUAGE sql
AS $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hex_equity;
$$;
