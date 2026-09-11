# PRD.md: Product Requirements Document (MVP)
## ResQ: Multi-Agency Disaster Decision Support Platform
### MUJHACKX 2026 | Problem Statement #2: Emergency Resource Allocation

---

## 1. Executive Summary & Problem Context

During catastrophic disaster events (such as the Uttarakhand Flash Flood and Glacial Lake Outbursts in the Alaknanda and Mandakini valleys), emergency management centers face two severe challenges: **information chaos** and **resource misallocation**.

Existing systems suffer from four systemic vulnerabilities:
1. **The First Caller Bias.** Urban settlements with functioning cellular towers consume all incoming rescue assets, while isolated mountain hamlets cut off by landslides receive zero aid.
2. **Phantom Demand Multiplication.** Dispatch tools treat multiple calls about the same washed-out settlement as distinct incidents, multiplying requested assets fiftyfold.
3. **Inter-Agency Silos.** NDRF mountain rescue teams, SDRF swift-water squads, ITBP high-altitude personnel, civil hospital ambulances, and NGO supply depots operate on fragmented radio channels, causing double-deployments and unaddressed sectors.
4. **Distrust of Black-Box AI.** Responders reject AI recommendations that cannot explain *why* an asset was allocated to one group of survivors over another.

### The Solution: ResQ
**ResQ** is a multi-agency, life-critical decision support platform powered by a **4-Engine Deterministic Architecture**:
- Multimodal noise is parsed into structured canonical incidents via Google Gemini Flash.
- Mountain geography is partitioned into uniform **Uber H3 hexagons** (Resolution 8: ~460m).
- Resource matching is calculated by a **deterministic greedy optimizer** operating on explicit capacity and terrain constraints.
- An auditable **Equity Engine** monitors the Fulfilled Need Ratio ($E_i$) of every sector, ensuring zero forgotten valleys.

---

## 2. Target User Personas & Operational Roles

| Persona | Role | Primary Goal | Pain Point Addressed |
| :--- | :--- | :--- | :--- |
| **Raj Kumar (47)** | District Incident Commander (NDRF) | Make rapid, valley-wide dispatch decisions with total situational clarity. | Eliminates cognitive overload; provides transparent "Why this allocation?" rationales. |
| **Arjun Mehta (38)**| Agency Logistics Officer (SDRF Uttarakhand)| Manage fleet availability, accept dispatch orders, and update asset status. | Multi-agency view prevents resource double-counting and route confusion. |
| **Priya Singh (33)** | NGO Field Coordinator | Submit real-time field observations from cut-off zones and verify help is coming. | Offline-capable mobile reporting with instant local buffering. |
| **Kavya Reddy (52)** | State Disaster Secretary (Dehradun EOC) | Monitor state-wide coverage equity and ensure no vulnerable mountain hamlets are neglected. | Dedicated Equity Lens displays live coverage percentage and flags forgotten zones. |
| **Ramesh Gupta (44)**| Control Room Dispatcher (Chamoli DEOC) | Rapidly ingest phone calls and radio reports into structured incident cards. | Gemini Flash one-click parsing turns messy voice/text into validated schema in <1.2s. |

---

## 3. MVP Scope: Built vs. Deferred Matrix

| Capability Area | 36-Hour MVP Implementation (Working Code) | Deferred Beyond MVP (Future Roadmap) |
| :--- | :--- | :--- |
| **Distress Ingestion** | Form + 4 Quick Presets + Web Speech Voice + Gemini 2.5 Flash parsing | Full Twilio telephony gateway / satellite uplinks |
| **Spatial Grouping** | Live client-side & edge Uber H3 indexing (`h3-js` Res 8 & 7) | Dynamic multi-resolution hydrological fluid meshes |
| **Allocation Engine** | Deterministic Greedy Priority Allocator with capability matching | Full OR-Tools Mixed Integer Linear Programming (MILP) |
| **Dynamic Rerouting** | Interactive "Route Submerged / Blocked" toggle with Plan Diff | Live real-time traffic camera video telemetry |
| **Realtime Sync** | Supabase PostgreSQL CDC (WebSockets) + Reactive Zustand | Apache Kafka / NATS enterprise event bus |
| **Fairness Layer** | Live $E_i$ Fulfilled Need Ratio + Forgotten Zone Visual Pulse | Multi-decade socio-economic census regression models |
| **Offline Resilience** | IndexedDB (`idb`) queue + Last-Write-Wins (LWW) sync | Full SQLite Wasm CRDT distributed cluster |

---

## 4. Functional Specifications

### FR-1: Multimodal Distress Intake & Structured Parsing
- **FR-1.1:** The system provides an SOS submission interface supporting freeform text, preset disaster scenarios, and microphone audio input via the browser Web Speech API.
- **FR-1.2:** Unstructured text/audio is parsed via the Google Gemini Flash API (`gemini-2.5-flash`) using a strict JSON response schema.
- **FR-1.3:** Extracted fields include: `event_type` (Flood, Landslide, Collapse, Medical Surge), `people_affected`, `trapped_count`, `injured_count`, `vulnerability_indicators` (children, elderly), and `access_condition` (Open, Partial, Blocked).

### FR-2: Deduplication & Canonical Incident Fusion (Engine 1)
- **FR-2.1:** Every new report is compared against existing incidents within a 500m radius and 2-hour temporal sliding window.
- **FR-2.2:** A deterministic Match Score is computed:
  $$\text{Match Score} = 0.4 \times \text{GeoProx} + 0.3 \times \text{TimeProx} + 0.2 \times \text{SemanticSim} + 0.1 \times \text{PopOverlap}$$
