# Foundation Specification — tarot-mission

## Summary
- **Team**: Small team (2-3)
- **Repository**: Single repo, single **Next.js (App Router)** fullstack app — client components, server route handlers, and shared types in one project
- **Architecture**: Fullstack Next.js. Frontend domain units (U1-U4) are in-process modules over a shared React Context store; server logic (API & Auth) runs in Next.js Route Handlers / Server Actions
- **Auth**: Optional login with **username + password** (credentials, hashed with argon2/bcrypt); guest play preserved (localStorage). Session via signed cookie (Auth.js Credentials or equivalent)
- **Error format**: Client — error boundaries + typed result + toasts; Server — standard JSON envelope `{ code, message, status, details?, requestId }`
- **Inter-unit comms**: FE units in-process (Context store); client ↔ server via Route Handlers / Server Actions (`/api/v1`)
- **Database**: PostgreSQL (Prisma), single schema owned by the server layer
- **Shared types**: `src/shared/` used by both client and server
- **Frontend**: React (Next.js) + TypeScript + Tailwind; localStorage-first with server sync for authenticated users
- **Infrastructure units**: Server (API & Auth) — combined server layer inside the Next.js app

## Repository Structure

**Strategy**: Single repo, single Next.js app. Rationale: fullstack Next.js collapses UI + API into one deployable; a small team ships faster with one project, one build, one host (Vercel). Shared types live in `src/shared/` and are imported by both client and server code.

```
aster-horoscope/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (game)/                 # game pages (draw, mission, reveal)
│   │   ├── (auth)/                 # login / register pages
│   │   ├── api/                    # Route Handlers (REST-style /api/v1)
│   │   │   └── v1/
│   │   │       ├── auth/           # register, login, logout, session
│   │   │       ├── sessions/       # seeker daily state
│   │   │       ├── draws/          # daily spread
│   │   │       ├── missions/       # pick/accept/reject/complete
│   │   │       ├── rewards/        # authoritative reward roll
│   │   │       └── shares/         # share + bonus (post-MVP)
│   │   ├── layout.tsx
│   │   └── globals.css             # Tailwind
│   ├── foundation/                 # FE shared kernel
│   │   ├── ui/                     # shared components (Card, Modal, Countdown, Toast)
│   │   ├── storage/                # typed, versioned localStorage service (+ sync adapter)
│   │   ├── state/                  # React Context store + hooks/reducers
│   │   └── api/                    # client fetch wrapper, auth-aware
│   ├── modules/                    # frontend domain units
│   │   ├── session-draw/           # U1
│   │   ├── mission/                # U2
│   │   ├── reveal-reward/          # U3
│   │   └── sharing/                # U4 (post-MVP)
│   ├── server/                     # server-side domain logic (called by route handlers)
│   │   ├── auth/                   # credentials auth, password hashing, session
│   │   ├── sessions/               # daily state persistence + day-boundary logic
│   │   ├── missions/               # lifecycle validation
│   │   ├── rewards/                # authoritative reward roll
│   │   ├── sharing/                # share/bonus (post-MVP)
│   │   └── db/                     # Prisma client
│   ├── shared/                     # types, API DTOs, error envelope, constants
│   └── data/                       # tarot deck, mission catalog, reward catalog
├── prisma/                         # schema.prisma + migrations
├── .github/workflows/              # CI/CD (GitHub Actions)
├── next.config.ts
├── package.json                    # bun
└── tailwind.config.ts
```

**Ownership** (small team): `src/shared/` and `prisma/schema.prisma` changes require PR review (contracts are the source of truth). Module/route code owned by whoever picks up the unit.

## Auth
- **Approach**: Optional login with **username + password**. Guests play without login using localStorage; registering/logging in links state to an account and enables cross-device sync (US-017).
- **Implementation**: Credentials-based (Auth.js Credentials provider or equivalent) with a signed, httpOnly session cookie.
- **Password storage**: hashed with **argon2id (preferred) or bcrypt**; never stored or logged in plaintext. Enforce minimum length + basic strength; rate-limit login attempts.
- **Authorization model**: Simple — a Seeker acts only on their own data. No roles for MVP.
- **Enforcement point**: Server route handlers validate the session cookie per request. Guest requests are unauthenticated and operate on client-only state.
- **Shared contract**: `AuthContext { userId: string; username: string }` (from a validated session).

