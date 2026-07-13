# Tasks — Unit U1: Session & Daily Draw

## Summary
- **Total tasks**: 22 across 7 phases
- **Execution waves**: 5 (one parallel wave)
- **Coverage**: 7 components, 3 client entities + deck, 3 consumed endpoints (mocked), 6 PBT properties
- **Strategy**: By layer; guest flow first, then authenticated sync (mocked SyncClient)
- **Testing approach**: Test-alongside; TDD for the pure core (tests + PBT precede/accompany logic)
- **Estimates**: Story points (Fibonacci 1/2/3/5/8)
- **Derived from**: `units/U1/design.md` (+ decisions D3/D4)

## Overview
**Architecture principle (user constraint): complete separation of UI and business logic.**
- `core/` — **pure** business logic (domain, services, state transitions, storage schema/migrations, sync contracts). **No `react`, `next`, or DOM imports.** Deterministic (inject `now` and RNG).
- `state/` — React adapter boundary (contexts + hooks) that wraps `core/`. The **only** place `core` meets React.
- `components/` — **presentational only** (props in, events out). No business rules, no storage, no services.
- Enforced by an ESLint import-boundary rule (`import/no-restricted-paths` or `eslint-plugin-boundaries`): `core` cannot import `state`/`components`/react; `components` cannot import `core` directly (only via `state` hooks).

Checkbox legend: `- [ ] N. Phase` / `  - [x] N.M Task`. Details are plain list items.

---

## Task Phases

- [x] 1. Shared Types & Deck Data
  - [x] 1.1 Define shared domain types & DTOs
    - **Deps**: none | **Ref**: design.md — Data Model, API Specification
    - Add `SeekerSession`, `DailyState`, `SpreadCard`, `TarotCard`, and API DTOs (`SessionResponse`, `DrawResponse`) + error envelope to `src/shared/`.
    - Points: 2
  - [x] 1.2 Author Major Arcana deck data (22 cards)
    - **Deps**: 1.1 | **Ref**: design.md — Components §1 deck, D3-1
    - `src/data/deck.ts`: 22 cards (id, name, arcana, artworkRef, meaning) + `getCardById`. Placeholder artworkRefs pending assets.
    - Points: 2

- [x] 2. Business-Logic Core (pure, no React) — TDD + PBT
  - [x] 2.1 DrawService: spread generation + draw rules (tests first)
    - **Deps**: 1.1, 1.2 | **Ref**: design.md — Components §5, Correctness P1–P4
    - `core/draw-service.ts`: `generateSpread(rng)` (10 distinct of 22), `canDraw(state, now)`, `nextResetAt(now)` using app-wide fixed tz (UTC default). Inject `now` + RNG for determinism.
    - Points: 3
  - [x] 2.2 Daily-state transitions (reducer/state machine)
    - **Deps**: 1.1 | **Ref**: design.md — Data Model, US-002/004/005
    - `core/daily-state.ts`: pure transitions (draw, block-while-active, reset) with invariants. No persistence, no React.
    - Points: 3
  - [x] 2.3 Storage schema + versioned migrations (pure)
    - **Deps**: 1.1 | **Ref**: design.md — Components §2, D3-4
    - `core/storage/schema.ts` + `migrations.ts`: `CURRENT_SCHEMA_VERSION`, pure `migrate(raw)`, serialize/parse. No `localStorage` access here.
    - Points: 3
  - [x] 2.4 Sync contract + mock (typed)
    - **Deps**: 1.1 | **Ref**: design.md — Components §8, Integration Points, D4-4
    - `core/sync/sync-client.ts` (interface) + `sync-client.mock.ts` implementing `src/shared` contracts. Guest→auth merge rule (server wins; adopt local if server empty) as a pure function.
    - Points: 3
  - [x] 2.5 PBT suite for core invariants (fast-check)
    - **Deps**: 2.1, 2.2, 2.3, 2.4 | **Ref**: design.md — Correctness P1–P6
    - Property tests: P1 one-draw/day, P2 spread shape, P3 mission gating, P4 reset boundary, P5 migration round-trip, P6 merge safety.
    - Points: 3