- **FR-2.3:** If $\text{Match Score} \ge 0.70$, the report merges into the existing Canonical Incident without creating phantom demand. Casualty counts update using $\max(\text{existing}, \text{new})$.

### FR-3: Spatial Clustering via Uber H3
- **FR-3.1:** Incidents are spatially indexed into Uber H3 Hexagons at Resolution 8 (~460m diameter) using `h3-js`.
- **FR-3.2:** Each hexagon aggregates cumulative need weight, affected populations, and active resource commitments.

### FR-4: Need Assessment & Demand Vector Computation (Engine 2)
- **FR-4.1:** Each incident produces 4 distinct assessment outputs: `Severity` [0–1], `Urgency` [0–1], `Need Intensity` [0–1], and `Confidence` [0–1].
- **FR-4.2:** Priority is calculated via the formula:
  $$\text{Priority} = (0.35 \times \text{Severity} + 0.25 \times \text{Urgency} + 0.20 \times \text{Need} + 0.10 \times \text{Vuln} + 0.10 \times \text{Isolation}) \times \max(\text{Conf}, 0.70) \times 100$$
- **FR-4.3:** Required assets are calculated using transparent demand vectors (such as 1 inflatable boat per 20 trapped in river floods, 1 mountain 4x4 ambulance per 4 injured with $+30\%$ vulnerability modifier).

### FR-5: Deterministic Greedy Priority Allocation (Engine 3)
- **FR-5.1:** Available assets from participating agencies (NDRF, SDRF, ITBP, Hospitals) pool into an available resource queue.
- **FR-5.2:** The allocator matches assets to highest-priority incidents based on capability intersection ($\ge 50\%$), travel time, and operational capacity.
- **FR-5.3:** No LLM or non-deterministic heuristic makes dispatch choices.

### FR-6: Per-Assignment Explainability
- **FR-6.1:** Every proposed assignment generates an explainability block stating:
  - Exact travel time and distance
  - Comparison to the next best alternative asset
  - Matching capability percentage
  - Priority rank of the target zone

### FR-7: Dynamic Reallocation & Plan Diff (Engine 4)
- **FR-7.1:** The system supports trigger events: `ROUTE_BLOCKED`, `NEW_CRITICAL_INCIDENT`, `RESOURCE_DAMAGED`, and `EQUITY_BREACH`.
- **FR-7.2:** Triggering a re-allocation generates a side-by-side **Plan Diff** showing previous vs. proposed routes, travel time deltas, and projected life impact.
- **FR-7.3:** Changes remain in `PENDING` state until authorized by the Commander.

### FR-8: The Fairness Layer (Equity Engine)
- **FR-8.1:** The system calculates the Fulfilled Need Ratio ($E_i$) for every active H3 hexagon:
  $$E_i = \frac{\sum \text{Deployed Resource Weights}}{\text{Cumulative Need Weight}}$$
- **FR-8.2:** If $E_i = 0$ for $>90$ minutes, the hexagon is flagged as a **Forgotten Zone** with a pulsing visual alert and mandatory commander acknowledgment.
- **FR-8.3:** An automated **Equity Correction Pass** force-assigns the next available asset to any zone with $E_i < 0.40$.

### FR-9: Degraded & Offline Field Resilience
- **FR-9.1:** The field reporting interface detects loss of connectivity and buffers reports locally in IndexedDB.
- **FR-9.2:** Reconnecting to the network triggers automatic background synchronization using monotonic timestamp Last-Write-Wins (LWW) conflict resolution.

---

## 5. Non-Functional Requirements (NFRs)

- **Performance:**
  - Ingestion parsing via Gemini Flash: $< 1.5$ seconds.
  - Greedy allocation algorithm execution: $< 50$ milliseconds for up to 500 active incidents.
  - Client-side map rendering: 60 FPS on modern desktop browsers (Chrome, Edge, Firefox).
- **Usability & Accessibility:**
  - Adherence to WCAG AAA contrast for all critical status indicators.
  - Minimum touch target of 44×44px on mobile viewports.
  - Dual-mode support (EOC Dark Mode default, Field Light Mode).
  - Typography: **Plus Jakarta Sans** (UI and headings) and **JetBrains Mono** (tabular numbers, coordinates, IDs).
- **Auditability:**
  - Every commander override, approval, or rejection is logged with an immutable actor ID, timestamp, and plan hash.

---

## 6. Hackathon Live Demo Scenario: Uttarakhand Flash Flood

The MVP is validated through a 4-phase interactive live demonstration set across the Alaknanda and Mandakini river valleys:
1. **T+00:00 (Initial Deluge):** Glacial lake breach triggers flash floods at Rudraprayag Sangam and Srinagar Garhwal. Ingest 4 distress reports (text and voice). Fusion engine deduplicates reports and clusters into H3 Hexes.
2. **T+00:15 (Optimization Run):** Commander triggers allocation. Optimizer dispatches SDRF swift-water rescue boats and Srinagar Base Hospital 4x4 ambulances. "Why this allocation?" inspector displays justifications.
3. **T+00:45 (Emergency Event: NH-07 Badrinath Highway Washed Out at Helang):** User clicks "Simulate Landslide / Road Block". System recalculates routes in 1.2s. Dynamic Plan Diff modal displays rerouted convoys via Chopta pass. Commander approves.
4. **T+01:30 (The Equity Climax: Mandakini Valley Forgotten Pocket):** A silent rural mountain pocket in Guptkashi has filed only 1 report due to collapsed cellular towers, but has 80 stranded residents. $E_i = 0$. System pulses violet, triggers an Equity Alert, and force-assigns the next incoming ITBP rescue squad.
