import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ fullSlug: string[] }>;
};

export async function generateMetadata({ params }: Props) {
  const { fullSlug } = await params;
  const location = await prisma.location.findUnique({
    where: { fullSlug: fullSlug.join("/") },
  });
  if (!location) return { title: "Location not found" };
  return {
    title: location.seoTitle ?? location.name,
    description:
      location.seoDescription ??
      location.shortDescription ??
      `${location.name} home services coverage`,
  };
}

export default async function LocationDetailPage({ params }: Props) {
  const { fullSlug } = await params;
  const slugPath = fullSlug.join("/");
  const location = await prisma.location.findUnique({
    where: { fullSlug: slugPath },
    include: {
      parent: true,
      children: {
        where: { isActive: true },
        orderBy: [{ type: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!location || !location.isActive) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/locations" className="hover:text-foreground">
              Locations
            </Link>
          </li>
          <li aria-hidden>/</li>
          {location.parent ? (
            <>
              <li>
                <Link
                  href={`/locations/${location.parent.fullSlug}`}
                  className="hover:text-foreground"
                >
                  {location.parent.name}
                </Link>
              </li>
              <li aria-hidden>/</li>
            </>
          ) : null}
          <li className="text-foreground">{location.name}</li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-4xl font-semibold text-primary">
          {location.name}
        </h1>
        <Badge variant="secondary">{location.type}</Badge>
      </div>

      {location.shortDescription ? (
        <p className="mt-4 text-lg text-muted-foreground">
          {location.shortDescription}
        </p>
      ) : null}

      {location.climateNotes ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Climate & seasonal notes</h2>
          <p className="mt-2 text-muted-foreground">{location.climateNotes}</p>
        </section>
      ) : null}

      {location.children.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Within {location.name}</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {location.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/locations/${child.fullSlug}`}
                  className="text-accent hover:underline"
                >
                  {child.name}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground">
                  {child.type}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
