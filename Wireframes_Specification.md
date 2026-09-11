# ResQ — UI/UX Wireframe & Interface Specifications
## Modern Civic-Tech Adaptive Design System | MUJ HACKX 4.0 (PS #2)

> **Document Version:** 1.0  
> **Status:** Production Specification  
> **Aesthetic Philosophy:** **Modern Civic-Tech Adaptive** — Engineered for high-stress Emergency Operations Center (EOC) multi-monitor consoles and mobile field response. High data density without visual clutter, crisp micro-borders, accessible color semantics (WCAG AAA contrast), and human-centered decision explainability.

---

## 1. Design System & Semantic Design Tokens

### 1.1 Aesthetic & Visual Philosophy
The design avoids skeuomorphic emergency clutter and generic corporate SaaS aesthetics. It balances two critical modes:
- **EOC Command Center (Dark Mode Default):** Low ambient eye fatigue in dim command rooms; deep slate surfaces (`#0F172A`), high-contrast text (`#F8FAFC`), and crisp semantic status glow indicators.
- **Field & Public Web (Light Mode Adaptive):** High-glare outdoor sunlight legibility; clean off-white surfaces (`#F8FAFC`), crisp neutral slate borders (`#E2E8F0`), and dark charcoal typography (`#0F172A`).

### 1.2 Color Semantics (WCAG AAA Compliant)

| Token Name | Light Mode Hex | Dark Mode Hex | Semantic Role & Operational Context |
|---|---|---|---|
| `--surface-canvas` | `#FFFFFF` | `#0F172A` | Primary background canvas |
| `--surface-panel` | `#F8FAFC` | `#1E293B` | Floating panels, sidebars, dashboard cards |
| `--surface-card` | `#FFFFFF` | `#334155` | Nested interactive cards, queue items |
| `--border-subtle` | `#E2E8F0` | `#334155` | Dividers, structural panel borders (1px solid) |
| `--border-strong` | `#CBD5E1` | `#475569` | Interactive inputs, card outlines |
| `--text-primary` | `#0F172A` | `#F8FAFC` | 100% legibility headings & vital metrics |
| `--text-muted` | `#475569` | `#94A3B8` | Subtitles, helper text, timestamps |
| `--status-critical` | `#DC2626` | `#EF4444` | Severity > 80%, structural collapse, trauma |
| `--status-high` | `#D97706` | `#F59E0B` | Severity 60-79%, road cutting off, urgent medical |
| `--status-moderate` | `#CA8A04` | `#FACC15` | Severity 40-59%, food/shelter needs |
| `--status-safe` | `#059669` | `#10B981` | Fully served, route verified open, operational |
| `--status-dispatched` | `#2563EB` | `#3B82F6` | Units actively en route, live GPS trackers |
| `--equity-alert` | `#7C3AED` | `#A855F7` | Forgotten Pocket alert, $E_i < 0.40$ breach |

### 1.3 Typography System
- **Display & UI Font:** `Plus Jakarta Sans`, system-ui, -apple-system (Geometric neo-grotesque, open counters, high legibility at 11px–14px).
- **Technical & Coordinates Font:** `JetBrains Mono`, `Roboto Mono` (Used for H3 Hex IDs, GPS coordinates, timestamps, and mathematical values).
- **Scale:**
  - Macro KPI Metric: `28px` / `32px` Bold
  - Section Headings: `18px` / `24px` SemiBold
  - Card Titles: `13px` / `16px` SemiBold
  - Body Text: `12px` / `16px` Regular
  - Pills & Badges: `11px` / `14px` Bold (All Caps)

---

## 2. Screen 1: EOC 3-Pane Incident Command Center (Desktop 1440px+)

### 2.1 Screen Architecture & Grid Layout
The desktop layout is structured into **Three Independent Functional Columns** around an overarching Macro KPI Top Bar:
- **Top Bar (Height: 56px):** System status, time elapsed since disaster onset (T+hh:mm), active agency badges, and citywide macro KPIs.
- **Left Pane (Width: 340px):** Prioritized Incident Queue (sorted by Priority Score, filterable by H3 Hex / Event Type).
- **Center Pane (Flexible ~720px+):** Leaflet.js Tactical Map with Uber H3 hexagonal layers, flood depth polygons, road cut markers, and asset vectors.
- **Right Pane (Width: 380px):** Explainable Allocation Plan, "Why this allocation?" rationale, capacity bars, and `[Review & Approve Plan]` CTA.