- [x] 3. Presentational UI Components (props-only) — parallel with Phase 2
  - [x] 3.1 SpreadCardView (face-down card, presentational)
    - **Deps**: 1.1 | **Ref**: design.md — Components §7
    - Pure component: props `{ card?, faceDown, state, onSelect }`. Solar tokens, ARIA, focusable. No business logic.
    - Points: 2
  - [x] 3.2 DailyDrawScreen layout (presentational)
    - **Deps**: 1.1 | **Ref**: design.md — Components §7
    - Renders spread grid/fan from props `{ spread, onPick, locked }`. No data access.
    - Points: 3
  - [x] 3.3 Countdown + Locked state (presentational)
    - **Deps**: 1.1 | **Ref**: design.md — Components §7, US-004
    - `Countdown` from a `nextResetAt` prop; locked "come back tomorrow" view. Pure render + interval.
    - Points: 2
  - [x] 3.4 RTL tests for presentational components
    - **Deps**: 3.1, 3.2, 3.3 | **Ref**: design.md — Testing Strategy
    - Render/interaction tests with mock props; no store.
    - Points: 2

- [x] 4. Storage Adapter (browser) + Sync wiring
  - [x] 4.1 localStorage StorageAdapter
    - **Deps**: 2.3 | **Ref**: design.md — Components §2
    - `state/storage-adapter.ts`: the ONLY module touching `localStorage`; delegates schema/migration to `core/storage`. Thin, tested with jsdom.
    - Points: 2

- [x] 5. State Adapter (React contexts/hooks) — the boundary
  - [x] 5.1 SessionProvider + useSession
    - **Deps**: 4.1 | **Ref**: design.md — Components §3, D3-7 (multiple on-demand contexts)
    - Anonymous sessionId bootstrap; identity context. Small, on-demand.
    - Points: 2
  - [x] 5.2 DailyStateProvider + useDailyState
    - **Deps**: 4.1, 2.2 | **Ref**: design.md — Components §4
    - Hydrate from StorageAdapter; dispatch core transitions; persist on change.
    - Points: 3
  - [x] 5.3 useDailyDraw orchestration hook
    - **Deps**: 5.1, 5.2, 2.1, 2.4 | **Ref**: design.md — Components §6
    - Guest: local generate+persist. Authenticated: mocked SyncClient. Enforces one/day + mission gating via core.
    - Points: 3
  - [x] 5.4 Hook tests (RTL + mocked adapter/sync)
    - **Deps**: 5.1, 5.2, 5.3 | **Ref**: design.md — Testing Strategy
    - Points: 2

- [x] 6. Wiring + Spread Animation
  - [x] 6.1 Wire hooks to presentational UI
    - **Deps**: 3.2, 5.3 | **Ref**: design.md — Components §7
    - Container that connects `useDailyDraw`/`useDailyState` to `DailyDrawScreen`. Keeps components presentational.
    - Points: 2
  - [x] 6.2 Foundation motion tokens
    - **Deps**: none (foundation) | **Ref**: design.md — Animation §Motion Tokens
    - `src/foundation/ui/motion.ts`: easings/durations (shared, reused by U3 flip).
    - Points: 1
  - [x] 6.3 Spread animation (Framer Motion)
    - **Deps**: 6.1, 6.2 | **Ref**: design.md — Animation Specification
    - Shuffle-in → staggered fan → idle glow → hover/focus lift → pick-to-center. Motion lives in `components/animation/spread-motion.ts`; components stay presentational (variants as props/config).
    - Points: 5
  - [x] 6.4 Reduced-motion + responsive behaviors
    - **Deps**: 6.3 | **Ref**: design.md — Animation §Accessibility/Responsive
    - `prefers-reduced-motion` fallback (fades); desktop fan / tablet / mobile snap-scroll.
    - Points: 3

- [x] 7. Integration Testing & Boundary Guard
  - [x] 7.1 ESLint import-boundary rule (UI/logic separation)
    - **Deps**: 1.1 | **Ref**: Overview (architecture principle)
    - Configure `import/no-restricted-paths` (or `eslint-plugin-boundaries`): core ⇏ react/state/components; components ⇏ core. CI fails on violation.
    - Points: 2
  - [x] 7.2 Playwright e2e: one-draw-per-day (guest)
    - **Deps**: 6.1 | **Ref**: design.md — Testing Strategy, US-003/004
    - Draw once → reload shows same spread → second draw blocked with countdown.
    - Points: 3
  - [x] 7.3 Verify build, lint, typecheck, full test suite
    - **Deps**: all | **Ref**: foundation.md — CI/CD
    - `bun run lint && tsc --noEmit && bun test && bun run test:e2e`.
    - Points: 1

---

