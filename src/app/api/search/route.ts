import { NextResponse } from "next/server";

import { searchCatalog } from "@/server/services/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q.length > 100) {
    return NextResponse.json({ error: "Query too long." }, { status: 400 });
  }

  const results = await searchCatalog(q);
  return NextResponse.json(
    {
      query: q,
      results: {
        services: results.services.map((s) => ({
          type: "service" as const,
          name: s.name,
          slug: s.slug,
          href: `/services/${s.slug}`,
        })),
        locations: results.locations.map((l) => ({
          type: "location" as const,
          name: l.name,
          slug: l.fullSlug,
          href: `/locations/${l.fullSlug}`,
        })),
        businesses: results.businesses.map((b) => ({
          type: "business" as const,
          name: b.name,
          slug: b.slug,
          href: `/businesses/${b.slug}`,
        })),
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
