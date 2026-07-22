import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Services",
  description:
    "Browse home service categories available across our coverage area.",
};

export default async function ServicesPage() {
  const services = await prisma.service
    .findMany({
      where: {
        isActive: true,
        parentId: null,
        status: { in: ["PUBLISHED", "APPROVED", "DRAFT"] },
      },
      orderBy: [
        { isLaunchFocus: "desc" },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-primary">
        Services
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Service categories are managed in the admin panel and stored in the
        database so the platform can expand without code changes.
      </p>

      {services.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-border bg-card p-6 text-muted-foreground">
          No services seeded yet. Run database migrations and{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            npm run db:seed
          </code>{" "}
          after PostgreSQL is available.
        </p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li
              key={service.id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold">
                  <Link
                    href={`/services/${service.slug}`}
                    className="hover:text-accent"
                  >
                    {service.name}
                  </Link>
                </h2>
                {service.isLaunchFocus ? (
                  <Badge variant="success">Launch focus</Badge>
                ) : null}
              </div>
              {service.shortDescription ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {service.shortDescription}
                </p>
              ) : null}
              {service.children.length > 0 ? (
                <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {service.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/services/${child.slug}`}
                        className="hover:text-foreground"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
