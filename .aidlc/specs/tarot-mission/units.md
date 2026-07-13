# Units of Work

## Summary
- **Units**: 1 infrastructure unit (Server — API & Auth) + shared Foundation + 4 frontend domain units — Server (API & Auth), Foundation, U1 Session & Daily Draw, U2 Mission Lifecycle, U3 Reveal & Reward, U4 Sharing & Share Bonus
- **Strategy**: Domain-Driven
- **Architecture**: Fullstack **Next.js (App Router)** single app — in-process frontend domain units over a shared React Context store + server Route Handlers/Server Actions + PostgreSQL (Prisma). Optional **username/password** login (guest play preserved). *(Updated in Foundation phase: fullstack Next.js, credentials auth, DB.)*
- **Story Distribution**: U1: 5, U2: 6, U3: 3, U4: 2; US-017 (auth cloud sync) un-deferred → owned by Backend API + U1
- **Key Dependencies**: U2 → U1 (Data), U3 → U2 (Event), U4 → U3 (Data) + U4 → U1 (Data); all frontend units → Foundation (Shared Kernel); all authenticated flows → Backend API
- **Development Sequence**: Phase 1 Backend API + Foundation → Phase 2 U1 → Phase 3 U2 → Phase 4 U3 → Phase 5 (post-MVP) U4

## Overview
The feature is decomposed into a shared Foundation plus 4 domain units for phased delivery within a single modular-monolith web app. The core loop (draw → mission → reveal → reward) maps to U1-U3 and forms the MVP; sharing (U4) and authenticated cloud sync (US-017) are deferred.

**Strategy**: Domain-Driven
**Rationale**: Each unit owns a cohesive slice of the daily ritual with clear data ownership. Units coordinate through a shared session-state module in the Foundation (Shared Kernel), which keeps the dependency graph linear and avoids circular dependencies even though the flow is sequential.

---

## Infrastructure Unit: Server (API & Auth) — `Source: foundation`

**Purpose**: Server layer inside the fullstack Next.js app (Route Handlers/Server Actions + Prisma/PostgreSQL). Provides auth, persistence, server-authoritative game logic, and cloud sync. Not a separate service.
**Priority**: High
**Complexity**: Medium-High
**Stories**: US-017 (auth cloud sync) + server-side aspects of US-002 (daily state/reset), US-013 (authoritative reward roll), US-015 (share bonus cap)

### Responsibilities
- Username/password auth (register/login/logout/session), password hashing (argon2/bcrypt), login rate-limiting (`AuthContext { userId, username }`)
- Persist/serve `SeekerSession` and daily state; server-authoritative one-draw-per-day + day boundary
- Mission lifecycle validation (accept/reject/complete/expire, deadlines)
- Server-side probabilistic reward roll (authoritative gain/no-gain + random type)
- Share event recording + once/day bonus cap (post-MVP)
- State sync for authenticated Seekers (US-017)

### Domain Model
**Aggregates**: mirrors the frontend aggregates persisted in Postgres (User, Seeker, DailyState, Mission, RewardOutcome, ShareEvent)
**Persistence**: Prisma ORM; single schema owned exclusively by the server layer

### Dependencies
| Depends On | Type | Description |
|------------|------|-------------|
| Foundation (src/shared) | Shared Kernel | Shared domain types + API DTOs + error envelope |

**Depended on by**: U1, U2, U3, U4 (authenticated flows call the `/api/v1` route handlers)

---

## Foundation (Shared Kernel)

**Purpose**: Shared building blocks every unit consumes. Not a domain unit — built first so units align on types, storage, and UI.
**Priority**: High
**Complexity**: Medium
**Contents**:
- **Domain types**: `SeekerSession`, `Spread`, `TarotCard`, `Mission`, `RewardOutcome`, `ShareEvent`
- **Persistence/state layer**: localStorage-backed store for the `SeekerSession` aggregate (read/write, day-boundary helpers, versioned schema so cloud sync can be added later without rework)
- **Reference data**: Mission Catalog (10 Aster features + difficulty tiers), Tarot deck data (cards + artwork refs + meanings), Aster reward-type catalog (ASTR, Discount, Physical coupon, Artwork)
- **UI shell**: responsive layout/design system, theming, shared components (card, modal, countdown)

