# aster-horoscope — Make targets
#   Vercel (current host):  make vercel-deploy | vercel-preview | vercel-smoke
#   Lightsail (AWS):        make lightsail-release | lightsail-build | lightsail-push | lightsail-deploy | lightsail-url | lightsail-logs
#   Database:               make db-setup | db-push-prod | db-studio | db-seed | ...
#   Shared:                 make verify    (lint + typecheck + build)

# ============================================================================
# Deploy — Vercel (current host)
#
#   make vercel-deploy    # verify (lint + typecheck + build) then deploy to production
#   make vercel-preview   # deploy a preview build (non-production URL)
#   make vercel-smoke     # health-check the production site
#
# Requires the Vercel CLI (`npm i -g vercel` or `bun add -g vercel`) and a
# linked project (the .vercel/ dir — run `vercel login` && `vercel link` once).
# ============================================================================
PROD_URL := https://aster-horoscope.vercel.app

.PHONY: verify vercel-deploy vercel-preview vercel-smoke

# Lint, typecheck and build locally — catch errors before shipping.
verify:
	bun run lint
	bun run typecheck
	bun run build

# Verify, then deploy to production (aliased to $(PROD_URL)).
vercel-deploy: verify
	vercel --prod --yes

# Deploy a preview build and print its URL (no production alias).
vercel-preview:
	vercel --yes

# Quick health check of the production site.
vercel-smoke:
	@echo -n "GET $(PROD_URL) -> "; curl -s -o /dev/null -w "%{http_code}\n" $(PROD_URL)/

# ============================================================================
# Database (Prisma + PostgreSQL)
#
# Run these after editing prisma/schema.prisma to sync the database + client.
#
#   make db-setup                                  # regenerate client + push to the .env DB (local)
#   make db-push-prod DATABASE_URL="postgresql://..."   # push to a remote DB (e.g. Supabase prod)
#   make db-studio                                 # open Prisma Studio
#   make db-seed                                   # run the seed script
#
# Supabase note: schema pushes MUST use the SESSION-mode pooler (port 5432):
#   postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres
# The direct host (db.<ref>.supabase.co:5432) is IPv6-only (often unreachable),
# and the transaction pooler (port 6543) is rejected by Prisma's schema engine.
# <region> must match the project's region (e.g. ap-northeast-1 for Tokyo).
# ============================================================================
.PHONY: db-generate db-push db-setup db-push-prod db-migrate db-studio db-seed

# Regenerate the Prisma client from the schema (do this after adding a model).
db-generate:
	bun run db:generate

# Push the schema to the database configured in .env (DATABASE_URL).
db-push:
	bun run db:push

# One-shot after a schema change: regenerate the client + sync the local DB.
db-setup: db-generate db-push
	@echo "✅ Prisma client generated and schema pushed to the .env database."

# Push the current schema to a remote DB. Pass the connection string inline:
#   make db-push-prod DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres"
db-push-prod:
	@test -n "$(DATABASE_URL)" || { \
		echo "Usage: make db-push-prod DATABASE_URL=\"postgresql://...pooler.supabase.com:5432/postgres\""; \
		exit 1; \
	}
	DATABASE_URL="$(DATABASE_URL)" bunx prisma db push --skip-generate
	@echo "✅ Schema pushed to the provided database."

# Migration-based workflow (creates a versioned migration against the .env DB).
db-migrate:
	bun run db:migrate

# Open Prisma Studio against the .env database.
db-studio:
	bun run db:studio

# Seed the .env database.
db-seed:
	bun run db:seed

# ============================================================================
# Deploy — AWS Lightsail (container service)
#
#   make lightsail-release   # build + push image + create a deployment
#   make lightsail-build | lightsail-push | lightsail-deploy | lightsail-url | lightsail-logs
#
# `aws login` caches credentials in a session format that only the AWS CLI
# understands. The lightsailctl plugin (used by lightsail-push) is a separate
# binary that can't read that cache, so every target re-exports the current CLI
# session as AWS_ACCESS_KEY_ID/SECRET/SESSION_TOKEN before running aws.
# ============================================================================
SERVICE := aster-horoscope
LABEL   := app
IMAGE   := $(SERVICE):latest
REGION  := ap-southeast-1
AWS_ENV := eval "$$(aws configure export-credentials --format env)" &&

.PHONY: lightsail-build lightsail-push lightsail-deploy lightsail-release lightsail-url lightsail-logs

lightsail-build:
	docker build --platform linux/amd64 -t $(IMAGE) .

lightsail-push: lightsail-build
	$(AWS_ENV) aws lightsail push-container-image --region $(REGION) \
		--service-name $(SERVICE) --label $(LABEL) --image $(IMAGE)

lightsail-deploy:
	$(AWS_ENV) aws lightsail create-container-service-deployment --region $(REGION) \
		--service-name $(SERVICE) \
		--containers file://deploy/containers.json \
		--public-endpoint file://deploy/public-endpoint.json

lightsail-release: lightsail-push lightsail-deploy

lightsail-url:
	$(AWS_ENV) aws lightsail get-container-services --region $(REGION) \
		--service-name $(SERVICE) --query 'containerServices[0].url' --output text

lightsail-logs:
	$(AWS_ENV) aws lightsail get-container-log --region $(REGION) \
		--service-name $(SERVICE) --container-name $(LABEL)
