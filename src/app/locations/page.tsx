import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Locations",
  description: "Explore coverage by state, county, and city.",
};

export default async function LocationsPage() {
  const states = await prisma.location
    .findMany({
      where: { type: "STATE", isActive: true },
      orderBy: { name: "asc" },
      include: {
        children: {
          where: { type: "COUNTY", isActive: true },
          orderBy: { name: "asc" },
          include: {
            children: {
              where: { type: "CITY", isActive: true },
              orderBy: { name: "asc" },
              take: 8,
            },
          },
        },
      },
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-primary">
        Locations
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Coverage starts in Northern New York and is designed to expand statewide
        and nationwide using the same hierarchical location model.
      </p>

      {states.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-border bg-card p-6 text-muted-foreground">
          No locations seeded yet. Run{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            npm run db:seed
          </code>{" "}
          after the database is ready.
        </p>
      ) : (
        <div className="mt-10 space-y-10">
          {states.map((state) => (
            <section key={state.id}>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl font-semibold">
                  <Link
                    href={`/locations/${state.fullSlug}`}
                    className="hover:text-accent"
                  >
                    {state.name}
                  </Link>
                </h2>
                <Badge variant="secondary">{state.stateCode ?? state.type}</Badge>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {state.children.map((county) => (
                  <div
                    key={county.id}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <h3 className="font-semibold">
                      <Link
                        href={`/locations/${county.fullSlug}`}
                        className="hover:text-accent"
                      >
                        {county.name}
                      </Link>
                    </h3>
                    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      {county.children.map((city) => (
                        <li key={city.id}>
                          <Link
                            href={`/locations/${city.fullSlug}`}
                            className="hover:text-foreground"
                          >
                            {city.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