### 2.2 Wireframe Diagram

```
+-------------------------------------------------------------------------------------------------------------------------------+
| ResQ COMMAND | Uttarakhand GLOF Flood | T+04:15 IST | State EOC Dehradun | Agencies: [NDRF: 8] [SDRF: 12] [ITBP: 16] | Admin ▾ |
+-------------------------------------------------------------------------------------------------------------------------------+
| MACRO KPIS:  [🔴 ACTIVE: 24]  [⚠️ CRITICAL: 7]  [🚜 DEPLOYED: 48/83 (58%)]  [🛡️ FLEET RESERVE: 35 (42%)]  [⚖️ UNMET NEED: 31%]   |
+------------------------------------+----------------------------------------------------------+-------------------------------+
| INCIDENT QUEUE (24 Active)    [🔍] | TACTICAL GEOSPATIAL MAP (Uber H3 Res 8)        [Layers ▾]| RECOMMENDED ALLOCATION PLAN   |
| Filter: [All] [Trapped] [Medical]  | +------------------------------------------------------+ | Plan ID: #OPT-8821  Status: PENDING   |
+------------------------------------+ | [+][-]  Base: OpenStreetMap | Heatmap: Flood Hazard    | +-----------------------------+
| 🔴 INC-1042 — Rudraprayag Sangam   | |                                                        | | ASSIGNMENT 1 (Medical Surge)|
| Priority: 94.2 | Conf: 88% (Gemini)| |           / \                                          | | Unit: AMB-SDRF-04 (Mountain)|
| 180 Affected · 64 Trapped · 12 Inj | |         /     \  [H3: 88609a6567fffff]                 | | From: Srinagar Base Hospital|
| H3: 88609a6567fffff | Road: PARTIAL| |        |  Z-A  |  Priority: 94.2                       | | To: INC-1042 (Rudraprayag)  |
| Demand: 3 Boats, 2 Amb, 120 Food   | |        | 🔴    |  Need: 84.5 | Ei: 0.12 (CRITICAL)     | | Route: NH-07 (38m, 32 km)   |
| Status: ZERO ASSETS ASSIGNED       | |         \     /                                        | | --------------------------- |
| [Inspect Incident]  [Focus Map]    | |          \ - / \                                       | | 💡 WHY THIS ALLOCATION:     |
+------------------------------------+ |             /     \                                    | | • 38 min ETA (vs 65m alt)   |
| 🟠 INC-1039 — Srinagar Riverside   | |            |  Z-B  |  [H3: 88609a6561fffff]            | | • 100% Mountain BLS match   |
| Priority: 81.0 | Conf: 92% (Agency)| |            |  🟠   |  Need: 42.0 | Ei: 0.65            | | • Staged: 1 of 2 ambulances |
| 45 Trapped · 8 Elderly Infirm      | |             \     /                                    | | • Holds 42% hospital reserve|
| H3: 88609a6561fffff | Road: BLOCKED| |              \ - /                                     | +-----------------------------+
| Demand: 2 CSSR Teams, 1 K9 Unit    | |                                                        | | ASSIGNMENT 2 (Swift-Water)  |
| Status: SDRF Team 2 En Route (22m) | |   [🚜 AMB-04] ----(NH-07 Route Polyline)----> 🔴 INC   | | Unit: BOAT-NDRF-07 (IRB-20) |
+------------------------------------+ |   [⚠️ ROAD CUT: NH-07 Washed Out at Helang Bridge]     | | To: INC-1042 (Rudraprayag)  |
| 🟣 INC-1028 — Guptkashi (SILENT)   | |                                                        | | ETA: 28 min | Cap: 20 pers  |
| Priority: 76.5 | Conf: 42% (Prior) | |   Map Legend:                                          | +-----------------------------+
| Census Pop: 8,500 | Reports: 1     | |   🔴 Hex Critical (Ei < 0.4)  🟠 Moderate (0.4-0.6)    | | SUMMARY OF PLAN #OPT-8821:  |
| ⚠️ SILENCE ALERT: No report >90min | |   🟢 Well-Served (Ei >= 1.0)  🟣 Forgotten Pocket      | | • 8 Units Dispatched        |
| Baseline Need: Active via Census   | |   🚜 Mobile Asset GPS        ⚠️ Road Blockage          | | • Net Need Reduction: 44%   |
+------------------------------------+ +--------------------------------------------------------+ | • Est. Lives Secured: 112   |
| 🟡 INC-1015 — Karnaprayag Ghat     | Live Status Footer:                                      | +-----------------------------+
| Priority: 58.0 | Road: OPEN        | 🟢 WebSockets: LIVE (28ms) | Active Grid: 18 H3 Hexes    | [  REVIEW & APPROVE PLAN ▾  ] |
| 20 Evacuees awaiting transport     | Fleet Committed: 58% | Staged Depot Reserve: 42%         | [ Modify Manual ]  [ Reject ] |
+------------------------------------+----------------------------------------------------------+-------------------------------+
```

