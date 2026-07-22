# Implementation checklist

## Phase 1 — Foundation

- [x] Project scaffold (Next.js, TypeScript, Tailwind)
- [x] Design tokens + accessible UI primitives
- [x] Prisma schema (full platform models)
- [x] Docker Compose for PostgreSQL
- [x] Auth.js credentials + JWT session
- [x] Roles, permissions, server-side guards
- [x] Site settings (DB + admin form)
- [x] Service & location models + admin CRUD create
- [x] Public services/locations listing & detail
- [x] Admin overview, audit log
- [x] Seed: NY counties/cities, launch services, roles, plans
- [x] Email provider abstraction (console)
- [x] robots.txt + basic sitemap
- [x] README + .env.example
- [x] Unit tests (RBAC, slugify)
- [x] Initial Prisma migration SQL generated
- [x] Lint / typecheck / test / build pass (build OK without live DB)
- [ ] Database migrate + seed verified on local Postgres (requires Docker or Postgres install)
- [ ] Git commit (Git not installed on this machine yet)

## Phase 2 — Public directory

- [x] Homepage search
- [x] Business profiles
- [x] Local service pages + page readiness
- [x] Search/filter
- [x] Structured data expansion
- [x] Dynamic sitemap (services, locations, businesses, indexable local pages)
- [x] Sample businesses + local page seed data
- [x] Directory unit tests (readiness, filters, verification labels)
- [x] Lint / typecheck / tests pass

## Phase 3 — Leads

- [ ] Quote form
- [ ] Routing engine
- [ ] Business/admin lead dashboards

## Phase 4 — Business accounts

- [ ] Claiming & verification
- [ ] Lead preferences

## Phase 5 — Homeowner tools

- [ ] Properties, tasks, appliances, documents

## Phase 6 — Content & AI

- [ ] CMS workflows
- [ ] AI draft generation (human approval)

## Phase 7 — Monetization

- [ ] Stripe integration
- [ ] Featured / sponsored labels

## Phase 8 — Optimization

- [ ] E2E tests, security/a11y/perf/SEO review
