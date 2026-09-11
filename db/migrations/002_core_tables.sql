-- ============================================================================
-- Migration 002: Core Tables
-- ============================================================================

-- ── AGENCIES ──────────────────────────────────────────────────────────────────
CREATE TABLE agencies (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    category            agency_category NOT NULL,
    category_detail     TEXT,
    -- ^ Required if category = 'Other'. Describes the specific organization type.
    name                TEXT        NOT NULL,
    incident_commander  TEXT,
    radio_channel       VARCHAR(30),
    phone               VARCHAR(25),
    staging_location    GEOMETRY(Point, 4326),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_agency_other_has_detail
        CHECK (category <> 'Other' OR (category_detail IS NOT NULL AND category_detail <> ''))
);

-- ── ASSETS ────────────────────────────────────────────────────────────────────
-- A single deployable unit owned by an agency.
--
-- Key design decisions (see implementation_plan.md §0 for rationale):
--   - NO current_incident_id (bidirectional FK antipattern removed)
--   - H3 index NOT stored here (computed at query time; assets move constantly)
--   - capability_tags TEXT[] drives matching via GIN index (@> containment)
--   - capabilities JSONB drives UX display and scoring arithmetic
--   - is_deleted / deleted_at for soft delete (never hard-delete fleet data)
CREATE TABLE assets (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id           UUID            NOT NULL REFERENCES agencies(id) ON DELETE RESTRICT,
    name                TEXT            NOT NULL,
    call_sign           VARCHAR(30)     UNIQUE,
    -- ^ Radio/tactical identifier used in the field: "NDRF-B3"

    category            asset_category  NOT NULL,
    category_detail     TEXT,
    -- ^ Required if category = 'Other'

    status              asset_op_status NOT NULL DEFAULT 'Available',

    -- Matching system: GIN-indexed tags for O(1) capability checks.
    -- Standard tags: water_rescue | evac | medical_als | medical_bls |
    --                thermal_camera | recon | search_rescue | structural |
    --                supply_drop | floodwater_capable | road_capable
    capability_tags     TEXT[]          NOT NULL DEFAULT ARRAY[]::TEXT[],

    -- Rich capability data for scoring and UI display.
    -- Canonical keys: evac_capacity_persons, speed_kmh, max_range_km,
    --                 medical_als, thermal_camera, floodwater_capable
    capabilities        JSONB           NOT NULL DEFAULT '{}'::JSONB,

    fuel_level          FLOAT           NOT NULL DEFAULT 1.0
                            CHECK (fuel_level BETWEEN 0.0 AND 1.0),

    location            GEOMETRY(Point, 4326) NOT NULL,

    last_telemetry_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_by          TEXT            NOT NULL DEFAULT 'SYSTEM',

    CONSTRAINT chk_asset_other_has_detail
        CHECK (category <> 'Other' OR (category_detail IS NOT NULL AND category_detail <> '')),
    CONSTRAINT chk_deleted_consistency
        CHECK (NOT is_deleted OR deleted_at IS NOT NULL)
);