## Error Handling
- **Client**: React error boundaries at app + module level; user-facing errors via toasts; typed `Result<T, AppError>` for expected failures (draw locked, mission expired, invalid credentials).
- **Server**: Standard JSON envelope for all route-handler errors:
  ```json
  { "code": "MISSION_002", "message": "Mission already expired", "status": 409, "requestId": "...", "details": {} }
  ```
- **Code convention**: `[DOMAIN]_[NUMBER]` — e.g., `AUTH_001`, `SESSION_001`, `MISSION_002`, `REWARD_001`, `SHARE_001`.
- **Shared codes**: `VALIDATION_001` (400), `AUTH_001` (401), `AUTH_002` (403), `NOT_FOUND` (404), `INTERNAL` (500).

## Inter-Unit Communication
- **Frontend ↔ Frontend units**: in-process — modules read/write the shared `SeekerSession` via the Context store; cross-unit effects (e.g., MissionCompleted → reveal) flow through store state, not direct imports (acyclic graph preserved).
- **Client ↔ Server**: Next.js Route Handlers under `/api/v1` (REST/JSON), plus Server Actions where a form-style mutation is cleaner. Session cookie carries auth.
- **Timeout/retry**: 10s client request timeout; retry idempotent GETs up to 2x with backoff; daily-state mutations are server-idempotent (not blindly retried).
- **Sync model**: localStorage written first (optimistic); for authenticated Seekers a background sync calls the API, which is the source of truth on conflict.

## Database Strategy
- **Approach**: PostgreSQL, single database + single schema, owned exclusively by the server layer (`src/server`). Client code never touches the DB directly.
- **Access**: Prisma ORM.
- **Schema convention**: snake_case tables, UUID `id` primary keys, `created_at`/`updated_at` timestamptz.
- **Core tables (sketch)**: `user` (username unique, password_hash), `seeker` (user_id nullable for guest-linked), `daily_state` (seeker_id, draw_date, spread_json, active_mission_id, last_completion_date, last_share_bonus_date), `mission` (seeker_id, card_ref, feature_ref, difficulty, deadline, status), `reward_outcome` (mission_id, granted, reward_type), `share_event` (outcome_id, shared_at, bonus_granted).

## Shared Types
- **Strategy**: `src/shared/` TypeScript module imported by both client components and server route handlers. Single source of truth for domain types, API DTOs, and the error envelope.
- **Rule**: contract changes go through `src/shared/` first, then client + server adapt.

## Code Conventions
- **Language**: TypeScript (strict). Node 20+ runtime (Next.js server).
- **Framework**: Next.js App Router.
- **Package manager**: bun.
- **Naming**: `camelCase` variables/functions, `PascalCase` types/components, `SCREAMING_SNAKE` constants; files `kebab-case.ts`, React components `PascalCase.tsx`.
- **Testing**: Vitest + React Testing Library (components/units), Vitest for server handlers, Playwright for key e2e flows.
- **Linting/formatting**: ESLint (next + typescript-eslint) + Prettier.
- **Data**: UUID v4 IDs; ISO-8601 UTC timestamps; daily boundaries computed server-side for authenticated Seekers.
- **Versioning**: API versioned by URL (`/api/v1`); `src/shared/` breaking changes documented in PRs.

## Integration Contracts (sketches — finalized in unit design)

All routes are Next.js Route Handlers under `/api/v1`. Guest mode runs the same flows client-only against localStorage using the identical `src/shared/` types; the API client is bypassed until login.

**Auth**
- `POST /api/v1/auth/register` `{ username, password }` → session cookie
- `POST /api/v1/auth/login` `{ username, password }` → session cookie
- `POST /api/v1/auth/logout` → clears session
- `GET /api/v1/auth/session` → `AuthContext | null`

**U1 Session & Draw**
- `GET /api/v1/sessions/me` → current daily state (creates/links on first authenticated call)
- `POST /api/v1/draws` → generate today's spread (server enforces one/day) → `Spread`

