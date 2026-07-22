import { describe, expect, it } from "vitest";

import { evaluateLocalPageReadiness } from "@/server/services/directory";
import { buildBusinessWhere } from "@/server/services/directory";
import { verificationLabel } from "@/lib/seo";

describe("local page readiness", () => {
  const solidPage = {
    h1: "Roofing in Potsdam, NY",
    seoTitle: "Roofing in Potsdam, NY | Local professionals",
    seoDescription:
      "Learn about roofing needs in Potsdam and find local professionals who serve the area.",
    introduction:
      "A".repeat(200),
    serviceExplanation: "B".repeat(150),
    localProblems: "C".repeat(120),
    seasonalNotes: "D".repeat(120),
    projectFactors: "E".repeat(120),
    status: "PUBLISHED",
    hasBusiness: true,
    hasFaq: true,
    duplicateWarning: false,
    factualWarning: false,
  };

  it("marks a complete published page as indexable", async () => {
    const result = await evaluateLocalPageReadiness(solidPage, {
      minScore: 70,
      minChars: 600,
    });
    expect(result.isIndexable).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it("blocks thin content", async () => {
    const result = await evaluateLocalPageReadiness(
      {
        ...solidPage,
        introduction: "Short",
        serviceExplanation: "",
        localProblems: "",
        seasonalNotes: "",
        projectFactors: "",
      },
      { minScore: 70, minChars: 600 },
    );
    expect(result.isIndexable).toBe(false);
    expect(result.reasons.some((r) => r.includes("Insufficient"))).toBe(true);
  });

  it("blocks duplicate and factual warnings", async () => {
    const result = await evaluateLocalPageReadiness(
      { ...solidPage, duplicateWarning: true },
      { minScore: 70, minChars: 600 },
    );
    expect(result.isIndexable).toBe(false);
  });

  it("requires editorial approval", async () => {
    const result = await evaluateLocalPageReadiness(
      { ...solidPage, status: "DRAFT" },
      { minScore: 70, minChars: 600 },
    );
    expect(result.isIndexable).toBe(false);
    expect(result.reasons).toContain("Not editorially approved/published");
  });
});

describe("business search filters", () => {
  it("builds where clauses for service and verification", () => {
    const where = buildBusinessWhere({
      serviceSlug: "roofing",
      verifiedOnly: true,
      emergency: true,
    });
    expect(where.publishStatus).toBe("PUBLISHED");
    expect(where.offersEmergency).toBe(true);
    expect(where.verificationStatus).toEqual({
      in: ["BUSINESS_VERIFIED", "PLATFORM_VERIFIED"],
    });
    expect(where.services).toBeTruthy();
  });
});

describe("verification labels", () => {
  it("does not claim unverified businesses are approved", () => {
    expect(verificationLabel("UNVERIFIED").label.toLowerCase()).toContain(
      "not independently verified",
    );
  });
});
