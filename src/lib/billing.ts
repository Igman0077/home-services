export type PlanEntitlements = {
  leadEligible?: boolean;
  exclusiveEligible?: boolean;
  featured?: boolean;
  sponsored?: boolean;
  analytics?: boolean;
  priorityLeads?: boolean;
  maxPhotos?: number;
};

export function parsePlanEntitlements(raw: unknown): PlanEntitlements {
  if (!raw || typeof raw !== "object") return {};
  return raw as PlanEntitlements;
}

export function placementFromEntitlements(entitlements: PlanEntitlements): {
  isFeatured: boolean;
  isSponsored: boolean;
} {
  return {
    isFeatured: entitlements.featured === true,
    isSponsored: entitlements.sponsored === true,
  };
}

export function formatPlanPrice(priceCents: number, interval: string): string {
  if (priceCents <= 0) return "Free";
  const dollars = (priceCents / 100).toFixed(0);
  return `$${dollars}/${interval}`;
}

export function humanizeEntitlementKey(key: string): string {
  const labels: Record<string, string> = {
    leadEligible: "Lead eligibility",
    exclusiveEligible: "Exclusive territory eligible",
    featured: "Featured directory placement",
    sponsored: "Sponsored label placement",
    analytics: "Business analytics",
    priorityLeads: "Priority lead routing",
    maxPhotos: "Max gallery photos",
  };
  return labels[key] ?? key;
}
