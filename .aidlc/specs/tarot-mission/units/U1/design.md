# Design — Unit U1: Session & Daily Draw

## Summary
- **Architecture**: Frontend domain module inside the fullstack Next.js app; localStorage-first with optional server sync for authenticated Seekers. In-process, on-demand React contexts/hooks (no single large provider).
- **Stack**: Next.js (App Router) + TypeScript, Tailwind (Solar Design System tokens), React Context + versioned localStorage service. Guest randomness via `crypto.getRandomValues`; authenticated draws generated server-side.
- **Scope**: US-001–005. **Components**: 7. **Entities**: 3 (client state) + deck reference. **Endpoints consumed**: 3. **Integrations**: 1 (Server API). **PBT properties**: 6.

## Architecture

Pattern: **feature module** under `src/modules/session-draw`, consuming the Foundation shared kernel (storage service, UI shell, `src/shared` types) and, for authenticated Seekers, the Server (API & Auth) unit. Reset boundary is an app-wide fixed timezone (default UTC). Offline authenticated behavior is out of scope (assumes online).

```
                 ┌─────────────────────────────────────┐
                 │  DailyDrawScreen (UI, Tailwind)      │
                 │  - spread (face-down) / locked state │
                 │  - Countdown to next draw            │
                 └───────────────┬─────────────────────┘
                                 │ uses hooks
        ┌────────────────────────┼───────────────────────────┐
        ▼                        ▼                            ▼
 useSession()            useDailyState()                useDailyDraw()
 (identity ctx)          (daily state ctx)              (draw actions)
        │                        │                            │
        └──────────► StorageService (versioned localStorage) ◄┘
                                 │
                       (authenticated only)
                                 ▼
                    SyncClient → Server API /api/v1
                    (GET /sessions/me, POST /draws)
```

- **Guest**: everything runs client-side; `DrawService` builds the spread with `crypto.getRandomValues`; state persisted via `StorageService`.
- **Authenticated**: `SyncClient` fetches/creates server state; the server generates the spread authoritatively; local state mirrors it (server wins on conflict).

## Components

### 1. `deck` (data module) — `src/data/deck.ts`
- **Purpose**: Major Arcana tarot deck (22 cards).
- **Exposes**: `TAROT_DECK: TarotCard[]` (id, name, arcana=`major`, artworkRef, meaning), `getCardById(id)`.
- **Consumes**: none.

### 2. `StorageService` (Foundation) — `src/foundation/storage/`
- **Purpose**: Typed, versioned localStorage read/write for `SeekerSession` + `DailyState`.
- **Responsibilities**: schema version key; forward-migration functions on load; safe parse/serialize; namespaced keys.
- **Exposes**: `load()`, `save(state)`, `migrate(raw)`, `CURRENT_SCHEMA_VERSION`.

### 3. `SessionProvider` + `useSession()` — identity context
- **Purpose**: Anonymous session identity; `isAuthenticated`, `userId?`.
- **Responsibilities**: on first load, create anonymous `sessionId` (UUID v4) if absent; expose identity; trigger guest→auth merge on login.
- **Exposes**: `useSession()` → `{ sessionId, isAuthenticated, userId }`.

### 4. `DailyStateProvider` + `useDailyState()` — daily state context
- **Purpose**: Holds `DailyState` (drawDate, spread, activeMissionRef, lastCompletionDate, lastShareBonusDate).
- **Responsibilities**: hydrate from `StorageService`; persist on change; expose selectors.
- **Exposes**: `useDailyState()` → state + `setState` actions (scoped, on-demand).

### 5. `DrawService` (domain logic) — `src/modules/session-draw/draw-service.ts`
- **Purpose**: Pure draw logic.
- **Responsibilities**: `generateSpread()` — pick 10 distinct card IDs without replacement using `crypto.getRandomValues`; `canDraw(state, now)` — false if drawn today (fixed-tz date) or an active mission exists; `nextResetAt(now)` — next fixed-tz midnight.
- **Exposes**: `generateSpread`, `canDraw`, `nextResetAt`.

### 6. `useDailyDraw()` (hook) — draw orchestration
- **Purpose**: Bridge UI ↔ DrawService/StorageService/SyncClient.
- **Responsibilities**: guest → local generate + persist; authenticated → call Server API and mirror; enforce one-per-day + active-mission gating.

### 7. `DailyDrawScreen` + `Countdown` + `SpreadCardView` (UI)
- **Purpose**: Render the animated face-down spread when a draw is available; render locked "come back tomorrow" state with a live countdown otherwise.
- **Technology**: React + Tailwind using Solar tokens (`bg-grey-gradient` panels, `bg-brand-gradient` highlight, Poppins type scale) + **Framer Motion** for the spread choreography (see Animation Specification). Keyboard-navigable, ARIA labels on cards.
- **Consumes**: `useDailyState`, `useDailyDraw`, `useSession`, `useReducedMotion`.