**U2 Mission**
- `POST /api/v1/missions/pick` `{ cardId }` → `Mission`
- `POST /api/v1/missions/{id}/accept` → active mission + deadline
- `POST /api/v1/missions/{id}/reject` → remaining spread
- `POST /api/v1/missions/{id}/complete` → validates deadline → triggers reveal

**U3 Reveal & Reward**
- `POST /api/v1/missions/{id}/reveal` → `{ tarotResult }`
- `POST /api/v1/rewards/roll` `{ missionId }` → `RewardOutcome` (authoritative server-side roll)

**U4 Sharing** (post-MVP)
- `POST /api/v1/shares` `{ outcomeId }` → `ShareEvent` (+ once/day bonus cap, server-enforced)

## Infrastructure Units

### Server (API & Auth) — `Source: foundation`
- **Type**: infrastructure (lives inside the Next.js app, not a separate service)
- **Priority**: High
- **Purpose**: The server layer of the fullstack Next.js app — route handlers + server domain logic + persistence.
- **Responsibilities**:
  - Username/password auth (register/login/logout/session), password hashing, login rate-limiting
  - Persist and serve `SeekerSession` / daily state; server-authoritative one-draw-per-day + day boundary
  - Mission lifecycle validation (accept/reject/complete/expire, deadlines)
  - **Server-side reward roll** (authoritative gain/no-gain + random type) and outcome persistence
  - Share event recording + once/day bonus cap (post-MVP)
  - State sync for authenticated Seekers (US-017)
- **Depended on by**: U1, U2, U3, U4 (authenticated flows)

## Logging & Observability
- **Server**: structured JSON logs; `x-request-id` correlation echoed in error envelopes; levels error/warn/info/debug.
- **Client**: console + optional error-reporting hook; user-facing errors via toasts.

## CI/CD
- **Branch strategy**: GitHub Flow — feature branches, PR review, merge to `main`.
- **Pipeline tool**: GitHub Actions.

| Stage | Trigger | Actions |
|-------|---------|---------|
| Lint & Typecheck | PR | eslint, tsc --noEmit |
| Test | PR | Vitest (components + server handlers), Playwright smoke |
| Build | PR / merge | next build |
| Deploy | merge to main | Vercel deploy (UI + serverless API); run Prisma migrations |

| Environment | Trigger | URL pattern |
|-------------|---------|-------------|
| Preview | PR | per-PR Vercel preview |
| Production | merge to main | app domain |

- **Deployment strategy**: Vercel managed rollouts; run DB migrations before promoting; rollback by redeploying the previous build.

---

## Team Assignments

| Unit | Owner | Priority | Sequence |
|------|-------|----------|----------|
| Server (API & Auth) | Dev A | High | 1st (with Foundation scaffold) |
| Foundation (UI shell/state/storage) | Dev B | High | 1st (parallel once shared/ contracts agreed) |
| U1 Session & Daily Draw | Dev B | High | 2nd |
| U2 Mission Lifecycle | Dev A/B | High | 3rd |
| U3 Reveal & Reward | Dev A/B | High | 4th |
| U4 Sharing | — | Low | post-MVP |

**Parallel work**: the Server layer and the frontend Foundation can proceed in parallel once `src/shared/` contracts + `prisma/schema.prisma` are agreed. Domain units follow in dependency order.

## Repository Ownership Rules
- `src/shared/` and `prisma/schema.prisma` — PR review required; contracts are source of truth.
- `src/modules/*` and `src/server/*` unit code — owned by the assigned developer.
- CI/CD and infra config — shared ownership, PR review.

## Sync Schedule (small team)
- Weekly integration check.
- PR-based review for any `src/shared/` or schema contract change.

## Risks
- **Contract drift** between client and server → single `src/shared/` module as source of truth.
- **Credentials auth security** → argon2/bcrypt hashing, login rate-limiting, no plaintext logging, secure httpOnly session cookie.
- **Scope creep from fullstack** → keep MVP surface to the routes sketched above.
- **Guest ↔ authenticated state migration** → define the merge/reconcile rule during U1/Server design.