### 2.3 Component Hierarchy & Behavioral States
- **Incident Card Component:**
  - `Hover State:` Subtle elevation, highlights corresponding H3 Hex on the center map.
  - `Selected State:` Left border thickens (4px primary indigo); right pane focuses on this incident's allocation recommendations.
  - `Badge System:`
    - Confidence Pill: `88% (Gemini Multimodal)` vs `42% (Spatial Prior)`.
    - Road Accessibility Tag: `OPEN (Green)`, `PARTIAL (Amber)`, `BLOCKED (Red)`.
- **Center Map Component:**
  - Rendered via **Leaflet.js + Leaflet-H3**.
  - Clicking any H3 hexagon displays its aggregated properties: `hex_address`, `cumulative_need_weight`, `equity_ratio_ei`, and active incident list.
  - Toggleable layer controls: (1) Hazard Polygons, (2) H3 Hexagonal Grid, (3) Live Vehicle Markers, (4) Road Obstructions.
- **Right Allocation Plan Component:**
  - Displays transparent reasoning (`allocation_reasoning`) answering **"Why this asset, why now, who was the alternative?"**.
  - Sticky bottom action bar with high-contrast primary button `[REVIEW & APPROVE PLAN ▾]`.

---

## 3. Screen 2: Commander Authorization & Dynamic Plan Diff Modal

### 3.1 Purpose & Trigger
When a road block cuts off an in-progress route (e.g. NH-58 submerges) or an unserved sector triggers a priority surge, the optimizer executes a dynamic re-run.
Per **Incident Command System (ICS)** rules, software cannot unilaterally reroute emergency vehicles without commander authorization. This modal displays an exact **Before vs. After Plan Diff**.

### 3.2 Wireframe Diagram

```
+-------------------------------------------------------------------------------------------------------+
|  ⚠️ DYNAMIC REALLOCATION REQUIRED — EVENT TRIGGER: MOUNTAIN HIGHWAY CUT DETECTED                    [X] |
+-------------------------------------------------------------------------------------------------------+
|  Trigger Event: NH-07 Washed Out at Helang Bridge Km 18 (Reported by Police Unit P-12 at 15:42 IST)   |
|  Impact Analysis: 3 In-Transit Convoys severed. Solver re-optimized 14 active units in 1.2s.        |
+-------------------------------------------------------------------------------------------------------+
|  PLAN DIFF: PREVIOUS PLAN (#OPT-8820) ➔ PROPOSED PLAN (#OPT-8821)                                    |
+-------------------+--------------------+--------------------+--------------------+--------------------+
| UNIT / ASSET      | PREVIOUS ROUTE/DEST| PROPOSED NEW PLAN  | TIME / TRAVEL DELTA| OPERATIONAL REASON |
+-------------------+--------------------+--------------------+--------------------+--------------------+
| AMB-SDRF-04       | INC-1035 via NH-07 | INC-1042 via Chopta| +18 min ETA (56 min| Rerouted around    |
| (Mountain 4x4 BLS)| ETA was: 38 min    | New ETA: 56 min    | Detour: +24 km     | severed Helang brg |
+-------------------+--------------------+--------------------+--------------------+--------------------+
| BOAT-NDRF-07      | Staging Depot West | INC-1042 (Sangam)  | PRIORITY SURGE     | Dispatched to      |
| (20-person IRB)   | Status: STANDBY    | New ETA: 24 min    | Dispatched from Res| rising confluence  |
|                   |                    |                    |                    | trapped victims.   |
+-------------------+--------------------+--------------------+--------------------+--------------------+
| TRUCK-ITBP-02     | INC-1042 via NH-07 | HALT AT JOSHIMATH  | MISSION PAUSED     | Road impassable;   |
| (Heavy Relief)    | ETA was: 45 min    | Status: STAGED     | Awaiting air-drop  | hold at staging.   |
+-------------------+--------------------+--------------------+--------------------+--------------------+
|  PROJECTED PLAN IMPACT:                                                                               |
|  • Net Lives Secured: +34 individuals                                                                 |
|  • Average Response Latency: +3.2 minutes (unavoidable detour penalty)                                |
|  • Citywide Fleet Reserve Remaining: 38% (Maintains safe operational buffer)                         |
+-------------------------------------------------------------------------------------------------------+
|  COMMANDER OVERRIDE & SIGN-OFF:                                                                       |
|  [✓] Log authorization to tamper-evident audit ledger (Actor: DIG_RAJ_EOC_COMM_01)                   |
|                                                                                                       |
|  [  APPROVE & DISPATCH REVISED PLAN (ENTER)  ]      [  MODIFY MANUALLY  ]      [  REJECT & HOLD  ]   |
+-------------------------------------------------------------------------------------------------------+
```

