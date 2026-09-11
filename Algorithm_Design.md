# Team ResQ: Decision Engine Algorithm Design

## §1 Overview
The pipeline converts raw reports into allocation decisions through 4 stages:
Report Ingestion → Incident Fusion → Need/Priority Scoring → Greedy Optimisation

## §2 Report Confidence Scoring
```text
Source credibility weights:
  Official agency (NDRF/SDRF/Police): 0.95
  Hospital: 0.90
  NGO field coordinator: 0.80
  Authenticated citizen: 0.65
  Anonymous citizen: 0.50
  Sensor/automated: 0.85

Confidence = base_credibility × corroboration_multiplier × freshness_factor
  base_credibility = weighted avg of all reporter credibilities
  corroboration_multiplier = min(1 + 0.15×(evidence_count - 1), 1.5)
  freshness_factor = exp(-0.05 × hours_since_last_report)

Low confidence rule:
  IF confidence < 0.4 AND severity > 0.7:
    flag = 'VERIFY_IMMEDIATELY'
    priority_reduction = max(0.7)  # don't drop below 70%
```

## §3 Deduplication Algorithm
```text
match_score = 0.4×geo_prox + 0.3×time_prox + 0.2×semantic_sim + 0.1×pop_overlap

geo_prox = 1 - min(distance_km / 0.5, 1)  # 500m radius
time_prox = 1 - min(hours_diff / 2.0, 1)  # 2-hour window
semantic_sim = jaccard(event_type_tokens_a, event_type_tokens_b)
pop_overlap = 1 - |affected_a - affected_b| / max(affected_a, affected_b)

IF match_score > 0.7: merge reports into one incident
Merge rules:
  - location: population-weighted centroid
  - people: max(injured), max(trapped), max(missing), max(affected)
  - evidence: union of all evidence lists
  - confidence: recompute with combined sources
  - timestamp: earliest report time
```

## §4 Severity Formula
```text
Severity = 0.40×medical_intensity + 0.30×structural_threat + 0.20×environmental_hazard + 0.10×density_factor

medical_intensity = min(injured/affected + 2×(trapped/affected) + 1.5×(missing/affected), 1.0)
structural_threat = {none: 0, partial: 0.5, full_collapse: 1.0}
environmental_hazard = {flood: 0.7, earthquake: 0.9, fire: 0.85, landslide: 0.75, cyclone: 0.8}
density_factor = min(affected / 1000, 1.0)  # capped at 1000 people
```

## §5 Urgency Formula
```text
Urgency = 0.50×time_criticality + 0.30×access_degradation + 0.20×resource_depletion

time_criticality:
  event_type=FLOOD → 0.9 (water rising = hours critical)
  event_type=EARTHQUAKE → 0.95 (golden hour)
  event_type=SHELTER → 0.4 (days)
  event_type=FOOD → 0.3 (days)

access_degradation = {OPEN: 0.1, PARTIAL: 0.5, BLOCKED: 0.9, UNKNOWN: 0.6}
resource_depletion = (hours_since_last_supply / 48) capped at 1.0
```

## §6 Demand Vector Computation (transparent rules)
```text
For incident with: affected=N, injured=I, trapped=T, event_type=E

ambulances_needed = ceil(I × 0.4 / 4)  # 4 = avg ambulance patient capacity
rescue_teams = ceil(T / 25)
boats_needed = ceil(T / 20) IF E==FLOOD else 0
food_packets = ceil(N × 1.2)  # 20% buffer
water_litres = N × 3
shelter_beds = ceil((N - already_sheltered) × 0.9)
medical_responders = ceil(I / 8)
k9_teams = 1 IF structural_threat > 0.5 AND T > 0 else 0

Vulnerability modifier (if elderly/children > 30% of affected):
  ambulances_needed ×= 1.3
  medical_responders ×= 1.2

Zone demand = sum of all incident demands with population dedup:
  IF two incidents share >60% population → take max, not sum
```

## §7 Priority Formula
```text
Priority(zone) = (
  0.35 × Severity +
  0.25 × Urgency +
  0.20 × NeedIntensity +
  0.10 × Vulnerability +
  0.10 × Isolation
) × confidence_modifier × 100

NeedIntensity = unmet_demand_weight / total_demand_weight  (0-1)
Vulnerability = (elderly_count + children_count) / affected  (0-1)
Isolation = 1 - access_score  where access_score: OPEN=0.9, PARTIAL=0.5, BLOCKED=0.05
confidence_modifier = max(confidence, 0.7)  # floor at 0.7 so even low-conf gets considered

Zone amplifier for clusters:
  zone_priority = max(incident_priorities) × (1 + log(incident_count) × 0.1)
```

