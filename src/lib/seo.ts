import type { Business, VerificationStatus } from "@prisma/client";

export type JsonLd = Record<string, unknown>;

export function organizationJsonLd(input: {
  name: string;
  url: string;
  description?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.url,
    description: input.description,
  };
}

export function websiteJsonLd(input: {
  name: string;
  url: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${input.url}/businesses?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function serviceJsonLd(input: {
  name: string;
  description?: string | null;
  url: string;
  areaServed?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description ?? undefined,
    url: input.url,
    areaServed: input.areaServed
      ? { "@type": "Place", name: input.areaServed }
      : undefined,
  };
}

export function localBusinessJsonLd(input: {
  business: Pick<
    Business,
    | "name"
    | "description"
    | "phone"
    | "email"
    | "website"
    | "addressLine1"
    | "city"
    | "stateCode"
    | "postalCode"
    | "latitude"
    | "longitude"
    | "verificationStatus"
  >;
  url: string;
}): JsonLd | null {
  const b = input.business;
  // Only emit LocalBusiness when we have a usable name and at least contact or address.
  if (!b.name) return null;
  if (!b.phone && !b.addressLine1 && !b.website) return null;

  const address =
    b.addressLine1 || b.city
      ? {
          "@type": "PostalAddress",
          streetAddress: b.addressLine1 ?? undefined,
          addressLocality: b.city ?? undefined,
          addressRegion: b.stateCode ?? undefined,
          postalCode: b.postalCode ?? undefined,
          addressCountry: "US",
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: b.name,
    description: b.description ?? undefined,
    url: input.url,
    telephone: b.phone ?? undefined,
    email: b.email ?? undefined,
    sameAs: b.website ? [b.website] : undefined,
    address,
    geo:
      b.latitude != null && b.longitude != null
        ? {
            "@type": "GeoCoordinates",
            latitude: b.latitude,
            longitude: b.longitude,
          }
        : undefined,
  };
}

export function faqJsonLd(
  faqs: { question: string; answer: string }[],
): JsonLd | null {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function verificationLabel(
  status: VerificationStatus,
): { label: string; tone: "success" | "warning" | "secondary" | "outline" } {
  switch (status) {
    case "PLATFORM_VERIFIED":
      return { label: "Platform verified", tone: "success" };
    case "BUSINESS_VERIFIED":
      return { label: "Business verified", tone: "success" };
    case "PENDING":
      return { label: "Verification pending", tone: "warning" };
    case "REJECTED":
      return { label: "Not verified", tone: "outline" };
    default:
      return { label: "Self-reported / not independently verified", tone: "secondary" };
  }
}