### Context Map role
Shared Kernel — stable, shared concepts consumed by all units. Owns the `SeekerSession` state so units never depend on each other's internals for shared state.

---

## Unit 1: Session & Daily Draw

**Purpose**: Manage the Seeker's anonymous local identity + daily state, and generate/govern the once-per-day tarot spread.
**Priority**: High
**Complexity**: Medium
**Stories**: 5 — US-001, US-002, US-003, US-004, US-005

### Commands
| Command | Description | Actor |
|---------|-------------|-------|
| InitSession | Create/restore the anonymous SeekerSession in localStorage | System |
| GenerateDailySpread | Draw 10 random cards once per day; record draw as used | System |
| CheckDrawAvailability | Determine if a draw is allowed (not used today, no active mission) | System |
| LockDailyDraw | Present "come back tomorrow" locked state with countdown | System |

### Domain Model
**Aggregates**: SeekerSession (root: SeekerSession) — sessionId, lastDrawDate, currentSpread, activeMissionRef, lastCompletionDate, lastShareBonusDate
**Entities**: SeekerSession, Spread
**Value Objects**: TarotCard (id, name, artworkRef, meaning), DrawDate

### Domain Events
**Publishes**: DailySpreadGenerated — when a new spread is drawn; DailyDrawLocked — when the daily draw is used
**Subscribes**: MissionCompleted / MissionExpired from U2 — clears activeMissionRef so a new draw becomes available on the next day boundary (consumed via the shared session state, not a code dependency on U2)

### Dependencies
| Depends On | Type | Description |
|------------|------|-------------|
| Foundation | Shared Kernel | SeekerSession types, localStorage state layer, tarot deck data |

---

## Unit 2: Mission Lifecycle

**Purpose**: Assign a difficulty-tiered mission on card pick; handle accept/reject/re-pick, single-active-mission tracking, deadline/expiry, and self-attested completion.
**Priority**: High
**Complexity**: Medium-High
**Stories**: 6 — US-006, US-007, US-008, US-009, US-010, US-011

### Commands
| Command | Description | Actor |
|---------|-------------|-------|
| PickCard | Select one card from the current spread | User |
| AssignMission | Map picked card to a catalog mission with difficulty + deadline | System |
| AcceptMission | Activate the mission; start deadline timer; set as single active mission | User |
| RejectMission | Return to same spread with remaining unpicked cards | User |
| CompleteMission | Self-attested "I did it" within the time window | User |
| ExpireMission | Mark expired when deadline passes without completion | System |

### Domain Model
**Aggregates**: Mission (root: Mission) — missionId, cardRef, featureRef, difficulty, deadline, status (assigned/active/completed/expired/rejected)
**Entities**: Mission
**Value Objects**: Difficulty (Easy/Medium/Hard + timeWindow), MissionCatalogEntry, Deadline

### Domain Events
**Publishes**: MissionAssigned, MissionAccepted, MissionRejected, MissionCompleted, MissionExpired
**Subscribes**: DailySpreadGenerated from U1 — to know the available cards for picking

### Dependencies
| Depends On | Type | Description |
|------------|------|-------------|
| U1 | Data | Reads current spread; writes activeMissionRef on the shared SeekerSession |
| Foundation | Shared Kernel | Mission catalog data, Mission types, state layer |

---

## Unit 3: Reveal & Reward

**Purpose**: On mission completion, reveal the tarot result, then run the probabilistic random reward roll and display the outcome referencing Aster reward types.
**Priority**: High
**Complexity**: Medium
**Stories**: 3 — US-012, US-013, US-014

### Commands
| Command | Description | Actor |
|---------|-------------|-------|
| RevealResult | Show the picked card's artwork + meaning after completion | System |
| RollReward | Probabilistic gain/no-gain roll (difficulty-independent) | System |
| DisplayReward | Show granted reward type referencing the Aster catalog (or "no reward") | System |

### Domain Model
**Aggregates**: RewardOutcome (root: RewardOutcome) — outcomeId, missionRef, revealedCard, rewardGranted, rewardType (nullable)
**Entities**: RewardOutcome
**Value Objects**: RewardType (ASTR / Discount / PhysicalCoupon / Artwork), RewardRoll (probability), TarotResult (artwork + meaning)