-- ── INCIDENTS ─────────────────────────────────────────────────────────────────
-- A single SOS distress event. Immutable after creation except for lifecycle
-- status transitions and assignment tracking.
--
-- H3 indices ARE stored here because incidents don't move — no staleness risk.
-- Dual-resolution: res7 for equity zone queries, res9 for deduplication.
CREATE TABLE incidents (
    id                          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Raw intake
    raw_sos_text                TEXT            NOT NULL,
    origin_channel              TEXT            NOT NULL DEFAULT 'WEB_SOS',
    -- ^ Values: WEB_SOS | FIELD_APP | SMS_GATEWAY | COMMANDER_ENTRY
    reporter_device_id          VARCHAR(64),
    -- ^ Used for offline sync idempotency

    -- AI-extracted intelligence (Gemini 2.5 Flash)
    primary_need                need_category   NOT NULL DEFAULT 'Other',
    primary_need_detail         TEXT,
    -- ^ Required if primary_need = 'Other'
    secondary_needs             TEXT[]          NOT NULL DEFAULT ARRAY[]::TEXT[],
    required_capability_tags    TEXT[]          NOT NULL DEFAULT ARRAY[]::TEXT[],
    -- ^ Derived by Gemini; used for asset matching via @> containment

    -- Triage
    ai_triage_tier              triage_tier     NOT NULL DEFAULT 'Unclassified',
    priority_score              FLOAT           NOT NULL DEFAULT 0.5
                                    CHECK (priority_score BETWEEN 0.0 AND 1.0),
    ai_confidence               FLOAT           DEFAULT NULL
                                    CHECK (ai_confidence IS NULL OR ai_confidence BETWEEN 0.0 AND 1.0),
    ai_rationale                TEXT,
    -- ^ Explainable AI: 1-sentence briefing for the incident commander

    -- Demographics (raw counts; vulnerability multiplier computed at query time)
    people_count                INT             NOT NULL DEFAULT 1 CHECK (people_count >= 1),
    vulnerable_infants          INT             NOT NULL DEFAULT 0 CHECK (vulnerable_infants >= 0),
    vulnerable_elderly          INT             NOT NULL DEFAULT 0 CHECK (vulnerable_elderly >= 0),
    vulnerable_critical_ill     INT             NOT NULL DEFAULT 0 CHECK (vulnerable_critical_ill >= 0),

    -- Geospatial
    location                    GEOMETRY(Point, 4326) NOT NULL,
    h3_res7                     VARCHAR(20)     NOT NULL,
    h3_res9                     VARCHAR(20)     NOT NULL,

    -- Lifecycle
    status                      incident_status NOT NULL DEFAULT 'Open',
    duplicate_of_id             UUID            REFERENCES incidents(id) ON DELETE SET NULL,

    -- Offline LWW reconciliation
    client_recorded_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_by                  TEXT            NOT NULL DEFAULT 'SYSTEM',

    CONSTRAINT chk_incident_other_has_detail
        CHECK (primary_need <> 'Other' OR (primary_need_detail IS NOT NULL AND primary_need_detail <> '')),
    CONSTRAINT chk_vulnerable_not_exceed_total
        CHECK ((vulnerable_infants + vulnerable_elderly + vulnerable_critical_ill) <= people_count)
);

-- ── ALLOCATIONS (Append-Only Audit Log) ──────────────────────────────────────
-- NEVER updated after insert. Each dispatch or reallocation appends a new row.
-- "Superseded" rows represent the history of how the assignment changed.
-- This gives us a complete, tamper-evident audit trail.
CREATE TABLE allocations (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    incident_id         UUID        NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    asset_id            UUID        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    allocation_version  INT         NOT NULL DEFAULT 1,
    -- ^ Monotonically increasing per incident_id

    algorithm           TEXT        NOT NULL DEFAULT 'GREEDY_CAPABILITY_HAVERSINE',
    dispatched_by       TEXT        NOT NULL DEFAULT 'SYSTEM_AI',

    -- Pre-computed routing metrics
    distance_km         FLOAT       NOT NULL CHECK (distance_km >= 0),
    est_transit_minutes FLOAT       NOT NULL CHECK (est_transit_minutes >= 0),
    est_fuel_drain      FLOAT       NOT NULL CHECK (est_fuel_drain BETWEEN 0.0 AND 1.0),

    -- Allocation state machine
    -- Valid values enforced by CHECK constraint below
    status              TEXT        NOT NULL DEFAULT 'Dispatched'
                            CHECK (status IN ('Dispatched', 'En_Route', 'On_Scene', 'Completed', 'Superseded')),

    superseded_by_id    UUID        REFERENCES allocations(id),
    supersession_reason TEXT,
    -- ^ Values: ASSET_DEGRADED | ROUTE_BLOCKED | COMMANDER_OVERRIDE

    dispatched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    on_scene_at         TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ
);
