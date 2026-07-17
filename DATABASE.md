# Database Setup

The app stores users, mission history, and the Tarot Match ranking board in
**PostgreSQL** via **Prisma**. Daily state, missions, and rewards are in-memory
for now.

- Schema: [`prisma/schema.prisma`](prisma/schema.prisma) — models `User`, `HistoryEntry`, `MatchScore`.
- Connection: the `DATABASE_URL` environment variable.
- **Fallback**: if `DATABASE_URL` is unset, the server uses an in-memory store
  (handy for quick dev without a database). In-memory data does **not** persist
  across restarts or serverless invocations, so use Postgres for anything real.

All commands below are wrapped in the [`Makefile`](Makefile) (they call the
`bun run db:*` scripts under the hood). You need `bun`, and `docker` for local
Postgres.

---

## 1. Local development

```bash
# 1. Create your local env file (defaults match docker-compose.yml)
cp .env.example .env

# 2. Start local Postgres (+ Adminer UI on http://localhost:8080)
docker compose up -d db

# 3. Generate the Prisma client and create the tables
make db-setup

# 4. (optional) seed data
make db-seed
```

`make db-setup` runs `db:generate` (regenerate the client) then `db:push` (sync
the schema to the database in `.env`).

Inspect data with Adminer (`http://localhost:8080`) or `make db-studio`
(Prisma Studio).

---

## 2. After changing the schema

Whenever you add or edit a model in `prisma/schema.prisma`:

```bash
# Local database (uses DATABASE_URL from .env)
make db-setup
```

```bash
# Production / remote database (pass the connection string inline)
make db-push-prod DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

`db-push-prod` skips client generation (already done locally) and just syncs the
schema to the target database. `db push` is **additive-safe** — it creates new
tables/columns and won't drop existing data unless the schema removes them.

---

## 3. Environments & `DATABASE_URL`

| Environment | `DATABASE_URL` |
|-------------|----------------|
| No DB (in-memory) | unset |
| Local (docker-compose) | `postgresql://aster:aster_dev_password@localhost:5432/aster_horoscope?schema=public` |
| Production (Vercel) | Supabase pooler URL, stored as a **Sensitive** env var in Vercel |

The Prisma client is regenerated automatically on `bun install` (`postinstall`)
and on every Vercel deploy, so the deployed app always matches the schema — you
only need to push the schema itself to the database.

---

## 4. Supabase (production) connection notes

Schema pushes to Supabase are picky. Use the **session-mode pooler** (host
`aws-0-<region>.pooler.supabase.com`, port **5432**, user `postgres.<ref>`):

```
postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

For this project the region is **Tokyo** (`ap-northeast-1`):

```bash
make db-push-prod DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

Avoid these for schema pushes:

- **Direct host** `db.<ref>.supabase.co:5432` — IPv6-only; often unreachable and
  returns `P1001: Can't reach database server`.
- **Transaction pooler** port `6543` — rejected by Prisma's schema engine
  (`Schema engine error`). It's fine for the app at runtime, but not for pushes.
- **Wrong region** in the pooler host — returns
  `FATAL: (ENOTFOUND) tenant/user postgres.<ref> not found`.

The app's runtime `DATABASE_URL` (in Vercel) can use the transaction pooler
(`:6543`); only migrations/pushes need the session pooler (`:5432`).

---

## 5. Make targets

| Command | What it does |
|---------|--------------|
| `make db-setup` | Regenerate client + push schema to the `.env` database |
| `make db-generate` | Regenerate the Prisma client only |
| `make db-push` | Push schema to the `.env` database |
| `make db-push-prod DATABASE_URL="…"` | Push schema to a remote database |
| `make db-migrate` | Create a versioned migration (`prisma migrate dev`) |
| `make db-studio` | Open Prisma Studio |
| `make db-seed` | Run the seed script |

---

## Security

- Never commit `.env` (it's gitignored). `.env.example` holds safe placeholders.
- Keep the production `DATABASE_URL` in Vercel's env vars (marked Sensitive), not
  in the repo.
- If a database credential is ever exposed, rotate it in Supabase
  (Settings → Database → Reset password) and update `DATABASE_URL` in Vercel and
  your local `.env`.