### 3.3 Interaction Details
- **Visual Diff Highlighting:**
  - Rerouted legs marked with amber delta badges (`+5 min`).
  - New dispatches marked with vibrant blue pills (`DISPATCHED`).
  - Halted units marked with neutral gray badges (`STAGED`).
- **Keyboard Shortcut:** Pressing `Enter` triggers `Approve & Dispatch`; `Esc` cancels.
- **Audit Stamp:** Every approval registers actor ID, timestamp, and mathematical plan hash in `audit_log`.

---

## 4. Screen 3: Equity Lens & Forgotten Pocket Inspector

### 4.1 Purpose & Algorithmic Background
The **Equity Lens** is ResQ's core ethical differentiator. It actively computes the **Fulfilled Need Ratio ($E_i$)** for every Uber H3 Hexagon:

$$E_i = rac{	ext{Resources Deployed}}{	ext{Cumulative Need Weight}}$$

Any sector with $E_i < 0.40$ or an active disaster zone with 0 resources for $>90	ext{ minutes}$ is surfaced as a **"Forgotten Pocket"**, triggering an automated equity correction.

### 4.2 Wireframe Diagram

```
+-------------------------------------------------------------------------------------------------------------------------------+
| ResQ COMMAND | EQUITY LENS & FAIRNESS AUDITOR | Incident: Jaipur Urban Flood | Citywide Equity Mean: 0.62 (ADEQUATE)           |
+-------------------------------------------------------------------------------------------------------------------------------+
| PARITY SUMMARY METRICS:                                                                                                       |
| [🟢 WELL-SERVED: 8 Hexes]   [🟡 ADEQUATE: 5 Hexes]   [🟠 UNDERSERVED: 3 Hexes]   [🔴 CRITICAL: 1 Hex]   [🟣 FORGOTTEN: 1 Hex]   |
+-------------------------------------------------------------+-----------------------------------------------------------------+
| UBER H3 SPATIAL FAIRNESS HEATMAP                            | DISTRICT RESOURCE-TO-NEED PARITY AUDIT                          |
| +---------------------------------------------------------+ | Sorted by: Equity Ratio (Ascending - Worst First)              |
| |                                                         | +---------------------+---------+---------+--------+------------+
| |          [H3: 88609a6567fffff]                          | | HEX ID / SECTOR     | NEED WT | ASSETS  | Ei     | STATUS     |
| |          Mansarovar Sector 4                            | +---------------------+---------+---------+--------+------------+
| |          Ei: 0.12 (CRITICAL UNDERSERVED)                | | 🟣 88609a6569fffff   | 68.0    | 0       | 0.00   | FORGOTTEN  |
| |          Needs: 2 Amb, 3 Boats | Assigned: 0            | |    Sanganer Ward 12 | (Pop:8.5k)| (0 units)| (0.0%) | (>95m idle)|
| |                                                         | | --------------------------------------------------------- |
| |                                 [H3: 88609a6569fffff]   | | 🔴 88609a6567fffff   | 84.5    | 1 Boat  | 0.12   | CRITICAL   |
| |                                 Sanganer Ward 12        | |    Mansarovar Sec 4 | (180 aff) | (1 unit)| (12%)  | Escalated  |
| |                                 Ei: 0.00 (FORGOTTEN)    | | --------------------------------------------------------- |
| |                                 Last Report: 98 min ago | | 🟠 88609a6565fffff   | 45.0    | 1 Amb   | 0.44   | UNDERSERVED|
| |                                 Baseline Pop: 8,500     | |    Jagatpura Ext    | (60 aff)  | (1 unit)| (44%)  | Monitored  |
| |                                                         | | --------------------------------------------------------- |
| |   [Map Controls]                                        | | 🟢 88609a6561fffff   | 32.0    | 3 Amb   | 1.09   | WELL-SERVED|
| |   (o) Fulfilled Ratio Ei   ( ) Demographic Vulnerability| |    Civil Lines      | (25 aff)  | (3 unit)| (109%) | Satisfied  |
| +---------------------------------------------------------+ +---------------------+---------+---------+--------+------------+
|  PULSING ALERT INSPECTOR: SANGANER WARD 12 (HEX: ...69fffff)                                                                 |
|  🚨 SYSTEM DIAGNOSIS: "First-Report Bias Detected"                                                                           |
|  • This sector filed only 1 fragmented SMS report 98 minutes ago due to power loss.                                           |
|  • Census demographic baseline indicates 8,500 residents in direct 1.5m flood inundation zone.                               |
|  • Zero resources have reached this sector while neighboring Civil Lines has received 109% of its demand.                    |
|                                                                                                                               |
|  RECOMMENDED EQUITY CORRECTION:                                                                                               |
|  Auto-reserve next available SDRF Rescue Boat (BOAT-SDRF-09) and 2 Ambulances for Sanganer Ward 12.                          |
|                                                                                                                               |
|  [  ⚡ EXECUTE FORCED EQUITY ALLOCATION  ]              [  Dispatch Recon Drone First  ]              [  Dismiss with Reason  ] |
+-------------------------------------------------------------------------------------------------------------------------------+
```

