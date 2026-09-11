# CLAUDE.md — ResQ Development & Operational Manual

This guide outlines commands, coding standards, and architectural constraints for developing and maintaining the **ResQ Multi-Agency Disaster Decision Support Platform**.

---

## 1. Commands

### Development
```bash
npm install              # Install dependencies
npm run dev              # Start Vite development server (default: http://localhost:5173)
npm run build            # Type-check with tsc and build production bundle
npm run preview          # Preview production build locally
```

### Linting & Formatting
```bash
npm run lint             # ESLint inspection across TypeScript/React files
npm run format           # Prettier code formatting
```

### Testing
```bash
npm test                 # Run Vitest unit tests (engine formulas & pure functions)
npm run test:watch       # Vitest in watch mode
```

---

## 2. Core Architecture Rules

1. **Deterministic Dispatch Decisions:** Never use an LLM to choose, rank, or dispatch emergency resources. Allocation decisions MUST run through the deterministic greedy optimization algorithm (`src/engines/allocator.ts`).
2. **Explainability Mandate:** Every generated assignment must contain a clear, human-auditable `reasoning[]` block detailing travel time, next alternative, capability match percentage, and priority weight.
3. **Strict Gemini Flash Scope:** Gemini Flash (`@google/genai`) is restricted to:
   - Voice audio transcription (distress calls)
   - Unstructured raw text -> Structured JSON incident schema parsing
   - Visual damage captioning from mobile photo uploads
   - Commander narrative briefing generation
4. **Spatial Partitioning via H3:** All geospatial clustering and equity calculations must utilize Uber H3 hexagonal indexing (Resolution 8: ~460m, Resolution 7: ~1.2km) via `h3-js`.
5. **Human-in-the-Loop Authority:** Automated algorithms generate proposals (`PENDING`). Dispatches require explicit Commander confirmation (`APPROVE ALL`, `APPROVE SELECTED`, or `MODIFY`).

---

## 3. Code Style & Architecture Conventions

### TypeScript & React
- Use strict TypeScript (`"strict": true` in `tsconfig.json`).
- Avoid `any`. Define comprehensive interfaces in `src/types/` (e.g., `Incident`, `Asset`, `AllocationPlan`, `H3HexCell`).
- Use React 18 functional components with named exports.
- Colocate components with their subcomponents or keep clean modular structure in `src/components/`.

### Styling & Design Tokens
- **Typography:** Use `Plus Jakarta Sans` for UI, headers, and prose; `JetBrains Mono` for coordinates, H3 hex IDs, mathematical metrics, and tabular counts.
- Use Tailwind CSS v3 utility classes mapped to our semantic design tokens:
  - Canvas: `bg-surface-canvas`
  - Panels: `bg-surface-panel`
  - Cards: `bg-surface-card`
  - Status: `text-status-critical`, `text-status-high`, `text-status-moderate`, `text-status-safe`, `text-status-dispatched`
  - Equity Alert: `text-equity-alert`, `border-equity-alert`
- Never write hardcoded hex color codes in component styles.
- Maintain WCAG AAA contrast compliance across both Dark (EOC) and Light (Field) themes.

### State Management
- Zustand stores in `src/stores/`:
  - `useIncidentStore`: Ingested reports, deduplicated incidents, H3 clusters.
  - `useResourceStore`: Multi-agency assets, statuses, coordinates.
  - `useAllocationStore`: Generated plans, diffs, assignment states.
  - `useUIStore`: Active modal, selected incident, map layers, theme.

### Offline & Resilience
- Every field form submission must buffer locally in IndexedDB when offline.
- State changes use monotonic timestamps for deterministic Last-Write-Wins (LWW) conflict reconciliation upon reconnect.

---

## 4. Disaster Response Invariants

- **No Phantom Demand:** Corroborating reports of an existing incident increment evidence and update casualties via `max()`, never summing counts naively.
- **No Forgotten Pockets:** Any active operational zone with zero assigned assets for $>90$ minutes MUST trigger an alert and forced-allocation recommendation.
- **Preserve Documentation:** Do NOT modify `README.md` without explicit user permission. Preserve existing comments and docstrings.
