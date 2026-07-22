# Architecture decisions (Phase 1)

## Schema

- **Single PostgreSQL schema** includes later-phase models so migrations stay additive and relations are coherent from day one.
- **Roles + permissions** are data-driven (`Role`, `Permission`, `RolePermission`, `UserRole`) with a code-level `ROLE_PERMISSION_MAP` used for seeding and fast checks.
- **Locations** use `fullSlug` (unique) for public catalog URLs under `/locations/...`, while local service pages (Phase 2) use `/{state}/{city}/{service}` via `LocalServicePage.slugPath`.
- **Soft deletes** on `User`, `Business`, and `HomeownerProperty` via `deletedAt`.
- **Sample data** is flagged with `isSampleData` on businesses/leads so production can exclude it.
- **Reviews** exist in schema but are feature-flagged off (`reviews.enabled` / site setting).

## Auth

- Auth.js v5 with **JWT sessions** + Prisma adapter for Account/Session/VerificationToken tables.
- Credentials provider with bcrypt password hashes (cost factor 12).
- Magic-link can be added later without schema changes (VerificationToken already present).

## Integrations

Provider interfaces live under `src/integrations/*`. Phase 1 ships a console email adapter only.

## SEO safety

`LocalServicePage` includes quality score, indexability flags, duplicate/factual warnings, and default `NOINDEX` until editorial approval (enforced in Phase 2/6).
