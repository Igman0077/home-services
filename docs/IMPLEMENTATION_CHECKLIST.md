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

- [x] Quote form (multi-step)
- [x] Lead storage + consent logging
- [x] Spam controls (honeypot, rate limit, timing, duplicate detection)
- [x] Routing engine (shared/exclusive/manual, caps, acceptance window)
- [x] Business lead dashboard (masked contacts until accept)
- [x] Admin lead dashboard + manual assign
- [x] Seed routing rules + business owner test account
- [x] Lead validation/fingerprint tests

## Phase 4 — Business accounts

- [x] Claiming workflow (submit + admin review + membership)
- [x] Create business profile (pending review until admin publish)
- [x] Profile edit: basics, services, areas, hours
- [x] Lead preferences (caps, pause, notifications)
- [x] Verification request + admin review
- [x] Business analytics (lead metrics only — no invented traffic)
- [x] Subscription plan display foundation (billing later)
- [x] Contractor landing + public claim CTA
- [x] Completeness scoring tests
- [x] Lint / typecheck / tests / build

## Phase 5 — Homeowner tools

- [x] Properties CRUD (soft delete / archive)
- [x] Maintenance tasks + completions + recurrence
- [x] Northern NY seasonal suggestions
- [x] Appliances + warranty records
- [x] Document vault (local storage adapter + external URLs)
- [x] Favorite businesses
- [x] Seed sample homeowner property data
- [x] Seasonal suggestion unit tests
- [x] Lint / typecheck / tests / build

## Phase 6 — Content & AI

- [x] Guides CMS (create/edit, status workflow, FAQs, revisions)
- [x] Public guides listing + detail + SEO JSON-LD
- [x] AI mock provider for guide drafts
- [x] AI review queue (approve → draft guide; never auto-publish)
- [x] Roof replacement calculator (ranges + disclaimer)
- [x] Sitemap includes published guides/calculators
- [x] Seed published guide + calculator
- [x] Content/AI/calculator unit tests
- [x] Lint / typecheck / tests / build

## Phase 7 — Monetization

- [ ] Stripe integration
- [ ] Featured / sponsored labels

## Phase 8 — Optimization

- [ ] E2E tests, security/a11y/perf/SEO review
