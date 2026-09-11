-- ============================================================================
-- Migration 001: Extensions & Domain Enums
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ── Agency Taxonomy ───────────────────────────────────────────────────────────
CREATE TYPE agency_category AS ENUM (
    'NDRF',
    'SDRF',
    'Indian_Army',
    'Indian_Air_Force',
    'Local_Police',
    'Health_Dept',
    'Fire_Rescue',
    'Coast_Guard',
    'NGO_Volunteer',
    'Other'
);

-- ── Asset Taxonomy ────────────────────────────────────────────────────────────
CREATE TYPE asset_category AS ENUM (
    'Inflatable_Rescue_Boat',
    'Motorized_Rescue_Boat',
    'Helicopter',
    '4x4_Ambulance',
    'Heavy_Rescue_Truck',
    'Supply_Truck',
    'Surveillance_Drone',
    'Payload_Delivery_Drone',
    'Medical_Team',
    'K9_Search_Squad',
    'Heavy_Excavator',
    'Other'
);

-- ── Asset Operational Lifecycle (ICS / INSARAG aligned) ───────────────────────
CREATE TYPE asset_op_status AS ENUM (
    'Available',
    'Assigned',
    'On_Scene',
    'Returning',
    'Standby',
    'Refueling_Resting',
    'Degraded',
    'Offline'
);

-- ── Incident Lifecycle ────────────────────────────────────────────────────────
CREATE TYPE incident_status AS ENUM (
    'Open',
    'Assigned',
    'On_Scene',
    'Resolved',
    'Duplicate',
    'False_Alarm'
);

-- ── Emergency Need Categories ─────────────────────────────────────────────────
CREATE TYPE need_category AS ENUM (
    'Medical_Emergency',
    'Water_Evacuation',
    'Structural_Extrication',
    'Food_Water_Supply',
    'Power_Medical_Equipment',
    'Hazmat_Fire',
    'Animal_Livestock',
    'Recon_Welfare_Check',
    'Other'
);

-- ── INSARAG Triage Tiers ──────────────────────────────────────────────────────
CREATE TYPE triage_tier AS ENUM (
    'T1_Immediate',
    'T2_Delayed',
    'T3_Minimal',
    'T4_Expectant',
    'Unclassified'
);
