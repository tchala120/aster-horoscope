---
inclusion: always
---

# Tech

## Summary
- **Stack**: Pending D3 decisions (production-ready responsive web app).
- **Architecture**: Pending D2/D3 decisions.
- **Infra**: Pending D3 decisions.

## Stack
- **Languages**: TypeScript (strict), one codebase (client + server)
- **Framework**: Next.js (App Router) — fullstack
- **Build System**: Next.js / Turbopack
- **Package Manager**: bun
- **Styling**: Tailwind CSS
- **State**: Server-authoritative — all game state persists server-side and is served via the API. Client fetches via the foundation API client (no localStorage).
- **Animation**: Framer Motion (+ CSS 3D transforms); shared motion tokens in `src/foundation/ui/motion.ts`; honor `prefers-reduced-motion`
- **ORM/DB**: Prisma + PostgreSQL
- **Testing**: Vitest + React Testing Library (components + server handlers), Playwright (e2e)

## Architecture
- **Pattern**: Fullstack Next.js single app — in-process frontend domain units over a shared Context store + server Route Handlers / Server Actions + PostgreSQL
- **API Style**: REST/JSON route handlers, versioned at `/api/v1`
- **Auth**: **Login required** — username + password (hashed; Node `scrypt` in the current build, argon2/bcrypt option later); httpOnly cookie session. No anonymous guest play.

## Infrastructure
- **Hosting**: Vercel — single Next.js deployment (SSR + serverless API)
- **Database**: PostgreSQL (single schema, owned by the server layer; Prisma ORM)
- **CI/CD**: GitHub Actions + GitHub Flow
- **IaC Tool**: None for MVP (managed hosting)

## Shared Conventions (from Foundation phase)
- **Repo**: single repo, single Next.js app; `src/shared/` holds types + API DTOs + error envelope; `prisma/schema.prisma` for the schema
- **Shared types**: single `src/shared/` module used by client + server; contract is source of truth
- **Error envelope (server)**: `{ code, message, status, details?, requestId }`; codes `[DOMAIN]_[NUMBER]`
- **Error handling (client)**: React error boundaries + typed `Result<T, AppError>` + toasts
- **Auth security**: argon2/bcrypt password hashing, login rate-limiting, no plaintext logging, httpOnly session cookie
- **IDs/timestamps**: UUID v4, ISO-8601 UTC; day boundaries computed server-side for authenticated users
- **Naming**: camelCase vars/functions, PascalCase types/components, kebab-case files
- **Inter-unit comms**: FE units in-process via Context store; client ↔ server via Route Handlers / Server Actions
- **Persistence model**: server-authoritative; all state in the server repository (in-memory now, Prisma/Postgres later) behind the `/api/v1` contract. No client-side persistence.

## Patterns & Conventions
- **Architecture pattern**: Will be defined during design phase
- **Data access**: Will be defined during design phase
- **API response format**: Will be defined during design phase
- **Error handling**: Will be defined during design phase
- **Authentication**: Will be defined during design phase (users must be identifiable for daily-limit enforcement)
- **Validation**: Will be defined during design phase
- **Logging**: Will be defined during design phase
- **Code style**: Will be defined during design phase
- **Naming conventions**: Will be defined during design phase
- **Branch strategy**: Will be defined during design phase

## Environment Configuration
- **Config approach**: Pending D3 decisions
- **Environments**: Pending D3 decisions
- **Secrets management**: Pending D3 decisions

## CI/CD Pipeline
- **Tool**: Pending D3 decisions
- **Stages**: Pending D3 decisions
- **Deploy target**: Pending D3 decisions

## Dependency Management
- **Lockfile**: Pending D3 decisions
- **Version strategy**: Pending D3 decisions
- **Monorepo tooling**: Pending D3 decisions
