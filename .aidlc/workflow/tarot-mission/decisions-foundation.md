# Foundation Decisions (DF)

## Context Summary
- **Product**: Daily tarot-mission responsive web app (guest/localStorage-first MVP). Core loop: draw → pick → mission → reveal → probabilistic reward. Sharing + auth cloud sync deferred.
- **Architecture (D2)**: Modular Monolith, Domain-Driven, in-process module calls over a shared state layer. Foundation (Shared Kernel) + U1-U4.
- **Team**: Small (2-3). Greenfield. No backend required for MVP (localStorage only); backend/API is a deferred concern (US-017).
- **Note**: These decisions set the shared stack + conventions. The design phase (D3) will refine per-unit architecture within these choices.

Some classic foundation questions (API gateway, BFF, event broker, inter-service DB) are **N/A** here because there's a single client app with in-process modules and no backend in the MVP. They're omitted.

---

## Decision Questions

### DF-1: Primary Language
- 1) **TypeScript** — type safety across the shared kernel and units **(Recommended)**
- 2) JavaScript
- 3) Other: _______

**Answer**: 1

---

### DF-2: Frontend Framework
- 1) **React** — largest ecosystem, strong tooling **(Recommended)**
- 2) Vue
- 3) Svelte / SvelteKit
- 4) SolidJS
- 5) Other: _______

**Answer**: 1

---

### DF-3: Build Tool / App Type
- 1) **Vite + React SPA** — simplest fit for a client-only, localStorage-first MVP **(Recommended)**
- 2) Next.js — if you want SSR/routing/an API layer ready for the deferred cloud sync
- 3) Remix
- 4) Astro
- 5) Other: _______

**Answer**: 2 (Next.js — fullstack, App Router; supersedes the earlier Vite SPA + separate NestJS backend)

---

### DF-4: Styling / UI System
- 1) **Tailwind CSS** — fast responsive styling; pair with a small custom component set **(Recommended)**
- 2) CSS Modules
- 3) styled-components / CSS-in-JS
- 4) Component library (MUI / Chakra / Mantine)
- 5) Other: _______

**Answer**: 1

---

### DF-5: State Management & Persistence Layer
- 1) **Zustand + persist middleware** (localStorage) behind a typed storage service with a versioned schema **(Recommended)**
- 2) React Context + hooks + custom localStorage wrapper
- 3) Redux Toolkit (+ redux-persist)
- 4) Other: _______

**Answer**: 4. prefer react context over zustand based on their usecase

---

### DF-6: Package Manager
- 1) **pnpm** — fast, efficient **(Recommended)**
- 2) npm
- 3) yarn
- 4) bun

**Answer**: 4

---

### DF-7: Repository Strategy
- 1) **Single repo, single app** with internal module folders (fits modular monolith) **(Recommended)**
- 2) Monorepo with packages (e.g., separate `foundation` package)
- 3) Multi-repo

**Answer**: 1

---

### DF-8: Shared Foundations Level
- 1) **Everything shared** — shared types, state layer, reference data, UI shell in one foundation module all units import **(Recommended)**
- 2) Interfaces only — share contracts, units own implementations
- 3) Minimal — duplicate as needed

**Answer**: 1

---

### DF-9: Shared Types Strategy
- 1) **Shared module/folder** imported by all units (single repo) **(Recommended)**
- 2) Separate shared package (if monorepo)
- 3) Code generation
- 4) Manual sync

**Answer**: 1

---

### DF-10: Inter-Unit Communication
- 1) **In-process** — direct module/function calls over the shared Zustand store (from D2) **(Recommended)**
- 2) In-app event emitter (pub/sub) for looser coupling
- 3) Mixed

**Answer**: 1

---

### DF-11: Error Handling & UX Convention
- 1) **React error boundaries + a typed result/notification pattern** (toasts for user-facing errors) **(Recommended)**
- 2) Framework default only
- 3) Custom global error handler
- 4) Other: _______

**Answer**: 1

---

### DF-12: Authentication (MVP)
- 1) **None / guest only for MVP** — auth + cloud sync deferred (US-017); storage layer designed to allow a future API adapter **(Recommended)**
- 2) Add basic auth now anyway
- 3) Other: _______

**Answer**: 2 for mvp

---

### DF-13: Backend / Persistence Direction (for the deferred sync)
- 1) **No backend in MVP**; keep localStorage the source of truth and design a storage interface so an API adapter can be added later **(Recommended)**
- 2) Stand up a minimal backend + DB now
- 3) Other: _______

**Answer**: 2

---

### DF-14: Testing Stack
- 1) **Vitest + React Testing Library** (unit/component); Playwright for a few end-to-end flows **(Recommended)**
- 2) Jest + RTL
- 3) Vitest only (no e2e for MVP)
- 4) Other: _______

**Answer**: 1

---

### DF-15: Hosting / Deployment
- 1) **Static hosting** (Vercel / Netlify) — simple for a client SPA **(Recommended)**
- 2) Static files on S3 + CloudFront
- 3) GitHub Pages
- 4) Other: _______

**Answer**: (superseded) Next.js on Vercel — single deployment (SSR + serverless API), not a static-only host

---

### DF-16: CI/CD & Branch Strategy
- 1) **GitHub Actions + GitHub Flow** (feature branches + PR, deploy on merge) **(Recommended)**
- 2) Trunk-based development
- 3) Other / none for now: _______

**Answer**: 1

---

