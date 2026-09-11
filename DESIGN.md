# DESIGN.md: ResQ Design System & UI/UX Architecture
## Modern Civic-Tech Adaptive Design System | Life-Critical Decision Support
### Lead Product Designer & Senior UI/UX Architecture Specification

> "In an emergency operations room, design is not decoration. It is cognitive triage. When an Incident Commander has been awake for 18 hours managing hundreds of simultaneous distress calls, visual ambiguity costs lives. ResQ eradicates cognitive friction, illuminates forgotten victims, and makes complex mathematical optimization instantly intuitive."

---

## 1. Product Design Vision & Emotional Architecture

### 1.1 The Context of Acute Crisis: The Uttarakhand Flash Flood
Disaster management interfaces operate in extreme psychological and physical environments:
- **At the State Emergency Operations Center (Dehradun EOC):** High sensory overload, ringing satellite phones, multi-monitor display walls, political urgency, and sleep deprivation. Under acute stress, human vision experiences tunneling (loss of peripheral perception) and working memory capacity drops by up to 50%.
- **In the Mountain Field (Alaknanda & Mandakini River Valleys):** Blinding midday glare or torrential rains, mud-splattered touchscreens, shivering hands, broken 2G network towers, high altitudes, and washed-out roads.

### 1.2 The ResQ Aesthetic Philosophy: Neo-Tactical Civic-Tech
ResQ rejects both clumsy government portals (gray bevels, dense unreadable tables) and generic corporate SaaS (excessive whitespace, decorative illustrations, low-contrast gray text).

Instead, ResQ implements **Neo-Tactical Civic-Tech**:
1. **High Information Density with Zero Visual Noise.** Every pixel serves operational comprehension. Data is structured using crisp 1px borders, subtle surface elevations, and strict typographic hierarchy.
2. **Sub-Second Visual Triage.** Color is reserved strictly for operational state. A commander can glance at any screen for 250 milliseconds and identify where the crisis is worst, which valley has zero help, and what action to authorize next.
3. **Transparent Explainability.** Field commanders reject algorithmic decisions if they cannot inspect the reason. Every asset recommendation explains its travel time delta, capability match percentage, and mathematical objective function.
4. **Radical Empathy & Anti-Bias.** Forgotten Himalayan hamlets that receive zero resources due to collapsed telecom towers are visually elevated above loud, high-reporting towns.

---

## 2. The Dual-Viewport Architecture

