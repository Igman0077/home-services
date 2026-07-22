export type SeoAuditFinding = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
};

export type SeoPageInput = {
  title?: string | null;
  description?: string | null;
  canonicalPath?: string | null;
  noindex?: boolean;
  h1Count?: number;
  hasStructuredData?: boolean;
  thinContentChars?: number;
};

/**
 * Lightweight SEO checklist for CMS/local pages.
 * Does not invent content quality scores beyond length heuristics.
 */
export function auditSeoPage(input: SeoPageInput): SeoAuditFinding[] {
  const findings: SeoAuditFinding[] = [];

  if (!input.title || input.title.trim().length < 10) {
    findings.push({
      severity: "error",
      code: "title_short",
      message: "Title should be at least 10 characters.",
    });
  } else if (input.title.length > 70) {
    findings.push({
      severity: "warning",
      code: "title_long",
      message: "Title exceeds ~70 characters and may truncate in SERPs.",
    });
  }

  if (!input.description || input.description.trim().length < 50) {
    findings.push({
      severity: "warning",
      code: "description_short",
      message: "Meta description should be ~50–160 characters.",
    });
  } else if (input.description.length > 170) {
    findings.push({
      severity: "warning",
      code: "description_long",
      message: "Meta description may truncate above ~160–170 characters.",
    });
  }

  if (!input.canonicalPath) {
    findings.push({
      severity: "warning",
      code: "canonical_missing",
      message: "Canonical path is missing.",
    });
  }

  if ((input.h1Count ?? 1) !== 1) {
    findings.push({
      severity: "error",
      code: "h1_count",
      message: "Pages should have exactly one H1.",
    });
  }

  if ((input.thinContentChars ?? 0) > 0 && (input.thinContentChars ?? 0) < 300) {
    findings.push({
      severity: "warning",
      code: "thin_content",
      message: "Body content looks thin for an indexable page.",
    });
  }

  if (input.noindex) {
    findings.push({
      severity: "info",
      code: "noindex",
      message: "Page is marked noindex (intentional for drafts/filters).",
    });
  } else if (!input.hasStructuredData) {
    findings.push({
      severity: "info",
      code: "structured_data",
      message: "Consider adding relevant structured data when publishing.",
    });
  }

  return findings;
}

export function seoAuditHasBlockingErrors(findings: SeoAuditFinding[]) {
  return findings.some((f) => f.severity === "error");
}
