import type { Prisma } from "@prisma/client";

import { SITE_SETTING_KEYS } from "@/lib/site-config";
import { getSiteSetting } from "@/server/services/site-settings";

export type LocalPageReadinessInput = {
  introduction?: string | null;
  serviceExplanation?: string | null;
  localProblems?: string | null;
  seasonalNotes?: string | null;
  projectFactors?: string | null;
  h1?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  duplicateWarning?: boolean;
  factualWarning?: boolean;
  status?: string;
  hasBusiness?: boolean;
  hasGuide?: boolean;
  hasFaq?: boolean;
};

export type LocalPageReadinessResult = {
  score: number;
  isIndexable: boolean;
  reasons: string[];
  contentChars: number;
};

function contentLength(input: LocalPageReadinessInput): number {
  return [
    input.introduction,
    input.serviceExplanation,
    input.localProblems,
    input.seasonalNotes,
    input.projectFactors,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim().length;
}

/**
 * Determines whether a local service page meets quality thresholds for indexing.
 * Does not invent content — only scores what editors/AI drafts provide.
 */
export async function evaluateLocalPageReadiness(
  input: LocalPageReadinessInput,
  overrides?: { minScore?: number; minChars?: number },
): Promise<LocalPageReadinessResult> {
  const minScore =
    overrides?.minScore ??
    (await getSiteSetting(SITE_SETTING_KEYS.LOCAL_PAGE_MIN_QUALITY_SCORE, 70));
  const minChars =
    overrides?.minChars ??
    (await getSiteSetting(SITE_SETTING_KEYS.LOCAL_PAGE_MIN_CONTENT_CHARS, 600));

  const reasons: string[] = [];
  let score = 0;
  const contentChars = contentLength(input);

  if (input.h1?.trim()) score += 10;
  else reasons.push("Missing H1");

  if (input.seoTitle?.trim()) score += 10;
  else reasons.push("Missing SEO title");

  if (input.seoDescription && input.seoDescription.trim().length >= 50) {
    score += 10;
  } else {
    reasons.push("SEO description missing or too short");
  }

  if (contentChars >= minChars) score += 30;
  else if (contentChars >= Math.floor(minChars * 0.5)) {
    score += 15;
    reasons.push(`Content below minimum (${contentChars}/${minChars} chars)`);
  } else {
    reasons.push(`Insufficient original content (${contentChars}/${minChars} chars)`);
  }

  if (input.localProblems?.trim()) score += 10;
  else reasons.push("Missing local problems section");

  if (input.seasonalNotes?.trim()) score += 10;
  else reasons.push("Missing seasonal considerations");

  const hasResource = Boolean(input.hasBusiness || input.hasGuide || input.hasFaq);
  if (hasResource) score += 15;
  else reasons.push("Needs at least one business, guide, or FAQ resource");

  if (input.duplicateWarning) {
    score = Math.max(0, score - 25);
    reasons.push("Unresolved duplicate-content warning");
  }

  if (input.factualWarning) {
    score = Math.max(0, score - 25);
    reasons.push("Unresolved factual warning");
  }

  const editoriallyApproved =
    input.status === "PUBLISHED" || input.status === "APPROVED";
  if (!editoriallyApproved) {
    reasons.push("Not editorially approved/published");
  }

  const isIndexable =
    score >= minScore &&
    contentChars >= minChars &&
    hasResource &&
    !input.duplicateWarning &&
    !input.factualWarning &&
    editoriallyApproved;

  if (!isIndexable && score >= minScore && !reasons.includes("Not editorially approved/published")) {
    // keep reasons already collected
  }

  return { score, isIndexable, reasons, contentChars };
}

export type BusinessSearchFilters = {
  serviceSlug?: string;
  locationSlug?: string;
  emergency?: boolean;
  freeEstimate?: boolean;
  financing?: boolean;
  verifiedOnly?: boolean;
  q?: string;
};

export function buildBusinessWhere(
  filters: BusinessSearchFilters,
): Prisma.BusinessWhereInput {
  const where: Prisma.BusinessWhereInput = {
    deletedAt: null,
    publishStatus: "PUBLISHED",
  };

  if (filters.emergency) where.offersEmergency = true;
  if (filters.freeEstimate) where.offersFreeEstimate = true;
  if (filters.financing) where.offersFinancing = true;
  if (filters.verifiedOnly) {
    where.verificationStatus = {
      in: ["BUSINESS_VERIFIED", "PLATFORM_VERIFIED"],
    };
  }

  if (filters.q?.trim()) {
    where.OR = [
      { name: { contains: filters.q.trim(), mode: "insensitive" } },
      { description: { contains: filters.q.trim(), mode: "insensitive" } },
      { city: { contains: filters.q.trim(), mode: "insensitive" } },
    ];
  }

  if (filters.serviceSlug) {
    where.services = {
      some: { service: { slug: filters.serviceSlug, isActive: true } },
    };
  }

  if (filters.locationSlug) {
    where.serviceAreas = {
      some: {
        location: {
          OR: [
            { slug: filters.locationSlug },
            { fullSlug: { endsWith: `/${filters.locationSlug}` } },
            { fullSlug: filters.locationSlug },
          ],
          isActive: true,
        },
      },
    };
  }

  return where;
}
