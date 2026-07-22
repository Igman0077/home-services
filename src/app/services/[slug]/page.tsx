import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const service = await prisma.service.findUnique({ where: { slug } });
    if (!service) return { title: "Service not found" };
    return {
      title: service.seoTitle ?? service.name,
      description:
        service.seoDescription ??
        service.shortDescription ??
        `${service.name} services`,
    };
  } catch {
    return { title: "Services" };
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  let service;
  try {
    service = await prisma.service.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        localPages: {
          where: { status: { in: ["PUBLISHED", "DRAFT"] } },
          include: { location: true },
          take: 12,
          orderBy: { updatedAt: "desc" },
        },
      },
    });
  } catch {
    notFound();
  }

  if (!service || !service.isActive) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/services" className="hover:text-foreground">
              Services
            </Link>
          </li>
          <li aria-hidden>/</li>
          {service.parent ? (
            <>
              <li>
                <Link
                  href={`/services/${service.parent.slug}`}
                  className="hover:text-foreground"
                >
                  {service.parent.name}
                </Link>
              </li>
              <li aria-hidden>/</li>
            </>
          ) : null}
          <li className="text-foreground">{service.name}</li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-4xl font-semibold text-primary">
          {service.name}
        </h1>
        {service.isLaunchFocus ? (
          <Badge variant="success">Launch focus</Badge>
        ) : null}
        <Badge variant="outline">{service.status}</Badge>
      </div>

      {service.shortDescription ? (
        <p className="mt-4 text-lg text-muted-foreground">
          {service.shortDescription}
        </p>
      ) : null}

      {service.description ? (
        <p className="mt-8 text-foreground/90">{service.description}</p>
      ) : null}

      {service.children.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Related subservices</h2>
          <ul className="mt-3 space-y-2">
            {service.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/services/${child.slug}`}
                  className="text-accent hover:underline"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {service.localPages.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Local pages</h2>
          <ul className="mt-3 space-y-2">
            {service.localPages.map((page) => (
              <li key={page.id}>
                <Link
                  href={`/${page.slugPath}`}
                  className="text-accent hover:underline"
                >
                  {service.name} in {page.location.name}
                </Link>
                {page.status !== "PUBLISHED" ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({page.status.toLowerCase()})
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-10">
        <Button asChild>
          <Link href={`/businesses?service=${service.slug}`}>
            Find {service.name.toLowerCase()} businesses
          </Link>
        </Button>
      </div>
    </div>
  );
}
