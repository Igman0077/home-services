import Link from "next/link";

import { BusinessCard } from "@/components/directory/business-card";
import { DirectorySearchForm } from "@/components/directory/search-form";
import { JsonLdScript } from "@/components/seo/structured-data";
import { Button } from "@/components/ui/button";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import {
  listCityLocations,
  listLaunchServices,
  listPublishedBusinesses,
} from "@/server/services/catalog";
import { getPublicSiteConfig } from "@/server/services/site-settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const site = await getPublicSiteConfig();
  const [services, cities, featured] = await Promise.all([
    listLaunchServices(),
    listCityLocations(),
    listPublishedBusinesses({}, { take: 6 }),
  ]);

  const orgLd = organizationJsonLd({
    name: site.name,
    url: site.url,
    description: site.tagline,
  });
  const siteLd = websiteJsonLd({ name: site.name, url: site.url });

  return (
    <div>
      <JsonLdScript data={orgLd} />
      <JsonLdScript data={siteLd} />

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.12), transparent 35%)",
          }}
        />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
          <p className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            {site.name}
          </p>
          <h1 className="mt-4 max-w-2xl text-xl font-medium text-white/90 sm:text-2xl">
            Local home service pros for Northern New York
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">
            {site.tagline}
          </p>
          <div className="mt-8 max-w-4xl">
            <DirectorySearchForm
              services={services.map((s) => ({ slug: s.slug, name: s.name }))}
              locations={cities.map((c) => ({ slug: c.slug, name: c.name }))}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-primary">
          Popular services
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Launch focus categories for the North Country — more services can be
          added from the admin panel without code changes.
        </p>
        {services.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Services appear after the database is migrated and seeded.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services
              .filter((s) => s.isLaunchFocus || s.parentId === null)
              .slice(0, 6)
              .map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent/40"
                  >
                    <h3 className="text-lg font-semibold">{service.name}</h3>
                    {service.shortDescription ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {service.shortDescription}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="border-y border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-primary">
            How it works
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Search by service and town",
                body: "Start with roofing, plumbing, HVAC, electrical, or tree removal across Northern New York.",
              },
              {
                step: "2",
                title: "Compare local businesses",
                body: "Profiles show clear verification labels. We do not invent ratings or licenses.",
              },
              {
                step: "3",
                title: "Request estimates",
                body: "Quote routing ships in Phase 3. Browse and compare are available now.",
              },
            ].map((item) => (
              <li key={item.step}>
                <p className="text-sm font-semibold text-accent">
                  Step {item.step}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold text-primary">
              Popular locations
            </h2>
            <p className="mt-2 text-muted-foreground">
              Cities and towns across the four launch counties.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/locations">All locations</Link>
          </Button>
        </div>
        {cities.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Locations appear after seeding.
          </p>
        ) : (
          <ul className="mt-8 flex flex-wrap gap-3">
            {cities.slice(0, 16).map((city) => (
              <li key={city.id}>
                <Link
                  href={`/locations/${city.fullSlug}`}
                  className="inline-flex rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:border-accent/40"
                >
                  {city.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold text-primary">
                Featured businesses
              </h2>
              <p className="mt-2 text-muted-foreground">
                Published listings only. Sample development businesses are
                labeled.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/businesses">Browse directory</Link>
            </Button>
          </div>
          {featured.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No published businesses yet. Seed sample data in development, or
              claim/create a listing from the contractor tools.
            </p>
          ) : (
            <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((business) => (
                <li key={business.id}>
                  <BusinessCard business={business} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold text-primary">
              Cost calculators & guides
            </h2>
            <p className="mt-3 text-muted-foreground">
              Educational estimators and maintenance guides are coming next.
              Calculators will show ranges and disclaimers — never false
              precision.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/calculators">Calculators</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/guides">Guides</Link>
              </Button>
            </div>
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold text-primary">
              For contractors
            </h2>
            <p className="mt-3 text-muted-foreground">
              Claim your profile, set service areas, manage lead preferences,
              and track basic performance from your business dashboard.
            </p>
            <Button asChild className="mt-5">
              <Link href="/for-contractors">Get started</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-primary">
            Trust & transparency
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            We do not invent customer counts, testimonials, ratings, or license
            claims. Sponsored placements are labeled. Sample data used in
            development is marked. Verification statuses are shown plainly.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Organization URL:{" "}
            <a className="text-accent hover:underline" href={absoluteUrl("/")}>
              {site.url}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
