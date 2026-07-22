import type { Metadata } from "next";

import { QuoteRequestForm } from "@/components/leads/quote-request-form";
import { SITE_SETTING_KEYS } from "@/lib/site-config";
import { prisma } from "@/lib/db";
import { getSiteSetting } from "@/server/services/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request a quote",
  description:
    "Request estimates from local home service professionals. Contact details are shared only after a business accepts your lead.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function RequestQuotePage({ searchParams }: Props) {
  const params = await searchParams;
  const serviceSlug = first(params.service);
  const locationSlug = first(params.location);
  const businessSlug = first(params.business);

  let services: { id: string; name: string; slug: string }[] = [];
  let locations: { id: string; name: string; slug: string }[] = [];
  try {
    [services, locations] = await Promise.all([
      prisma.service.findMany({
        where: { isActive: true, parentId: null },
        orderBy: [{ isLaunchFocus: "desc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true },
      }),
      prisma.location.findMany({
        where: { type: "CITY", isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
    ]);
  } catch {
    // DB unavailable
  }

  const consentText = await getSiteSetting(
    SITE_SETTING_KEYS.LEAD_CONSENT_TEXT,
    "DRAFT: By submitting this form you consent to be contacted about your project by matching service professionals. Attorney review required.",
  );

  const defaultServiceId =
    services.find((s) => s.slug === serviceSlug)?.id ?? "";
  const defaultLocationId =
    locations.find((l) => l.slug === locationSlug)?.id ?? "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-primary">
        Request a quote
      </h1>
      <p className="mt-3 text-muted-foreground">
        Tell us about your project in a few steps. We route your request to
        matching local businesses. Your phone and email are revealed only after
        a business accepts the lead.
      </p>
      <div className="mt-8">
        <QuoteRequestForm
          services={services}
          locations={locations}
          consentText={consentText}
          defaultServiceId={defaultServiceId}
          defaultLocationId={defaultLocationId}
          defaultBusinessSlug={businessSlug}
        />
      </div>
    </div>
  );
}
