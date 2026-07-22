import type { GuideContentBlocks } from "@/integrations/ai/types";

export function parseGuideBlocks(raw: unknown): GuideContentBlocks {
  if (!raw || typeof raw !== "object") {
    return { body: "" };
  }
  const value = raw as Record<string, unknown>;
  const body = typeof value.body === "string" ? value.body : "";
  const sections = Array.isArray(value.sections)
    ? value.sections
        .map((section) => {
          if (!section || typeof section !== "object") return null;
          const s = section as Record<string, unknown>;
          if (typeof s.heading !== "string" || typeof s.body !== "string") {
            return null;
          }
          return { heading: s.heading, body: s.body };
        })
        .filter(Boolean)
    : undefined;
  return {
    body,
    sections: sections as GuideContentBlocks["sections"],
  };
}

export function guideBodyToParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function canTransitionGuideStatus(
  from: string,
  to: string,
): boolean {
  const allowed: Record<string, string[]> = {
    DRAFT: ["IN_REVIEW", "ARCHIVED"],
    IN_REVIEW: ["DRAFT", "APPROVED", "ARCHIVED"],
    APPROVED: ["PUBLISHED", "IN_REVIEW", "ARCHIVED"],
    SCHEDULED: ["PUBLISHED", "APPROVED", "ARCHIVED"],
    PUBLISHED: ["ARCHIVED", "DRAFT"],
    ARCHIVED: ["DRAFT"],
  };
  return allowed[from]?.includes(to) ?? false;
}