## §8 Capability Matching
```text
Capability registry:
  AMB_TYPE_I: [medical_transport, bls, oxygen, trauma_support, 4_patient_cap]
  AMB_TYPE_II: [medical_transport, als, icu_transport, 2_patient_cap]
  IRB_BOAT: [water_rescue, flood_navigation, 20_person_cap]
  FRP_BOAT: [water_rescue, flood_navigation, 12_person_cap]
  CSSR_TEAM: [rubble_rescue, life_detection, cutting, lifting]
  K9_TEAM: [search_detection, scent_tracking, rubble_navigation]
  MFR_TEAM: [triage, first_aid, mass_casualty]
  NDRF_RESCUE: [water_rescue, evacuation, medical_response, urban_rescue]
  FOOD_DEPOT: [food_supply, water_supply]
  SHELTER_UNIT: [shelter_capacity, bedding, hygiene_support]

Required capabilities per event type:
  FLOOD: [water_rescue, evacuation, medical_transport]
  EARTHQUAKE: [rubble_rescue, life_detection, medical_transport, search_detection]
  FIRE: [fire_suppression, evacuation]
  LANDSLIDE: [rubble_rescue, cutting, medical_transport]
  MEDICAL_SURGE: [medical_transport, triage, icu_transport]

Match score:
  match_score(resource, zone) = |capabilities(resource) ∩ required(zone)| / |required(zone)|
  Only resources with match_score ≥ 0.5 are candidates
```

## §9 Greedy Allocation Algorithm
```text
INPUT: priority_queue (zones sorted by priority desc), resources (available), route_matrix
OUTPUT: assignments[], unmet_needs[]

FOR each zone in priority_queue:
  FOR each need_type in demand_vector(zone):
    candidates = [r for r in resources 
                  if r.status == AVAILABLE 
                  and match_score(r, zone) >= 0.5
                  and route_accessible(r.location, zone, route_matrix)]
    
    sort candidates by: travel_time ASC, match_score DESC
    
    WHILE demand_remaining > 0 AND candidates not empty:
      best = candidates.pop(0)
      assign(best, zone)
      demand_remaining -= best.capacity
      resources.remove(best)

// Equity correction pass
FOR each zone WHERE equity_score < 0.4:
  next_available = resources.filter(status=AVAILABLE)[0]
  IF next_available exists:
    force_assign(next_available, zone)
    emit EQUITY_FORCED_ASSIGNMENT alert

Objective being maximised (for explainability):
  max SUM(assignment.zone_priority × assignment.match_score × 1/travel_time)
  subject to:
    resource capacity constraints
    route accessibility constraints
    minimum reserve policy
```

## §10 Re-optimisation Triggers
```text
Trigger types:
  ROUTE_BLOCKED: affected_assignments = [a for a in current if a.route==blocked_route]
  NEW_INCIDENT: priority > 80 → auto-trigger
  RESOURCE_DAMAGED: remove from pool, re-run
  EQUITY_BREACH: zone equity_score drops below 0.3
  COMMANDER_MANUAL: explicit button press

Re-optimisation:
  1. Update state (route/resource/incident)
  2. Re-score affected zones
  3. Re-run greedy on changed subset
  4. Compute diff:
     diff = {unchanged: [], modified: [], added: [], removed: []}
  5. Display diff with cause + expected improvement
  6. Request approval for changed assignments only
```

## §11 Equity Score
```text
ResourceWeight = {AMBULANCE: 10, RESCUE_TEAM: 8, BOAT: 6, PERSONNEL: 5, SHELTER: 3, MEDICINE: 2, FOOD: 1}

resources_received(zone) = SUM(ResourceWeight[r.type] × r.quantity for r in deployed_to_zone)
pop_factor = log10(zone.affected_population + 1) / 3
estimated_need(zone) = (zone.priority / 100) × 20 × (1 + pop_factor)
equity_score = resources_received / estimated_need

Classification:
  equity_score == 0: FORGOTTEN → mandatory commander ack
  equity_score < 0.4: CRITICAL_UNDERSERVED → equity correction pass
  equity_score < 0.6: UNDERSERVED → monitor
  equity_score < 1.0: ADEQUATELY_SERVED
  equity_score >= 1.0: WELL_SERVED
```

## §12 Where AI (Gemini Flash) vs Deterministic (Greedy)
```text
AI (Google Gemini Flash API (Free Tier)) is used ONLY for:
  1. Voice audio → transcribed text (via Whisper/browser SpeechAPI)
  2. Transcribed/typed text → structured incident fields (LLM extraction)
  3. Image → evidence description (vision model)
  4. Allocation plan → human-readable narrative explanation

AI is NOT used for:
  ✗ Calculating need scores
  ✗ Making allocation decisions
  ✗ Scoring priorities
  ✗ Any step where deterministic math works

This separation is critical for:
  - Auditability: every decision can be traced to a formula
  - Reliability: deterministic engine works even if Google Gemini Flash API (Free Tier) fails
  - Credibility: judges trust math more than "AI said so"
```

---

## Worked Examples: Uttarakhand Flash Flood Scenario

### Example 1: §3 Deduplication Algorithm in Action
**Scenario:** Two flood reports arrive from Rudraprayag Sangam riverside settlement during intense cloudburst rains.