### 8. `SyncClient` (authenticated only) — `src/foundation/api/`
- **Purpose**: Talk to the Server API; reconcile local ↔ server (server source of truth; adopt local once if server empty).

## Animation Specification — Card Spread

Inspiration: [arcanamana.com](https://arcanamana.com/) (Awwwards) — a sleek, mystical daily-draw feel. We match the genre's motion language (shuffle → fan → hover → pick, with an ambient glow and idle float); we do not copy the site's code. Implemented with **Framer Motion** + CSS 3D transforms; **all motion respects `prefers-reduced-motion`**.

### Phases
| Phase | Trigger | Motion | Tokens |
|-------|---------|--------|--------|
| Shuffle-in | Spread available | Deck stacked center, quick riffle offset, settle | `dur.shuffle` 600ms, `ease.out` |
| Fan / Spread | After shuffle | 10 cards arc out to a fan (desktop) / row (mobile), **staggered** entrance with slight per-card rotation along the arc | `stagger` 60ms/card, `dur.spread` 500ms, `ease.out` |
| Idle | At rest | Subtle float/breathing (translateY ±4px) + brand-gradient glow pulse | `dur.idle` 3.5s loop, `ease.inOut` |
| Hover / Focus | Pointer/keyboard focus | Card lifts (translateY −12px) + scale 1.05, teal glow intensifies, neighbors ease aside | `dur.hover` 200ms, `ease.out` |
| Pick | Card selected | Chosen card floats to center + scales up; others fade + slide out | `dur.pick` 500ms, `ease.inOut` |
| Locked | Draw used / mission active | Deck dims (opacity via `black/40` scrim), gentle pulse beside countdown | `dur.idle` loop |
| Flip reveal | (U3 owns) | 3D `rotateY` back→face | `dur.flip` 700ms — **shared token, promote to Foundation UI shell for U3 reuse** |

### Motion Tokens (proposed; promote to Foundation `src/foundation/ui/motion.ts`)
- Easings: `ease.out = cubic-bezier(0.22, 1, 0.36, 1)`, `ease.inOut = cubic-bezier(0.65, 0, 0.35, 1)`
- Durations: shuffle 600ms, spread 500ms (stagger 60ms), hover 200ms, pick 500ms, flip 700ms, idle 3.5s
- Glow: `box-shadow`/`drop-shadow` using `teal/α` and `sky/α` alpha tokens

### Responsive
- **Desktop**: full arc fan (10 cards), wider spread, larger hover lift.
- **Tablet**: reduced arc radius, tighter fan.
- **Mobile**: horizontal snap-scroll row or 2-row grid; smaller stagger; tap replaces hover.

### Accessibility & Performance
- `prefers-reduced-motion: reduce` → replace transforms with simple opacity fades; disable idle loop and riffle; keep instant state changes.
- Animate **only `transform` + `opacity`** (GPU-friendly); use `will-change` sparingly; no layout-affecting props.
- Keyboard: cards are focusable; focus triggers the same lift as hover; Enter/Space picks.
- Lazy-load card artwork; face-down backs are a shared lightweight asset.

## Data Model (client state; server mirrors)

### `SeekerSession`
| Field | Type | Constraints |
|-------|------|-------------|
| sessionId | string (UUID v4) | required |
| isAuthenticated | boolean | default false |
| userId | string \| null | set when authenticated |
| schemaVersion | number | current schema version |

### `DailyState`
| Field | Type | Constraints |
|-------|------|-------------|
| drawDate | string (ISO date, fixed-tz) | null until first draw of the day |
| spread | `SpreadCard[]` | length 10 when present |
| activeMissionRef | string \| null | mission id if a mission is active |
| lastCompletionDate | string (ISO date) \| null | |
| lastShareBonusDate | string (ISO date) \| null | |

`SpreadCard`: `{ cardId: string; picked: boolean; rejected: boolean }` (card details resolved from `deck`).

### `TarotCard` (reference — deck data)
| Field | Type |
|-------|------|
| id | string |
| name | string |
| arcana | `'major'` |
| artworkRef | string |
| meaning | string |

## API Specification (consumed by U1; owned by Server unit)
Conventions: REST/JSON under `/api/v1`; session cookie auth; standard error envelope.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/sessions/me` | session | — | `SeekerSession + DailyState` | `AUTH_001` |
| POST | `/api/v1/draws` | session | — | `{ spread: SpreadCard[] }` (server enforces one/day) | `DRAW_001` already drawn, `DRAW_002` active mission |
| POST | `/api/v1/sessions` | session | `{ localState? }` | linked/merged `SeekerSession + DailyState` | `VALIDATION_001` |

Guest mode bypasses these and uses `StorageService` with the same `src/shared` types.

## Integration Points
| System | Protocol | Purpose | Error handling |
|--------|----------|---------|----------------|
| Server (API & Auth) | REST/JSON `/api/v1` | Authenticated daily state + authoritative draw + guest→auth merge | On failure: keep localStorage state, surface toast; server authoritative on reconnect |

## Implementation
```
src/
├── data/deck.ts                       # 22 Major Arcana cards
├── foundation/
│   ├── storage/                       # StorageService (versioned + migrations)
│   └── api/sync-client.ts             # SyncClient (authenticated)
└── modules/session-draw/
    ├── context/session-context.tsx    # SessionProvider + useSession
    ├── context/daily-state-context.tsx# DailyStateProvider + useDailyState
    ├── draw-service.ts                 # pure draw logic
    ├── use-daily-draw.ts               # orchestration hook
    ├── components/DailyDrawScreen.tsx
    ├── components/SpreadCardView.tsx    # per-card motion (fan/hover/pick)
    ├── components/Countdown.tsx
    ├── animation/spread-motion.ts       # Framer Motion variants/transitions
    └── __tests__/                       # unit + PBT
```
- **Dev setup**: bun install; Next.js dev server; Poppins via `next/font/google`; Solar tokens in `globals.css` + `tailwind.config.ts`.
- **New dependency**: `framer-motion` for spread choreography. Shared motion tokens live in `src/foundation/ui/motion.ts` so U3's flip reveal reuses the same easings/durations.
- **Conventions**: follow Foundation — kebab-case files, PascalCase components, typed `Result` for expected failures, tokens-only styling (no hardcoded hex).

## Testing Strategy
- **Pyramid**: mostly unit + property-based on `DrawService` and `StorageService`; a few RTL component tests; one Playwright e2e for the one-draw-per-day flow.
- **Frameworks**: Vitest + React Testing Library; fast-check for PBT; Playwright for e2e.
- **Mocks**: freeze/inject `now` for time-dependent logic (fixed-tz boundary); mock `SyncClient`/fetch for authenticated paths; mock `crypto.getRandomValues` seeding where determinism is needed.
- **Coverage targets**: 100% of `DrawService` branches; invariants covered by PBT.
- **Run**: `bun test` (unit/PBT), `bun run test:e2e` (Playwright).

## Correctness (Property-Based Testing)
| Property | Description | Validates |
|----------|-------------|-----------|
| P1 one-draw-per-day | Repeated draw calls within the same fixed-tz day never create a second spread | US-003, US-004 |
| P2 spread shape | Every generated spread has exactly 10 distinct card IDs, all from the 22-card deck | US-003 |
| P3 mission gating | `canDraw` is false whenever `activeMissionRef` is set | US-005 |
| P4 reset boundary | A new draw becomes available exactly when the fixed-tz date advances and no active mission exists | US-002, US-004 |
| P5 migration round-trip | Any prior-version persisted shape migrates to current schema without data loss for retained fields | US-002 |
| P6 merge safety | Guest→auth merge adopts local state only when server has no active state; never overwrites server active state | US-001, US-005 |

## NFR (highlights; full NFR at feature level)
- **Responsive**: mobile/tablet/desktop; touch-friendly face-down cards; spread reflows by breakpoint.
- **Accessibility**: keyboard-selectable cards, focus states, ARIA labels, WCAG AA contrast using Solar tokens (dark theme). Full WCAG validation needs manual assistive-tech testing.
- **Performance**: instant guest draw (no network); snappy card render/flip.
- **Security/anti-abuse**: authenticated draws are server-authoritative; guest is best-effort (documented limitation). No PII persisted.

## Traceability
| Requirement | Component(s) | API | Data |
|-------------|--------------|-----|------|
| US-001 Guest play + local persistence | SessionProvider, StorageService | POST /sessions | SeekerSession |
| US-002 Daily state persistence & reset | DailyStateProvider, DrawService, StorageService | GET /sessions/me | DailyState |
| US-003 Generate daily spread (10) | DrawService, useDailyDraw, DailyDrawScreen | POST /draws | DailyState.spread, deck |
| US-004 One draw per day | DrawService.canDraw, useDailyDraw, Countdown | POST /draws | DailyState.drawDate |
| US-005 Draw blocked by active mission | DrawService.canDraw, useDailyDraw | POST /draws | DailyState.activeMissionRef |

## External References
| Source | Type | Used in |
|--------|------|---------|
| Solar Design System (`.kiro/steering/design-tokens.md`) | Design tokens | DailyDrawScreen, Countdown styling |
| foundation.md | Conventions | stack, storage, API contracts |
| [arcanamana.com](https://arcanamana.com/) (Awwwards) | Animation inspiration (style, not code) | Card Spread animation spec |
| Framer Motion | Animation library | Spread choreography, flip reveal (shared) |