### 4.3 Behavioral Logic
- **Color Coding:**
  - $E_i = 0$: Pulsing Neon Purple (`#A855F7`) with audible alert.
  - $E_i < 0.4$: High-contrast Red (`#EF4444`).
  - $0.4 \le E_i < 0.6$: Amber (`#F59E0B`).
  - $E_i \ge 1.0$: Safe Green (`#10B981`).
- **Forced Allocation CTA:** Clicking `[⚡ EXECUTE FORCED EQUITY ALLOCATION]` overrides the pure shortest-path optimizer, reserving the next available vehicle regardless of proximity.

---

## 5. Screen 4: Mobile Field Reporter (Mobile Web 375px–420px)

### 5.1 Purpose & Field Context
Designed as a **responsive, zero-install mobile web application** (optimized for Android Chrome / Mobile Safari), progressively capable of offline operation via PWA service workers.
Used by local police officers, volunteers, and citizens in wet, chaotic conditions.

### 5.2 Wireframe Diagram

```
+-----------------------------------------------+
| ResQ FIELD | SOS REPORTER            [🌐 LIVE]|
| Status: 🟢 Connected (2G/EDGE)  Agency: PUBLIC|
+-----------------------------------------------+
| 📍 CURRENT GPS LOCATION                       |
| 26.9124° N, 75.7873° E (Accuracy: ±6m)        |
| H3 Hex: 88609a6567fffff · Mansarovar, Jaipur  |
| [ Update GPS Location ]                       |
+-----------------------------------------------+
| 🎙️ VOICE REPORT (LOCAL DIALECT / HINDI / EN)  |
| +-------------------------------------------+ |
| |                                           | |
| |          [ 🔴 TAP TO SPEAK ]              | |
| |                                           | |
| |     "Yahan 40 log chhat par fase hain,    | |
| |      pani 6 foot tak badh gaya hai..."    | |
| +-------------------------------------------+ |
| Audio transcribed via Web Speech API (Free)   |
+-----------------------------------------------+
| 📸 DAMAGE EVIDENCE PHOTO (OPTIONAL)           |
| +-------------------------------------------+ |
| | [ 📷 Take Photo / Upload ]                | |
| | Image: IMG_9921.jpg (Preview attached)    | |
| | Gemini Flash Triage: "Roof evacuation,    | |
| | water level ~2m, 35-45 people visible"    | |
| +-------------------------------------------+ |
+-----------------------------------------------+
| 📋 QUICK TRIAGE TAGS (TAP ALL THAT APPLY)     |
| [🔴 People Trapped]  [⚠️ Medical Emergency]   |
| [🌊 Water Rising]    [⚡ Live Wire / Fire]    |
| [🍞 Food/Water Need] [🏚️ Building Collapse]   |
+-----------------------------------------------+
| ESTIMATED HEADCOUNT:                          |
| Affected: [ 45 ]  Injured: [ 4 ]  Trapped: [40|
+-----------------------------------------------+
| [✓] Auto-queue offline if network disconnects |
|                                               |
| [      🚀 SUBMIT EMERGENCY REPORT NOW       ] |
|                                               |
| 🔒 Transmitted directly to NDRF/EOC Command   |
+-----------------------------------------------+
```