*   **Report A:** Source: Citizen app. Time: 10:00 AM. Location: (30.285, 78.981). Event: "Severe river surge, ghat submerged". Affected: 50.
*   **Report B:** Source: NGO coordinator. Time: 10:30 AM. Location: (30.287, 78.982). Event: "Flash flood near Mandakini confluence". Affected: 60.

**Calculation:**
*   `distance_km` = ~0.25 km. `geo_prox` = $1 - \min(0.25 / 0.5, 1) = 0.5$
*   `hours_diff` = 0.5 hrs. `time_prox` = $1 - \min(0.5 / 2.0, 1) = 0.75$
*   `semantic_sim` (surge, flood) ≈ 0.9 (Jaccard similarity via NLP threshold)
*   `pop_overlap` = $1 - \frac{|50 - 60|}{60} = 1 - 0.166 = 0.83$

**Match Score** = $0.4(0.5) + 0.3(0.75) + 0.2(0.9) + 0.1(0.83) = 0.20 + 0.225 + 0.18 + 0.083 = 0.688$
*Result:* $0.688 < 0.7$. Currently not merged, treated as distinct but closely monitored. If another report corroborates they are the same riverside cluster, they cross the 0.7 threshold.

### Example 2: §7 Priority Scoring
**Scenario:** Massive flash flood in Srinagar Garhwal Riverside Basin.
*   **Context:** 800 affected, 20 trapped, access roads partially blocked by debris. Medical intensity is moderate. 40% of the affected are children/elderly pilgrims (high vulnerability).
*   **Metrics Derived:**
    *   `Severity`: 0.75 (High environmental hazard, moderate medical need)
    *   `Urgency`: 0.85 (Time criticality = 0.9 for floods, partial access = 0.5. $0.5(0.9) + 0.3(0.5) + 0.2(1.0) = 0.8$)
    *   `NeedIntensity`: 1.0 (No resources allocated yet)
    *   `Vulnerability`: 0.40 (40% children/elderly)
    *   `Isolation`: $1 - 0.5 = 0.5$ (PARTIAL access)
    *   `Confidence`: 0.95 (Verified by SDRF)

**Priority Calculation:**
$Priority = (0.35 \times 0.75 + 0.25 \times 0.85 + 0.20 \times 1.0 + 0.10 \times 0.40 + 0.10 \times 0.50) \times 0.95 \times 100$
$Priority = (0.2625 + 0.2125 + 0.20 + 0.04 + 0.05) \times 95 = 0.765 \times 95 = 72.67$

### Example 3: §9 Greedy Allocation Algorithm
**Scenario:**
*   **Priority Queue:** `[Srinagar Basin: Priority 72.6], [Karnaprayag: Priority 45.0]`
*   **Demand (Srinagar Basin):** Needs 2 `FRP_BOAT`s, 1 `AMBULANCE`.
*   **Available Resources:**
    *   `Res1`: `IRB_BOAT` at SDRF Base Jolly Grant (ETA: 35 mins)
    *   `Res2`: `FRP_BOAT` at Alaknanda Staging Depot (ETA: 18 mins)
    *   `Res3`: `AMB_TYPE_II` at Srinagar Base Hospital (ETA: 12 mins)

**Execution for Srinagar Basin:**
1.  *Target Demand:* `FRP_BOAT` (need 2). Candidates: `Res2` (match 1.0, ETA 18m), `Res1` (match 0.8, ETA 35m).
2.  *Action:* Assign `Res2` (demand drops to 1). Resources available updated.
3.  *Action:* Assign `Res1` (demand drops to 0). Resources available updated.
4.  *Target Demand:* `AMBULANCE` (need 1). Candidate: `Res3` (match 1.0, ETA 12m).
5.  *Action:* Assign `Res3`. Demand fulfilled.

*Result:* Srinagar Basin receives `Res2`, `Res1`, and `Res3`. Karnaprayag allocation proceeds next with remaining assets.


## §13 — Central-Side Degraded Operation (Partial & Fragmentary Data)

### 1. Spatial Bayesian Need Prior (Preventing Silent Zone Starvation)
When zero or sparse reports have arrived from a flooded sector:
$$\text{PriorDemand}(H_i) = \text{CensusPop}(H_i) \times \text{FloodSeverity}(H_i) \times (1 + \text{VulnerabilityIndex}(H_i))$$
- Demand is grounded in **baseline demographic exposure**, not raw call frequency.
- Silent sectors maintain positive latent demand in the optimization graph.

### 2. Staged Commitment Policy (Reserve Buffering)
The allocator dynamically limits the proportion of total deployable fleet committed in any single cycle:
- If overall system data confidence $< 0.50$: Max fleet commitment = $70\%$. Mandatory **$30\%$ reserve buffer** held at staging bases.
- If confidence $0.50 - 0.80$: Max commitment = $85\%$.
- If confidence $> 0.80$: $100\%$ full fleet commitment authorized.

### 3. Capability-Tiered Probing
- Unverified, high-severity reports trigger **Scout / Drone reconnaissance missions** rather than irreversible heavy field hospital deployment.
