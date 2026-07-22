# North Country Home Services

Regional home-services directory and lead-generation platform for Northern New York, designed to expand statewide and nationwide without a rebuild.

The public site name is configurable via environment variables and admin **Site settings** (`SiteSetting`), so branding can change without editing code.

## Current status

**Phase 2 — Public directory (complete in code)**

- Homepage search + popular services/locations/businesses
- Business directory with filters and profile pages
- Local service pages at `/{state}/{city}/{service}` with readiness/noindex gates
- Structured data (Organization, WebSite, BreadcrumbList, Service, LocalBusiness, FAQPage when eligible)
- Dynamic sitemap + `/api/search`
- Seed: labeled sample businesses and reviewed local page drafts

## Stack

| Concern | Choice |
|--------|--------|
| App | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4 + Radix-based components |
| Database | PostgreSQL + Prisma 6 |
| Auth | Auth.js / NextAuth v5 |
| Validation | Zod |
| Tests | Vitest |

## Prerequisites

- Node.js 20+ (22/24 OK)
- PostgreSQL 16+ **or** Docker Desktop for `docker compose up -d`

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file (already present as .env for local dev)
cp .env.example .env

# 3. Start PostgreSQL (Docker)
docker compose up -d

# 4. Generate client, migrate, seed
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Run the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed accounts (development only)

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@example.com` | `ChangeMeNow!123` |
| Editor | `editor@example.com` | `ChangeMeNow!123` |
| Homeowner | `homeowner@example.com` | `ChangeMeNow!123` |

Change these immediately if the environment is shared. Override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (and editor equivalents).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:seed` | Seed development data |
| `npm run db:studio` | Prisma Studio |

## Architecture overview

```
src/
  app/                 # Routes (public, auth, admin, dashboards)
  components/          # UI + layout
  lib/                 # db, auth, rbac, site-config, utils
  server/              # Server actions + domain services
  integrations/        # Email (and later storage, AI, payments, …)
prisma/
  schema.prisma        # Full platform schema
  seed.ts              # Dev seed
```

### Canonical local service URLs (Phase 2+)

`/{state}/{city}/{service}` — e.g. `/new-york/potsdam/roofing`

Location catalog pages use `/locations/{fullSlug}` (e.g. `/locations/new-york/st-lawrence-county/potsdam`).

### Roles

- **Visitor** — unauthenticated browse
- **HOMEOWNER** — property/maintenance tools (Phase 5)
- **BUSINESS_OWNER** — profile & leads (Phase 4)
- **EDITOR** — content CMS (Phase 6)
- **ADMINISTRATOR** — full admin

Permissions are enforced server-side (`requirePermission` / `requireAdminAccess`).

## Environment variables

See `.env.example`. Critical keys:

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — Auth.js secret (32+ chars)
- `NEXT_PUBLIC_SITE_NAME` — default branding (overridable in admin)

## Database without Docker

Install PostgreSQL locally, create database/user matching `.env`, then run migrate + seed. Example `DATABASE_URL`:

```
postgresql://nchs:nchs_dev_password@localhost:5432/north_country_home_services?schema=public
```

## Deployment notes (Vercel-ready)

- Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_SITE_URL`
- Run `prisma migrate deploy` in the release pipeline
- Do not seed sample businesses into production
- Legal pages are **draft** until attorney review

## Implementation checklist

See `docs/IMPLEMENTATION_CHECKLIST.md`.

## License

Private / proprietary — all rights reserved.
