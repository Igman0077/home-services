import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BusinessCard } from "@/components/directory/business-card";
import { Breadcrumbs, JsonLdScript } from "@/components/seo/structured-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  serviceJsonLd,
} from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import {
  getLocalServicePage,
  listBusinessesForLocalPage,
} from "@/server/services/catalog";
import { evaluateLocalPageReadiness } from "@/server/services/directory";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ state: string; city: string; service: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city, service } = await params;
  const page = await getLocalServicePage(state, city, service);
  if (!page) {
    return {
      title: "Page not found",
      robots: { index: false, follow: false },
    };
  }

  const businesses = await listBusinessesForLocalPage(
    page.serviceId,
    page.locationId,
  );
  const readiness = await evaluateLocalPageReadiness({
    ...page,
    hasBusiness: businesses.length > 0,
    hasFaq: page.faqs.length > 0,
  });

  const shouldIndex =
    page.isIndexable &&
    readiness.isIndexable &&
    page.indexDirective === "INDEX";

  return {
    title: page.seoTitle ?? page.h1 ?? `${page.service.name} in ${page.location.name}`,
    description:
      page.seoDescription ??
      page.introduction?.slice(0, 160) ??
      `${page.service.name} professionals serving ${page.location.name}, NY`,
    alternates: {
      canonical: page.canonicalPath ?? `/${page.slugPath}`,
    },
    robots: shouldIndex
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function LocalServicePage({ params }: Props) {
  const { state, city, service } = await params;
  const page = await getLocalServicePage(state, city, service);
  if (!page) notFound();

  const businesses = await listBusinessesForLocalPage(
    page.serviceId,
    page.locationId,
  );
  const readiness = await evaluateLocalPageReadiness({
    ...page,
    hasBusiness: businesses.length > 0,
    hasFaq: page.faqs.length > 0,
  });

  const pageUrl = absoluteUrl(`/${page.slugPath}`);
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "New York", href: "/locations/new-york" },
    {
      name: page.location.name,
      href: `/locations/${page.location.fullSlug}`,
    },
    { name: page.service.name },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Home", url: absoluteUrl("/") },
          { name: "New York", url: absoluteUrl("/locations/new-york") },
          {
            name: page.location.name,
            url: absoluteUrl(`/locations/${page.location.fullSlug}`),
          },
          { name: page.service.name, url: pageUrl },
        ])}
      />
      <JsonLdScript
        data={serviceJsonLd({
          name: `${page.service.name} in ${page.location.name}`,
          description: page.introduction,
          url: pageUrl,
          areaServed: `${page.location.name}, NY`,
        })}
      />
      <JsonLdScript
        data={faqJsonLd(
          page.faqs.map((f) => ({ question: f.question, answer: f.answer })),
        )}
      />

      <Breadcrumbs items={crumbs} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-4xl font-semibold text-primary">
          {page.h1 ?? `${page.service.name} in ${page.location.name}, NY`}
        </h1>
        {!readiness.isIndexable ? (
          <Badge variant="warning">Draft / noindex</Badge>
        ) : (
          <Badge variant="success">Published</Badge>
        )}
      </div>

      {page.lastReviewedAt ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Last reviewed{" "}
          <time dateTime={page.lastReviewedAt.toISOString()}>
            {page.lastReviewedAt.toLocaleDateString()}
          </time>
          {page.reviewedByName ? ` · ${page.reviewedByName}` : null}
        </p>
      ) : null}

      {page.introduction ? (
        <p className="mt-6 text-lg leading-relaxed text-foreground/90">
          {page.introduction}
        </p>
      ) : null}

      {page.serviceExplanation ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">About this service</h2>
          <p className="mt-2 text-muted-foreground">{page.serviceExplanation}</p>
        </section>
      ) : null}

      {page.localProblems ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Common issues in {page.location.name}
          </h2>
          <p className="mt-2 text-muted-foreground">{page.localProblems}</p>
        </section>
      ) : null}

      {page.seasonalNotes ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Seasonal considerations</h2>
          <p className="mt-2 text-muted-foreground">{page.seasonalNotes}</p>
        </section>
      ) : null}

      {page.projectFactors ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">What affects project scope</h2>
          <p className="mt-2 text-muted-foreground">{page.projectFactors}</p>
        </section>
      ) : null}

      {(page.priceRangeLow != null || page.priceRangeHigh != null) && (
        <section className="mt-8 rounded-lg border border-border bg-card p-5">
          <h2 className="text-xl font-semibold">Estimated price range</h2>
          <p className="mt-2 text-2xl font-semibold text-primary">
            {page.priceRangeLow != null
              ? `$${page.priceRangeLow.toLocaleString()}`
              : "—"}
            {" – "}
            {page.priceRangeHigh != null
              ? `$${page.priceRangeHigh.toLocaleString()}`
              : "—"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {page.priceDisclaimer ??
              "Estimates only. Actual prices vary by property, materials, access, and contractor. Not a bid or guarantee."}
          </p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Local {page.service.name.toLowerCase()} professionals
        </h2>
        {businesses.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No published businesses currently list this service in{" "}
            {page.location.name}. You can still request quotes when lead routing
            launches.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {businesses.map((business) => (
              <li key={business.id}>
                <BusinessCard business={business} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {page.faqs.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Frequently asked questions</h2>
          <dl className="mt-4 space-y-4">
            {page.faqs.map((faq) => (
              <div key={faq.id}>
                <dt className="font-medium">{faq.question}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link
            href={`/request-a-quote?service=${page.service.slug}&location=${page.location.slug}`}
          >
            Request a quote
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/services/${page.service.slug}`}>
            All {page.service.name.toLowerCase()} info
          </Link>
        </Button>
      </div>

      {!readiness.isIndexable ? (
        <aside className="mt-8 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            Page readiness (editors only)
          </p>
          <p className="mt-1">Quality score: {readiness.score}/100</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {readiness.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}