### 5.3 Offline State Variant (Disconnected Mode)
When mobile data drops, the top banner updates smoothly without throwing error screens:
```
+-----------------------------------------------+
| ResQ FIELD | SOS REPORTER         [🟠 OFFLINE]|
| Status: 🟠 Buffering Locally (2 Reports Saved)|
+-----------------------------------------------+
...
| [   💾 SAVE REPORT LOCALLY TO BUFFER (2)    ] |
| Reports will auto-sync upon signal restore    |
+-----------------------------------------------+
```

---

## 6. Screen 5: Multi-Agency Resource Inventory Manager

### 6.1 Purpose
Maintains the unified operational inventory across sovereign agencies (NDRF, SDRF, State Police, Municipal Hospitals, and NGOs).
Distinguishes between **Mobile Assets** (which have battery/fuel and move) and **Static Resources** (which have capacity/stock).

### 6.2 Wireframe Diagram

```
+-------------------------------------------------------------------------------------------------------------------------------+
| ResQ COMMAND | MULTI-AGENCY LIVE RESOURCE INVENTORY | Total Tracked Assets: 83 | Available: 35 | Deployed: 48 (58%)            |
+-------------------------------------------------------------------------------------------------------------------------------+
| FILTER BY AGENCY: [✓ All (83)]  [✓ NDRF (22)]  [✓ SDRF (18)]  [✓ Police (15)]  [✓ Hospitals (16)]  [✓ NGOs (12)]              |
| FILTER BY TYPE:   [All] [Ambulances] [Rescue Boats] [Drones/UAV] [CSSR Teams] [Static Shelters] [Food Depots]                |
+-------------------------------------------------------------------------------------------------------------------------------+
| ASSET ID    | AGENCY OWNER  | TYPE & SPECS        | CONDITION     | BATTERY/FUEL | CURRENT STATUS     | ACTIVE ASSIGNMENT / BASE  |
+-------------+---------------+---------------------+---------------+--------------+--------------------+---------------------------+
| AMB-04      | SMS Hospital  | Type-I BLS (4-bed)  | [Operational▾]| [██████ 82%] | 🚜 EN_ROUTE (8m)   | INC-1042 (Mansarovar Sec4)|
| AMB-09      | Apex Hospital | Type-II ALS (2-bed) | [Operational▾]| [██████ 95%] | 🟢 AVAILABLE       | Staging Depot West (Reserve)|
| BOAT-N-07   | NDRF 6th Bn   | Inflatable IRB (20p)| [Operational▾]| [█████- 70%] | 🚜 ON_SITE         | INC-1042 (Water Rescue)   |
| BOAT-S-02   | Raj SDRF      | FRP Motorboat (12p) | [Degraded ▾]  | [███--- 45%] | ⚠️ RETURNING       | Fuel leak; heading base   |
| DRONE-U-01  | State Police  | Quadcopter (Thermal)| [Operational▾]| [████-- 60%] | 🛸 AIR PATROL      | Hex ...67fffff Recon      |
| CSSR-N-01   | NDRF 6th Bn   | Heavy Rubble Rescue | [Operational▾]| [ N/A ]      | 🚜 EN_ROUTE (14m)  | INC-1039 (Ramganj Collapse|
+-------------+---------------+---------------------+---------------+--------------+--------------------+---------------------------+
| STATIC DEPOTS & SHELTER CAPACITY:                                                                                             |
+-------------+---------------+---------------------+---------------+--------------+--------------------+---------------------------+
| DEPOT ID    | AGENCY OWNER  | RESOURCE TYPE       | TOTAL CAPACITY| USED CAPACITY| UTILIZATION RATE   | SUPPLY EXPIRY / STATUS    |
+-------------+---------------+---------------------+---------------+--------------+--------------------+---------------------------+
| SHELTER-01  | Jaipur Nagar  | Govt High School    | 500 Beds      | 380 Beds     | [████████-- 76%]   | 🟢 Operational (120 avail)|
| SHELTER-04  | Community Ctr | Mansarovar Hall     | 250 Beds      | 250 Beds     | [██████████ 100%]  | 🔴 FULLY OCCUPIED         |
| FOOD-DEP-02 | Akshaya Patra | Hot Meal Rations    | 5,000 Packs   | 1,800 Packs  | [████------ 36%]   | Batch 4 Expiry: +48 hrs   |
+-------------+---------------+---------------------+---------------+--------------+--------------------+---------------------------+
| [ + Register New Asset ]   [ ⬇ Export IDRN CSV ]   [ 🔄 Refresh Telemetry ]                    Live Telemetry: Active (300ms) |
+-------------------------------------------------------------------------------------------------------------------------------+
```

