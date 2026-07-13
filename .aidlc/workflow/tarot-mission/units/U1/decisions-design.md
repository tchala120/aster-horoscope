# Design Decisions (D3) — Unit U1: Session & Daily Draw

## Context Summary
- **Unit**: U1 Session & Daily Draw (US-001–005). Anonymous guest local identity + daily state; generate a 10-card daily spread; enforce one-draw-per-day; block draws while a mission is active; day-boundary reset.
- **Stack (from Foundation, settled)**: Next.js (App Router) + TypeScript, Tailwind, React Context + versioned localStorage service, Prisma/Postgres server, username/password auth, `/api/v1` route handlers. **Not re-asked here.**
- **Persistence model**: localStorage-first for all; authenticated Seekers sync to the server (API is source of truth on conflict). Guest play preserved.
- Only U1-specific design choices are below.

---

## Decision Questions

### D3-1: Tarot Deck Scope
- 1) **Major Arcana only (22 cards)** — simpler MVP, iconic imagery, easier to source artwork **(Recommended)**
- 2) Full Rider-Waite (78 cards)
- 3) Custom Aster-themed deck
- 4) Other: _______

**Answer**: 1

---

### D3-2: Spread Randomization
The daily spread is 10 distinct cards drawn without replacement.
- 1) **Guests: `crypto.getRandomValues` client-side; Authenticated: server generates the spread authoritatively and persists it** **(Recommended)**
- 2) Always client-side random (server just stores)
- 3) Always server-side (guest requires a lightweight anonymous server draw)
- 4) Other: _______

**Answer**: 1

---

### D3-3: Daily Reset / "One per Day" Boundary
- 1) **App-wide fixed timezone** (configurable; default UTC) — same reset moment for everyone, simplest to reason about **(Recommended)**
- 2) Device-local midnight (per user's device timezone)
- 3) Rolling 24h from last draw
- 4) Other (e.g., specific business timezone like Asia/Bangkok): _______

**Answer**: 1

---

### D3-4: localStorage Schema Versioning & Migration
- 1) **Versioned schema key + migration functions** on load (forward-migrate old shapes) **(Recommended)**
- 2) Version tag, clear-and-reset on mismatch (lose old local state)
- 3) No versioning
- 4) Other: _______

**Answer**: 1

---

### D3-5: Guest → Authenticated Merge Rule (on first login)
When a guest with local state logs in and the server may already have state:
- 1) **Server is source of truth; if server has no active state, adopt the local state once (migrate)** **(Recommended)**
- 2) Always keep local, overwrite server
- 3) Most-recent-write wins (by timestamp)
- 4) Prompt the user to choose
- 5) Other: _______

**Answer**: 1

---

### D3-6: Offline Draw Behavior (authenticated but offline)
- 1) **Optimistic local draw; reconcile with server on reconnect (server authoritative on conflict)** **(Recommended)**
- 2) Block draw until online (server-authoritative always)
- 3) Other: _______

**Answer**: 3 skip for this

---

### D3-7: Context Store Structure
- 1) **Single `SeekerSession` context provider with a reducer + selector hooks** (other units read/write via these hooks) **(Recommended)**
- 2) Multiple context slices (session, draw, mission…)
- 3) Other: _______

**Answer**: 3. multiple based on their action do not wrap much context use on demand

---

### D3-8: Spread State Shape
- 1) **Store card IDs + pick/reject state; resolve full card details from the deck data module** **(Recommended)**
- 2) Store full card objects in localStorage
- 3) Other: _______

**Answer**: 1

---

### D3-9: Correctness & Property-Based Testing (mandatory)
U1 has clear invariants (≤1 spread/day, spread = 10 distinct cards, reset logic, no draw while mission active).
- 1) **Property-based tests (fast-check) for these invariants + example-based unit tests** **(Recommended)**
- 2) Example-based unit tests only
- 3) None for now

**Answer**: 1

---

## Decisions Summary
- D3-1 Deck Scope: Major Arcana only (22 cards)
- D3-2 Spread Randomization: Guests client-side `crypto.getRandomValues`; authenticated → server generates + persists
- D3-3 Daily Reset Boundary: App-wide fixed timezone (default UTC)
- D3-4 localStorage Versioning: Versioned schema key + migration functions
- D3-5 Guest→Auth Merge: Server is source of truth; adopt local once if server has no active state
- D3-6 Offline Draw: Skipped — no offline draw handling in U1 (authenticated draw assumes online)
- D3-7 Context Store Structure: Multiple small, on-demand contexts/hooks per concern (no single large provider)
- D3-8 Spread State Shape: Store card IDs + pick/reject state; resolve details from deck data
- D3-9 Correctness/PBT: Property-based tests (fast-check) for invariants + example-based unit tests

## Design System
- Follows the **Solar Design System** tokens (color, typography, alpha/opacity, gradient) provided by the user. Captured in `.kiro/steering/design-tokens.md`.

---

**Instructions**: Fill in your answers above and respond with "done"
