# Tasks — Foundation (Shared Kernel)

## Summary
- **Total tasks**: 19 across 7 phases
- **Execution waves**: 5 (one parallel wave)
- **Design source**: `foundation.md` (Foundation phase) + DF decisions
- **Scope**: Next.js project scaffold, shared contracts, Solar design tokens, UI shell, storage/state foundation, reference data, tooling & CI. **Excludes** Prisma schema, auth, and `/api/v1` route handlers (owned by the **Server (API & Auth)** unit).
- **Estimates**: Fibonacci story points (1/2/3/5/8)
- **Principle**: establishes the **UI/business-logic separation** boundary (`core/` vs `state/` vs `components/`) and the ESLint rule that enforces it for all units.

## Overview
The Foundation is the shared kernel every unit imports. It is built first so U1-U4 and the Server unit align on types, tokens, storage, and UI. Checkbox legend: `- [ ] N. Phase` / `  - [x] N.M Task`.

---

## Task Phases

- [x] 1. Project Scaffold & Tooling
  - [x] 1.1 Initialize Next.js (App Router) + TypeScript with bun
    - **Deps**: none | **Ref**: foundation.md — Repository Structure, Code Conventions
    - `bun create next-app` (App Router, TS, strict `tsconfig`), base `next.config.ts`, folder skeleton (`src/app`, `src/shared`, `src/foundation`, `src/modules`, `src/data`, `src/server`).
    - Points: 3
  - [x] 1.2 ESLint + Prettier + import-boundary rule
    - **Deps**: 1.1 | **Ref**: foundation.md — Code Conventions; U1 separation constraint
    - Configure ESLint (next + typescript-eslint) + Prettier. Add `import/no-restricted-paths` (or `eslint-plugin-boundaries`): `core` ⇏ react/next/`state`/`components`; `components` ⇏ `core`. This rule is shared by all units.
    - Points: 3
  - [x] 1.3 Test tooling (Vitest + RTL + Playwright + fast-check)
    - **Deps**: 1.1 | **Ref**: foundation.md — Code Conventions; testing
    - Vitest config (jsdom), RTL setup, Playwright config, fast-check install; test scripts in `package.json`.
    - Points: 3

- [x] 2. Design Tokens & Theming (Solar)
  - [x] 2.1 Tailwind + Solar token theme
    - **Deps**: 1.1 | **Ref**: `.kiro/steering/design-tokens.md`
    - Tailwind setup; `tailwind.config.ts` `theme.extend`: color families (grey, aster-teal, aster-sky, aster-purple, aster-orange, green, blue, yellow, red — 50→950), opacity scale, gradients (`brand-gradient`, `grey-gradient`), fontFamily Poppins, fontSize scale (display/heading/text). Brand anchors `aster-teal-500 #33CCAD`, `aster-sky-500 #33A1CC`.
    - Points: 3
  - [x] 2.2 CSS variables + Poppins font
    - **Deps**: 2.1 | **Ref**: design-tokens.md — Implementation Guidance
    - `globals.css` CSS custom properties mirroring tokens; dark-theme base; load Poppins via `next/font/google`.
    - Points: 2
    - Note: full per-shade hexes to be filled from the Solar token export; keep token names stable.

- [x] 3. Shared Contracts (`src/shared`)
  - [x] 3.1 Domain types
    - **Deps**: 1.1 | **Ref**: foundation.md — Shared Types; units.md
    - `SeekerSession`, `DailyState`, `SpreadCard`, `TarotCard`, `Mission`, `RewardOutcome`, `ShareEvent`, `AuthContext`.
    - Points: 3
  - [x] 3.2 API DTOs + error envelope
    - **Deps**: 3.1 | **Ref**: foundation.md — Error Handling, Integration Contracts
    - Request/response DTOs for `/api/v1`; `AppError` envelope `{ code, message, status, details?, requestId }`; shared code constants (`VALIDATION_001`, `AUTH_001`, …).
    - Points: 2
  - [x] 3.3 Shared constants
    - **Deps**: 3.1 | **Ref**: requirements.md; product.md
    - Difficulty time windows (Easy/Medium/Hard), reward types (ASTR/Discount/Physical coupon/Artwork), mission-catalog IDs, app timezone config.
    - Points: 2

- [x] 4. Foundation UI Shell (presentational)
  - [x] 4.1 App layout + theme provider
    - **Deps**: 2.2 | **Ref**: foundation.md — Repository Structure
    - Root layout, dark theme, responsive container, Poppins applied.
    - Points: 2
  - [x] 4.2 Shared components (Card shell, Modal, Countdown, Toast)
    - **Deps**: 4.1 | **Ref**: foundation.md — Summary; design-tokens.md
    - Presentational, token-styled, accessible (ARIA, focus). No business logic.
    - Points: 5
  - [x] 4.3 Error boundary + toast/notification system + `Result` type
    - **Deps**: 4.1, 3.2 | **Ref**: foundation.md — Error Handling
    - React error boundary; toast provider/hook; typed `Result<T, AppError>` helper.
    - Points: 3
  - [x] 4.4 Motion tokens
    - **Deps**: 1.1 | **Ref**: U1 design.md — Animation §Motion Tokens
    - `src/foundation/ui/motion.ts`: easings/durations (shared; reused by U1 spread + U3 flip). Install `framer-motion`.
    - Points: 2