ResQ provides two synchronized viewports tailored to distinct operational contexts:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VIEWPORT ARCHITECTURE                           │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. EOC COMMAND CONSOLE            │ 2. FIELD & CITIZEN MOBILE PWA      │
│ • Target: Desktops (1440px - 4K)  │ • Target: Smartphones (360px - 430px│
│ • Ambient: Dim command room       │ • Ambient: Direct glare, rain      │
│ • Theme: Deep Slate (Dark Mode)   │ • Theme: High-Contrast Light Mode  │
│ • Input: Mouse + Keyboard Hotkeys │ • Input: 48px+ Thumb Touch Targets │
│ • Layout: Synchronous 3-Pane Grid │ • Layout: Single-Column Linear Flow│
│ • Focus: Macro triage & approval  │ • Focus: Rapid distress reporting  │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 3. Semantic Color Tokens & WCAG AAA Contrast

Colors in ResQ are functional signals, not decorative accents. All text-background pairs strictly adhere to **WCAG AAA (7:1 contrast ratio)** for critical data and **WCAG AA (4.5:1)** for secondary metadata.

### 3.1 Surface & Structural Tokens

| Token Name | Dark Mode (EOC Default) | Light Mode (Field Default) | Semantic Role |
| :--- | :--- | :--- | :--- |
| `--surface-canvas` | `#0B0F19` (Deep Void) | `#F8FAFC` (Pure Pearl) | Background canvas of the application |
| `--surface-panel` | `#111827` (Command Slate) | `#FFFFFF` (Solid White) | Primary sidebar, drawers, modal bodies |
| `--surface-card` | `#1F2937` (Card Charcoal) | `#F1F5F9` (Subtle Slate) | Nested interactive cards, queue items |
| `--surface-hover` | `#374151` (Elevated Charcoal)| `#E2E8F0` (Pressed Slate) | Hover and active selection states |
| `--border-subtle` | `#1F2937` (1px Solid) | `#E2E8F0` (1px Solid) | Secondary partition dividers |
| `--border-strong` | `#374151` (1px Solid) | `#CBD5E1` (1px Solid) | Card perimeters and input containers |
| `--border-focus` | `#6366F1` (Indigo 500) | `#4F46E5` (Indigo 600) | High-visibility 2px focus ring |

### 3.2 Life-Critical Status Tokens

| Operational State | Token Name | Hex Code | Semantic Meaning | Icon Pairing |
| :--- | :--- | :--- | :--- | :--- |
| **Critical Urgent** | `--status-critical` | `#EF4444` (Crimson Red) | Severity > 80%, casualties, trapped victims | `AlertTriangle` |
| **High Priority** | `--status-high` | `#F59E0B` (Amber Orange) | Escalating threat, road cutting off | `AlertCircle` |
| **Moderate Need** | `--status-moderate` | `#FACC15` (Triage Yellow) | Sustained need, food/water, shelters | `Clock` |
| **Fully Served** | `--status-safe` | `#10B981` (Emerald Green) | Demand 100% satisfied, secure area | `CheckCircle2` |
| **Dispatched** | `--status-dispatched`| `#3B82F6` (Rescue Blue) | Resource en-route, active GPS tracking | `Navigation` |
| **Forgotten Pocket**| `--status-forgotten` | `#A855F7` (Vivid Violet) | $E_i = 0$ for >90 mins, zero assistance | `HelpCircle` + Pulse |

> [!IMPORTANT]
> **The Color-Blind Invariant:** Never convey state through color alone. Every badge, map marker, or metric MUST combine:
> 1. A semantic background/text color token
> 2. A distinct SVG icon (`lucide-react`)
> 3. An explicit text label (such as `CRITICAL`, `EN-ROUTE`, or `FORGOTTEN`)

---

## 4. Typography System: Plus Jakarta Sans & JetBrains Mono

We deliberately reject generic Inter in favor of a crisp, high-character typographic pairing engineered for visual hierarchy and tabular stability:

```
UI & Headings:             Plus Jakarta Sans (Google Fonts)
                           Geometric neo-grotesque with distinct open apertures,
                           sculpted terminals, and high legibility at 11px to 14px.

Coordinates, IDs & Math:   JetBrains Mono (Google Fonts)
                           Tabular figures prevent layout jitter during live
                           WebSocket data stream updates.
```

### 4.1 Typographic Scale

| Level | Size / Line-Height | Weight | Font Family | Usage Example |
| :--- | :--- | :--- | :--- | :--- |
| **Display Macro** | `28px / 34px` | Bold (700) | Plus Jakarta Sans | Top Bar KPI Metrics (`24 Active`, `31% Unmet`) |
| **Section Title** | `18px / 24px` | SemiBold (600) | Plus Jakarta Sans | Panel Headers (`Incident Queue`, `Plan Diff`) |
| **Card Title** | `14px / 20px` | SemiBold (600) | Plus Jakarta Sans | Incident Location (`Rudraprayag Sangam Flood`) |
| **Body Regular** | `13px / 18px` | Regular (400) | Plus Jakarta Sans | Descriptive notes, caller explanations |
| **Technical Value** | `12px / 16px` | Medium (500) | JetBrains Mono | GPS `30.2854° N, 78.9812° E`, H3 `88609a6567fffff` |
| **Micro Badge** | `10px / 14px` | Bold (700) | JetBrains Mono | Status pills (`94.2 PRIORITY`, `CONF: 88%`) |

---

## 5. Core Interface Component Architecture

### 5.1 The EOC 3-Pane Command Console
The flagship interface gives the Incident Commander complete situational awareness across the Uttarakhand disaster zone without page reloads:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP COMMAND BAR (56px): Uttarakhand GLOF Flood | T+04:15 | Agencies: NDRF, SDRF, ITBP   │
├─────────────────────────┬────────────────────────────────────┬───────────────────────────┤
│ LEFT PANE (340px)       │ CENTER PANE (Flex ~720px+)         │ RIGHT PANE (380px)        │
│ PRIORITIZED QUEUE       │ TACTICAL GEOSPATIAL MAP            │ EXPLAINABLE DISPATCH PLAN │
│                         │                                    │                           │
│ • Search & Quick Filters│ • Leaflet.js with H3 Hex Layers    │ • Active Plan Summary     │
│ • Sorted by Priority    │ • Incident Distress Pins           │ • Step-by-Step Assignments│
│ • Live casualty badges  │ • Live Asset GPS Markers           │ • "Why this allocation?"  │
│ • Accessibility tags    │ • Mountain Highway Blockages       │ • Travel time deltas      │
│ • Silence/Forgotten tags│ • Interactive Hexagon Inspector    │ • Sticky Approval Bar     │
├─────────────────────────┴────────────────────────────────────┴───────────────────────────┤
│ SYSTEM STATUS FOOTER (32px): WebSocket Health | Active Hex Count | Offline Sync State   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 The "Why This Allocation?" Explainability Card
Every automated recommendation generated by Engine 3 is presented inside an inspector card that satisfies the Commander's requirement for clear justification:

```
┌────────────────────────────────────────────────────────┐
│ 🚑 ASSIGNMENT #1: EMERGENCY MEDICAL EVACUATION         │
├────────────────────────────────────────────────────────┤
│ Unit: AMB-SDRF-04 (Mountain 4x4 BLS · 4-Bed Capacity)  │
│ Origin: Srinagar Base Hospital ➔ Rudraprayag Sangam    │
│ Route: Via NH-07 Bypass (Distance: 32 km · ETA: 38 min)│
├────────────────────────────────────────────────────────┤
│ 💡 WHY THIS ALLOCATION:                                │
│ • 38 min travel time (Next alternative AMB-12: 65 min) │
│ • 100% mountain terrain and BLS capability match       │
│ • Target Zone has Priority 94.2/100 (Highest in state) │
│ • Preserves 35% district hospital reserve              │
│ • Decision Method: DETERMINISTIC GREEDY OPTIMIZER      │
├────────────────────────────────────────────────────────┤
│ [Approve Assignment]  [Swap Asset]  [Dismiss]          │
└────────────────────────────────────────────────────────┘
```

### 5.3 Dynamic Plan Diff Modal (Before vs. After)
When real-time conditions mutate (such as the Badrinath Highway NH-07 washing out at Helang bridge), the system recalculates dispatches. Under Incident Command System (ICS) protocol, the Commander must authorize route changes:

- **Rerouted paths:** Marked in Amber (`+24 min ETA detour via Chopta`)
- **New dispatches:** Marked in Blue (`Dispatched from Reserve Depot`)
- **Paused units:** Marked in Gray (`Held at Staging Base`)
- **Impact summary:** "Net Lives Secured: +42 | Valley Fleet Reserve: 38%"

### 5.4 The Equity Lens Drawer & Forgotten Zone Alert
The Equity Lens visualizes fairness across all mountain sectors:
- **Metric:** Live Fulfilled Need Ratio $E_i = \frac{\sum \text{Deployed Resources}}{\sum \text{Need Weight}}$
- **The Forgotten Zone Widget:** If an active H3 hexagon receives zero resources for $>90$ minutes (such as cut-off Mandakini Valley hamlets), it turns **Vivid Violet with a continuous pulse** (`animation: pulse-ring 2s infinite`).
- **Commander Acknowledgment:** The alert requires active attention. The commander must either click `[Force-Assign Next Available Asset]` or log an operational justification.

### 5.5 The Field Responder Mobile PWA
Optimized for one-handed operation on rugged terrain:
- **Preset Quick Buttons:** 4 large tap cards ("River Flash Flood Trapped", "Landslide Structural Collapse", "Bridge Severed", "Isolated Villagers with Hypothermia").
- **Voice SOS Ingestion:** Large central microphone button using browser Web Speech API.
- **One-Tap GPS:** Instant device geolocation with fallback map pin drop.
- **Offline Indicator:** Floating badge showing `OFFLINE — 3 Reports Queued` that transitions to `SYNCED` upon reconnect.

---

## 6. Micro-Interactions & Motion Choreography

All motion in ResQ is functional and respects `prefers-reduced-motion` settings.

### 6.1 Timing & Easing Curves
- **Standard Transitions:** `150ms ease-out` for hover states and button presses.
- **Panel Expansion & Drawers:** `250ms cubic-bezier(0.16, 1, 0.3, 1)` (responsive spring curve).
- **Plan Recalculation:** Progress bar completes in 400ms to convey computational certainty.

### 6.2 Emergency Feedback Signals
- **Critical Alert Pulse:**
  ```css
  @keyframes emergency-pulse {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
    70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
  ```
- **H3 Hex Selection:** Selecting an incident card pans the Leaflet map in 300ms and highlights the hexagon perimeter in 2px cyan (`#06B6D4`).

---

## 7. Keyboard Ergonomics for Incident Commanders

Power users in an EOC rarely rely on mice for routine approvals. ResQ incorporates direct keyboard shortcuts:

| Key Binding | Operational Action |
| :--- | :--- |
| `Enter` | Approve currently highlighted plan or modal |
| `Escape` | Dismiss modal or cancel selection |
| `Space` | Toggle map layer menu |
| `J` / `K` | Navigate down / up through the incident priority queue |
| `1` | Toggle H3 Hexagonal Density Layer |
| `2` | Toggle Live Asset Trackers |
| `3` | Toggle Mountain Highway Blockages & Flood Hazards |
| `E` | Open Equity Lens Drawer |
| `R` | Trigger Manual Re-Optimization Cycle |

---

## 8. Localization & Agency Alignment

ResQ is configured for Indian disaster response command structures:
- **Bilingual Interface:** Instant toggle between English and Hindi (`हिन्दी`).
- **Agency Nomenclature:** Aligns with National Disaster Response Force (NDRF), State Disaster Response Force (SDRF Uttarakhand), Indo-Tibetan Border Police (ITBP), and District Emergency Operations Center (DEOC) protocols.
- **Toponym Resolution:** Recognizes Himalayan valley geography and landmark naming (such as "Rudraprayag Sangam Ghat", "Joshimath Raini Bridge", "Helang Highway Km 18").
