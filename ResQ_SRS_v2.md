# ResQ — Multi-Agency Disaster Decision Support Platform
## Software Requirements Specification v2.0 | MUJHACKX 2026 | PS #2

> **Version:** 2.0 | **Supersedes:** SRS v1.0  
> **Key Change:** System reframed from "AI allocation app" to "4-engine decision support platform." Gemini Flash removed from allocation decisions; deterministic greedy optimizer added. Full 3-tier data model (Report→Incident→Zone) added. NDRF-aligned resource model with capabilities[]. Multi-agency architecture.

---

> *"In disaster response, the first reports get all the resources. The silent zones get nothing. ResQ finds the forgotten pockets — and every decision it makes can be traced to a formula."*

---

## Table of Contents

1. [Document Info & Version Changelog](#1-document-info--version-changelog)
2. [System Definition](#2-system-definition)
3. [The Decision Engine Loop](#3-the-decision-engine-loop)
4. [What We Are NOT Building](#4-what-we-are-not-building)
5. [Stakeholders & Personas](#5-stakeholders--personas)
6. [The 4-Engine Architecture Overview](#6-the-4-engine-architecture-overview)
7. [Engine 1 — Information Fusion Engine](#7-engine-1--information-fusion-engine)
8. [Engine 2 — Need & Priority Engine](#8-engine-2--need--priority-engine)
9. [Engine 3 — Resource Optimisation Engine](#9-engine-3--resource-optimisation-engine)
10. [Engine 4 — Dynamic Situation Engine](#10-engine-4--dynamic-situation-engine)
11. [Equity Engine — The Differentiator](#11-equity-engine--the-differentiator)
12. [Degraded / Offline Mode](#12-degraded--offline-mode)
13. [Command Dashboard UI/UX](#13-command-dashboard-uiux)
14. [Database Schema](#14-database-schema)
15. [API Contract](#15-api-contract)
16. [Non-Functional Requirements](#16-non-functional-requirements)
17. [Security & Compliance](#17-security--compliance)
18. [36-Hour Implementation Roadmap](#18-36-hour-implementation-roadmap)
19. [Demo Scenario — Jaipur Flood](#19-demo-scenario--jaipur-flood)
20. [Glossary](#20-glossary)
21. [Appendix: Seed Data & Environment Variables](#21-appendix-seed-data--environment-variables)

---

## 1. Document Info & Version Changelog

| Field | Value |
|---|---|
| **Project Name** | ResQ — Multi-Agency Disaster Decision Support Platform |
| **Hackathon** | MUJHACKX 2026 |
| **Problem Statement** | PS #2 — Emergency Resource Allocation |
| **SRS Version** | 2.0 |
| **Date** | September 11, 2026 |

### 1.1 What Changed from v1.0

| Change | Category |
|---|---|
| System framing: "AI app" → "4-engine decision platform" | 🔄 Architecture |
| 3-tier data model: Report → Incident → Zone | 🆕 New layer |
| Deduplication pipeline with match_score formula | 🆕 New |
| Canonical Incident object as core data structure | 🆕 New |
| NDRF-aligned hierarchical resource model + capabilities[] | 🔄 Upgraded |
| Multi-agency resource ownership model | 🆕 New |
| 4-output assessment: Severity / Urgency / Need / Confidence | 🔄 Upgraded |
| Demand vector per zone (transparent rules, not LLM) | 🔄 Upgraded |
| Deterministic greedy optimizer (Gemini Flash ≠ allocator) | 🔄 Major change |
| Per-assignment "Why this allocation?" explainability | 🆕 New |
| Resource lifecycle: 7-state model + feedback loop | 🔄 Upgraded |
| Equity Engine: forced-allocation rule added | ✅ Enhanced |
| Demo scenario: Jaipur Flood with 4 sequential events | 🔄 Upgraded |
| DB schema: 10 tables (+ incidents, agencies) | 🔄 Upgraded |

---

## 2. System Definition & Strategic Objectives

> **ResQ is an AI-assisted, multi-agency disaster decision-support ecosystem engineered for the extreme pressures of catastrophe. It transforms chaotic, multi-modal SOS noise and sensor streams (including thermal-equipped drones and ground reports) into a live, mathematically optimized operational picture. By utilizing Uber H3 hexagonal spatial indexing, deterministic constraint solvers, and real-time equity audits, ResQ deploys specialized life-saving assets with sub-second precision—ensuring that every decision is traceable to an auditable formula and zero vulnerable communities are forgotten.**

### 2.1 Deployment Strategy: Web Application First, PWA Phased
- **Prime Focus (Phase 1 & 2): Responsive Web Application:** Engineered for high-resolution Emergency Operations Center (EOC) multi-monitor setups and mobile browser field reporting across Android/iOS devices with zero app-store download friction.
- **Progressive Enhancement (Phase 3): Offline PWA:** Integrates Service Workers, IndexedDB, and Conflict-free Replicated Data Types (CRDTs) to buffer reports and waypoints through intermittent cellular dead zones.

### 2.2 Core Architectural Principles
- **Connectivity Resilience & Central Degraded Mode:** Functions reliably when field units are offline (via local buffering) AND when central data is partial/fragmentary (via Staged Reserve Buffering & Population Priors).
- **Cognitive Load Reduction:** Fast multimodal inference via Google Gemini Flash models extracting structured intent and human-made signs from raw audio/vision feeds.
- **Unified Situational Awareness:** Eradicates resource "double-counting" and agency silos by synchronizing NDRF, SDRF, Police, Fire, and Hospitals onto one live hexagonal operational graph.
- **Auditable Hybrid Intelligence:** AI parses unstructured noise; deterministic mathematical algorithms (OR-Tools / Greedy Solvers) make resource allocation decisions. AI never guesses life-and-death dispatches.

---

## 3. The Decision Engine Loop

```
  FRAGMENTED INPUTS
  (voice / text / image / agency reports / sensor)
          │
          ▼
  ┌────────────────────────────┐
  │  ENGINE 1                 │
  │  Information Fusion        │
  │  100 reports               │
  │  → 17 incidents            │
  │  → 5 operational zones     │
  └────────────┬───────────────┘
               │
               ▼
  ┌────────────────────────────┐
  │  ENGINE 2                 │
  │  Need & Priority           │
  │  Severity / Urgency        │
  │  Demand vector per zone    │
  │  Priority score (0-100)    │
  └────────────┬───────────────┘
               │
               ▼
  ┌────────────────────────────┐
  │  ENGINE 3                 │  ◄─── Resource Inventory (multi-agency)
  │  Resource Optimisation     │  ◄─── Road Network / Access Conditions
  │  Capability matching       │
  │  Greedy allocation         │
  │  Per-assignment reasoning  │
  └────────────┬───────────────┘
               │
               ▼
  ┌────────────────────────────┐
  │  COMMAND DASHBOARD         │
  │  Shared operational picture│
  │  Priority queue            │
  │  Allocation plan           │
  └────────────┬───────────────┘
               │
  ┌────────────▼───────────────┐
  │  HUMAN AUTHORISATION       │
  │  [APPROVE] [MODIFY] [REJECT]│
  └────────────┬───────────────┘
               │
               ▼
  ┌────────────────────────────┐
  │  DISPATCH / STATUS UPDATE  │
  │  Resource lifecycle tracked │
  │  Actual vs estimated need   │
  └────────────┬───────────────┘
               │
          New information arrives
               │
               ▼
  ┌────────────────────────────┐
  │  ENGINE 4                 │
  │  Dynamic Situation Engine  │
  │  Re-score → Re-optimise    │
  │  Diff: old plan vs new     │
  └────────────────────────────┘
          │
          └──────────────────► EQUITY CHECK
                                FORGOTTEN ZONE?
                                Force allocation
```

---

## 4. What We Are NOT Building

> For a 36-hour hackathon, scope control is as important as feature design.

| We are NOT building | Why |
|---|---|
| Full multi-agency auth with govt SSO | Supabase roles are sufficient |
| Real NDRF/SDRF API integration | Seed data with realistic NDRF types |
| Real-time satellite processing | Out of scope and distracting |
| Drone/UAV fleet management | Nice demo prop, not core |
| Blockchain audit trail | Adds complexity, no demo value |
| Sophisticated ML disaster prediction | PS asks for response, not prediction |
| Real SMS/Radio gateway | Simulate via web form |
| Multi-language NLP at scale | Voice demo in Hindi/English is enough |
| Weather API integration | Static "flood scenario" is cleaner for demo |

**Get the core decision engine working first. Everything else is polish.**

---

## 5. Stakeholders & Personas

### 5.1 Incident Commander — Raj Kumar (47)
> *"I'm looking at 20 agencies, 80 incoming calls, and 6 different maps. I need one screen that shows where the pain is and what to do next."*

- **Role:** District Incident Commander, NDRF
- **Goal:** Make the right allocation decision before the situation deteriorates
- **Key screens:** Command Dashboard, Allocation Plan, Equity Lens
- **Critical need:** Explainable recommendations, not black-box AI

### 5.2 Agency Resource Admin — Arjun Mehta (38)
> *"I manage NDRF Unit 7's 6 boats and 3 rescue teams. I need to update their status and see where they're going."*

- **Role:** NDRF Logistics Officer
- **Goal:** Keep resource inventory accurate; receive and confirm dispatch orders
- **Key screens:** Agency Resource Panel, Status Updates

### 5.3 Field Coordinator — Priya Singh (33)
> *"45 people stranded, bridge accessible by jeep only. I filed a report 2 hours ago — nothing came."*

- **Role:** NGO field coordinator
- **Goal:** Submit accurate reports, get confirmation, track resource ETA
- **Key screens:** Mobile Field Report Form, Report Status

### 5.4 State Minister / Secretary — Kavya Reddy (52)
> *"How many zones are underserved? What's our response coverage?"*

- **Role:** State Disaster Secretary
- **Goal:** Accountability, escalation decisions
- **Key screens:** Equity Lens summary, Coverage % metric

### 5.5 Local Control Officer — Ramesh Gupta (44)
> *"Flooding started in Ramganj. I'm calling it in. 850 people, roads partially blocked."*

- **Role:** District Control Room Officer
- **Goal:** Create incident, trigger system response
- **Key screens:** Incident Creation Form, Notification Dispatch

---

## 6. The 4-Engine Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser / PWA)                           │
│  React 18 + Tailwind + Leaflet.js + Zustand                        │
│  Screens: Command Dashboard | Field Form | Agency Panel             │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ Supabase Realtime (WebSocket)
┌─────────────────────────────▼───────────────────────────────────────┐
│                   SUPABASE (Backend as a Service)                   │
│  PostgreSQL + PostGIS | Realtime Engine | Auth (JWT + RLS)          │
│  Tables: reports, incidents, zones, resources, agencies,            │
│          allocation_plans, zone_scores, route_conditions, audit_log │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                 NODE.JS + EXPRESS API SERVER                        │
│                                                                     │
│  ENGINE 1: Information Fusion                                       │
│  POST /api/reports  →  extract → validate → dedup → create incident│
│                                                                     │
│  ENGINE 2: Need & Priority                                          │
│  GET /api/zones/priority  →  demand vector + priority scores        │
│                                                                     │
│  ENGINE 3: Resource Optimisation                                    │
│  POST /api/allocation/run  →  greedy optimizer → assignment plan    │
│                                                                     │
│  ENGINE 4: Dynamic Situation                                        │
│  POST /api/reallocation/run  →  re-optimise on event               │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                         AI LAYER (Narrow Use Only)                  │
│  Google Gemini Flash API (Free Tier): voice→text, image→evidence, text→structured fields    │
│  NOT USED FOR: allocation decisions, priority scoring, routing      │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 18 + Vite | Fast HMR, ecosystem |
| Styling | Tailwind CSS v3 | Utility-first, rapid build |
| Map | Leaflet.js + react-leaflet | OSM tiles, no API key |
| Geospatial ops | Turf.js | Clustering, distance, centroid |
| Routing/ETA | OpenRouteService API (free) | Road-aware travel time |
| Heatmap | leaflet.heat | Canvas-rendered |
| State | Zustand | Minimal boilerplate |
| Backend | Node.js 20 + Express | Team familiarity |
| Validation | Zod | Type-safe schema at API boundary |
| Database | Supabase (PostgreSQL + PostGIS) | Realtime + free tier |
| AI (narrow) | Google Gemini 1.5/2.0 Flash (Free Tier) | Text/image extraction + narrative |
| Voice input | Web Speech API (browser) | No API key, instant |
| Offline | localStorage + Service Worker | Degraded mode |
| Deploy | Vercel (FE) + Railway (BE) | Zero-config |

---

## 7. Engine 1 — Information Fusion Engine

> *This is where the system becomes intelligent. Converting noise into signal.*

### 7.1 Three-Tier Information Model with Uber H3 Hexagonal Indexing

```
TIER 1 — MULTIMODAL INGESTION STREAM
  100+ raw signals: Telegram Bot API, Web Voice calls, WhatsApp texts, 
  drone thermal/multispectral frames, sensor feeds, control room lines
          │
          │   Gemini Flash Multimodal Ingestion + CV Human-Sign Detection
          │   Deduplication (match_score > 0.70) + Corroboration Pipeline
          ▼
TIER 2 — CANONICAL INCIDENT OBJECTS
  17 verified, structured incident records with confidence ratings (e.g. 88%)
  and explicit detection flags (human_signs_detected: true)
          │
          │   Spatial Hashing: Uber H3 Hexagonal Indexing (Resolution 8: ~460m)
          │   Equidistant neighbor clustering & demand aggregation
          ▼
TIER 3 — SPATIAL HEX DEMAND CLUSTERS (OPERATIONAL ZONES)
  Actionable H3 Hexagons with cumulative need weights, demand vectors,
  and live Fulfilled Need Ratios (Ei = Deployed / Need)
```

**Strategic Value of Uber H3 Hexagonal Indexing:**
1. **Uniform Adjacency:** Every hexagon has exactly 6 equidistant neighbors (unlike square grids or irregular polygons), enabling continuous diffusion modeling for rising floodwaters.
2. **Computational Speed:** Grouping 1,000 incident waypoints into spatial clusters is a sub-millisecond string hash lookup ($O(1)$) rather than heavy $O(N^2)$ PostGIS polygon intersection geometry.
3. **Hierarchical Drill-down:** Smooth zoom from macro district overview (H3 Res 6 ~3.2km) to tactical search-and-rescue sector (H3 Res 8 ~460m) to precision drone drop zone (H3 Res 10 ~65m).

**Why this matters:** 100 reports about 5 real situations should produce 5 incidents, not 100. Without this layer, the system amplifies noise into false urgency.

### 7.2 Report Ingestion — Input Types

| Input Type | Channel | Gemini Flash Used? | Output |
|---|---|---|---|
| Structured form (web) | Field report form | No | Direct incident fields |
| Free text (web/WhatsApp) | Text field | Yes (extraction) | Structured incident fields |
| Voice (Hindi/English) | Browser microphone | Yes (Whisper + extraction) | Structured incident fields |
| Image + GPS | Mobile upload | Yes (vision description) | Evidence object |
| Agency API/feed | REST ingest | No | Direct structured data |
| Control room officer | Authenticated form | No | High-confidence incident |

### 7.3 Raw Report Schema

```sql
-- Every inbound signal, regardless of channel, becomes a report
{
  report_id:       UUID (auto)
  source_type:     enum [FORM, TEXT, VOICE, IMAGE, AGENCY_API, CONTROL_ROOM]
  reporter_name:   text (optional — anonymous allowed)
  reporter_role:   enum [NDRF, SDRF, POLICE, HOSPITAL, NGO_FIELD, CIVILIAN, SENSOR]
  raw_content:     text (original message before extraction)
  extracted_data:  JSONB (Gemini Flash output OR direct form fields)
  location_text:   text (e.g., "Ramganj near school")
  location_coords: geometry(Point, 4326) (GPS or geocoded)
  submitted_at:    timestamptz
  is_processed:    boolean (has been fed through fusion engine)
  incident_id:     UUID (set after dedup, FK to incidents)
}
```

### 7.4 Deduplication Pipeline

Every new report triggers the following 5-step pipeline:

**Step A — Extraction**
Parse what happened: location, people count, event type, resource needs.
(LLM for unstructured; direct parse for structured forms)

**Step B — Geospatial Validation**
- Is the location within the declared disaster boundary?
- Is the population count plausible for that area?
- Is the event type consistent with the disaster type?

**Step C — Candidate Match Query**
```sql
-- Find existing incidents within 500m, last 2 hours, same event type
SELECT i.* FROM incidents i
WHERE ST_DWithin(i.location, report.location, 500)   -- 500m radius
  AND i.created_at > NOW() - INTERVAL '2 hours'
  AND i.event_type = report.event_type
  AND i.status != 'CLOSED'
```

**Anti-Phantom Demand Rule:**
When 50 citizens call about the same school flood, naive systems multiply demand by 50x (counting 100 victims 50 times = 5,000 victims). ResQ treats subsequent calls as **corroboration events**, not new demand.

**Step D — Match Score**
```
match_score = 0.4 × geo_proximity (or H3 k_ring(1) adjacency)
            + 0.3 × time_proximity (within 2-hour sliding window)
            + 0.2 × semantic_similarity (matching hazard / need tokens)
            + 0.1 × population_overlap

IF match_score > 0.70:
  ACTION = CORROBORATE_INCIDENT
  - Do NOT create duplicate incident
  - Do NOT multiply resource demand
  - Increment report_count and attach caller notes/photos
  - Recompute detection_confidence (increases asymptotically toward 0.98)
  - Headcount = max(existing_headcount, reported_headcount)

geo_proximity  = 1 - min(distance_km / 0.5, 1)
time_proximity = 1 - min(hours_since_incident / 2.0, 1)
semantic_sim   = jaccard(event_type_tokens_a, event_type_tokens_b)
pop_overlap    = 1 - |affected_a - affected_b| / max(affected_a, affected_b)

IF match_score > 0.7: merge with existing incident
IF match_score 0.4–0.7: flag as 'POSSIBLE_DUPLICATE', human review
IF match_score < 0.4: create new incident
```

**Step E — Merge Rules**
```
When merging report into existing incident:
  people.affected    = max(existing, new)
  people.injured     = max(existing, new)
  people.trapped     = max(existing, new)
  people.missing     = max(existing, new)
  location           = population-weighted centroid
  evidence[]         = union(existing.evidence, new.evidence)
  confidence         = recompute (see §7.6)
  updated_at         = NOW()
  report_count       = report_count + 1
```

### 7.5 Canonical Incident Object

**This is the most important data structure in the entire system.** Everything downstream reads from this.

```json
{
  "incident_id":   "INC-1042",
  "zone_id":       "Z4",
  "location":      {"lat": 26.922, "lon": 75.787},
  "timestamp":     "2026-09-11T18:32:00Z",
  "event_type":    "FLOOD",
  "status":        "ACTIVE",

  "people": {
    "affected":    180,
    "trapped":     64,
    "injured":     12,
    "missing":      5,
    "children":    22,
    "elderly":     18
  },

  "needs": {
    "ambulances":       4,
    "rescue_teams":     3,
    "boats":            4,
    "food_packets":   220,
    "water_litres":   540,
    "shelter_beds":   120,
    "medical_responders": 2
  },

  "assessment": {
    "severity":       0.87,
    "urgency":        0.93,
    "vulnerability":  0.71,
    "confidence":     0.82
  },

  "access": {
    "road_status":              "PARTIAL",
    "estimated_travel_minutes": 23,
    "access_note":              "NH-58 passable by jeep only"
  },

  "evidence": [
    {"type": "CONTROL_ROOM_REPORT", "report_id": "RPT-8821", "credibility": 0.95},
    {"type": "CITIZEN_TEXT", "report_id": "RPT-8809", "credibility": 0.65},
    {"type": "IMAGE_UPLOAD", "report_id": "RPT-8814", "credibility": 0.80}
  ],

  "report_count": 3,
  "created_at": "2026-09-11T18:32:00Z",
  "updated_at": "2026-09-11T18:47:00Z"
}
```

### 7.6 Confidence Scoring

```
Confidence = base_credibility × corroboration_multiplier × freshness_factor

base_credibility = weighted_average(reporter_credibility[i])
  Credibility weights:
    NDRF/SDRF/POLICE   = 0.95
    HOSPITAL            = 0.90
    SENSOR/AUTOMATED   = 0.85
    NGO_FIELD          = 0.80
    AUTHENTICATED_CITIZEN = 0.65
    ANONYMOUS_CITIZEN  = 0.50

corroboration_multiplier = min(1 + 0.15 × (evidence_count - 1), 1.5)
  1 source: 1.0
  2 sources: 1.15
  3 sources: 1.30
  5+ sources: 1.50 (capped)

freshness_factor = exp(-0.05 × hours_since_last_report)
  0h: 1.00 | 6h: 0.74 | 12h: 0.55 | 24h: 0.30
```

**Critical Rule — Low Confidence + High Severity:**
```
IF confidence < 0.4 AND severity > 0.7:
  flag = 'VERIFY_IMMEDIATELY'
  priority_reduction_floor = 0.7  # never drop below 70% priority
  alert_commander = true
  message = "High-impact report from unverified source. Verify before committing resources."

# We DO NOT ignore low-confidence reports about potentially catastrophic situations.
# This is the key design decision that v1 missed.
```

**UI Confidence Badge:**
```
INC-1042 | 180 affected | 64 trapped | 12 injured
┌──────────────────────────────────────────────────┐
│ CONFIDENCE: 82%                                  │
│ Evidence:                                        │
│   ✓ District Control Room report                 │
│   ✓ 2 corroborating citizen reports              │
│   ✓ Image uploaded with GPS                      │
│   ⚠ Exact casualty count unverified             │
└──────────────────────────────────────────────────┘
```

### 7.7 Zone Aggregation

```
Algorithm:
1. Collect all ACTIVE incidents
2. Cluster by spatial proximity (Turf.js: 2km epsilon)
3. Each cluster = one operational zone
4. Zone centroid = population-weighted avg of incident coords
5. Zone need = sum incident demands (with population dedup:
     if two incidents share >60% estimated population → take max, not sum)
6. Zone priority = compute in Engine 2
```

---

## 8. Engine 2 — Need & Priority Engine

### 8.1 Four-Output Assessment

Unlike v1 (which had a single "Need Score"), each incident now produces 4 distinct scores:

| Score | What it measures | Range |
|---|---|---|
| **Severity** | How bad is the current situation? | 0–1 |
| **Urgency** | How quickly must we act? | 0–1 |
| **Need Intensity** | How much resource is unmet? | 0–1 |
| **Confidence** | How trustworthy is the data? | 0–1 |

**Severity:**
```
Severity = 0.40 × medical_intensity
         + 0.30 × structural_threat
         + 0.20 × environmental_hazard
         + 0.10 × density_factor

medical_intensity = min(injured/affected + 2×(trapped/affected) + 1.5×(missing/affected), 1.0)
structural_threat = {none: 0.0, partial: 0.5, full_collapse: 1.0}
environmental_hazard = {FLOOD: 0.70, EARTHQUAKE: 0.90, FIRE: 0.85, LANDSLIDE: 0.75, CYCLONE: 0.80}
density_factor = min(affected / 1000, 1.0)
```

**Urgency:**
```
Urgency = 0.50 × time_criticality
        + 0.30 × access_degradation
        + 0.20 × resource_depletion

time_criticality:
  FLOOD: 0.90 (water rising — hours matter)
  EARTHQUAKE: 0.95 (golden hour for trapped)
  SHELTER: 0.40 (days, but still time-sensitive)
  FOOD: 0.30 (days)

access_degradation: OPEN=0.10, PARTIAL=0.50, BLOCKED=0.90, UNKNOWN=0.60
resource_depletion = min(hours_without_supply / 48, 1.0)
```

### 8.2 Demand Vector — Transparent Rules

Every zone's resource demand is computed from explicit, auditable rules:

```javascript
function computeDemandVector(incident) {
  const { affected, injured, trapped, children, elderly } = incident.people;
  const { event_type } = incident;

  // Core demands
  const ambulances       = Math.ceil(injured * 0.4 / 4); // 4 = avg patient capacity
  const rescue_teams     = Math.ceil(trapped / 25);
  const boats            = event_type === 'FLOOD' ? Math.ceil(trapped / 20) : 0;
  const food_packets     = Math.ceil(affected * 1.2); // 20% buffer
  const water_litres     = affected * 3;
  const shelter_beds     = Math.ceil((affected - already_sheltered) * 0.9);
  const med_responders   = Math.ceil(injured / 8);
  const k9_teams         = (incident.assessment.structural_threat > 0.5 && trapped > 0) ? 1 : 0;

  // Vulnerability modifier: elderly + children > 30%? increase medical demand
  const vuln_ratio = (children + elderly) / affected;
  const vuln_multiplier = vuln_ratio > 0.30 ? 1.3 : 1.0;

  return {
    ambulances:          Math.ceil(ambulances * vuln_multiplier),
    rescue_teams,
    boats,
    food_packets,
    water_litres,
    shelter_beds,
    medical_responders:  Math.ceil(med_responders * vuln_multiplier),
    k9_teams
  };
}
```

### 8.3 Priority Formula

```
Priority(zone) = (
  0.35 × Severity     +
  0.25 × Urgency      +
  0.20 × NeedIntensity+
  0.10 × Vulnerability+
  0.10 × Isolation
) × confidence_modifier × 100

NeedIntensity = unmet_demand_weight / total_demand_weight  [0–1]
Vulnerability = (children + elderly) / affected             [0–1]
Isolation     = 1 - access_score
  (OPEN=0.9, PARTIAL=0.5, BLOCKED=0.05)

confidence_modifier = max(confidence, 0.70)
  # floor at 0.70 — even unverified high-severity gets considered

Zone amplifier for multi-incident clusters:
  zone_priority = max(incident_priorities) × (1 + log(incident_count) × 0.1)
```

**Example output:**

| Zone | People | Severity | Urgency | Isolation | Priority | Status |
|---|---|---|---|---|---|---|
| Zone A | 150 | 0.95 | 0.90 | 0.80 | **91** | 🔴 CRITICAL |
| Zone C | 80 | 0.90 | 0.85 | 0.90 | **78** | 🟠 HIGH |
| Zone B | 300 | 0.50 | 0.60 | 0.40 | **68** | 🟡 MODERATE |

### 8.4 Central-Side Degraded Operation: Reasoning under Partial & Fragmentary Data

In the first two hours of a catastrophe, central EOC headquarters receives only a small fraction (10–15%) of expected reports. Naive algorithms commit 100% of available assets to the earliest callers, catastrophically starving silent zones whose reports arrive later. ResQ incorporates three mathematical safeguards:

#### 1. Population-Baseline Prior (Spatial Bayesian Demand)
For any Uber H3 Hexagon $H_i$, the estimated need is never calculated purely from inbound report counts. Instead, ResQ establishes a baseline demand prior grounded in census population at risk:

$$\text{BaselineNeed}(H_i) = \text{Population}(H_i) \times \text{HazardIntensity}(H_i) \times \text{DemographicVulnerability}(H_i)$$

Even if an isolated ward has filed **zero reports** due to knocked-out cell towers, if hydro-sensor data or satellite models indicate severe flooding ($	ext{HazardIntensity} > 0.8$), its latent need remains active in the queue, preventing it from being classified as "safe."

#### 2. Staged Commitment & Fleet Reserve Policy
To prevent premature fleet exhaustion, the optimizer enforces a **Data-Confidence Capping Rule**:
- **Confidence $< 0.50$ (Fragmentary Data):** Caps asset commitment to a maximum of **70% of available fleet**. A mandatory **30% reserve buffer** is held at regional staging depots.
- **Confidence $0.50 - 0.80$ (Maturing Data):** Capped at **85% commitment** (15% reserve).
- **Confidence $> 0.80$ (Verified Ground Truth):** Full 100% operational deployment permitted.

#### 3. Capability-Tiered Probing (Reconnaissance Before Commitment)
When an incident exhibits high severity but low confidence (e.g. unverified social media rumor of a collapsed school), the system **does not deploy heavy, irreversible assets** (such as specialized surgical trailers or full NDRF battalions). Instead, it dispatches **light, rapid reconnaissance units** (thermal drones, motorcycle scout patrols) to establish ground truth within 15 minutes.

### 8.5 Zone Priority Queue Output

The priority engine outputs a ranked, sortable queue:

```
OPERATIONAL PRIORITY QUEUE — 15:47 IST

🔴  ZONE A — Ramganj Flood Cluster        Priority: 91
    150 affected · 32 injured · isolated  Confidence: 88%
    Need: 4 ambulances, 3 boats, 200 food
    Last resource dispatched: NEVER

🟠  ZONE C — Jagatpura Collapse           Priority: 78
    80 affected · 41 trapped · blocked    Confidence: 82%
    Need: 2 CSSR teams, 1 K9, 3 ambulances

🟡  ZONE B — Sanganer Camp               Priority: 68
    300 affected · 15 injured · open      Confidence: 91%
    Need: 900 food, 1800L water, 150 beds
```

---

## 9. Engine 3 — Resource Optimisation Engine

### 9.1 NDRF-Aligned Hierarchical Resource Model

```
MEDICAL
  ├── Ambulance (Type I)    capabilities: [medical_transport, bls, oxygen, 4_patient]
  ├── Ambulance (Type II)   capabilities: [medical_transport, als, icu_transport, 2_patient]
  ├── ICU Van               capabilities: [icu_transport, critical_care, 1_patient]
  ├── Medical First Responder capabilities: [triage, first_aid, mass_casualty]
  ├── Trauma Kit (supply)   capabilities: [trauma_supply]
  └── Medicines (supply)    capabilities: [medical_supply]

SEARCH & RESCUE
  ├── NDRF Rescue Team      capabilities: [water_rescue, evacuation, urban_rescue, medical_response]
  ├── SDRF Rescue Team      capabilities: [water_rescue, evacuation, basic_first_aid]
  ├── CSSR Team             capabilities: [rubble_rescue, life_detection, cutting, lifting]
  ├── K9 Unit               capabilities: [search_detection, scent_tracking, rubble_navigation]
  └── Rescue Radar          capabilities: [life_detection, through_wall_sensing]

FLOOD / WATER
  ├── IRB (Inflatable Rescue Boat)  capabilities: [water_rescue, flood_navigation, 20_person]
  ├── FRP Boat                      capabilities: [water_rescue, flood_navigation, 12_person]
  ├── Diving Team                   capabilities: [underwater_rescue, dive_navigation]
  └── Life Jackets (supply)         capabilities: [flood_safety_supply]

FIRE
  ├── Fire Team             capabilities: [fire_suppression, evacuation, extrication]
  ├── Water Pump            capabilities: [dewatering, fire_suppression]
  └── UAV                   capabilities: [aerial_survey, crowd_detection]

SHELTER & RELIEF
  ├── Emergency Shelter     capabilities: [shelter_capacity, bedding, hygiene]
  ├── Food Depot            capabilities: [food_supply]
  ├── Water Tanker          capabilities: [water_supply]
  ├── Medical Supply Kit    capabilities: [medical_supply]
  └── Hygiene Kit           capabilities: [hygiene_supply]

COMMUNICATION
  ├── Satellite Phone       capabilities: [offline_comms]
  ├── Portable Repeater     capabilities: [radio_range_extension]
  └── HF Radio              capabilities: [long_range_comms]
```

**Resource Record Example:**
```json
{
  "resource_id":   "NDRF_IRB_04",
  "name":          "NDRF Inflatable Rescue Boat 04",
  "agency":        "NDRF_UNIT_7_JAIPUR",
  "category":      "FLOOD_WATER",
  "sub_type":      "IRB",
  "capabilities":  ["water_rescue", "flood_navigation", "20_person"],
  "capacity":      20,
  "quantity":      1,
  "status":        "AVAILABLE",
  "current_zone":  null,
  "current_coords": {"lat": 26.912, "lng": 75.789},
  "owning_agency": "NDRF",
  "travel_speed_kmh": 15,
  "last_updated":  "2026-09-11T15:00:00Z"
}
```

### 9.2 Multi-Agency Resource Ownership

```
Platform does NOT own NDRF resources.
Each agency manages its own inventory.

NDRF Unit 7 Admin → updates NDRF resources
SDRF Region 3 Admin → updates SDRF resources
District Hospital → updates beds + ambulances
NGO "Relief India" → updates food + water stock
Police → updates vehicles
District Authority → updates shelters + camps

Platform aggregates into:
COMMON OPERATIONAL PICTURE

Agency-specific notifications:
  NDRF: "Zone B requires water_rescue + evacuation capability — 3 teams needed"
  Hospital: "Zone A — 12 injured incoming, prepare 15 emergency beds"
  NGO: "Zone B — 850 affected, 900 food packets, 1800L water needed"
  Police: "Road NH-58 near Zone A — establish diversion"
```

### 9.3 Capability-Based Matching

```javascript
// Capabilities required per event type
const REQUIRED_CAPABILITIES = {
  FLOOD:      ['water_rescue', 'evacuation', 'medical_transport'],
  EARTHQUAKE: ['rubble_rescue', 'life_detection', 'medical_transport', 'search_detection'],
  FIRE:       ['fire_suppression', 'evacuation'],
  LANDSLIDE:  ['rubble_rescue', 'cutting', 'medical_transport'],
  MEDICAL:    ['medical_transport', 'triage']
};

function matchScore(resource, zone) {
  const required = REQUIRED_CAPABILITIES[zone.event_type] || [];
  const provided = resource.capabilities;
  const intersection = provided.filter(c => required.includes(c));
  return intersection.length / required.length;
}

// Only resources with matchScore >= 0.5 are candidates for a zone
```

### 9.4 Dual-Domain Optimization: Ground Assets + Autonomous Aerial Coverage

The optimization engine manages two distinct operational domains through Mixed Integer Linear Programming (Google OR-Tools) and priority-weighted heuristics:

#### 1. Ground Transport & Marine Rescue
- **Road Network Graph:** OSRM / OpenRouteService with dynamic **flood penalties**. Submerged segments receive $\infty$ cost, while passable waterlogged roads apply speed penalty factors ($0.3	imes$).
- **Capacity Constraints:** Ambulances restricted by patient capacity; trucks by payload kg; rescue boats by passenger count.

#### 2. Autonomous Drone Coverage Planning
- **Battery Limits:** Every drone asset tracks `battery_level` (0.0 to 1.0) and discharge curve ($	ext{mAh/min}$).
- **Airspace Restrictions:** Flight corridors respect designated no-fly zones (e.g. active civilian evacuation flight paths, high-tension powerlines).
- **Mission Profiling:** The solver computes `est_battery_consumption` for each waypoint leg. Drones are scheduled with mandatory 20% battery reserve return-to-launch (RTL) thresholds.

### 9.5 Greedy Priority Allocation Algorithm

```javascript
function runAllocation(zones, resources, routeMatrix, constraints) {
  // Sort zones by priority descending
  const priorityQueue = [...zones].sort((a, b) => b.priority - a.priority);
  const assignments = [];
  const unmetNeeds = [];
  let availablePool = resources.filter(r => r.status === 'AVAILABLE');

  for (const zone of priorityQueue) {
    const demandVector = zone.demand_vector;

    for (const [needType, quantityNeeded] of Object.entries(demandVector)) {
      let remaining = quantityNeeded;

      // Find candidates: available, capability match, route accessible
      const candidates = availablePool
        .filter(r => {
          const score = matchScore(r, zone);
          const routeOk = isRouteAccessible(r.current_coords, zone.centroid, routeMatrix);
          return score >= 0.5 && routeOk;
        })
        .sort((a, b) => {
          // Primary: travel time ASC; Secondary: match score DESC
          const tA = travelTime(a.current_coords, zone.centroid, routeMatrix);
          const tB = travelTime(b.current_coords, zone.centroid, routeMatrix);
          if (tA !== tB) return tA - tB;
          return matchScore(b, zone) - matchScore(a, zone);
        });

      for (const resource of candidates) {
        if (remaining <= 0) break;
        const travelMins = travelTime(resource.current_coords, zone.centroid, routeMatrix);

        assignments.push({
          resource_id:    resource.resource_id,
          zone_id:        zone.zone_id,
          need_type:      needType,
          match_score:    matchScore(resource, zone),
          travel_minutes: travelMins,
          utility_score:  zone.priority * matchScore(resource, zone) / travelMins,
          reasoning:      buildReasoning(resource, zone, travelMins, candidates)
        });

        remaining -= resource.capacity;
        availablePool = availablePool.filter(r => r.resource_id !== resource.resource_id);
      }

      if (remaining > 0) {
        unmetNeeds.push({ zone_id: zone.zone_id, need_type: needType, unmet: remaining });
      }
    }
  }

  // Equity correction pass
  for (const zone of zones) {
    if (equityScore(zone) < 0.4) {
      const next = availablePool[0];
      if (next) {
        assignments.push({ ...next, zone_id: zone.zone_id, reason: 'EQUITY_FORCED' });
        availablePool.shift();
        emitEquityForcedAlert(zone.zone_id);
      }
    }
  }

  return { assignments, unmetNeeds };
}
```

**Objective function (for explainability):**
```
Maximise: Σ(assignment.zone_priority × assignment.match_score × 1/assignment.travel_minutes)

Subject to:
  - Each resource used at most once
  - Travel time ≤ maximum_allowed_time (configurable)
  - Resource capacity respected
  - Minimum reserve maintained (e.g., 2 ambulances in staging)
  - Route accessibility (no blocked roads)
```

### 9.5 "Why This Allocation?" — Per-Assignment Explainability

Every assignment generates a human-readable reasoning block:

```javascript
function buildReasoning(resource, zone, travelMins, allCandidates) {
  const nextBest = allCandidates[1];
  const nextBestTime = nextBest ? travelTime(nextBest.coords, zone.centroid) : null;

  return [
    `${travelMins} min travel time (${nextBestTime ? `next alternative: ${nextBestTime} min` : 'only option'})`,
    `Capability match: ${matchScore(resource, zone) * 100}% of required capabilities`,
    `Capacity: ${resource.capacity} ${resource.unit} (zone needs ${zone.demand_vector[resource.category]})`,
    `Zone ${zone.zone_id} has priority ${zone.priority}/100 (rank #${zone.priority_rank} active)`,
    `Assigned by: GREEDY PRIORITY OPTIMIZER`
  ];
}
```

**UI display:**
```
AMB-17 → Zone A — Ramganj
─────────────────────────────────────────────────
Selected because:
  • 7 min travel time (next alternative AMB-19: 19 min)
  • 100% capability match: [bls, oxygen, medical_transport]
  • 4-patient capacity; Zone A needs 4 ambulances (12 injured)
  • Zone A priority: 91/100 (highest active)
  • Utility score: 91 × 1.0 / 7 = 13.0

[✅ Approve]  [✏️ Modify]  [❌ Reject]
```

### 9.6 Human Approval Flow

```
System generates plan (deterministic)
          │
          ▼
Commander sees plan in dashboard
  ├── View each assignment with reasoning
  ├── Override individual assignments
  └── See unmet needs highlighted

Commander actions:
  [APPROVE ALL]     → all assignments → DISPATCHED status
  [APPROVE SELECTED] → partial approval
  [MODIFY]          → swap resource, change zone
  [REJECT]          → plan scrapped, manual allocation

Post-approval:
  → Resource status updated to ASSIGNED → EN_ROUTE
  → Agency admin receives dispatch notification
  → ETA shown on map
  → Equity score recomputed
```

---

## 10. Engine 4 — Dynamic Situation Engine

### 10.1 Trigger Events

| Event | Source | Response |
|---|---|---|
| **Route blocked** | Logistics officer marks road | Re-run allocation excluding route; show diff |
| **Route reopened** | Same | Re-run including new route; show improvement |
| **New incident** | Report submitted with severity > 0.80 | Auto re-optimise |
| **Resource damaged** | Admin updates status to DAMAGED | Remove from pool, re-run |
| **Equity breach** | Zone equity drops below 0.30 | Force re-optimise + flag |
| **Equity Time-Decay** | Active hex with $E_i = 0$ for $>90$ min | Auto-triggers equity pass to pull next available asset |
| **Zone escalated** | Commander manually increases priority | Bump +20, re-run |
| **Commander manual** | Button press | Re-run with same state |

### 10.2 Plan Diff View

```
PLAN CHANGED — 16:03 IST
Trigger: Road NH-58 blocked (confirmed: bridge submerged)
Affected: 2 resource assignments changed

════════════════════════════════════════════════════════
  CHANGE 1:
  OLD: NDRF_IRB_04 → Zone A  via NH-58  ETA: 18 min
  NEW: SDRF_FRP_02 → Zone A  via SH-12  ETA: 31 min
  Impact: +13 min Zone A response time
  Reason: NH-58 inaccessible; SDRF boat faster than any other option
────────────────────────────────────────────────────────
  CHANGE 2:
  OLD: NDRF_RESCUE_14 → Zone B
  NEW: NDRF_RESCUE_14 → Zone A  (reallocated from Zone B)
       + SDRF_RESCUE_04 → Zone B (newly assigned, 22 min)
  Impact: Zone A ETA unchanged; Zone B +10 min but now has coverage
  Reason: Zone A urgency score 0.93 (highest); SDRF covers Zone B gap
════════════════════════════════════════════════════════

Expected improvement: Zone A unmet need 31% → 9%
Equity: Zone B goes from 0% → 45% coverage

[✅ Approve Changes]  [🔄 Keep Old Plan]  [✏️ Modify]
```

### 10.3 Resource Lifecycle

```
AVAILABLE
    │
    │ (commander approves assignment)
    ▼
ASSIGNED
    │
    │ (resource accepts, begins moving)
    ▼
EN_ROUTE
    │
    │ (arrives at zone)
    ▼
ON_SITE
    │
    │ (resource partially consumed / capacity remaining)
    ├──────────────────► PARTIALLY_USED
    │                        │
    │ (fully consumed)        │ (returns to base)
    ▼                        ▼
COMPLETED                 RETURNING
    │                        │
    └─────────┬──────────────┘
              │
              ▼
          AVAILABLE   (ready for next assignment)

Alt paths:
  Any state → DAMAGED (mark as unavailable, trigger reallocation)
  Any state → UNAVAILABLE (planned maintenance, out of area)
```

### 10.4 Feedback Loop

After each deployment, the system tracks actual vs estimated:

```
Estimated Zone A medical need: 12 patients
Actual treated on-site: 9
Estimation error: -25%

Estimated food: 180 packets
Actual consumed: 142 packets
Estimation error: -21%

→ Future incidents of type FLOOD:
  medical_demand_multiplier adjusted: ×0.85
  food_demand_multiplier adjusted: ×0.85

This makes the system's estimates better over time.
```

---

## 11. Equity Engine — The Differentiator

### 11.1 Fulfilled Need Ratio ($E_i$) & Mathematical Formulation

The Fairness Layer evaluates resource parity across every Uber H3 Hexagon:

$$\text{Fulfilled Need Ratio } E_i = \frac{\text{Resources Deployed to } H_i}{\text{Cumulative Need Weight of } H_i} = \frac{\sum_{r \in R(H_i)} w_r \cdot q_r}{\sum_{inc \in I(H_i)} (\text{Priority}_{inc} \cdot \text{DemographicVulnerability}_{inc})}$$

Where:
- $w_r$: Standardized resource weight (e.g., Ambulance = 10, CSSR Rescue Team = 9, Thermal Drone = 8, Boat = 6, Medic = 5, Water/Food = 1).
- $q_r$: Quantity of deployed assets currently operational within the H3 Hex.
- $\text{DemographicVulnerability}$: CDC Social Vulnerability Index multiplier (elderly, children, infirm populations boost need weight by up to $+30\%$)

**Equitable Action Matrix:**
- **$E_i \ge 1.0$ (Well-Served - Green):** Hex requirements fully satisfied.
- **$0.6 \le E_i < 1.0$ (Adequately Served - Yellow):** Ongoing operations stable.
- **$0.4 \le E_i < 0.6$ (Underserved - Orange):** Flagged for priority replenishment in next allocation cycle.
- **$E_i < 0.4$ (Critical Underserved - Red):** Triggers automated **Equity Forced Assignment**, reserving next available assets.
- **$E_i = 0$ (Forgotten Pocket - Pulsing Pink):** Hex has active incidents but zero assigned assets for $>90$ minutes; triggers high-priority visual alert and commander audio notification.

### 11.2 Classification & Actions

| Equity Score | Label | Badge | Required Action |
|---|---|---|---|
| ≥ 1.0 | WELL-SERVED | 🟢 Green | None |
| 0.6–0.99 | ADEQUATELY SERVED | 🟡 Yellow | Monitor |
| 0.4–0.59 | UNDERSERVED | 🟠 Orange | Review next cycle |
| 0.1–0.39 | CRITICAL UNDERSERVED | 🔴 Red | Immediate equity pass |
| 0 | FORGOTTEN ZONE | 🔴 Pulsing + ⚠️ | **Commander must acknowledge** |

### 11.3 Forced-Allocation Rule (New in v2)

```
IF zone.equity_score < 0.40:
  → Equity correction pass runs after normal allocation
  → Next available resource (any type) assigned to this zone
  → Alert generated: "EQUITY FORCED ASSIGNMENT — Zone X"
  → This overrides the priority queue for one slot

IF zone.equity_score == 0 AND zone.hours_without_resources >= 2:
  → FORGOTTEN ZONE badge
  → Persistent notification (requires commander click to dismiss)
  → Gemini Flash generates equity narrative: "Zone X has received zero support in N hours..."
```

### 11.4 Equity Panel UI

```
⚖️ EQUITY LENS                          [📊 Export] [🔄 Refresh]
"When every second counts, bias kills. Find the forgotten pockets."
─────────────────────────────────────────────────────────────────
COVERAGE: ████████████░░░░░░░░  58% zones adequately served
🔴 1 Forgotten  🟠 2 Critical  🟡 2 Underserved  🟢 3 Well-served
─────────────────────────────────────────────────────────────────
Zone         Need  Received   Equity   Status
─────────────────────────────────────────────────────────────────
⚠️ Z6 Sanganer  61    NONE     0%     🔴 FORGOTTEN  [ACK required]
🟠 Z4 Jagatpura  73    LOW     28%    🔴 CRITICAL
🟡 Z3 Mansarovar 55    MED     52%    🟡 UNDERSERVED
🟢 Z1 Ramganj    91    HIGH   105%    🟢 WELL-SERVED
─────────────────────────────────────────────────────────────────
💬 AI NARRATIVE (Gemini Flash):              [Generate ✨]
"Zone 6 (Sanganer) has received zero resources despite a
priority score of 61. With 34 children and 22 elderly persons
in the affected population (high vulnerability index 0.71),
this zone represents a critical equity gap. Immediate
dispatch of at least one rescue team recommended."

[🔔 Alert Commander]  [📌 Force-Assign Next Available]
```

---

## 12. Degraded / Offline Mode

### 12.1 What Still Works Offline

| Feature | Online | Offline (Degraded) |
|---|---|---|
| Map rendering | ✅ Live tiles | ✅ Cached tiles |
| Zone polygons | ✅ Realtime | ✅ Cached GeoJSON |
| Resource markers | ✅ Live | ✅ Last known positions |
| Priority queue | ✅ Live | ✅ Cached scores |
| Field report submission | ✅ Instant sync | ✅ Queued locally |
| AI allocation engine | ✅ Active | ❌ Disabled (requires backend) |
| Equity scores | ✅ Live | ✅ Cached last computed |
| Status updates | ✅ Instant | ✅ Queued, sync on reconnect |

### 12.2 CRDT-Based Offline State Reconciliation

In high-intensity disaster zones, network towers collapse frequently. ResQ implements **Conflict-Free Replicated Data Types (CRDTs)** via IndexedDB and Wasm SQLite:

1. **State-Based CRDTs (LWW-Element-Set):** Each field unit maintains a local replica of incident reports and waypoint completions. Status updates attach monotonic logical timestamps.
2. **Deterministic Merge Guarantee:** When a field unit enters cellular coverage after a 12-hour dead-zone patrol, local updates merge mathematically into central Supabase state with **zero central merge conflicts** and **zero data loss**.
3. **Bandwidth-Optimized Diff Sync:** Only Delta-CRDT state changes are transmitted over intermittent 2G/EDGE or satellite links, compressing sync payloads down to <5 KB per synchronization cycle.

```javascript
// localStorage keys
const CACHE_KEYS = {
  INVENTORY:     'resq_inventory_v2',
  ZONE_SCORES:   'resq_zone_scores',
  INCIDENTS:     'resq_incidents',
  LAST_PLAN:     'resq_last_plan',
  REPORT_QUEUE:  'resq_offline_reports',
  CACHED_AT:     'resq_cache_timestamp'
};

// Service Worker: cache map tiles + static assets
// IndexedDB: larger payloads (incident list, full inventory)
```

### 12.3 Offline Banner

```
┌─────────────────────────────────────────────────────────────────┐
│ 🟠 DEGRADED MODE — Cached data from 14:22 IST (48 sec ago)     │
│  Queued updates: 7 | AI allocation: unavailable                 │
│                                         [🔄 Retry Connection]   │
└─────────────────────────────────────────────────────────────────┘
```

### 12.4 Reconnection Sync

```
On reconnection:
1. Flush offline report queue to server
2. Server processes each queued report through Fusion Engine
3. Conflict resolution: server state wins (last-write-wins with timestamp)
4. Dashboard refreshes with merged state
5. Banner: "🟢 RECONNECTED — 7 queued reports synced"
```

---

## 13. Command Dashboard UI/UX

### 13.1 Design System

**Colour Palette:**
```css
/* Status colours */
--critical:    #EF4444;   /* Need score 80-100 / FORGOTTEN zone */
--high:        #F97316;   /* Need score 60-79 / CRITICAL underserved */
--moderate:    #EAB308;   /* Need score 40-59 / UNDERSERVED */
--low:         #22C55E;   /* Need score 0-39 / WELL-SERVED */
--dispatched:  #3B82F6;   /* EN_ROUTE resources */
--equity-zero: #7C3AED;   /* Forgotten zone pulsing */

/* Dashboard (dark EOC default) */
--bg-primary:  #0F172A;
--bg-panel:    #1E293B;
--bg-card:     #334155;
--text-primary:#F1F5F9;
--text-muted:  #94A3B8;
--border:      #475569;
--accent:      #6366F1;
```

**Typography:** Plus Jakarta Sans (display & UI) + JetBrains Mono (IDs, coords, formulas)

### 13.2 Dashboard Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│ HEADER: ResQ | Incident: Uttarakhand Flood T+04:22 | 15:47 IST | Raj ▾ | 🔔3│
├────────────────────────────────────┬───────────────────────────────────┤
│                                    │  TABS:                            │
│                                    │  [Queue][Inventory][Plan][Equity] │
│         LEAFLET MAP                │                                   │
│   ┌─ Layers ─────────────────┐     │  ┌─ Active Tab Panel ──────────┐ │
│   │ ✓ Zone Boundaries        │     │  │                             │ │
│   │ ✓ Priority Heatmap       │     │  │  (scrollable content)       │ │
│   │ □ Equity Overlay         │     │  │                             │ │
│   │ ✓ Resource Markers       │     │  └─────────────────────────────┘ │
│   │ □ Routes                 │     │                                   │
│   └──────────────────────────┘     │  ┌─ Status Footer ─────────────┐ │
│                                    │  │ 🟢 LIVE | 5 zones | 3 CRIT  │ │
│                                    │  │ UNMET NEED: 31%              │ │
│                                    │  └─────────────────────────────┘ │
└────────────────────────────────────┴───────────────────────────────────┘
```

### 13.3 Top Summary Bar

```
┌──────────────────────────────────────────────────────────────────────┐
│  ACTIVE INCIDENTS  24  │  CRITICAL  7  │  RESOURCES  83  │  UNMET 31%│
└──────────────────────────────────────────────────────────────────────┘
```

### 13.4 Priority Queue Panel

```
🔴 ZONE A — Ramganj Flood              Priority 91
   150 affected · 32 injured · isolated · CONFIDENCE 88%
   Needs: 4 ambulances · 3 boats · 200 food
   Resources here: NONE  [CRITICAL — 0 dispatched]

🟠 ZONE C — Jagatpura Collapse         Priority 78
   80 affected · 41 trapped · blocked
   Needs: 2 CSSR · 1 K9 · 3 ambulances
   Resources: NDRF CSSR-1 en route (ETA 18 min)

🟡 ZONE B — Sanganer Camp             Priority 68
   300 affected · 15 injured · road open
   Needs: 900 food · 1800L water · 150 shelter beds
   Resources: NGO Depot A dispatching (ETA 25 min)
```

### 13.5 Incident Detail Panel (Zone click on map)

```
┌────────────────────────────────────────────┐
│  ZONE A — Ramganj Flood Cluster            │
│  4 incidents merged | Priority: 91          │
│  ──────────────────────────────────────── │
│  👥 150 affected  💔 32 injured             │
│  🏊 64 trapped   ❓ 5 missing              │
│  👶 22 children  🧓 18 elderly             │
│  ──────────────────────────────────────── │
│  Assessment:                               │
│  Severity  █████████░  88%                 │
│  Urgency   ██████████  94%                 │
│  Need      ████████░░  81%                 │
│  Confidence████████░░  82%                 │
│  ──────────────────────────────────────── │
│  Road: NH-12 OPEN · NH-58 BLOCKED          │
│  ETA (best route): 18 min                  │
│  ──────────────────────────────────────── │
│  Resources dispatched: NONE               │
│  Equity: ⚠️  0% — FORGOTTEN ZONE          │
│  ──────────────────────────────────────── │
│  [📋 View Reports] [⚡ Dispatch Resource]  │
│  [🚨 Escalate Priority]                   │
└────────────────────────────────────────────┘
```

### 13.6 Agency Admin Panel

```
┌─────────────────────────────────────────────────────────────┐
│  NDRF UNIT 7 — Jaipur                    Arjun Mehta, Admin │
│  ─────────────────────────────────────────────────────────  │
│  PENDING DISPATCH REQUESTS                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ IRB-04 → Zone A via SH-12                ETA 31 min │   │
│  │ Requested by: Commander Raj Kumar  15:47 IST        │   │
│  │ [✅ Confirm Dispatch] [❌ Decline] [💬 Note]         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  MY RESOURCES (NDRF Unit 7)                                 │
│  AMB-01  Available  Zone: Staging                           │
│  IRB-04  Assigned   → Zone A (pending confirm)              │
│  RESCUE-14  En Route → Zone B  ETA: 9 min                   │
│  CSSR-07  Available  Zone: Staging                          │
│                                                             │
│  [+ Add Resource] [📊 Status Report]                        │
└─────────────────────────────────────────────────────────────┘
```

### 13.7 Field Report Mobile Form

```
┌────────────────────────────────┐
│  📡 REPORT AN INCIDENT — ResQ  │
├────────────────────────────────┤
│  Your Name *                   │
│  [________________________]   │
│                                │
│  Your Role *                   │
│  [District Control Room    ▾]  │
│                                │
│  Event Type *                  │
│  [Flood                    ▾]  │
│                                │
│  Location *                    │
│  [📍 Use GPS]  [Pin on Map]    │
│                                │
│  People Affected *   [   850 ] │
│  Injured             [    18 ] │
│  Trapped             [   110 ] │
│                                │
│  Severity: ① ② ③ ④ ⑤          │
│                                │
│  Access Route:                 │
│  ○ Open  ● Partial  ○ Blocked  │
│                                │
│  Notes:                        │
│  [School near river. Water   ] │
│  [entering ground floor.     ] │
│                                │
│  [📸 Attach Photo]             │
│                                │
│  [📤 Submit Report]            │
└────────────────────────────────┘
```

---

## 14. Database & Core Data Schemas

Strict, standardized JSON and PostGIS schemas guarantee deterministic AI extraction, inter-agency interoperability, and end-to-end auditability.

### 14.1 Core Structural Schemas (Fast-Stack Data Models)

#### 1. Asset Schema (Multi-Agency Live Inventory)
```json
{
  "id": "UUID",
  "agency_owner": "String (e.g., NDRF_UNIT_7, RAJASTHAN_SDRF, DISTRICT_POLICE)",
  "type": "Enum (Boat, Truck, Drone, Medic, CSSR_Team, Ambulance)",
  "capabilities": {
    "thermal_sensing": true,
    "payload_kg": 5.0,
    "medical_level": "BLS",
    "water_rescue": true,
    "patient_capacity": 4
  },
  "battery_level": 0.85,
  "geo_location": "POINT(75.7873 26.9124)",
  "status": "Enum (Available, En-Route, Busy, Returning, Offline, Damaged)"
}
```

#### 2. SOS Incident Schema (Need Assessment & Detections)
```json
{
  "id": "UUID",
  "media_type": "Enum (Voice, Text, Image, Thermal_Image, Multispectral, Sensor_Uplink)",
  "vulnerability_flags": {
    "elderly_count": 18,
    "children_count": 22,
    "critical_medical": true,
    "submerged_ground_floor": true
  },
  "extracted_needs": {
    "boats": 3,
    "ambulances": 2,
    "trauma_kits": 15,
    "food_packets": 250
  },
  "detection_confidence": 0.88,
  "human_signs_detected": true,
  "h3_hex_id": "88609a6567fffff",
  "priority_score": 0.914
}
```

#### 3. Spatial Hex Schema (Uber H3 Indexing)
```json
{
  "hex_address": "88609a6567fffff",
  "cumulative_need_weight": 84.5,
  "resource_density": 3,
  "equity_ratio_ei": 0.284,
  "terrain_risk_score": 0.75
}
```

#### 4. Dispatch & Waypoint Schema (Optimized Routes & Drone Paths)
```json
{
  "id": "UUID",
  "asset_id": "UUID",
  "incident_id": "UUID",
  "waypoint_type": "Enum (Ground Team Waypoint, Drone Search Path, Drop Zone)",
  "est_battery_consumption": 0.32,
  "destination_resource_id": "UUID (nullable, target Shelter or Depot ID)",
  "allocation_reasoning": "String (e.g. 'Selected AMB-04: 7 min ETA via SH-12, 100% BLS match, 4-patient capacity. Next alt AMB-12 is 19 min away.')",
  "optimized_route_polyline": "enc:m~`~Fz_`{M_... (OSRM Polyline)",
  "status": "Enum (Dispatched, En-Route, Arrived, Complete)"
}
```

### 14.2 Relational Tables (Supabase PostgreSQL + PostGIS)

### 14.1 `reports` — Raw Inbound Signals

```sql
CREATE TABLE reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id     TEXT UNIQUE NOT NULL,  -- 'RPT-20260911-0042'
  source_type   TEXT CHECK (source_type IN ('FORM','TEXT','VOICE','IMAGE','AGENCY_API','CONTROL_ROOM')),
  reporter_role TEXT CHECK (reporter_role IN ('NDRF','SDRF','POLICE','HOSPITAL','NGO_FIELD','CIVILIAN','SENSOR')),
  reporter_name TEXT,
  raw_content   TEXT,
  extracted_data JSONB,
  location_text  TEXT,
  location_coords GEOMETRY(Point, 4326),
  submitted_at   TIMESTAMPTZ DEFAULT NOW(),
  is_processed   BOOLEAN DEFAULT FALSE,
  incident_id    UUID REFERENCES incidents(id),
  credibility_score DECIMAL(3,2)
);
```

### 14.2 `incidents` — Deduplicated, Validated Events *(NEW)*

```sql
CREATE TABLE incidents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id    TEXT UNIQUE NOT NULL,  -- 'INC-1042'
  zone_id        TEXT REFERENCES zones(id),
  location       GEOMETRY(Point, 4326),
  event_type     TEXT CHECK (event_type IN ('FLOOD','EARTHQUAKE','FIRE','LANDSLIDE','CYCLONE','MEDICAL_SURGE','OTHER')),
  status         TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','RESOLVED','DUPLICATE','CLOSED')),
  
  -- People counts
  affected       INTEGER DEFAULT 0,
  trapped        INTEGER DEFAULT 0,
  injured        INTEGER DEFAULT 0,
  missing        INTEGER DEFAULT 0,
  children       INTEGER DEFAULT 0,
  elderly        INTEGER DEFAULT 0,
  
  -- Computed demand
  demand_vector  JSONB,  -- {ambulances:4, boats:5, food:900, ...}
  
  -- Assessment scores
  severity       DECIMAL(3,2),
  urgency        DECIMAL(3,2),
  vulnerability  DECIMAL(3,2),
  confidence     DECIMAL(3,2),
  priority_score DECIMAL(5,2),
  
  -- Access
  road_status    TEXT CHECK (road_status IN ('OPEN','PARTIAL','BLOCKED','UNKNOWN')),
  travel_minutes INTEGER,
  
  -- Evidence
  report_count   INTEGER DEFAULT 1,
  evidence       JSONB,  -- array of evidence objects
  
  -- Flags
  verify_flag    BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_zone ON incidents(zone_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_location ON incidents USING GIST(location);
```

### 14.3 `zones` — Operational Clusters

```sql
CREATE TABLE zones (
  id                   TEXT PRIMARY KEY,  -- 'Z4'
  name                 TEXT NOT NULL,
  district             TEXT,
  boundary             GEOMETRY(Polygon, 4326),
  centroid             GEOMETRY(Point, 4326),
  population           INTEGER DEFAULT 0,
  vulnerability_index  DECIMAL(3,2),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
```

### 14.4 `resources` — NDRF-Aligned, Capability-Based *(Upgraded)*

```sql
CREATE TABLE resources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id     TEXT UNIQUE NOT NULL,  -- 'NDRF_IRB_04'
  name            TEXT NOT NULL,
  agency_id       UUID REFERENCES agencies(id),
  category        TEXT NOT NULL CHECK (category IN ('MEDICAL','SEARCH_RESCUE','FLOOD_WATER','FIRE','SHELTER_RELIEF','COMMUNICATION')),
  sub_type        TEXT,
  capabilities    TEXT[],  -- ['water_rescue', 'flood_navigation', '20_person']
  quantity        INTEGER DEFAULT 1,
  capacity        INTEGER,
  unit            TEXT,
  status          TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','ASSIGNED','EN_ROUTE','ON_SITE','PARTIALLY_USED','COMPLETED','RETURNING','DAMAGED','UNAVAILABLE')),
  current_zone    TEXT REFERENCES zones(id),
  current_coords  GEOMETRY(Point, 4326),
  travel_speed_kmh INTEGER DEFAULT 40,
  last_updated    TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_agency ON resources(agency_id);
CREATE INDEX idx_resources_coords ON resources USING GIST(current_coords);
```

### 14.5 `agencies` — Multi-Agency Model *(NEW)*

```sql
CREATE TABLE agencies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   TEXT UNIQUE NOT NULL,  -- 'NDRF_UNIT7_JAIPUR'
  name        TEXT NOT NULL,         -- 'NDRF Unit 7, Jaipur'
  type        TEXT CHECK (type IN ('NDRF','SDRF','POLICE','FIRE','HOSPITAL','NGO','DISTRICT_AUTH','ARMY','NAVY')),
  contact_officer TEXT,
  phone       TEXT,
  area_of_operation TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 14.6 `allocation_plans`

```sql
CREATE TABLE allocation_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         TEXT UNIQUE NOT NULL,
  version         INTEGER DEFAULT 1,
  status          TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','SUPERSEDED')),
  trigger_type    TEXT,  -- 'COMMANDER_MANUAL', 'ROUTE_BLOCKED', 'NEW_INCIDENT', etc.
  narrative_text  TEXT,  -- Gemini Flash-generated plain language
  assignments     JSONB,  -- array of assignment objects
  unmet_needs     JSONB,
  equity_flags    JSONB,
  plan_diff       JSONB,  -- vs previous plan (for dynamic reallocation)
  utility_score   DECIMAL(8,2),  -- total objective function value
  approved_by     UUID REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 14.7 `zone_scores`

```sql
CREATE TABLE zone_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id       TEXT REFERENCES zones(id),
  priority_score DECIMAL(5,2),
  equity_score  DECIMAL(5,4),
  equity_status TEXT CHECK (equity_status IN ('WELL_SERVED','ADEQUATELY_SERVED','UNDERSERVED','CRITICAL_UNDERSERVED','FORGOTTEN')),
  resources_received_weight INTEGER,
  demand_vector JSONB,
  ack_required  BOOLEAN DEFAULT FALSE,
  acked_by      UUID REFERENCES auth.users(id),
  computed_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 14.8 `route_conditions`

```sql
CREATE TABLE route_conditions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  road_name    TEXT NOT NULL,
  from_zone    TEXT REFERENCES zones(id),
  to_zone      TEXT REFERENCES zones(id),
  status       TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN','PARTIAL','BLOCKED','UNKNOWN')),
  blocked_reason TEXT,
  updated_by   UUID REFERENCES auth.users(id),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 14.9 `audit_log`

```sql
CREATE TABLE audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type  TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    TEXT,
  old_value    JSONB,
  new_value    JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 14.10 RLS Role Policies

| Role | Reports | Incidents | Resources | Allocation | Equity |
|---|---|---|---|---|---|
| `OBSERVER` | READ | READ | READ | READ | READ |
| `FIELD` | INSERT | READ | READ | — | READ |
| `AGENCY_ADMIN` | — | READ | R/W (own agency) | READ | READ |
| `LOGISTICS` | — | READ | R/W | READ | READ |
| `COMMANDER` | ALL | ALL | ALL | ALL | ALL |

---

## 15. API Contract

### 15.1 POST `/api/reports` — Submit Field Report

**Request:**
```json
{
  "reporter_role": "CONTROL_ROOM",
  "source_type": "FORM",
  "event_type": "FLOOD",
  "location_coords": {"lat": 26.9124, "lng": 75.7873},
  "people": {"affected": 850, "trapped": 110, "injured": 18},
  "road_status": "PARTIAL",
  "notes": "School near Ramganj. Water entering first floor."
}
```

**Response 201:**
```json
{
  "report_id": "RPT-20260911-0089",
  "fusion_result": {
    "action": "MERGED_INTO_INCIDENT",
    "incident_id": "INC-1042",
    "match_score": 0.84,
    "new_confidence": 0.88,
    "priority_updated": true,
    "new_priority": 91.4
  }
}
```

### 15.2 GET `/api/incidents` — List All Active Incidents

**Response 200:**
```json
{
  "incidents": [
    {
      "incident_id": "INC-1042",
      "zone_id": "Z1",
      "event_type": "FLOOD",
      "people": {"affected": 850, "trapped": 110, "injured": 18},
      "assessment": {"severity": 0.87, "urgency": 0.93, "confidence": 0.88},
      "priority_score": 91.4,
      "demand_vector": {"ambulances": 4, "boats": 5, "food": 1020},
      "equity_score": 0.0,
      "equity_status": "FORGOTTEN",
      "road_status": "PARTIAL",
      "report_count": 5
    }
  ],
  "total": 17,
  "critical": 4,
  "forgotten_zones": ["Z1"]
}
```

### 15.3 GET `/api/zones/priority` — Zone Priority Queue

**Response 200:**
```json
{
  "priority_queue": [
    {
      "zone_id": "Z1",
      "name": "Ramganj Flood Cluster",
      "priority": 91,
      "incidents": 4,
      "people_affected": 850,
      "demand_vector": {"ambulances": 4, "boats": 5, "food": 1020},
      "equity_score": 0.0,
      "equity_status": "FORGOTTEN",
      "current_resources": []
    }
  ]
}
```

### 15.4 POST `/api/allocation/run` — Run Optimiser

**Request:**
```json
{
  "trigger_reason": "COMMANDER_MANUAL",
  "constraints": {
    "min_reserve_ambulances": 2,
    "max_travel_minutes": 60,
    "priority_policy": "NEED_SCORE_WEIGHTED_WITH_EQUITY"
  }
}
```

**Response 200:**
```json
{
  "plan_id": "PLAN-20260911-1547",
  "assignments": [
    {
      "resource_id": "NDRF_IRB_04",
      "zone_id": "Z1",
      "need_type": "boats",
      "match_score": 1.0,
      "travel_minutes": 18,
      "utility_score": 91.0,
      "reasoning": [
        "18 min travel via SH-12 (OPEN)",
        "100% capability match: water_rescue, flood_navigation",
        "Capacity: 20 persons (Zone Z1 needs 110 evacuated)",
        "Zone Z1 priority 91 — highest active"
      ]
    }
  ],
  "unmet_needs": [],
  "equity_flags": [],
  "narrative": "ALLOCATION PLAN — 15:47 IST\n\nPRIORITY 1: Zone Z1 — Ramganj...",
  "utility_total": 847.3
}
```

### 15.5 POST `/api/allocation/approve`

### 15.6 PATCH `/api/resources/:id` — Update Status/Location

### 15.7 PATCH `/api/routes/block` — Block/Unblock Road → Triggers Re-optimisation

**Response includes:**
```json
{
  "updated": true,
  "reallocation_recommended": true,
  "affected_assignments": ["PLAN-1547-alloc-003"],
  "diff_preview": {
    "changed": [
      {
        "resource_id": "NDRF_IRB_04",
        "old_route": "NH-58",
        "new_route": "SH-12",
        "old_eta": 12,
        "new_eta": 31,
        "impact": "+19 min Zone Z1 response time"
      }
    ]
  }
}
```

### 15.8 GET `/api/equity` — Equity Scores

### 15.9 POST `/api/agencies/:id/resources` — Agency Adds Resource

### 15.10 GET `/api/incidents/:id` — Single Incident Detail

---

## 16. Non-Functional Requirements

| Metric | Target | Max Threshold |
|---|---|---|
| Dashboard initial load | < 3s (4G) | 5s |
| Realtime update propagation | < 2s | 5s |
| Deduplication processing | < 1s per report | 3s |
| Demand vector computation | < 200ms | 500ms |
| Greedy optimizer runtime | < 500ms (50 resources, 10 zones) | 2s |
| Google Gemini Flash API (Free Tier) response | < 8s | 15s |
| Equity recomputation | < 300ms | 1s |
| Concurrent EOC users | 50 | 100 |
| Reports/minute ingestion | 200 | 500 |
| Resources tracked | 500 | 1000 |
| Zones | 30 | 50 |

---

## 17. Security & Compliance

### Role Permissions

| Action | OBSERVER | FIELD | AGENCY_ADMIN | LOGISTICS | COMMANDER |
|---|---|---|---|---|---|
| View dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit report | ❌ | ✅ | ✅ | ❌ | ✅ |
| Manage own agency resources | ❌ | ❌ | ✅ | ✅ | ✅ |
| Run allocation optimizer | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approve allocation | ❌ | ❌ | (own resources) | ❌ | ✅ |
| Block road | ❌ | ❌ | ❌ | ✅ | ✅ |
| Acknowledge equity flag | ❌ | ❌ | ❌ | ❌ | ✅ |
| View audit log | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 18. 36-Hour Implementation Roadmap

### Phase 0: Foundation (Hours 0–2)

| Task | Person | Output |
|---|---|---|
| Supabase project: schema, PostGIS, RLS, 5 roles | P2 | DB live |
| React + Vite + Tailwind + Zustand scaffold | P1 | App on localhost |
| Express server with `/health` endpoint | P2 | Server live |
| Vercel + Railway deploy (blank apps) | P1 | Live URLs |
| Google Gemini Flash API (Free Tier) key test + OpenRouteService key | P2 | Both working |

### Phase 1: Engine 1 + Engine 2 (Hours 2–14)

**Person 1 — Frontend/Map**

| Hours | Task | Done When |
|---|---|---|
| 2–5 | Leaflet map, zone polygons (GeoJSON Jaipur), zone click popup | Map shows 5 zones |
| 5–8 | Resource markers (colour by status), MarkerCluster | 10 resources on map |
| 8–11 | Priority heatmap overlay (leaflet.heat) | Heatmap renders |
| 11–14 | Priority queue panel + Incident Detail panel | Panel shows 5 incidents |

**Person 2 — Backend/AI**

| Hours | Task | Done When |
|---|---|---|
| 2–5 | `POST /api/reports` — ingest + basic extraction | Reports stored |
| 5–8 | Deduplication logic (geo + time proximity, match score) | 3 reports → 1 incident |
| 8–11 | Demand vector computation + priority formula | Priority scores returned |
| 11–14 | Supabase Realtime wired to frontend | Score change → map updates in <2s |

**Checkpoint Hour 14:** Submit 3 reports about same area → 1 incident created → priority score on map.

### Phase 2: Engine 3 + Engine 4 (Hours 14–24)

**Person 1**

| Hours | Task | Done When |
|---|---|---|
| 14–17 | Allocation Plan panel: assignment cards with reasoning | Plan displays |
| 17–20 | Approve/Modify/Reject flow → resource status update | Status changes |
| 20–22 | Plan diff view (Engine 4 UI) | Diff shows old/new |
| 22–24 | Route block UI: click road on map → mark blocked | Route turns red |

**Person 2**

| Hours | Task | Done When |
|---|---|---|
| 14–17 | Greedy optimizer + capability matching → `POST /api/allocation/run` | Plan returned |
| 17–20 | `POST /api/allocation/approve` → resource lifecycle update | Status cascade |
| 20–22 | Re-optimisation trigger on route block → plan diff | Diff computed |
| 22–24 | Gemini Flash: text report → structured extraction | 1 voice report → incident |

**Checkpoint Hour 24:** Full allocation loop working. Block a road → diff shown.

### Phase 3: Equity + Offline + Polish (Hours 24–32)

| Hours | Task | Person | Done When |
|---|---|---|---|
| 24–26 | Equity Engine: score formula + panel + map overlay | P2 + P1 | Equity panel shows |
| 26–28 | Offline mode: localStorage cache + service worker | P1 | Disconnect → cached state |
| 28–30 | Seed Jaipur flood data: 5 zones, 20 resources, 8 incidents | P2 | Demo data ready |
| 30–32 | Mobile report form (responsive 375px) + confirmation | P1 | Works on phone |

### Phase 4: Demo Prep (Hours 32–36)

| Hours | Task |
|---|---|
| 32–34 | Demo run #1 + bug list + fix critical bugs |
| 34–35 | Polish: loading states, animations, error messages |
| 35–36 | Demo run #2 (timed: must be < 5 minutes) + presentation slides |

---

## 19. Demo Scenario — Uttarakhand Flash Flood

*A complete 5-minute story. Rehearse until it's 4:30.*

**Setup:** Glacial lake breach and torrential cloudburst in the Alaknanda and Mandakini river valleys. 5 active operational zones. 8:14 AM.

### Step 1 — Open the Dashboard (30 sec)
Commander sees State EOC command center: 5 valley zones colour-coded, resource markers, priority queue.
> "This is our common operating picture across the Garhwal disaster sector. 17 active incidents, 5 operational zones."

### Step 2 — Submit Live Reports (60 sec)
Submit 3 reports about Rudraprayag Sangam (Zone A) using the mobile form. Watch:
- Report 1: dedup says "new incident INC-1042"
- Report 2: dedup merges (match_score: 0.83), confidence goes 0.65 → 0.79
- Report 3: image upload → Gemini Flash extracts evidence → confidence → 0.88
Zone A need score jumps from 61 → 91. Map turns red.
> "Three reports, one incident. 88% confidence. 850 people, 110 trapped near river confluence."

### Step 3 — Generate Allocation Plan (60 sec)
Click [Run Allocation Engine]. Greedy optimizer runs (< 500ms).
Show assignment cards: SDRF Swift-Water Boat 04 → Zone A with reasoning:
> "24 min via NH-07 bypass, 100% capability match. Not AI guessing — formula-driven."
Click [Approve All]. Resources turn blue (EN_ROUTE) on map.

### Step 4 — Equity Lens (45 sec)
Click Equity tab. Zone D (Guptkashi mountain hamlet) shows:
- 0 resources in 8 hours
- Priority: 61, Equity: 0% — FORGOTTEN ZONE
Gemini Flash generates narrative: *"Zone D has received zero resources despite 34 vulnerable elderly persons and children..."*
> "This is the cut-off valley pocket that gets missed in every mountain disaster. ResQ finds it."

### Step 5 — Dynamic Reallocation (45 sec)
Click mountain bridge on map → Mark NH-07 Helang Bridge BLOCKED.
System auto-flags 2 assignments. Click [Re-optimise].
Plan diff shows: SDRF rescue convoy rerouted via Chopta pass (+18 min), ITBP mountain squad covers gap.
> "Conditions changed. Plan changed in seconds. Commander approves with one click."

### Step 6 — Offline Mode (30 sec)
Turn off WiFi. Banner: "🟠 DEGRADED — Cached from 14:22."
Map still works. Submit one report. "3 queued locally."
Reconnect. Reports sync. Banner: "🟢 RECONNECTED — 3 reports synced."

### Closing Line
> *"Every allocation traceable to a formula. Every forgotten zone surfaced. ResQ."*

---

## 20. Glossary

| Term | Definition |
|---|---|
| **Capability Matching** | Matching resources to zones by required skill/equipment type, not just resource category |
| **Confidence Score** | 0–1 score measuring trustworthiness of an incident's data |
| **Demand Vector** | Per-zone explicit resource demand: {ambulances:4, boats:5, food:900} |
| **Deduplication** | Process of merging multiple reports about the same incident into one canonical record |
| **Equity Score** | Resources received / estimated need; below 0.4 = critically underserved |
| **Forgotten Zone** | Zone with zero dispatched resources regardless of need (equity = 0) |
| **Greedy Allocator** | Deterministic priority-weighted assignment algorithm (no LLM) |
| **ICS** | Incident Command System — FEMA standard for multi-agency disaster management |
| **Incident** | Tier-2 data object: deduplicated, validated event with structured fields |
| **Match Score** | Similarity score between two reports for deduplication (0–1, threshold 0.7) |
| **NDRF** | National Disaster Response Force (India) |
| **Priority Score** | 0–100 composite urgency score per zone |
| **Report** | Tier-1 raw input: any inbound signal before processing |
| **SDRF** | State Disaster Response Force (India) |
| **Severity** | 0–1 score for how bad the current situation is |
| **Urgency** | 0–1 score for how quickly action is required |
| **Zone** | Tier-3 geographic cluster of related incidents forming an operational area |

---

## 21. Appendix: Seed Data & Environment Variables

### Demo Zones — Jaipur Flood

```json
[
  {"id":"Z1","name":"Ramganj","lat":26.9124,"lng":75.8621,"pop":45000,"priority":91,"resources":0},
  {"id":"Z2","name":"Mansarovar","lat":26.8516,"lng":75.7397,"pop":120000,"priority":68},
  {"id":"Z3","name":"Jagatpura","lat":26.8241,"lng":75.8658,"pop":55000,"priority":78},
  {"id":"Z4","name":"Civil Lines","lat":26.9260,"lng":75.8235,"pop":25000,"priority":54},
  {"id":"Z5","name":"Sanganer","lat":26.8021,"lng":75.8209,"pop":38000,"priority":61,"resources":0}
]
```

### Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI
GEMINI_API_KEY=AIzaSy...

# Routing
OPENROUTE_SERVICE_KEY=your_free_ors_key

# Backend
PORT=3001
NODE_ENV=production

# Frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE_URL=https://your-backend.railway.app
```

---

*ResQ SRS v2.0 — Complete. Single source of truth for the MUJHACKX 2026 build.*

*"Every second counts. Every formula matters. Every forgotten zone found."*