- [x] 5. Storage / State / API-Client Foundation
  - [x] 5.1 Storage service interface + versioned schema base
    - **Deps**: 3.1 | **Ref**: foundation.md — Shared Types; U1 design §StorageService
    - Generic `StorageService` interface, `CURRENT_SCHEMA_VERSION`, migration-runner scaffold (pure, in `core/` layout). Unit-specific migrations added by consuming units.
    - Points: 3
  - [x] 5.2 Auth-aware API client wrapper
    - **Deps**: 3.2 | **Ref**: foundation.md — Inter-Unit Communication
    - `src/foundation/api/`: typed fetch wrapper (base `/api/v1`, session cookie, timeout/retry for GET, error-envelope parsing). No endpoint-specific logic.
    - Points: 3

- [x] 6. Reference Data & Config
  - [x] 6.1 Reference-data module structure + catalogs
    - **Deps**: 3.3 | **Ref**: foundation.md — Repository Structure; requirements.md — Mission Catalog
    - `src/data/`: mission catalog (10 Aster features + difficulty), reward catalog. **Deck data (22 cards) is authored in U1 (task 1.2)** — Foundation only sets the module location + shared shapes.
    - Points: 2
  - [x] 6.2 Environment config
    - **Deps**: 1.1 | **Ref**: foundation.md — CI/CD
    - `.env.example`, typed env access, app-timezone default (UTC).
    - Points: 1

- [x] 7. CI/CD & Verification
  - [x] 7.1 GitHub Actions pipeline
    - **Deps**: 1.2, 1.3 | **Ref**: foundation.md — CI/CD
    - Workflow: install → lint → typecheck → test → build. PR triggers.
    - Points: 2
  - [x] 7.2 Verify scaffold builds & boundary rule works
    - **Deps**: all | **Ref**: foundation.md — CI/CD
    - `bun install && bun run lint && tsc --noEmit && bun run build`; add a deliberate boundary violation in a scratch test to confirm the lint rule fails, then remove.
    - Points: 2

---

## Task Summary
| Task | Title | Deps | Status |
|------|-------|------|--------|
| 1.1 | Next.js scaffold | — | done |
| 1.2 | ESLint/Prettier + boundary rule | 1.1 | done |
| 1.3 | Test tooling | 1.1 | done |
| 2.1 | Tailwind + Solar tokens | 1.1 | done |
| 2.2 | CSS vars + Poppins | 2.1 | done |
| 3.1 | Domain types | 1.1 | done |
| 3.2 | API DTOs + error envelope | 3.1 | done |
| 3.3 | Shared constants | 3.1 | done |
| 4.1 | App layout + theme | 2.2 | done |
| 4.2 | Shared components | 4.1 | done |
| 4.3 | Error boundary + toasts + Result | 4.1,3.2 | done |
| 4.4 | Motion tokens | 1.1 | done |
| 5.1 | Storage interface + schema base | 3.1 | done |
| 5.2 | API client wrapper | 3.2 | done |
| 6.1 | Reference-data + catalogs | 3.3 | done |
| 6.2 | Env config | 1.1 | done |
| 7.1 | CI/CD pipeline | 1.2,1.3 | done |
| 7.2 | Verify build + boundary | all | done |

## Design Coverage (foundation.md)
| Foundation element | Tasks |
|--------------------|-------|
| Repository structure / scaffold | 1.1 |
| Code conventions / tooling / boundary | 1.2, 1.3 |
| Solar design tokens | 2.1, 2.2 |
| Shared types / DTOs / error envelope | 3.1, 3.2, 3.3 |
| UI shell + components | 4.1, 4.2, 4.3 |
| Motion tokens (shared) | 4.4 |
| Storage layer + API client | 5.1, 5.2 |
| Reference data | 6.1 |
| Env / config | 6.2 |
| CI/CD | 7.1, 7.2 |

## Testing Coverage
- **Unit**: 4.3 (Result/toast), 5.1 (schema/migration base), 5.2 (API client) have unit tests.
- **Component (RTL)**: 4.2 shared components.
- **Boundary guard**: 1.2 sets the rule; 7.2 verifies it fails on violation.
- **Note**: Foundation is mostly scaffolding; deep business-logic tests live in the consuming units.

## Definition of Done
- [x] Project builds (`bun run build`), lints, typechecks
- [x] Solar tokens available as Tailwind classes + CSS vars; Poppins loaded
- [x] `src/shared` contracts compile and are importable by client + server
- [x] UI shell components render with tokens; accessible
- [x] Import-boundary lint rule active and proven to fail on violation
- [ ] CI pipeline green on a test PR (workflow added; not yet run on a real PR)

## Execution Waves
| Wave | Phases | Resolved dependencies |
|------|--------|-----------------------|
| 1 | Phase 1 (scaffold & tooling) | none |
| 2 | Phase 2 (tokens) ∥ Phase 3 (shared contracts) | after Phase 1 |
| 3 | Phase 4 (UI shell) ∥ Phase 5 (storage/API) | after Phases 2 & 3 |
| 4 | Phase 6 (reference data & config) | after Phase 3 |
| 5 | Phase 7 (CI/CD & verify) | after all |

### File Ownership (parallel waves)
- **Wave 2** — Phase 2: `tailwind.config.ts`, `src/app/globals.css`, font setup; Phase 3: `src/shared/**`. No overlap.
- **Wave 3** — Phase 4: `src/foundation/ui/**`, `src/app/layout.tsx`; Phase 5: `src/foundation/storage/**`, `src/foundation/api/**`. No overlap.

## Notes
- **Excluded (Server unit)**: `prisma/schema.prisma`, auth (register/login/session, password hashing), `/api/v1` route handlers, server-side reward roll.
- **Deferred**: full Solar color-scale hexes (from token export); deck artwork assets.
- After Foundation is implemented, unpark **U1** and proceed to its implementation.
