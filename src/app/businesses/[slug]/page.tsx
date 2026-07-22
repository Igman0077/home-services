import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClaimBusinessForm } from "@/components/business/claim-business-form";
import { FavoriteBusinessButton } from "@/components/homeowner/favorite-button";
import { Breadcrumbs, JsonLdScript } from "@/components/seo/structured-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import {
  breadcrumbJsonLd,
  localBusinessJsonLd,
  verificationLabel,
} from "@/lib/seo";
import { SITE_CONFIG } from "@/lib/site-config";
import { absoluteUrl } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { getBusinessBySlug } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return { title: "Business not found" };
  return {
    title: business.name,
    description:
      business.description?.slice(0, 160) ??
      `${business.name} — local home services listing`,
    alternates: { canonical: `/businesses/${business.slug}` },
  };
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export default async function BusinessProfilePage({ params }: Props) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const session = await auth();
  const isMember = session?.user
    ? Boolean(
        await prisma.businessMember.findUnique({
          where: {
            businessId_userId: {
              businessId: business.id,
              userId: session.user.id,
            },
          },
        }),
      )
    : false;
  const isFavorited = session?.user
    ? Boolean(
        await prisma.favoriteBusiness.findUnique({
          where: {
            userId_businessId: {
              userId: session.user.id,
              businessId: business.id,
            },
          },
        }),
      )
    : false;
  const canClaim =
    !isMember &&
    business.claimStatus !== "APPROVED" &&
    (business.claimStatus === "UNCLAIMED" ||
      business.claimStatus === "REJECTED" ||
      business.claimStatus === "MORE_INFO_REQUIRED");

  const verification = verificationLabel(business.verificationStatus);
  const pageUrl = absoluteUrl(`/businesses/${business.slug}`);
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Businesses", href: "/businesses" },
    { name: business.name },
  ];
  const crumbLd = breadcrumbJsonLd([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Businesses", url: absoluteUrl("/businesses") },
    { name: business.name, url: pageUrl },
  ]);
  const businessLd = localBusinessJsonLd({ business, url: pageUrl });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <JsonLdScript data={crumbLd} />
      <JsonLdScript data={businessLd} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-primary">
            {business.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {[business.city, business.stateCode].filter(Boolean).join(", ") ||
              "Service-area business"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {business.isSampleData && SITE_CONFIG.showSampleDataBadges ? (
            <Badge variant="outline">Sample data</Badge>
          ) : null}
          {business.isSponsored ? <Badge variant="warning">Sponsored</Badge> : null}
          {business.isFeatured ? <Badge variant="secondary">Featured</Badge> : null}
          <Badge variant={verification.tone}>{verification.label}</Badge>
        </div>
      </div>

      {business.description ? (
        <p className="mt-6 text-lg leading-relaxed text-foreground/90">
          {business.description}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
        <div className="space-y-2 text-sm">
          <h2 className="font-semibold">Contact</h2>
          {business.phone ? (
            <p>
              Phone:{" "}
              <a className="text-accent hover:underline" href={`tel:${business.phone}`}>
                {business.phone}
              </a>
            </p>
          ) : (
            <p className="text-muted-foreground">Phone not listed</p>
          )}
          {business.website ? (
            <p>
              Website:{" "}
              <a
                className="text-accent hover:underline"
                href={business.website}
                rel="noopener noreferrer"
                target="_blank"
              >
                Visit site
              </a>
            </p>
          ) : null}
          {business.addressLine1 ? (
            <p>
              {[
                business.addressLine1,
                business.city,
                business.stateCode,
                business.postalCode,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          ) : business.isServiceAreaBusiness ? (
            <p className="text-muted-foreground">
              Service-area business — no single storefront address listed.
            </p>
          ) : null}
        </div>
        <div className="space-y-2 text-sm">
          <h2 className="font-semibold">Highlights</h2>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              Emergency service: {business.offersEmergency ? "Yes" : "Not stated"}
            </li>
            <li>
              Free estimates: {business.offersFreeEstimate ? "Yes" : "Not stated"}
            </li>
            <li>
              Financing: {business.offersFinancing ? "Yes" : "Not stated"}
            </li>
            <li>
              Year established: {business.yearEstablished ?? "Not stated"}
            </li>
          </ul>
          <p className="pt-2 text-xs text-muted-foreground">
            License and insurance details below are self-reported unless marked
            platform verified. {SITE_CONFIG.name} does not independently confirm
            every claim.
          </p>
        </div>
      </div>

      {(business.licenseDetails || business.insuranceDetails) && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Credentials (self-reported)</h2>
          {business.licenseDetails ? (
            <p className="mt-2 text-sm text-muted-foreground">
              License: {business.licenseDetails}
            </p>
          ) : null}
          {business.insuranceDetails ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Insurance: {business.insuranceDetails}
            </p>
          ) : null}
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Services offered</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {business.services.map(({ service }) => (
            <li key={service.id}>
              <Link
                href={`/services/${service.slug}`}
                className="inline-flex rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent/40"
              >
                {service.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Areas served</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {business.serviceAreas.map(({ location }) => (
            <li key={location.id}>
              <Link
                href={`/locations/${location.fullSlug}`}
                className="inline-flex rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent/40"
              >
                {location.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {business.hours.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Hours</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {business.hours.map((row) => (
              <li key={row.id} className="flex justify-between gap-4 sm:max-w-sm">
                <span>{DAY_LABELS[row.dayOfWeek] ?? row.dayOfWeek}</span>
                <span>
                  {row.isClosed
                    ? "Closed"
                    : `${row.openTime ?? "—"} – ${row.closeTime ?? "—"}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link
            href={`/request-a-quote?business=${business.slug}`}
          >
            Request a quote
          </Link>
        </Button>
        <FavoriteBusinessButton
          businessId={business.id}
          isFavorited={isFavorited}
          isSignedIn={Boolean(session?.user)}
        />
        <Button asChild variant="outline">
          <Link href="/businesses">Back to directory</Link>
        </Button>
      </div>

      <section className="mt-12 rounded-lg border border-border bg-card p-5">
        <h2 className="text-xl font-semibold">Own this business?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Claim status:{" "}
          {business.claimStatus.replaceAll("_", " ").toLowerCase()}.
          {isMember
            ? " You already manage this listing."
            : business.claimStatus === "APPROVED"
              ? " This listing is already claimed."
              : business.claimStatus === "PENDING"
                ? " A claim is awaiting administrator review."
                : " Submit evidence of ownership for administrator review."}
        </p>
        {isMember ? (
          <Button asChild className="mt-4" variant="outline">
            <Link href="/business/dashboard">Open business dashboard</Link>
          </Button>
        ) : canClaim ? (
          <div className="mt-4 max-w-lg">
            <ClaimBusinessForm
              businessId={business.id}
              isSignedIn={Boolean(session?.user)}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