### DF-17: Infrastructure Units
- 1) **None** — static SPA, no gateway/BFF/event-bus/auth-service needed for MVP **(Recommended)**
- 2) Add specific infra unit(s): _______

**Answer**: 1

---

## ⚠️ Reconciliation Gate (DF-12/DF-13 reverse the earlier "defer auth" decision)

You changed DF-12 and DF-13 to add **authentication + backend + database in the MVP**. This un-defers US-017 and makes the app full-stack. If that's intended, answer the questions below so the foundation is consistent. If it was a misclick and you want to keep the guest/localStorage-only MVP, set DF-R1 = "No".

### DF-R1: Confirm the scope change
- 1) **Yes** — add auth + backend + DB to the MVP (un-defer US-017; app becomes full-stack)
- 2) No — keep MVP guest/localStorage-only; revert DF-12 to (1) and DF-13 to (1); auth/backend stay deferred **(matches approved requirements)**

**Answer**: 1 (Yes — full-stack MVP, un-defer US-017)

---

### DF-R2: Authentication mechanism (only if DF-R1 = Yes)
- 1) **Integrate Aster platform identity (SSO / OAuth2)** — reuse existing accounts **(Recommended, since Aster already exists)**
- 2) Standalone email + password
- 3) Magic link / passwordless
- 4) Other: _______

**Answer**: 2 (Username + password, credentials-based; passwords hashed with argon2/bcrypt)

---

### DF-R3: Guest access (only if DF-R1 = Yes)
- 1) **Optional login** — still play as guest (localStorage); sign in to sync across devices (preserves US-001) **(Recommended)**
- 2) Login required — no guest play

**Answer**: 1 (Optional login — guest play preserved, sign in to sync)

---

### DF-R4: Backend stack (only if DF-R1 = Yes)
- 1) **Node.js + TypeScript** (Fastify or NestJS) — shares language with the frontend **(Recommended)**
- 2) Python (FastAPI)
- 3) Other: _______

**Answer**: 3 (Next.js fullstack — server via Route Handlers / Server Actions; no separate backend service)

---

### DF-R5: Database (only if DF-R1 = Yes)
- 1) **PostgreSQL** — reliable relational store for sessions/missions/rewards **(Recommended)**
- 2) MySQL
- 3) MongoDB
- 4) Managed BaaS (Supabase / Firebase) — bundles DB + auth
- 5) Other: _______

**Answer**: 1 (PostgreSQL)

---

### DF-R6: Backend hosting (only if DF-R1 = Yes)
- 1) **Managed app host (Render / Railway / Fly.io)** — simple for a small team **(Recommended)**
- 2) AWS (ECS/Lambda + RDS)
- 3) Vercel serverless functions
- 4) Managed BaaS (if DF-R5 = 4)
- 5) Other: _______

**Answer**: 3 (Vercel — single Next.js deployment; serverless functions host the API)

---

### DF-R7: Infrastructure units (supersedes DF-17 if DF-R1 = Yes)
- 1) **One combined Backend API unit** (handles API + auth + persistence) **(Recommended for small team)**
- 2) Separate Backend API unit + Auth service
- 3) Other: _______

**Answer**: 1 (One combined Backend API unit)

---

## Decisions Summary
- DF-1 Language: TypeScript (frontend + backend)
- DF-2 Framework: React (via Next.js)
- DF-3 Build Tool / App Type: **Next.js (App Router) — fullstack single app**
- DF-4 Styling: Tailwind CSS + small custom component set
- DF-5 State & Persistence: **REVISED — localStorage removed.** Server-authoritative persistence via `/api/v1` behind a repository interface (in-memory now, Prisma/Postgres later). Client fetches via the foundation API client.
- DF-6 Package Manager: bun
- DF-7 Repo Strategy: Single repo, single Next.js app (client + server + shared in one project)
- DF-8 Shared Foundations Level: Everything shared (Comprehensive)
- DF-9 Shared Types: Shared `src/shared/` module used by both client and server code
- DF-10 Inter-Unit Comms: Frontend units in-process over shared Context store; client↔server via Next.js Route Handlers / Server Actions (REST-style `/api/v1`)
- DF-11 Error Handling: React error boundaries + typed result/notification (toasts) on client; standard JSON error envelope from server
- DF-12 Auth (MVP): Yes — optional login with **username + password (credentials, hashed)**; guest play preserved [DF-R1/R2/R3]
- DF-13 Backend Direction: Server lives inside the Next.js app + Postgres now [DF-R1]
- DF-14 Testing: Vitest + React Testing Library (component/unit), Playwright (e2e); server route/handler tests with Vitest
- DF-15 Hosting: **Next.js on Vercel — single deployment (SSR + serverless API)**
- DF-16 CI/CD & Branch: GitHub Actions + GitHub Flow
- DF-17 Infra Units: One combined **Server (API & Auth) unit** within the Next.js app [DF-R7]
- DF-R1 Scope change: Yes — full-stack MVP, un-defer US-017
- DF-R2 Auth mechanism: **Username + password (credentials-based; argon2/bcrypt hashing)**
- DF-R3 Guest access: **REVISED — login required (no guest play).** localStorage removed; server-side persistence only.
- DF-R4 Backend stack: **Next.js fullstack (Route Handlers / Server Actions) — no separate backend service**
- DF-R5 Database: PostgreSQL (Prisma)
- DF-R6 Backend hosting: **Vercel (single Next.js deployment)**
- DF-R7 Infra units: One combined Server (API & Auth) unit inside the Next.js app

---

**Instructions**: Fill in your answers above and respond with "done"