### 6.3 Interactivity & Capabilities
- **Condition Dropdown:** Clicking `Operational` allows toggling to `Degraded` or `Out of Service`. If a unit is marked `Out of Service`, the optimizer instantly triggers an Engine 4 reallocation.
- **Agency Sovereignty:** Agency admins can edit their own units; Central Commanders view all units in a consolidated operational picture.

---

## 7. Interaction State Matrix

| System State | EOC Dashboard Behavior | Mobile Reporter Behavior | Optimizer Action |
|---|---|---|---|
| **Normal / Steady State** | Green live indicator; active monitoring; metrics stable. | Online indicator; instant submission. | Standby; monitoring event queues. |
| **High Influx Surge** | Left queue scrolls rapidly; top KPI badges flash amber/red; audio ping for severity > 85. | Instant submission with local caching buffer. | Deduplication merges matching calls into canonical incidents. |
| **Road Severance** | Affected route lines turn dashed red; plan diff modal pops up automatically. | Displays route obstruction banner on map. | Recomputes routes with $\infty$ flood penalties; generates Plan Diff. |
| **Silent Sector Detected** | Pulsing violet alert on H3 hex; audible chime; equity card surfaces in queue. | Unaffected. | Triggers Staged Reserve Buffering; calculates Bayesian Census Prior. |
| **Total Central Blackout** | Degraded mode banner; serves cached Leaflet tiles and last approved plan. | Local IndexedDB buffers all SOS reports; background worker retries. | Runs locally on client CPU using cached deterministic heuristics. |

---

## 8. Responsive Breakpoint Strategy

| Screen / Device | Target Dimensions | Layout Adaptation & Ergonomics |
|---|---|---|
| **Large EOC Multi-Monitor** | `1920px × 1080px` or `2560px × 1440px` | 3 Full Columns side-by-side with maximum geospatial map real estate. |
| **Standard Command Laptop** | `1366px × 768px` to `1440px × 900px` | 3 Columns with collapsible Left/Right panes (toggleable via `[` and `]` shortcuts). |
| **Field Tablet (iPad / Galaxy Tab)** | `768px × 1024px` (Portrait/Landscape) | 2 Columns (Map on top, toggleable Queue/Plan tabs below). |
| **Mobile Web (Field Reporter)** | `375px × 667px` to `412px × 915px` | Single-column stacked form, 48px minimum touch targets, one-thumb reachability. |
