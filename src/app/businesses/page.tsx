import type { Metadata } from "next";
import { Suspense } from "react";

import { BusinessCard } from "@/components/directory/business-card";
import { BusinessFilters } from "@/components/directory/business-filters";
import {
  listCityLocations,
  listLaunchServices,
  listPublishedBusinesses,
} from "@/server/services/catalog";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Object.keys(params).length > 0;
  return {
    title: "Businesses",
    description:
      "Browse local home service businesses across Northern New York.",
    robots: hasFilters
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function BusinessesPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = {
    q: first(params.q),
    serviceSlug: first(params.service),
    locationSlug: first(params.location),
    emergency: first(params.emergency) === "1",
    freeEstimate: first(params.freeEstimate) === "1",
    financing: first(params.financing) === "1",
    verifiedOnly: first(params.verified) === "1",
  };

  const [businesses, services, locations] = await Promise.all([
    listPublishedBusinesses(filters),
    listLaunchServices(),
    listCityLocations(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-primary">
        Business directory
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Compare local professionals. Verification labels are explicit. Sample
        development listings are marked. We do not display fabricated ratings.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
          <BusinessFilters
            services={services.map((s) => ({ slug: s.slug, name: s.name }))}
            locations={locations.map((l) => ({ slug: l.slug, name: l.name }))}
          />
        </Suspense>

        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            {businesses.length} result{businesses.length === 1 ? "" : "s"}
          </p>
          {businesses.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-card p-6 text-muted-foreground">
              No published businesses match these filters. Seed sample data or
              broaden your search.
            </p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {businesses.map((business) => (
                <li key={business.id}>
                  <BusinessCard business={business} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