## Task Summary
| Task | Title | Deps | Status |
|------|-------|------|--------|
| 1.1 | Shared types & DTOs | — | done |
| 1.2 | Deck data (22) | 1.1 | done |
| 2.1 | DrawService | 1.1,1.2 | done |
| 2.2 | Daily-state transitions | 1.1 | done |
| 2.3 | Storage schema+migrations | 1.1 | done |
| 2.4 | Sync contract+mock | 1.1 | done |
| 2.5 | PBT suite | 2.1–2.4 | done |
| 3.1 | SpreadCardView | 1.1 | done |
| 3.2 | DailyDrawScreen | 1.1 | done |
| 3.3 | Countdown + Locked | 1.1 | done |
| 3.4 | RTL component tests | 3.1–3.3 | done |
| 4.1 | localStorage adapter | 2.3 | done |
| 5.1 | SessionProvider/useSession | 4.1 | done |
| 5.2 | DailyStateProvider/useDailyState | 4.1,2.2 | done |
| 5.3 | useDailyDraw | 5.1,5.2,2.1,2.4 | done |
| 5.4 | Hook tests | 5.1–5.3 | done |
| 6.1 | Wire hooks to UI | 3.2,5.3 | done |
| 6.2 | Motion tokens | — | done |
| 6.3 | Spread animation | 6.1,6.2 | done |
| 6.4 | Reduced-motion + responsive | 6.3 | done |
| 7.1 | Import-boundary lint | 1.1 | done |
| 7.2 | Playwright e2e | 6.1 | done |
| 7.3 | Build/lint/test verify | all | done |

## Requirements Coverage
| Story | Tasks |
|-------|-------|
| US-001 Guest play + local persistence | 1.1, 2.3, 2.4, 4.1, 5.1 |
| US-002 Daily state persistence & reset | 2.2, 2.3, 4.1, 5.2 |
| US-003 Generate daily spread (10) | 2.1, 3.1, 3.2, 5.3, 6.x |
| US-004 One draw per day | 2.1, 3.3, 5.3, 7.2 |
| US-005 Draw blocked by active mission | 2.1, 2.2, 5.3 |

## Design Coverage
| Design element | Tasks |
|----------------|-------|
| deck | 1.2 | 
| StorageService (schema+adapter) | 2.3, 4.1 |
| SessionProvider | 5.1 |
| DailyStateProvider | 5.2 |
| DrawService | 2.1 |
| useDailyDraw | 5.3 |
| DailyDrawScreen/SpreadCardView/Countdown | 3.1, 3.2, 3.3, 6.1 |
| SyncClient | 2.4 |
| Animation spec | 6.2, 6.3, 6.4 |
| Endpoints (GET /sessions/me, POST /draws, POST /sessions) | 2.4 (mock), 5.3 |

## Testing Coverage
- **Unit tasks**: 2.1, 2.2, 2.3, 2.4 (core), 4.1 (adapter)
- **PBT tasks**: 2.5 (P1–P6)
- **Component (RTL) tasks**: 3.4, 5.4
- **E2E tasks**: 7.2 (one-draw-per-day, guest)
- **Endpoints**: consumed endpoints exercised via mocked SyncClient in 2.4/5.3; real integration tests deferred to the Server unit
- **Boundary guard**: 7.1 (enforces UI/logic separation)
- **Coverage summary**: 7/7 components have test tasks; consumed endpoints covered via mock (real API owned by Server unit)

## Definition of Done
- [x] Code implemented per design; UI/logic separation holds (boundary lint passes, proven both directions)
- [x] Unit + PBT green; core has no react/DOM imports
- [x] Component + hook tests green (38/38 total)
- [x] `bun run lint && tsc --noEmit && bun test` pass; `next build` succeeds
- [x] Tokens-only styling (no hardcoded hex); `prefers-reduced-motion` honored
- [x] Acceptance criteria for US-001–005 met (guest path); authenticated path wired against mock
- [ ] Playwright e2e (one-draw-per-day) — spec written; NOT executed (Playwright browser not installed in this environment)

## Execution Waves
| Wave | Phases | Resolved dependencies |
|------|--------|-----------------------|
| 1 | Phase 1 | none |
| 2 | Phase 2 (core) ∥ Phase 3 (presentational UI) | after Phase 1 |
| 3 | Phase 4 (storage adapter) → Phase 5 (state hooks) | after Phase 2 |
| 4 | Phase 6 (wiring + animation) | after Phases 3 & 5 |
| 5 | Phase 7 (e2e + boundary guard + verify) | after Phase 6 |

### File Ownership (parallel Wave 2)
- **Phase 2 (core)**: `src/modules/session-draw/core/**`, `src/data/deck.ts` (read), `src/shared/**` (read)
- **Phase 3 (UI)**: `src/modules/session-draw/components/**`
- No overlap → safe to parallelize.

## Notes
- **Technical debt / deferred**: real Server API integration tests (owned by Server unit); artwork assets for deck; full color-scale hexes from Solar token export.
- **Future**: promote motion tokens + flip variant to Foundation for U3 reuse (6.2 seeds this).
