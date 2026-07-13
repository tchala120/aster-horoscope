# Tasks Decisions (D4) — Unit U1: Session & Daily Draw

## Context Summary
- **Unit**: U1 Session & Daily Draw (US-001–005). Design: 7 components, 3 client-state entities + deck reference, 3 consumed endpoints, 1 integration (Server API — **not built yet**), 6 PBT properties, Framer Motion spread animation.
- **Stack**: Next.js + TypeScript, Tailwind (Solar tokens), React Context + versioned localStorage, fast-check, Vitest + RTL, Playwright, Framer Motion.
- **Team**: Small (2-3).
- **Note**: U1's authenticated flows depend on the Server (API & Auth) unit, which isn't implemented. Guest/localStorage flow is fully buildable now.

---

## Decision Questions

### D4-1: Task Breakdown Strategy
- 1) **By layer within the unit** — foundation bits (types/deck/storage) → pure domain logic → contexts/hooks → UI/animation → tests **(Recommended)**
- 2) By story (US-001…US-005 vertical slices)
- 3) By component (one task per component)
- 4) Other: _______

**Answer**: 1

---

### D4-2: Implementation Approach
- 1) **Test-alongside, TDD for pure logic** — write DrawService/StorageService with tests+PBT first; test components after **(Recommended)**
- 2) Strict TDD everywhere
- 3) Test-after (implement, then test)
- 4) Other: _______

**Answer**: 1

---

### D4-3: Build Order / Priority
- 1) **Guest flow end-to-end first, then authenticated sync** — deliver a working guest daily-draw before wiring the Server API **(Recommended)**
- 2) Data/logic layer fully, then all UI
- 3) UI-first with mocked state, logic after
- 4) Other: _______

**Answer**: 1

---

### D4-4: Server API Integration (dependency not built yet)
- 1) **Build against a typed mock/stub `SyncClient`** using `src/shared` contracts; wire the real API when the Server unit lands **(Recommended)**
- 2) Defer all authenticated flows to when the Server unit is done (guest-only for now)
- 3) Build the Server endpoints as part of this unit
- 4) Other: _______

**Answer**: 1

---

### D4-5: Testing Scope for U1
- 1) **Unit + PBT (DrawService, StorageService) + a few RTL component tests + 1 Playwright e2e (one-draw-per-day)** **(Recommended)**
- 2) Unit + PBT only (no component/e2e yet)
- 3) Full coverage incl. e2e for every flow
- 4) Other: _______

**Answer**: 1

---

### D4-6: Animation Tasking
- 1) **Separate task for spread animation** (Framer Motion variants + reduced-motion + responsive), after the static spread renders **(Recommended)**
- 2) Fold animation into the spread UI task
- 3) Defer animation to a polish pass
- 4) Other: _______

**Answer**: 1

---

### D4-7: Task Granularity
- 1) **1-2 day tasks** **(Recommended)**
- 2) Smaller 2-4h tasks
- 3) Larger multi-day tasks
- 4) Other: _______

**Answer**: 1

---

### D4-8: Execution Model
- 1) **Execution waves with light parallelism** — pure logic and UI scaffolding can proceed in parallel after types/storage land **(Recommended for 2-3 devs)**
- 2) Fully sequential
- 3) Maximize parallelism
- 4) Other: _______

**Answer**: 1

---

### D4-9: Estimate Format
- 1) **T-shirt sizes (S/M/L) + rough hours** **(Recommended)**
- 2) Hours only
- 3) Story points
- 4) None
- 5) Other: _______

**Answer**: 5 Fibonacci

---

## Decisions Summary
- D4-1 Breakdown Strategy: By layer within the unit (foundation → pure logic → contexts/hooks → UI/animation → tests)
- D4-2 Implementation Approach: Test-alongside; TDD for pure logic (DrawService/StorageService + PBT first)
- D4-3 Build Order: Guest flow end-to-end first, then authenticated sync
- D4-4 Server Integration: Build against a typed mock/stub SyncClient using src/shared contracts; wire real API when Server unit lands
- D4-5 Testing Scope: Unit + PBT + a few RTL component tests + 1 Playwright e2e (one-draw-per-day)
- D4-6 Animation Tasking: Separate task for spread animation (after static spread renders)
- D4-7 Granularity: 1-2 day tasks
- D4-8 Execution Model: Execution waves with light parallelism
- D4-9 Estimate Format: Story points (Fibonacci: 1, 2, 3, 5, 8)

## Additional Constraint (user)
- **Complete separation of UI and business logic**: a framework-agnostic `core/` layer (pure domain, services, state, storage schema, sync contracts) with **no React/DOM imports**; React contexts/hooks form the adapter boundary; UI components are presentational only (render + call hooks, no business rules). Enforced via an import/lint boundary.

---

**Instructions**: Fill in your answers above and respond with "done"