### Domain Events
**Publishes**: ResultRevealed, RewardRolled
**Subscribes**: MissionCompleted from U2 — triggers the reveal + reward flow

### Dependencies
| Depends On | Type | Description |
|------------|------|-------------|
| U2 | Event | MissionCompleted triggers reveal |
| Foundation | Shared Kernel | Reward-type catalog reference, RewardOutcome types, state layer |

---

## Unit 4: Sharing & Share Bonus (post-MVP / optional)

**Purpose**: Generate a shareable, PII-free artifact of the result and grant a once-per-day share bonus.
**Priority**: Low
**Complexity**: Low
**Stories**: 2 — US-015, US-016

### Commands
| Command | Description | Actor |
|---------|-------------|-------|
| GenerateShareArtifact | Build a shareable link/image (card + meaning + attribution, no PII) | System |
| ShareResult | Share via link/image or native share sheet | User |
| GrantShareBonus | Grant a capped (once/day) share bonus reward | System |

### Domain Model
**Aggregates**: ShareEvent (root: ShareEvent) — shareId, outcomeRef, sharedAt, bonusGranted
**Entities**: ShareEvent
**Value Objects**: ShareArtifact (link/image reference, no PII)

### Domain Events
**Publishes**: ResultShared, ShareBonusGranted
**Subscribes**: ResultRevealed / RewardRolled from U3 — result becomes shareable

### Dependencies
| Depends On | Type | Description |
|------------|------|-------------|
| U3 | Data | The revealed result / reward outcome to share |
| U1 | Data | lastShareBonusDate on SeekerSession to enforce the daily cap |
| Foundation | Shared Kernel | ShareEvent types, state layer, UI components |

---

## Authenticated Cloud Sync (US-017) — now in MVP
Un-deferred in the Foundation phase (DF-R1 = Yes). Owned by the **Server (API & Auth)** unit with the frontend sync logic in **U1**. localStorage stays primary (guest + optimistic writes); for authenticated Seekers the API is the source of truth on conflict. Guest play remains available (optional username/password login).

---

## Context Map

| Upstream | Downstream | Pattern |
|----------|------------|---------|
| Foundation (src/shared) | Server (API & Auth), U1, U2, U3, U4 | Shared Kernel |
| Server (API & Auth) | U1, U2, U3, U4 | Customer/Supplier (server-authoritative API for authenticated flows) |
| U1 | U2 | Customer/Supplier (U1 supplies spread + session state) |
| U2 | U1 | Publisher/Subscriber (completion/expiry events update draw availability via shared state) |
| U2 | U3 | Publisher/Subscriber (MissionCompleted triggers reveal) |
| U3 | U4 | Customer/Supplier (result supplied to share) |
| U1 | U4 | Customer/Supplier (share-bonus cap state) |

**No circular dependencies**: frontend units coordinate through the Foundation-owned SeekerSession state (not direct imports); the Server (API & Auth) layer is an upstream supplier all frontend units consume. Graph stays acyclic (`src/shared → Server (API & Auth) → U1 → U2 → U3 → U4`).

---

## Development Sequence

### Phase 1: Foundation & Infrastructure
- [ ] Foundation (Shared Kernel) — Next.js scaffold, `src/shared` types + DTOs, localStorage state layer, reference data (catalog/deck/rewards), responsive UI shell
- [ ] Server (API & Auth) — username/password auth, Postgres schema (Prisma), session/mission/reward route handlers, server-side reward roll (parallel with Foundation once `src/shared` contracts + schema are agreed)

### Phase 2: Core (MVP)
- [ ] U1: Session & Daily Draw — player state + daily draw + guest/auth persistence and sync (US-017 FE side)
- [ ] U2: Mission Lifecycle — the interactive heart of the loop; depends on U1's spread/state
- [ ] U3: Reveal & Reward — the payoff; triggered by U2 completion

### Phase 3: Supporting (post-MVP)
- [ ] U4: Sharing & Share Bonus — optional growth feature; depends on U3's result
