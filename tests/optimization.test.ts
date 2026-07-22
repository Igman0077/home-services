import { describe, expect, it, beforeEach } from "vitest";

import {
  checkRateLimit,
  resetRateLimitBuckets,
} from "@/lib/rate-limit";
import { SECURITY_HEADERS } from "@/lib/security-headers";
import {
  auditSeoPage,
  seoAuditHasBlockingErrors,
} from "@/lib/seo-audit";

describe("rate limiter", () => {
  beforeEach(() => {
    resetRateLimitBuckets();
  });

  it("allows requests under the limit and blocks after", () => {
    const key = "test:ip";
    expect(checkRateLimit({ key, limit: 2, windowMs: 60_000 }).allowed).toBe(
      true,
    );
    expect(checkRateLimit({ key, limit: 2, windowMs: 60_000 }).allowed).toBe(
      true,
    );
    const blocked = checkRateLimit({ key, limit: 2, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe("security headers", () => {
  it("includes framing and content-type protections", () => {
    expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    expect(SECURITY_HEADERS["Content-Security-Policy"]).toContain(
      "frame-ancestors 'none'",
    );
  });
});

describe("seo audit", () => {
  it("flags missing title and wrong h1 count as blocking", () => {
    const findings = auditSeoPage({
      title: "Hi",
      description: "short",
      h1Count: 0,
    });
    expect(seoAuditHasBlockingErrors(findings)).toBe(true);
    expect(findings.some((f) => f.code === "title_short")).toBe(true);
    expect(findings.some((f) => f.code === "h1_count")).toBe(true);
  });

  it("passes a healthy published page shape", () => {
    const findings = auditSeoPage({
      title: "Winter roof care for Northern New York homes",
      description:
        "Educational tips for ice dams, snow load, and attic ventilation in Northern New York winters.",
      canonicalPath: "/guides/winter-roof-care-northern-ny",
      h1Count: 1,
      hasStructuredData: true,
      thinContentChars: 1200,
    });
    expect(seoAuditHasBlockingErrors(findings)).toBe(false);
  });
});
