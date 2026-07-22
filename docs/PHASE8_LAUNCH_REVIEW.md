# Phase 8 — Launch review notes

Completed optimization pass for North Country Home Services. This is a living checklist of what shipped and what still needs production ops attention.

## Security

Shipped:
- Security headers via `next.config.ts` (`X-Frame-Options`, `nosniff`, Referrer-Policy, Permissions-Policy, COOP, CSP baseline)
- `poweredByHeader: false`
- Middleware blocks common probe paths (`.env`, `wp-admin`, `.git`, etc.)
- In-memory rate limits on `/api/search` and `/api/auth/register`
- Existing lead spam controls (honeypot, timing, duplicate fingerprint, email rate)

Production follow-ups:
- Replace in-memory rate limiting with Redis/Upstash when running multiple instances
- Tighten CSP (`script-src`) once nonce-based Next.js CSP is configured for the host
- Rotate `AUTH_SECRET`, seed passwords, and Stripe keys before go-live
- Enable Stripe webhook signature verification with `PAYMENT_PROVIDER=stripe`
- Add WAF / bot protection at the edge (Cloudflare/Vercel)

## Accessibility

Shipped:
- Skip link to `#main-content`
- Mobile navigation disclosure with Escape-to-close and `aria-expanded` / `aria-controls`
- `:focus-visible` outline styles
- `prefers-reduced-motion` respect
- Landmark roles via header/nav/main/footer

Production follow-ups:
- Manual axe/Lighthouse a11y scan on quote form and admin tables
- Keyboard walkthrough of multi-step quote + business claim flows
- Color contrast audit on badge variants against card backgrounds

## Performance

Shipped:
- `compress: true`
- Font `display: "swap"`
- `optimizePackageImports` for `lucide-react`
- AVIF/WebP image formats enabled
- Search API cache headers (`s-maxage=60`)

Production follow-ups:
- Add real CDN caching for public catalog pages
- Measure LCP on homepage with production assets
- Consider static generation for published guides once content volume grows

## SEO

Shipped:
- Dynamic sitemap (services, locations, businesses, local pages, guides, calculators)
- Robots disallow for private app areas + auth pages
- Open Graph + Twitter metadata defaults
- Article/FAQ/LocalBusiness/Breadcrumb JSON-LD where applicable
- Local page readiness/noindex gates from Phase 2
- Lightweight `auditSeoPage` helper + unit tests

Production follow-ups:
- Submit sitemap in Google Search Console / Bing Webmaster
- Add brand OG image asset (`og-default.png`)
- Attorney review of draft legal pages before indexing heavily

## E2E

Shipped:
- Playwright smoke suite for public routes (`/`, `/services`, `/businesses`, `/guides`, `/calculators`, `/request-a-quote`, `/robots.txt`)
- Script: `npm run test:e2e`

Notes:
- Smoke tests expect a running production build (`webServer` starts `npm run start`)
- Pages degrade gracefully without Postgres; empty states are acceptable
- Full authenticated E2E requires migrated/seeded Postgres

## Command checklist before release

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
# or: npm run test:e2e:ci  (build + e2e)
npx prisma migrate deploy
npm run db:seed   # development only — do not seed sample businesses to production
```
