---
inclusion: always
---

# Structure

## Summary
- Repo type: single repo, single Next.js (App Router) fullstack app.
- Key source directories: `src/modules` (frontend units), `src/foundation`, `src/server`, `src/shared`, `src/app/api` (route handlers).
- Main entry points: `src/app` (App Router), `src/app/api/v1` (server route handlers).

## Repository
- **Type**: Single repo, single Next.js app (client + server + shared types together).
- **Root**: `aster-horoscope/`.

## Repository Structure (from Foundation phase)
```
aster-horoscope/
├── src/
│   ├── app/           # Next.js App Router: (game), (auth) pages + api/v1 route handlers
│   ├── foundation/    # FE shared kernel: ui/, storage/, state/ (Context store), api/
│   ├── modules/       # frontend units: session-draw (U1), mission (U2), reveal-reward (U3), sharing (U4)
│   ├── server/        # server domain logic: auth, sessions, missions, rewards, sharing, db (Prisma)
│   ├── shared/        # domain types, API DTOs, error envelope, constants
│   └── data/          # tarot deck, mission catalog, reward catalog
├── prisma/            # schema.prisma + migrations
└── .github/workflows/ # CI/CD
```

## Key Directories
| Directory | Purpose | Key Contents |
|-----------|---------|--------------|
| `src/shared/` | Shared contracts | domain types, API DTOs, error envelope, constants |
| `src/foundation/` | FE shared kernel | UI shell, API client, motion tokens, Result |
| `src/modules/` | Frontend domain units | U1-U4 |
| `src/server/` | Server layer | auth, sessions, missions, rewards, sharing, db |
| `src/app/api/v1/` | Route handlers | REST-style endpoints |

## Entry Points
| Entry | Type | Description |
|-------|------|-------------|
| `src/app` | Next.js App Router | pages + layouts |
| `src/app/api/v1` | Route Handlers | server API endpoints |
